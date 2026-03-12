package com.gamewiki.service;

import com.gamewiki.dto.CatalogBulkRequest;
import com.gamewiki.dto.CatalogEntryRequest;
import com.gamewiki.dto.CatalogEntryResponse;
import com.gamewiki.entity.Boss;
import com.gamewiki.entity.CatalogEntry;
import com.gamewiki.entity.Game;
import com.gamewiki.entity.Item;
import com.gamewiki.entity.Npc;
import com.gamewiki.repository.BossRepository;
import com.gamewiki.repository.CatalogEntryRepository;
import com.gamewiki.repository.GameRepository;
import com.gamewiki.repository.ItemRepository;
import com.gamewiki.repository.NpcRepository;
import com.gamewiki.util.NameNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogEntryService {

    private final CatalogEntryRepository catalogEntryRepository;
    private final GameRepository gameRepository;
    private final ItemRepository itemRepository;
    private final BossRepository bossRepository;
    private final NpcRepository npcRepository;

    public List<CatalogEntryResponse> findAll(Long gameId, String type) {
        List<CatalogEntry> entries;
        if (gameId != null) {
            if (type != null && !type.isBlank()) {
                entries = catalogEntryRepository.findByGameIdAndTypeOrderByNameAsc(gameId, type);
            } else {
                entries = catalogEntryRepository.findByGameIdOrderByTypeAscNameAsc(gameId);
            }
        } else {
            if (type != null && !type.isBlank()) {
                entries = catalogEntryRepository.findByTypeOrderByNameAsc(type);
            } else {
                entries = catalogEntryRepository.findAllByOrderByTypeAscNameAsc();
            }
        }
        return entries.stream().map(this::toResponse).toList();
    }

    @Transactional
    public CatalogEntryResponse create(CatalogEntryRequest request, String username) {
        if (existsByNormalizedName(request.getName(), request.getType(), request.getGameId())) {
            throw new IllegalArgumentException("既に登録されています");
        }
        if (existsEntityByNormalizedName(request.getName(), request.getType(), request.getGameId())) {
            throw new IllegalArgumentException("同一ゲーム・同一種別で同名のデータが既に存在します");
        }

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        CatalogEntry entry = new CatalogEntry();
        entry.setName(request.getName());
        entry.setType(request.getType());
        entry.setCategory(request.getCategory());
        entry.setGame(game);
        entry.setCreatedBy(username);

        CatalogEntry saved = catalogEntryRepository.save(entry);
        createEntityIfNeeded(request.getType(), request.getName().trim(), request.getCategory(), game);
        return toResponse(saved);
    }

    @Transactional
    public Map<String, Integer> bulkCreate(CatalogBulkRequest request, String username) {
        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        Set<String> existingNames = catalogEntryRepository
                .findByGameIdAndTypeOrderByNameAsc(request.getGameId(), request.getType())
                .stream()
                .map(CatalogEntry::getName)
                .map(NameNormalizer::normalize)
                .collect(Collectors.toSet());
        Set<String> existingEntityNames = findEntityNormalizedNames(request.getType(), request.getGameId());
        Set<String> seenInRequest = new HashSet<>();

        int added = 0, skipped = 0;
        for (String rawName : request.getNames()) {
            String name = rawName == null ? "" : rawName.trim();
            if (name.isBlank()) continue;
            String normalized = NameNormalizer.normalize(name);
            if (existingNames.contains(normalized)
                    || existingEntityNames.contains(normalized)
                    || !seenInRequest.add(normalized)) {
                skipped++;
                continue;
            }
            CatalogEntry entry = new CatalogEntry();
            entry.setName(name);
            entry.setType(request.getType());
            entry.setCategory(request.getCategory());
            entry.setGame(game);
            entry.setCreatedBy(username);
            catalogEntryRepository.save(entry);
            createEntityIfNeeded(request.getType(), name, request.getCategory(), game);
            existingNames.add(normalized);
            existingEntityNames.add(normalized);
            added++;
        }
        return Map.of("added", added, "skipped", skipped);
    }

    public void delete(Long id) {
        CatalogEntry entry = catalogEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("CatalogEntry not found: " + id));
        catalogEntryRepository.delete(entry);
    }

    private CatalogEntryResponse toResponse(CatalogEntry entry) {
        CatalogEntryResponse r = new CatalogEntryResponse();
        r.setId(entry.getId());
        r.setName(entry.getName());
        r.setType(entry.getType());
        r.setCategory(entry.getCategory());
        r.setGameId(entry.getGame().getId());
        r.setGameName(entry.getGame().getName());
        r.setCreatedBy(entry.getCreatedBy());
        r.setCreatedAt(entry.getCreatedAt());
        return r;
    }

    private boolean existsByNormalizedName(String name, String type, Long gameId) {
        String target = NameNormalizer.normalize(name);
        return catalogEntryRepository.findByGameIdAndTypeOrderByNameAsc(gameId, type).stream()
                .map(CatalogEntry::getName)
                .map(NameNormalizer::normalize)
                .anyMatch(target::equals);
    }

    private boolean existsEntityByNormalizedName(String name, String type, Long gameId) {
        String target = NameNormalizer.normalize(name);
        return findEntityNormalizedNames(type, gameId).contains(target);
    }

    private Set<String> findEntityNormalizedNames(String type, Long gameId) {
        if ("ITEM".equals(type)) {
            return itemRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId).stream()
                    .map(Item::getName)
                    .map(NameNormalizer::normalize)
                    .collect(Collectors.toSet());
        }
        if ("BOSS".equals(type)) {
            return bossRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId).stream()
                    .map(Boss::getName)
                    .map(NameNormalizer::normalize)
                    .collect(Collectors.toSet());
        }
        if ("NPC".equals(type)) {
            return npcRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId).stream()
                    .map(Npc::getName)
                    .map(NameNormalizer::normalize)
                    .collect(Collectors.toSet());
        }
        throw new IllegalArgumentException("Unsupported catalog type: " + type);
    }

    private void createEntityIfNeeded(String type, String name, String category, Game game) {
        if ("ITEM".equals(type)) {
            Item item = new Item();
            item.setName(name);
            item.setCategory(category);
            item.setGame(game);
            itemRepository.save(item);
            return;
        }
        if ("BOSS".equals(type)) {
            Boss boss = new Boss();
            boss.setName(name);
            boss.setGame(game);
            bossRepository.save(boss);
            return;
        }
        if ("NPC".equals(type)) {
            Npc npc = new Npc();
            npc.setName(name);
            npc.setGame(game);
            npcRepository.save(npc);
            return;
        }
        throw new IllegalArgumentException("Unsupported catalog type: " + type);
    }
}

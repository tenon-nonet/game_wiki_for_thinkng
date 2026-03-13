package com.gamewiki.service;

import com.gamewiki.dto.CatalogBulkRequest;
import com.gamewiki.dto.CatalogEntryRequest;
import com.gamewiki.dto.CatalogEntryResponse;
import com.gamewiki.entity.Boss;
import com.gamewiki.entity.Game;
import com.gamewiki.entity.Item;
import com.gamewiki.entity.Npc;
import com.gamewiki.repository.BossRepository;
import com.gamewiki.repository.GameRepository;
import com.gamewiki.repository.ItemRepository;
import com.gamewiki.repository.NpcRepository;
import com.gamewiki.util.CatalogType;
import com.gamewiki.util.EntityNameConflictChecker;
import com.gamewiki.util.NameNormalizer;
import com.gamewiki.util.ValidationMessages;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CatalogEntryService {

    private final GameRepository gameRepository;
    private final ItemRepository itemRepository;
    private final BossRepository bossRepository;
    private final NpcRepository npcRepository;
    private final FileStorageService fileStorageService;

    public List<CatalogEntryResponse> findAll(Long gameId, String type) {
        if (type != null && !type.isBlank()) {
            return findByType(gameId, CatalogType.from(type));
        }

        List<CatalogEntryResponse> entries = new ArrayList<>();
        for (CatalogType candidate : CatalogType.DISPLAY_ORDER) {
            entries.addAll(findByType(gameId, candidate));
        }
        return entries;
    }

    @Transactional
    public CatalogEntryResponse create(CatalogEntryRequest request) {
        CatalogType type = CatalogType.from(request.getType());
        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        ensureNoDuplicateEntity(request.getName(), type, request.getGameId(), null);

        return switch (type) {
            case ITEM -> toResponse(itemRepository.save(createItem(request.getName(), request.getCategory(), game)));
            case BOSS -> toResponse(bossRepository.save(createBoss(request.getName(), game)));
            case NPC -> toResponse(npcRepository.save(createNpc(request.getName(), game)));
        };
    }

    @Transactional
    public Map<String, Integer> bulkCreate(CatalogBulkRequest request) {
        CatalogType type = CatalogType.from(request.getType());
        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        Set<String> existingNames = findEntityNormalizedNames(type, request.getGameId());
        Set<String> seenInRequest = new HashSet<>();

        int added = 0;
        int skipped = 0;
        for (String rawName : request.getNames()) {
            String name = rawName == null ? "" : rawName.trim();
            if (name.isBlank()) {
                continue;
            }
            String normalized = NameNormalizer.normalize(name);
            if (existingNames.contains(normalized) || !seenInRequest.add(normalized)) {
                skipped++;
                continue;
            }

            switch (type) {
                case ITEM -> itemRepository.save(createItem(name, request.getCategory(), game));
                case BOSS -> bossRepository.save(createBoss(name, game));
                case NPC -> npcRepository.save(createNpc(name, game));
            }
            existingNames.add(normalized);
            added++;
        }
        return Map.of("added", added, "skipped", skipped);
    }

    @Transactional
    public void delete(Long id, String type) {
        switch (CatalogType.from(type)) {
            case ITEM -> {
                Item item = itemRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));
                fileStorageService.delete(item.getImagePath());
                itemRepository.delete(item);
            }
            case BOSS -> {
                Boss boss = bossRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Boss not found: " + id));
                fileStorageService.delete(boss.getImagePath());
                bossRepository.delete(boss);
            }
            case NPC -> {
                Npc npc = npcRepository.findById(id)
                        .orElseThrow(() -> new IllegalArgumentException("Npc not found: " + id));
                fileStorageService.delete(npc.getImagePath());
                npcRepository.delete(npc);
            }
        }
    }

    private List<CatalogEntryResponse> findByType(Long gameId, CatalogType type) {
        return switch (type) {
            case ITEM -> loadItems(gameId);
            case BOSS -> loadBosses(gameId);
            case NPC -> loadNpcs(gameId);
        };
    }

    private List<CatalogEntryResponse> loadItems(Long gameId) {
        List<Item> items = gameId != null
                ? itemRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId)
                : itemRepository.findAllByOrderBySortOrderAscIdAsc();
        return items.stream()
                .sorted(Comparator.comparing((Item item) -> item.getGame().getSortOrder())
                        .thenComparing(Item::getSortOrder)
                        .thenComparing(Item::getId))
                .map(this::toResponse)
                .toList();
    }

    private List<CatalogEntryResponse> loadBosses(Long gameId) {
        List<Boss> bosses = gameId != null
                ? bossRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId)
                : bossRepository.findAllByOrderBySortOrderAscIdAsc();
        return bosses.stream()
                .sorted(Comparator.comparing((Boss boss) -> boss.getGame().getSortOrder())
                        .thenComparing(Boss::getSortOrder)
                        .thenComparing(Boss::getId))
                .map(this::toResponse)
                .toList();
    }

    private List<CatalogEntryResponse> loadNpcs(Long gameId) {
        List<Npc> npcs = gameId != null
                ? npcRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId)
                : npcRepository.findAllByOrderBySortOrderAscIdAsc();
        return npcs.stream()
                .sorted(Comparator.comparing((Npc npc) -> npc.getGame().getSortOrder())
                        .thenComparing(Npc::getSortOrder)
                        .thenComparing(Npc::getId))
                .map(this::toResponse)
                .toList();
    }

    private CatalogEntryResponse toResponse(Item item) {
        CatalogEntryResponse response = baseResponse(item.getId(), item.getName(), CatalogType.ITEM, item.getGame(), item.getCreatedAt());
        response.setCategory(item.getCategory());
        return response;
    }

    private CatalogEntryResponse toResponse(Boss boss) {
        return baseResponse(boss.getId(), boss.getName(), CatalogType.BOSS, boss.getGame(), boss.getCreatedAt());
    }

    private CatalogEntryResponse toResponse(Npc npc) {
        return baseResponse(npc.getId(), npc.getName(), CatalogType.NPC, npc.getGame(), npc.getCreatedAt());
    }

    private CatalogEntryResponse baseResponse(Long id, String name, CatalogType type, Game game, LocalDateTime createdAt) {
        CatalogEntryResponse response = new CatalogEntryResponse();
        response.setId(id);
        response.setName(name);
        response.setType(type.name());
        response.setGameId(game.getId());
        response.setGameName(game.getName());
        response.setCreatedAt(createdAt);
        return response;
    }

    private Set<String> findEntityNormalizedNames(CatalogType type, Long gameId) {
        return switch (type) {
            case ITEM -> itemRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId).stream()
                    .map(Item::getName)
                    .map(NameNormalizer::normalize)
                    .collect(Collectors.toSet());
            case BOSS -> bossRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId).stream()
                    .map(Boss::getName)
                    .map(NameNormalizer::normalize)
                    .collect(Collectors.toSet());
            case NPC -> npcRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId).stream()
                    .map(Npc::getName)
                    .map(NameNormalizer::normalize)
                    .collect(Collectors.toSet());
        };
    }

    private void ensureNoDuplicateEntity(String name, CatalogType type, Long gameId, Long selfId) {
        boolean duplicated = switch (type) {
            case ITEM -> EntityNameConflictChecker.hasDuplicateName(
                    itemRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId),
                    Item::getId,
                    Item::getName,
                    name,
                    selfId
            );
            case BOSS -> EntityNameConflictChecker.hasDuplicateName(
                    bossRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId),
                    Boss::getId,
                    Boss::getName,
                    name,
                    selfId
            );
            case NPC -> EntityNameConflictChecker.hasDuplicateName(
                    npcRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId),
                    Npc::getId,
                    Npc::getName,
                    name,
                    selfId
            );
        };
        if (duplicated) {
            throw new IllegalArgumentException(ValidationMessages.DUPLICATE_ENTITY_NAME);
        }
    }

    private Item createItem(String name, String category, Game game) {
        Item item = new Item();
        item.setName(name.trim());
        item.setCategory(category);
        item.setGame(game);
        return item;
    }

    private Boss createBoss(String name, Game game) {
        Boss boss = new Boss();
        boss.setName(name.trim());
        boss.setGame(game);
        return boss;
    }

    private Npc createNpc(String name, Game game) {
        Npc npc = new Npc();
        npc.setName(name.trim());
        npc.setGame(game);
        return npc;
    }
}
package com.gamewiki.service;

import com.gamewiki.dto.NpcRequest;
import com.gamewiki.dto.NpcResponse;
import com.gamewiki.entity.CatalogEntry;
import com.gamewiki.entity.Game;
import com.gamewiki.entity.Npc;
import com.gamewiki.entity.NpcDialogue;
import com.gamewiki.entity.Tag;
import com.gamewiki.repository.CatalogEntryRepository;
import com.gamewiki.repository.GameRepository;
import com.gamewiki.repository.NpcRepository;
import com.gamewiki.repository.TagRepository;
import com.gamewiki.util.NameNormalizer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NpcService {

    private final NpcRepository npcRepository;
    private final GameRepository gameRepository;
    private final TagRepository tagRepository;
    private final CatalogEntryRepository catalogEntryRepository;
    private final FileStorageService fileStorageService;
    private final TagService tagService;

    @Transactional
    public void updateOrder(List<Long> ids) {
        for (int i = 0; i < ids.size(); i++) {
            Npc npc = getNpc(ids.get(i));
            npc.setSortOrder(i);
            npcRepository.save(npc);
        }
    }

    public List<NpcResponse> findAll(Long gameId, String tagName, String keyword) {
        List<Npc> npcs;
        if (gameId != null) {
            npcs = npcRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId);
        } else {
            npcs = npcRepository.findAllByOrderBySortOrderAscIdAsc();
        }
        if (tagName != null && !tagName.isBlank()) {
            npcs = npcs.stream()
                    .filter(n -> n.getTags().stream().anyMatch(t -> t.getName().equalsIgnoreCase(tagName)))
                    .toList();
        }
        if (keyword != null && !keyword.isBlank()) {
            String lower = keyword.toLowerCase();
            npcs = npcs.stream()
                    .filter(n -> n.getName().toLowerCase().contains(lower)
                            || (n.getDescription() != null && n.getDescription().toLowerCase().contains(lower)))
                    .toList();
        }
        return npcs.stream().map(this::toResponse).toList();
    }

    public NpcResponse findById(Long id) {
        return toResponse(getNpc(id));
    }

    public NpcResponse create(NpcRequest request, MultipartFile image) {
        if (!existsCatalogEntry(request.getName(), request.getGameId(), "NPC")) {
            throw new IllegalArgumentException("目録に登録されていないNPCは作成できません。先に目録へ登録してください。");
        }
        ensureNoDuplicateNpc(request.getName(), request.getGameId(), null);

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        Npc npc = new Npc();
        npc.setName(request.getName());
        npc.setDescription(request.getDescription());
        npc.setGame(game);
        npc.setTags(resolveTags(request.getTags(), request.getGameId()));
        setDialogues(npc, request.getDialogues());

        if (image != null && !image.isEmpty()) {
            npc.setImagePath(fileStorageService.store(image));
        }

        return toResponse(npcRepository.save(npc));
    }

    @Transactional
    public NpcResponse update(Long id, NpcRequest request, MultipartFile image) {
        Npc npc = getNpc(id);
        Long oldGameId = npc.getGame().getId();
        String oldName = npc.getName();
        CatalogEntry catalogEntry = resolveCatalogEntryForUpdate(oldName, request.getName(), oldGameId, "NPC");

        ensureNoDuplicateNpc(request.getName(), request.getGameId(), id);
        ensureNoDuplicateCatalogEntry(request.getName(), request.getGameId(), "NPC", catalogEntry.getId());

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        npc.setName(request.getName());
        npc.setDescription(request.getDescription());
        npc.setGame(game);
        npc.setTags(resolveTags(request.getTags(), request.getGameId()));
        npc.getDialogues().clear();
        setDialogues(npc, request.getDialogues());

        if (image != null && !image.isEmpty()) {
            fileStorageService.delete(npc.getImagePath());
            npc.setImagePath(fileStorageService.store(image));
        }

        Npc saved = npcRepository.save(npc);

        catalogEntry.setName(request.getName());
        catalogEntry.setGame(game);
        catalogEntryRepository.save(catalogEntry);

        return toResponse(saved);
    }

    public void delete(Long id) {
        Npc npc = getNpc(id);
        fileStorageService.delete(npc.getImagePath());
        npcRepository.delete(npc);
    }

    private Npc getNpc(Long id) {
        return npcRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Npc not found: " + id));
    }

    private void setDialogues(Npc npc, List<String> texts) {
        if (texts == null) return;
        for (int i = 0; i < texts.size(); i++) {
            String text = texts.get(i);
            if (text == null || text.isBlank()) continue;
            NpcDialogue d = new NpcDialogue();
            d.setNpc(npc);
            d.setText(text.trim());
            d.setOrderIndex(i);
            npc.getDialogues().add(d);
        }
    }

    private Set<Tag> resolveTags(Set<String> tagNames, Long gameId) {
        if (tagNames == null || tagNames.isEmpty()) return new HashSet<>();
        return tagNames.stream().map(name ->
            tagRepository.findByNameAndGameIdAndType(name, gameId, "NPC")
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + name))
        ).collect(Collectors.toSet());
    }

    private NpcResponse toResponse(Npc npc) {
        NpcResponse r = new NpcResponse();
        r.setId(npc.getId());
        r.setName(npc.getName());
        r.setDescription(npc.getDescription());
        r.setImagePath(npc.getImagePath());
        r.setGameId(npc.getGame().getId());
        r.setGameName(npc.getGame().getName());
        r.setTags(npc.getTags().stream().map(tagService::toResponse).collect(Collectors.toSet()));
        r.setDialogues(npc.getDialogues().stream().map(NpcDialogue::getText).toList());
        r.setCreatedAt(npc.getCreatedAt());
        r.setUpdatedAt(npc.getUpdatedAt());
        return r;
    }

    private boolean existsCatalogEntry(String name, Long gameId, String type) {
        String target = NameNormalizer.normalize(name);
        return catalogEntryRepository.findByGameIdAndTypeOrderByNameAsc(gameId, type).stream()
                .map(CatalogEntry::getName)
                .map(NameNormalizer::normalize)
                .anyMatch(target::equals);
    }

    private CatalogEntry findCatalogEntryByNormalizedName(String name, Long gameId, String type) {
        String target = NameNormalizer.normalize(name);
        return catalogEntryRepository.findByGameIdAndTypeOrderByNameAsc(gameId, type).stream()
                .filter(e -> NameNormalizer.normalize(e.getName()).equals(target))
                .findFirst()
                .orElse(null);
    }

    private CatalogEntry resolveCatalogEntryForUpdate(String oldName, String newName, Long oldGameId, String type) {
        CatalogEntry byOldName = findCatalogEntryByNormalizedName(oldName, oldGameId, type);
        if (byOldName != null) return byOldName;

        CatalogEntry byNewName = findCatalogEntryByNormalizedName(newName, oldGameId, type);
        if (byNewName != null) return byNewName;

        String target = NameNormalizer.normalize(oldName);
        List<CatalogEntry> candidates = catalogEntryRepository.findByTypeOrderByNameAsc(type).stream()
                .filter(e -> NameNormalizer.normalize(e.getName()).equals(target))
                .toList();
        if (candidates.size() == 1) return candidates.get(0);

        throw new IllegalStateException("目録エントリとの紐付け不整合があるため更新できません。目録を確認してください。");
    }

    private void ensureNoDuplicateCatalogEntry(String name, Long gameId, String type, Long excludeId) {
        String target = NameNormalizer.normalize(name);
        boolean duplicated = catalogEntryRepository.findByGameIdAndTypeOrderByNameAsc(gameId, type).stream()
                .filter(entry -> excludeId == null || !entry.getId().equals(excludeId))
                .map(CatalogEntry::getName)
                .map(NameNormalizer::normalize)
                .anyMatch(target::equals);
        if (duplicated) {
            throw new IllegalArgumentException("目録に同一ゲーム・同一種別で同名のデータが既に存在します");
        }
    }

    private void ensureNoDuplicateNpc(String name, Long gameId, Long selfId) {
        String target = NameNormalizer.normalize(name);
        boolean duplicated = npcRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId).stream()
                .filter(npc -> selfId == null || !npc.getId().equals(selfId))
                .map(Npc::getName)
                .map(NameNormalizer::normalize)
                .anyMatch(target::equals);
        if (duplicated) {
            throw new IllegalArgumentException("同一ゲーム・同一種別で同名のデータが既に存在します");
        }
    }
}

package com.gamewiki.service;

import com.gamewiki.dto.BossRequest;
import com.gamewiki.dto.BossResponse;
import com.gamewiki.entity.Boss;
import com.gamewiki.entity.BossDialogue;
import com.gamewiki.entity.Game;
import com.gamewiki.entity.Tag;
import com.gamewiki.repository.BossRepository;
import com.gamewiki.repository.GameRepository;
import com.gamewiki.repository.TagRepository;
import com.gamewiki.util.EntityNameConflictChecker;
import com.gamewiki.util.EntitySearchFilter;
import com.gamewiki.util.ValidationMessages;
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
public class BossService {

    private final BossRepository bossRepository;
    private final GameRepository gameRepository;
    private final TagRepository tagRepository;
    private final FileStorageService fileStorageService;
    private final TagService tagService;
    private final EditHistoryService editHistoryService;

    @Transactional
    public void updateOrder(List<Long> ids) {
        for (int i = 0; i < ids.size(); i++) {
            Boss boss = getBoss(ids.get(i));
            boss.setSortOrder(i);
            bossRepository.save(boss);
        }
    }

    public List<BossResponse> findAll(Long gameId, String tagName, String keyword) {
        List<Boss> bosses = gameId != null
                ? bossRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId)
                : bossRepository.findAllByOrderBySortOrderAscIdAsc();
        bosses = EntitySearchFilter.apply(bosses, tagName, keyword, Boss::getTags, Boss::getName, Boss::getDescription);
        return bosses.stream().map(this::toResponse).toList();
    }

    public BossResponse findById(Long id) {
        return toResponse(getBoss(id));
    }

    public BossResponse create(BossRequest request, MultipartFile image, String editorUsername) {
        ensureNoDuplicateBoss(request.getName(), request.getGameId(), null);
        gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));
        String storedImagePath = image != null && !image.isEmpty() ? fileStorageService.store(image) : null;
        return createFromStoredImage(request, storedImagePath, editorUsername);
    }

    public BossResponse createFromStoredImage(BossRequest request, String storedImagePath, String editorUsername) {
        ensureNoDuplicateBoss(request.getName(), request.getGameId(), null);

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        Boss boss = new Boss();
        boss.setName(request.getName());
        boss.setDescription(request.getDescription());
        boss.setGame(game);
        boss.setTags(resolveTags(request.getTags(), request.getGameId()));
        boss.setUpdatedBy(editorUsername);
        setDialogues(boss, request.getDialogues());

        if (storedImagePath != null && !storedImagePath.isBlank()) {
            boss.setImagePath(storedImagePath);
        }

        Boss saved = bossRepository.save(boss);
        editHistoryService.record(editorUsername, "BOSS", saved.getId(), saved.getName(), "CREATE", saved.getGame().getName());
        return toResponse(saved);
    }

    @Transactional
    public BossResponse update(Long id, BossRequest request, MultipartFile image, String editorUsername) {
        getBoss(id);
        ensureNoDuplicateBoss(request.getName(), request.getGameId(), id);
        gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));
        String storedImagePath = image != null && !image.isEmpty() ? fileStorageService.store(image) : null;
        return updateFromStoredImage(id, request, storedImagePath, editorUsername);
    }

    @Transactional
    public BossResponse updateFromStoredImage(Long id, BossRequest request, String storedImagePath, String editorUsername) {
        Boss boss = getBoss(id);
        ensureNoDuplicateBoss(request.getName(), request.getGameId(), id);

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        boss.setName(request.getName());
        boss.setDescription(request.getDescription());
        boss.setGame(game);
        boss.setTags(resolveTags(request.getTags(), request.getGameId()));
        boss.setUpdatedBy(editorUsername);
        boss.getDialogues().clear();
        setDialogues(boss, request.getDialogues());

        if (storedImagePath != null && !storedImagePath.isBlank()) {
            fileStorageService.delete(boss.getImagePath());
            boss.setImagePath(storedImagePath);
        }

        Boss saved = bossRepository.save(boss);
        editHistoryService.record(editorUsername, "BOSS", saved.getId(), saved.getName(), "UPDATE", saved.getGame().getName());
        return toResponse(saved);
    }

    public void delete(Long id) {
        Boss boss = getBoss(id);
        fileStorageService.delete(boss.getImagePath());
        bossRepository.delete(boss);
    }

    private Boss getBoss(Long id) {
        return bossRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Boss not found: " + id));
    }

    private Set<Tag> resolveTags(Set<String> tagNames, Long gameId) {
        if (tagNames == null || tagNames.isEmpty()) return new HashSet<>();
        return tagNames.stream().map(name ->
            tagRepository.findByNameAndGameIdAndType(name, gameId, "BOSS")
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + name))
        ).collect(Collectors.toSet());
    }

    private void setDialogues(Boss boss, List<String> texts) {
        if (texts == null) return;
        for (int i = 0; i < texts.size(); i++) {
            String text = texts.get(i);
            if (text == null || text.isBlank()) continue;
            BossDialogue d = new BossDialogue();
            d.setBoss(boss);
            d.setText(text.trim());
            d.setOrderIndex(i);
            boss.getDialogues().add(d);
        }
    }

    private BossResponse toResponse(Boss boss) {
        BossResponse r = new BossResponse();
        r.setId(boss.getId());
        r.setName(boss.getName());
        r.setDescription(boss.getDescription());
        r.setImagePath(boss.getImagePath());
        r.setGameId(boss.getGame().getId());
        r.setGameName(boss.getGame().getName());
        r.setTags(boss.getTags().stream().map(tagService::toResponse).collect(Collectors.toSet()));
        r.setDialogues(boss.getDialogues().stream().map(BossDialogue::getText).toList());
        r.setCreatedAt(boss.getCreatedAt());
        r.setUpdatedAt(boss.getUpdatedAt());
        r.setUpdatedBy(boss.getUpdatedBy());
        return r;
    }

    private void ensureNoDuplicateBoss(String name, Long gameId, Long selfId) {
        if (EntityNameConflictChecker.hasDuplicateName(
                bossRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId),
                Boss::getId,
                Boss::getName,
                name,
                selfId
        )) {
            throw new IllegalArgumentException("同一ゲーム・同一種別で同名のデータが既に存在します");
        }
    }
}

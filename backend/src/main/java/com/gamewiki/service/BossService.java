package com.gamewiki.service;

import com.gamewiki.dto.BossRequest;
import com.gamewiki.dto.BossResponse;
import com.gamewiki.entity.Boss;
import com.gamewiki.entity.Game;
import com.gamewiki.entity.Tag;
import com.gamewiki.repository.BossRepository;
import com.gamewiki.repository.CatalogEntryRepository;
import com.gamewiki.repository.GameRepository;
import com.gamewiki.repository.TagRepository;
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
    private final CatalogEntryRepository catalogEntryRepository;
    private final FileStorageService fileStorageService;
    private final TagService tagService;

    @Transactional
    public void updateOrder(List<Long> ids) {
        for (int i = 0; i < ids.size(); i++) {
            Boss boss = getBoss(ids.get(i));
            boss.setSortOrder(i);
            bossRepository.save(boss);
        }
    }

    public List<BossResponse> findAll(Long gameId, String tagName, String keyword) {
        List<Boss> bosses;
        if (gameId != null) {
            bosses = bossRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId);
        } else {
            bosses = bossRepository.findAllByOrderBySortOrderAscIdAsc();
        }
        if (tagName != null && !tagName.isBlank()) {
            bosses = bosses.stream()
                    .filter(b -> b.getTags().stream().anyMatch(t -> t.getName().equalsIgnoreCase(tagName)))
                    .toList();
        }
        if (keyword != null && !keyword.isBlank()) {
            String lower = keyword.toLowerCase();
            bosses = bosses.stream()
                    .filter(b -> b.getName().toLowerCase().contains(lower)
                            || (b.getDescription() != null && b.getDescription().toLowerCase().contains(lower)))
                    .toList();
        }
        return bosses.stream().map(this::toResponse).toList();
    }

    public BossResponse findById(Long id) {
        return toResponse(getBoss(id));
    }

    public BossResponse create(BossRequest request, MultipartFile image) {
        if (!catalogEntryRepository.existsByNameAndTypeAndGameId(request.getName(), "BOSS", request.getGameId())) {
            throw new IllegalArgumentException("目録に登録されていないボスは作成できません。先に目録へ登録してください。");
        }

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        Boss boss = new Boss();
        boss.setName(request.getName());
        boss.setDescription(request.getDescription());
        boss.setGame(game);
        boss.setTags(resolveTags(request.getTags(), request.getGameId()));

        if (image != null && !image.isEmpty()) {
            boss.setImagePath(fileStorageService.store(image));
        }

        return toResponse(bossRepository.save(boss));
    }

    public BossResponse update(Long id, BossRequest request, MultipartFile image) {
        Boss boss = getBoss(id);

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        boss.setName(request.getName());
        boss.setDescription(request.getDescription());
        boss.setGame(game);
        boss.setTags(resolveTags(request.getTags(), request.getGameId()));

        if (image != null && !image.isEmpty()) {
            fileStorageService.delete(boss.getImagePath());
            boss.setImagePath(fileStorageService.store(image));
        }

        return toResponse(bossRepository.save(boss));
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

    private BossResponse toResponse(Boss boss) {
        BossResponse r = new BossResponse();
        r.setId(boss.getId());
        r.setName(boss.getName());
        r.setDescription(boss.getDescription());
        r.setImagePath(boss.getImagePath());
        r.setGameId(boss.getGame().getId());
        r.setGameName(boss.getGame().getName());
        r.setTags(boss.getTags().stream().map(tagService::toResponse).collect(Collectors.toSet()));
        r.setCreatedAt(boss.getCreatedAt());
        r.setUpdatedAt(boss.getUpdatedAt());
        return r;
    }
}

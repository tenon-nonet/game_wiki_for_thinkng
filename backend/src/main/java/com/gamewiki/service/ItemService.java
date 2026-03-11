package com.gamewiki.service;

import com.gamewiki.dto.ItemRequest;
import com.gamewiki.dto.ItemResponse;
import com.gamewiki.entity.Game;
import com.gamewiki.entity.Item;
import com.gamewiki.entity.Tag;
import com.gamewiki.repository.CatalogEntryRepository;
import com.gamewiki.repository.GameRepository;
import com.gamewiki.repository.ItemRepository;
import com.gamewiki.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ItemService {

    private final ItemRepository itemRepository;
    private final GameRepository gameRepository;
    private final TagRepository tagRepository;
    private final CatalogEntryRepository catalogEntryRepository;
    private final FileStorageService fileStorageService;
    private final TagService tagService;

    @Transactional
    public void updateOrder(List<Long> ids) {
        for (int i = 0; i < ids.size(); i++) {
            Item item = getItem(ids.get(i));
            item.setSortOrder(i);
            itemRepository.save(item);
        }
    }

    public List<ItemResponse> findAll(Long gameId, String tagName, String keyword) {
        List<Item> items;
        if (gameId != null) {
            items = itemRepository.findByGameIdOrderBySortOrderAscIdAsc(gameId);
        } else {
            items = itemRepository.findAllByOrderBySortOrderAscIdAsc();
        }
        if (tagName != null && !tagName.isBlank()) {
            items = items.stream()
                    .filter(i -> i.getTags().stream().anyMatch(t -> t.getName().equalsIgnoreCase(tagName)))
                    .toList();
        }
        if (keyword != null && !keyword.isBlank()) {
            String lower = keyword.toLowerCase();
            items = items.stream()
                    .filter(i -> i.getName().toLowerCase().contains(lower)
                            || (i.getDescription() != null && i.getDescription().toLowerCase().contains(lower)))
                    .toList();
        }
        return items.stream().map(this::toResponse).toList();
    }

    public ItemResponse findById(Long id) {
        return toResponse(getItem(id));
    }

    public ItemResponse create(ItemRequest request, MultipartFile image) {
        if (!catalogEntryRepository.existsByNameAndTypeAndGameId(request.getName(), "ITEM", request.getGameId())) {
            throw new IllegalArgumentException("目録に登録されていないアイテムは作成できません。先に目録へ登録してください。");
        }

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        Item item = new Item();
        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setCategory(request.getCategory());
        item.setGame(game);
        item.setTags(resolveTags(request.getTags(), request.getGameId()));

        if (image != null && !image.isEmpty()) {
            item.setImagePath(fileStorageService.store(image));
        }

        return toResponse(itemRepository.save(item));
    }

    public ItemResponse update(Long id, ItemRequest request, MultipartFile image) {
        Item item = getItem(id);

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        item.setName(request.getName());
        item.setDescription(request.getDescription());
        item.setCategory(request.getCategory());
        item.setGame(game);
        item.setTags(resolveTags(request.getTags(), request.getGameId()));

        if (image != null && !image.isEmpty()) {
            fileStorageService.delete(item.getImagePath());
            item.setImagePath(fileStorageService.store(image));
        }

        return toResponse(itemRepository.save(item));
    }

    public void delete(Long id) {
        Item item = getItem(id);
        fileStorageService.delete(item.getImagePath());
        itemRepository.delete(item);
    }

    private Item getItem(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + id));
    }

    private Set<Tag> resolveTags(Set<String> tagNames, Long gameId) {
        if (tagNames == null || tagNames.isEmpty()) return new HashSet<>();
        return tagNames.stream().map(name ->
            tagRepository.findByNameAndGameId(name, gameId)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + name))
        ).collect(Collectors.toSet());
    }

    private ItemResponse toResponse(Item item) {
        ItemResponse r = new ItemResponse();
        r.setId(item.getId());
        r.setName(item.getName());
        r.setDescription(item.getDescription());
        r.setImagePath(item.getImagePath());
        r.setGameId(item.getGame().getId());
        r.setGameName(item.getGame().getName());
        r.setTags(item.getTags().stream().map(tagService::toResponse).collect(Collectors.toSet()));
        r.setCategory(item.getCategory());
        r.setCreatedAt(item.getCreatedAt());
        r.setUpdatedAt(item.getUpdatedAt());
        return r;
    }
}

package com.gamewiki.service;

import com.gamewiki.dto.TagResponse;
import com.gamewiki.entity.Game;
import com.gamewiki.entity.Tag;
import com.gamewiki.repository.GameRepository;
import com.gamewiki.repository.ItemRepository;
import com.gamewiki.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final ItemRepository itemRepository;
    private final GameRepository gameRepository;

    public List<TagResponse> findByGameId(Long gameId) {
        return tagRepository.findByGameIdOrderByName(gameId).stream().map(this::toResponse).toList();
    }

    public TagResponse create(String name, Long gameId) {
        if (tagRepository.existsByNameAndGameId(name, gameId)) {
            throw new IllegalArgumentException("Tag already exists: " + name);
        }
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));
        Tag tag = new Tag();
        tag.setName(name);
        tag.setGame(game);
        return toResponse(tagRepository.save(tag));
    }

    public TagResponse update(Long id, String name) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + id));
        Long gameId = tag.getGame() != null ? tag.getGame().getId() : null;
        if (!tag.getName().equals(name) && gameId != null && tagRepository.existsByNameAndGameId(name, gameId)) {
            throw new IllegalArgumentException("Tag already exists: " + name);
        }
        tag.setName(name);
        return toResponse(tagRepository.save(tag));
    }

    @Transactional
    public void delete(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + id));
        itemRepository.findAll().forEach(item -> item.getTags().remove(tag));
        itemRepository.flush();
        tagRepository.delete(tag);
    }

    public TagResponse toResponse(Tag tag) {
        TagResponse r = new TagResponse();
        r.setId(tag.getId());
        r.setName(tag.getName());
        if (tag.getGame() != null) {
            r.setGameId(tag.getGame().getId());
        }
        return r;
    }
}

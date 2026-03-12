package com.gamewiki.service;

import com.gamewiki.dto.TagResponse;
import com.gamewiki.entity.Game;
import com.gamewiki.entity.Tag;
import com.gamewiki.repository.BossRepository;
import com.gamewiki.repository.GameRepository;
import com.gamewiki.repository.ItemRepository;
import com.gamewiki.repository.NpcRepository;
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
    private final BossRepository bossRepository;
    private final NpcRepository npcRepository;
    private final GameRepository gameRepository;

    public List<TagResponse> findByGameId(Long gameId, String type) {
        List<Tag> tags = (type != null && !type.isBlank())
                ? tagRepository.findByGameIdAndTypeOrderByNameAsc(gameId, type)
                : tagRepository.findByGameIdOrderByNameAsc(gameId);
        return tags.stream().map(this::toResponse).toList();
    }

    public TagResponse create(String name, Long gameId, String type, String attribute) {
        String resolvedType = (type != null && !type.isBlank()) ? type : "ITEM";
        if (tagRepository.existsByNameAndGameIdAndType(name, gameId, resolvedType)) {
            throw new IllegalArgumentException("Tag already exists: " + name);
        }
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));
        Tag tag = new Tag();
        tag.setName(name);
        tag.setType(resolvedType);
        tag.setAttribute(attribute != null && !attribute.isBlank() ? attribute : null);
        tag.setGame(game);
        return toResponse(tagRepository.save(tag));
    }

    public TagResponse update(Long id, String name, String attribute) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + id));
        Long gameId = tag.getGame() != null ? tag.getGame().getId() : null;
        if (!tag.getName().equals(name) && gameId != null
                && tagRepository.existsByNameAndGameIdAndType(name, gameId, tag.getType())) {
            throw new IllegalArgumentException("Tag already exists: " + name);
        }
        tag.setName(name);
        tag.setAttribute(attribute != null && !attribute.isBlank() ? attribute : null);
        return toResponse(tagRepository.save(tag));
    }

    @Transactional
    public void delete(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + id));
        itemRepository.findAll().forEach(item -> item.getTags().remove(tag));
        itemRepository.flush();
        bossRepository.findAll().forEach(boss -> boss.getTags().remove(tag));
        bossRepository.flush();
        npcRepository.findAll().forEach(npc -> npc.getTags().remove(tag));
        npcRepository.flush();
        tagRepository.delete(tag);
    }

    public TagResponse toResponse(Tag tag) {
        TagResponse r = new TagResponse();
        r.setId(tag.getId());
        r.setName(tag.getName());
        r.setType(tag.getType());
        r.setAttribute(tag.getAttribute());
        if (tag.getGame() != null) {
            r.setGameId(tag.getGame().getId());
        }
        return r;
    }
}

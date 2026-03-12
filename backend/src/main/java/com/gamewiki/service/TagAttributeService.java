package com.gamewiki.service;

import com.gamewiki.dto.TagAttributeResponse;
import com.gamewiki.entity.Game;
import com.gamewiki.entity.TagAttribute;
import com.gamewiki.repository.GameRepository;
import com.gamewiki.repository.TagAttributeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagAttributeService {

    private final TagAttributeRepository tagAttributeRepository;
    private final GameRepository gameRepository;

    public List<TagAttributeResponse> findByGameId(Long gameId) {
        return tagAttributeRepository.findByGameIdOrderBySortOrderAscNameAsc(gameId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public void updateOrder(List<Long> ids) {
        for (int i = 0; i < ids.size(); i++) {
            TagAttribute attr = tagAttributeRepository.findById(ids.get(i))
                    .orElseThrow(() -> new IllegalArgumentException("TagAttribute not found"));
            attr.setSortOrder(i);
            tagAttributeRepository.save(attr);
        }
    }

    public TagAttributeResponse create(String name, Long gameId) {
        if (tagAttributeRepository.existsByNameAndGameId(name, gameId)) {
            throw new IllegalArgumentException("TagAttribute already exists: " + name);
        }
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));
        TagAttribute attr = new TagAttribute();
        attr.setName(name);
        attr.setGame(game);
        attr.setSortOrder(tagAttributeRepository.countByGameId(gameId));
        return toResponse(tagAttributeRepository.save(attr));
    }

    public void delete(Long id) {
        TagAttribute attr = tagAttributeRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("TagAttribute not found: " + id));
        tagAttributeRepository.delete(attr);
    }

    private TagAttributeResponse toResponse(TagAttribute attr) {
        TagAttributeResponse r = new TagAttributeResponse();
        r.setId(attr.getId());
        r.setName(attr.getName());
        r.setGameId(attr.getGame().getId());
        return r;
    }
}

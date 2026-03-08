package com.gamewiki.service;

import com.gamewiki.dto.TagResponse;
import com.gamewiki.entity.Tag;
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

    public List<TagResponse> findAll() {
        return tagRepository.findAll().stream().map(this::toResponse).toList();
    }

    public TagResponse create(String name) {
        if (tagRepository.existsByName(name)) {
            throw new IllegalArgumentException("Tag already exists: " + name);
        }
        Tag tag = new Tag();
        tag.setName(name);
        return toResponse(tagRepository.save(tag));
    }

    public TagResponse update(Long id, String name) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + id));
        if (!tag.getName().equals(name) && tagRepository.existsByName(name)) {
            throw new IllegalArgumentException("Tag already exists: " + name);
        }
        tag.setName(name);
        return toResponse(tagRepository.save(tag));
    }

    @Transactional
    public void delete(Long id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + id));
        // 中間テーブルの参照を先に削除してからタグを削除する
        itemRepository.findAll().forEach(item -> item.getTags().remove(tag));
        itemRepository.flush();
        tagRepository.delete(tag);
    }

    public TagResponse toResponse(Tag tag) {
        TagResponse r = new TagResponse();
        r.setId(tag.getId());
        r.setName(tag.getName());
        return r;
    }
}

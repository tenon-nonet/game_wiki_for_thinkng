package com.gamewiki.service;

import com.gamewiki.dto.TagResponse;
import com.gamewiki.entity.Tag;
import com.gamewiki.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;

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

    public void delete(Long id) {
        tagRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tag not found: " + id));
        tagRepository.deleteById(id);
    }

    public TagResponse toResponse(Tag tag) {
        TagResponse r = new TagResponse();
        r.setId(tag.getId());
        r.setName(tag.getName());
        return r;
    }
}

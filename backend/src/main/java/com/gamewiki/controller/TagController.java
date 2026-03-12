package com.gamewiki.controller;

import com.gamewiki.dto.TagResponse;
import com.gamewiki.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<List<TagResponse>> findAll(
            @RequestParam Long gameId,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(tagService.findByGameId(gameId, type));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TagResponse> create(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        Object gameIdObj = body.get("gameId");
        if (name == null || name.isBlank() || gameIdObj == null) {
            return ResponseEntity.badRequest().build();
        }
        Long gameId = Long.valueOf(gameIdObj.toString());
        String type = body.get("type") != null ? body.get("type").toString() : null;
        String attribute = body.get("attribute") != null ? body.get("attribute").toString() : null;
        return ResponseEntity.ok(tagService.create(name, gameId, type, attribute));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TagResponse> update(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String attribute = body.get("attribute");
        return ResponseEntity.ok(tagService.update(id, name, attribute));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tagService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

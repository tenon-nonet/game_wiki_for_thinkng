package com.gamewiki.controller;

import com.gamewiki.dto.TagAttributeResponse;
import com.gamewiki.service.TagAttributeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tag-attributes")
@RequiredArgsConstructor
public class TagAttributeController {

    private final TagAttributeService tagAttributeService;

    @GetMapping
    public ResponseEntity<List<TagAttributeResponse>> findAll(@RequestParam Long gameId) {
        return ResponseEntity.ok(tagAttributeService.findByGameId(gameId));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TagAttributeResponse> create(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        Object gameIdObj = body.get("gameId");
        if (name == null || name.isBlank() || gameIdObj == null) {
            return ResponseEntity.badRequest().build();
        }
        Long gameId = Long.valueOf(gameIdObj.toString());
        return ResponseEntity.ok(tagAttributeService.create(name, gameId));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tagAttributeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

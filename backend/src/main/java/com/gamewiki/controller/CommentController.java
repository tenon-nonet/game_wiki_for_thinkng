package com.gamewiki.controller;

import com.gamewiki.dto.CommentResponse;
import com.gamewiki.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/api/items/{itemId}/comments")
    public ResponseEntity<List<CommentResponse>> list(
            @PathVariable Long itemId,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : null;
        return ResponseEntity.ok(commentService.findByItemId(itemId, username));
    }

    @PostMapping("/api/items/{itemId}/comments")
    public ResponseEntity<CommentResponse> create(
            @PathVariable Long itemId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String username = userDetails != null ? userDetails.getUsername() : "名もなき褪せ人";
        Long parentId = body.get("parentId") != null ? Long.parseLong(body.get("parentId")) : null;
        return ResponseEntity.ok(commentService.create(itemId, content.trim(), username, parentId));
    }

    @PutMapping("/api/comments/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CommentResponse> update(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        String content = body.get("content");
        if (content == null || content.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(commentService.update(id, content.trim(), userDetails.getUsername()));
    }

    @DeleteMapping("/api/comments/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        boolean isAdmin = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        commentService.delete(id, userDetails.getUsername(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/comments/{id}/like")
    public ResponseEntity<CommentResponse> toggleLike(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails != null ? userDetails.getUsername() : "名もなき褪せ人";
        return ResponseEntity.ok(commentService.toggleLike(id, username));
    }
}

package com.gamewiki.controller;

import com.gamewiki.repository.BoardPostRepository;
import com.gamewiki.repository.CommentRepository;
import com.gamewiki.repository.EditRequestRepository;
import com.gamewiki.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final EditRequestRepository editRequestRepository;
    private final CommentRepository commentRepository;
    private final BoardPostRepository boardPostRepository;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listUsers() {
        List<Map<String, Object>> users = userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(u -> {
                    String name = u.getUsername();
                    Map<String, Object> row = new java.util.LinkedHashMap<>();
                    row.put("id", u.getId());
                    row.put("username", name);
                    row.put("role", u.getRole().name());
                    row.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : "");
                    row.put("editRequestCount", editRequestRepository.countByRequestedBy(name));
                    row.put("commentCount", commentRepository.countByUsername(name));
                    row.put("boardPostCount", boardPostRepository.countByUsername(name));
                    return row;
                })
                .toList();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> countSince(@RequestParam(required = false) Long since) {
        long count;
        if (since != null) {
            LocalDateTime sinceDate = LocalDateTime.ofInstant(Instant.ofEpochMilli(since), ZoneOffset.UTC);
            count = userRepository.countByCreatedAtAfter(sinceDate);
        } else {
            count = userRepository.count();
        }
        return ResponseEntity.ok(Map.of("count", count));
    }
}

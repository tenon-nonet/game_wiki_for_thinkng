package com.gamewiki.controller;

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

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listUsers() {
        List<Map<String, Object>> users = userRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "username", u.getUsername(),
                        "role", u.getRole().name(),
                        "createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : ""
                ))
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

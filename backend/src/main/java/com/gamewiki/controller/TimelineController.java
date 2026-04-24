package com.gamewiki.controller;

import com.gamewiki.dto.TimelineRequest;
import com.gamewiki.dto.TimelineResponse;
import com.gamewiki.service.TimelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/timelines")
@RequiredArgsConstructor
public class TimelineController {

    private final TimelineService timelineService;

    /** 公式年表取得（全員） */
    @GetMapping("/{gameId}")
    public ResponseEntity<TimelineResponse> getOfficial(@PathVariable Long gameId) {
        return timelineService.findOfficial(gameId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** ユーザー個人年表取得（要ログイン） */
    @GetMapping("/{gameId}/mine")
    public ResponseEntity<TimelineResponse> getMine(
            @PathVariable Long gameId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return timelineService.findByUser(gameId, userDetails.getUsername())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** 公式年表保存（管理者のみ） */
    @PutMapping("/{gameId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TimelineResponse> saveOfficial(
            @PathVariable Long gameId,
            @RequestBody TimelineRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                timelineService.saveOfficial(gameId, request, userDetails.getUsername()));
    }

    /** ユーザー個人年表保存（要ログイン） */
    @PutMapping("/{gameId}/mine")
    public ResponseEntity<TimelineResponse> saveMine(
            @PathVariable Long gameId,
            @RequestBody TimelineRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                timelineService.saveUserTimeline(gameId, userDetails.getUsername(), request));
    }
}

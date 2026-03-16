package com.gamewiki.controller;

import com.gamewiki.dto.RelationGraphRequest;
import com.gamewiki.dto.RelationGraphResponse;
import com.gamewiki.service.RelationGraphService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/relation-graphs")
@RequiredArgsConstructor
public class RelationGraphController {

    private final RelationGraphService relationGraphService;

    /** 公式グラフ取得（全員） */
    @GetMapping("/{gameId}")
    public ResponseEntity<RelationGraphResponse> getOfficial(@PathVariable Long gameId) {
        return relationGraphService.findOfficial(gameId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** ユーザー個人グラフ取得（要ログイン） */
    @GetMapping("/{gameId}/mine")
    public ResponseEntity<RelationGraphResponse> getMine(
            @PathVariable Long gameId,
            @AuthenticationPrincipal UserDetails userDetails) {
        return relationGraphService.findByUser(gameId, userDetails.getUsername())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    /** 公式グラフ保存（管理者のみ） */
    @PutMapping("/{gameId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RelationGraphResponse> saveOfficial(
            @PathVariable Long gameId,
            @RequestBody RelationGraphRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                relationGraphService.saveOfficial(gameId, request.getGraphData(), userDetails.getUsername()));
    }

    /** ユーザー個人グラフ保存（要ログイン） */
    @PutMapping("/{gameId}/mine")
    public ResponseEntity<RelationGraphResponse> saveMine(
            @PathVariable Long gameId,
            @RequestBody RelationGraphRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
                relationGraphService.saveUserGraph(gameId, request.getGraphData(), userDetails.getUsername()));
    }
}

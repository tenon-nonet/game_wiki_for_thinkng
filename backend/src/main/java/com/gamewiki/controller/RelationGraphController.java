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

    @GetMapping("/{gameId}")
    public ResponseEntity<RelationGraphResponse> get(@PathVariable Long gameId) {
        return relationGraphService.findByGameId(gameId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PutMapping("/{gameId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RelationGraphResponse> save(
            @PathVariable Long gameId,
            @RequestBody RelationGraphRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        String username = userDetails.getUsername();
        return ResponseEntity.ok(relationGraphService.save(gameId, request.getGraphData(), username));
    }
}

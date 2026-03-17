package com.gamewiki.controller;

import com.gamewiki.dto.EditRequestDecisionRequest;
import com.gamewiki.dto.EditRequestResponse;
import com.gamewiki.service.EditRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/edit-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class EditRequestController {

    private final EditRequestService editRequestService;

    @GetMapping
    public ResponseEntity<List<EditRequestResponse>> findPending() {
        return ResponseEntity.ok(editRequestService.findPending());
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Long>> countPending() {
        return ResponseEntity.ok(Map.of("count", editRequestService.countPending()));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<EditRequestResponse> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(editRequestService.approve(id, userDetails.getUsername()));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<EditRequestResponse> reject(
            @PathVariable Long id,
            @RequestBody(required = false) EditRequestDecisionRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(editRequestService.reject(
                id,
                userDetails.getUsername(),
                request != null ? request.getReviewComment() : null
        ));
    }
}

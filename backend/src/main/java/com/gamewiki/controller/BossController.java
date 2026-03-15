package com.gamewiki.controller;

import com.gamewiki.dto.BossRequest;
import com.gamewiki.dto.BossResponse;
import com.gamewiki.dto.EditSubmissionResponse;
import com.gamewiki.service.EditRequestService;
import com.gamewiki.service.BossService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/bosses")
@RequiredArgsConstructor
public class BossController {

    private final BossService bossService;
    private final EditRequestService editRequestService;

    @GetMapping
    public ResponseEntity<List<BossResponse>> findAll(
            @RequestParam(required = false) Long gameId,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(bossService.findAll(gameId, tag, keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BossResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(bossService.findById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @Valid @RequestPart("data") BossRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (isAdmin(userDetails)) {
            return ResponseEntity.ok(bossService.create(request, image, userDetails.getUsername()));
        }
        editRequestService.createBossRequest("CREATE", null, request, image, userDetails != null ? userDetails.getUsername() : null);
        return ResponseEntity.accepted().body(new EditSubmissionResponse(true, "編集申請を送信しました"));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @Valid @RequestPart("data") BossRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (isAdmin(userDetails)) {
            return ResponseEntity.ok(bossService.update(id, request, image, userDetails.getUsername()));
        }
        editRequestService.createBossRequest("UPDATE", id, request, image, userDetails != null ? userDetails.getUsername() : null);
        return ResponseEntity.accepted().body(new EditSubmissionResponse(true, "編集申請を送信しました"));
    }

    @PutMapping("/order")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> updateOrder(@RequestBody List<Long> ids) {
        bossService.updateOrder(ids);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        bossService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isAdmin(UserDetails userDetails) {
        return userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }
}

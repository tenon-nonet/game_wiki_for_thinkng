package com.gamewiki.controller;

import com.gamewiki.dto.ItemRequest;
import com.gamewiki.dto.ItemResponse;
import com.gamewiki.dto.EditSubmissionResponse;
import com.gamewiki.service.EditRequestService;
import com.gamewiki.service.ItemService;
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
@RequestMapping("/api/items")
@RequiredArgsConstructor
public class ItemController {

    private final ItemService itemService;
    private final EditRequestService editRequestService;

    @GetMapping
    public ResponseEntity<List<ItemResponse>> findAll(
            @RequestParam(required = false) Long gameId,
            @RequestParam(required = false) String tag,
            @RequestParam(required = false) String keyword) {
        return ResponseEntity.ok(itemService.findAll(gameId, tag, keyword));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ItemResponse> findById(@PathVariable Long id) {
        return ResponseEntity.ok(itemService.findById(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> create(
            @Valid @RequestPart("data") ItemRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (isAdmin(userDetails)) {
            return ResponseEntity.ok(itemService.create(request, image, userDetails.getUsername()));
        }
        editRequestService.createItemRequest("CREATE", null, request, image, userDetails != null ? userDetails.getUsername() : null);
        return ResponseEntity.accepted().body(new EditSubmissionResponse(true, "編集申請を送信しました"));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @Valid @RequestPart("data") ItemRequest request,
            @RequestPart(value = "image", required = false) MultipartFile image,
            @AuthenticationPrincipal UserDetails userDetails) {
        if (isAdmin(userDetails)) {
            return ResponseEntity.ok(itemService.update(id, request, image, userDetails.getUsername()));
        }
        editRequestService.createItemRequest("UPDATE", id, request, image, userDetails != null ? userDetails.getUsername() : null);
        return ResponseEntity.accepted().body(new EditSubmissionResponse(true, "編集申請を送信しました"));
    }

    @PutMapping("/order")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> updateOrder(@RequestBody List<Long> ids) {
        itemService.updateOrder(ids);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        itemService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private boolean isAdmin(UserDetails userDetails) {
        return userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"));
    }
}

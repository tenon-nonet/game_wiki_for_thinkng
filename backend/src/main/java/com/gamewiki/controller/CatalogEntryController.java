package com.gamewiki.controller;

import com.gamewiki.dto.CatalogBulkRequest;
import com.gamewiki.dto.CatalogEntryRequest;
import com.gamewiki.dto.CatalogEntryResponse;
import com.gamewiki.service.CatalogEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/catalog")
@RequiredArgsConstructor
public class CatalogEntryController {

    private final CatalogEntryService catalogEntryService;

    @GetMapping
    public ResponseEntity<List<CatalogEntryResponse>> findAll(
            @RequestParam Long gameId,
            @RequestParam(required = false) String type) {
        return ResponseEntity.ok(catalogEntryService.findAll(gameId, type));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CatalogEntryResponse> create(
            @Valid @RequestBody CatalogEntryRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(catalogEntryService.create(request, authentication.getName()));
    }

    @PostMapping("/bulk")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Integer>> bulkCreate(
            @Valid @RequestBody CatalogBulkRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(catalogEntryService.bulkCreate(request, authentication.getName()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        catalogEntryService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

package com.gamewiki.service;

import com.gamewiki.dto.CatalogBulkRequest;
import com.gamewiki.dto.CatalogEntryRequest;
import com.gamewiki.dto.CatalogEntryResponse;
import com.gamewiki.entity.CatalogEntry;
import com.gamewiki.entity.Game;
import com.gamewiki.repository.CatalogEntryRepository;
import com.gamewiki.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CatalogEntryService {

    private final CatalogEntryRepository catalogEntryRepository;
    private final GameRepository gameRepository;

    public List<CatalogEntryResponse> findAll(Long gameId, String type) {
        List<CatalogEntry> entries;
        if (type != null && !type.isBlank()) {
            entries = catalogEntryRepository.findByGameIdAndTypeOrderByNameAsc(gameId, type);
        } else {
            entries = catalogEntryRepository.findByGameIdOrderByTypeAscNameAsc(gameId);
        }
        return entries.stream().map(this::toResponse).toList();
    }

    public CatalogEntryResponse create(CatalogEntryRequest request, String username) {
        if (catalogEntryRepository.existsByNameAndTypeAndGameId(request.getName(), request.getType(), request.getGameId())) {
            throw new IllegalArgumentException("既に登録されています");
        }

        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        CatalogEntry entry = new CatalogEntry();
        entry.setName(request.getName());
        entry.setType(request.getType());
        entry.setCategory(request.getCategory());
        entry.setGame(game);
        entry.setCreatedBy(username);

        return toResponse(catalogEntryRepository.save(entry));
    }

    public Map<String, Integer> bulkCreate(CatalogBulkRequest request, String username) {
        Game game = gameRepository.findById(request.getGameId())
                .orElseThrow(() -> new IllegalArgumentException("Game not found"));

        int added = 0, skipped = 0;
        for (String rawName : request.getNames()) {
            String name = rawName == null ? "" : rawName.trim();
            if (name.isBlank()) continue;
            if (catalogEntryRepository.existsByNameAndTypeAndGameId(name, request.getType(), request.getGameId())) {
                skipped++;
                continue;
            }
            CatalogEntry entry = new CatalogEntry();
            entry.setName(name);
            entry.setType(request.getType());
            entry.setCategory(request.getCategory());
            entry.setGame(game);
            entry.setCreatedBy(username);
            catalogEntryRepository.save(entry);
            added++;
        }
        return Map.of("added", added, "skipped", skipped);
    }

    public void delete(Long id) {
        CatalogEntry entry = catalogEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("CatalogEntry not found: " + id));
        catalogEntryRepository.delete(entry);
    }

    private CatalogEntryResponse toResponse(CatalogEntry entry) {
        CatalogEntryResponse r = new CatalogEntryResponse();
        r.setId(entry.getId());
        r.setName(entry.getName());
        r.setType(entry.getType());
        r.setCategory(entry.getCategory());
        r.setGameId(entry.getGame().getId());
        r.setGameName(entry.getGame().getName());
        r.setCreatedBy(entry.getCreatedBy());
        r.setCreatedAt(entry.getCreatedAt());
        return r;
    }
}

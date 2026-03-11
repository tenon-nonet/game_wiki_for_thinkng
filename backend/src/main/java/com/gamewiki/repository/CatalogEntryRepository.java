package com.gamewiki.repository;

import com.gamewiki.entity.CatalogEntry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CatalogEntryRepository extends JpaRepository<CatalogEntry, Long> {
    List<CatalogEntry> findByGameIdAndTypeOrderByNameAsc(Long gameId, String type);
    List<CatalogEntry> findByGameIdOrderByTypeAscNameAsc(Long gameId);
    boolean existsByNameAndTypeAndGameId(String name, String type, Long gameId);
}

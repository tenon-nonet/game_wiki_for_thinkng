package com.gamewiki.repository;

import com.gamewiki.entity.TagAttribute;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagAttributeRepository extends JpaRepository<TagAttribute, Long> {
    List<TagAttribute> findByGameIdOrderBySortOrderAscNameAsc(Long gameId);
    boolean existsByNameAndGameId(String name, Long gameId);
    int countByGameId(Long gameId);
}

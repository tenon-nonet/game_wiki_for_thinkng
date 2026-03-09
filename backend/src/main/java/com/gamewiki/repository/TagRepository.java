package com.gamewiki.repository;

import com.gamewiki.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findByGameIdOrderByName(Long gameId);
    Optional<Tag> findByNameAndGameId(String name, Long gameId);
    boolean existsByNameAndGameId(String name, Long gameId);
}

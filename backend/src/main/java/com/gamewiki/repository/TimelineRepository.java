package com.gamewiki.repository;

import com.gamewiki.entity.Timeline;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface TimelineRepository extends JpaRepository<Timeline, Long> {
    Optional<Timeline> findByGameIdAndUsernameIsNull(Long gameId);
    Optional<Timeline> findByGameIdAndUsername(Long gameId, String username);
}

package com.gamewiki.repository;

import com.gamewiki.entity.BoardThread;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoardThreadRepository extends JpaRepository<BoardThread, Long> {
    List<BoardThread> findAllByGameIdIn(List<Long> gameIds);
    List<BoardThread> findByBoardType(String boardType);
    List<BoardThread> findByGameIdOrderByPinnedDescLastPostedAtDescIdDesc(Long gameId);
    List<BoardThread> findByBoardTypeOrderByPinnedDescLastPostedAtDescIdDesc(String boardType);
    Optional<BoardThread> findByIdAndGameId(Long id, Long gameId);
    Optional<BoardThread> findByIdAndBoardType(Long id, String boardType);
    Optional<BoardThread> findTopByAuthorKeyOrderByCreatedAtDescIdDesc(String authorKey);
}

package com.gamewiki.repository;

import com.gamewiki.entity.BoardPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BoardPostRepository extends JpaRepository<BoardPost, Long> {
    List<BoardPost> findByThreadIdOrderByCreatedAtAscIdAsc(Long threadId);
    Optional<BoardPost> findTopByAuthorKeyOrderByCreatedAtDescIdDesc(String authorKey);
    Optional<BoardPost> findTopByThreadIdOrderByCreatedAtDescIdDesc(Long threadId);
    long countByThreadId(Long threadId);
    void deleteByThreadId(Long threadId);
}

package com.gamewiki.repository;

import com.gamewiki.entity.BoardPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BoardPostRepository extends JpaRepository<BoardPost, Long> {
    List<BoardPost> findByThreadIdOrderByCreatedAtAscIdAsc(Long threadId);
    java.util.Optional<BoardPost> findTopByAuthorKeyOrderByCreatedAtDescIdDesc(String authorKey);
}

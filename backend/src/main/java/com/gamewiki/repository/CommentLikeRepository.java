package com.gamewiki.repository;

import com.gamewiki.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {
    List<CommentLike> findByCommentIdIn(List<Long> commentIds);
    Optional<CommentLike> findByCommentIdAndUsername(Long commentId, String username);
}

package com.gamewiki.repository;

import com.gamewiki.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByItemIdAndParentIdIsNullOrderByCreatedAtDesc(Long itemId);
    List<Comment> findByParentIdInOrderByCreatedAtAsc(List<Long> parentIds);
}

package com.gamewiki.service;

import com.gamewiki.dto.CommentResponse;
import com.gamewiki.entity.Comment;
import com.gamewiki.entity.Item;
import com.gamewiki.repository.CommentRepository;
import com.gamewiki.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final ItemRepository itemRepository;

    public List<CommentResponse> findByItemId(Long itemId) {
        return commentRepository.findByItemIdOrderByCreatedAtDesc(itemId)
                .stream().map(this::toResponse).toList();
    }

    public CommentResponse create(Long itemId, String content, String username) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + itemId));
        Comment comment = new Comment();
        comment.setContent(content);
        comment.setUsername(username);
        comment.setItem(item);
        return toResponse(commentRepository.save(comment));
    }

    public CommentResponse update(Long commentId, String content, String username) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        if (!comment.getUsername().equals(username)) {
            throw new SecurityException("Cannot edit another user's comment");
        }
        comment.setContent(content);
        return toResponse(commentRepository.save(comment));
    }

    public void delete(Long commentId, String username, boolean isAdmin) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        if (!isAdmin && !comment.getUsername().equals(username)) {
            throw new SecurityException("Cannot delete another user's comment");
        }
        commentRepository.delete(comment);
    }

    private CommentResponse toResponse(Comment comment) {
        CommentResponse r = new CommentResponse();
        r.setId(comment.getId());
        r.setContent(comment.getContent());
        r.setUsername(comment.getUsername());
        r.setCreatedAt(comment.getCreatedAt());
        return r;
    }
}

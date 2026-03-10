package com.gamewiki.service;

import com.gamewiki.dto.CommentResponse;
import com.gamewiki.entity.Comment;
import com.gamewiki.entity.CommentLike;
import com.gamewiki.entity.Item;
import com.gamewiki.repository.CommentLikeRepository;
import com.gamewiki.repository.CommentRepository;
import com.gamewiki.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final ItemRepository itemRepository;
    private final CommentLikeRepository commentLikeRepository;

    public List<CommentResponse> findByItemId(Long itemId, String currentUsername) {
        List<Comment> comments = commentRepository.findByItemIdOrderByCreatedAtDesc(itemId);
        List<Long> ids = comments.stream().map(Comment::getId).toList();
        List<CommentLike> allLikes = ids.isEmpty() ? List.of() : commentLikeRepository.findByCommentIdIn(ids);

        Map<Long, Long> likeCounts = allLikes.stream()
                .collect(Collectors.groupingBy(CommentLike::getCommentId, Collectors.counting()));
        Set<Long> likedIds = currentUsername != null
                ? allLikes.stream()
                        .filter(l -> l.getUsername().equals(currentUsername))
                        .map(CommentLike::getCommentId)
                        .collect(Collectors.toSet())
                : Set.of();

        return comments.stream()
                .map(c -> toResponse(c, likeCounts.getOrDefault(c.getId(), 0L), likedIds.contains(c.getId())))
                .toList();
    }

    public CommentResponse create(Long itemId, String content, String username) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + itemId));
        Comment comment = new Comment();
        comment.setContent(content);
        comment.setUsername(username);
        comment.setItem(item);
        return toResponse(commentRepository.save(comment), 0L, false);
    }

    public CommentResponse update(Long commentId, String content, String username) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        if (!comment.getUsername().equals(username)) {
            throw new SecurityException("Cannot edit another user's comment");
        }
        comment.setContent(content);
        Comment saved = commentRepository.save(comment);
        long likeCount = commentLikeRepository.findByCommentIdIn(List.of(saved.getId())).size();
        boolean likedByMe = commentLikeRepository.findByCommentIdAndUsername(saved.getId(), username).isPresent();
        return toResponse(saved, likeCount, likedByMe);
    }

    public void delete(Long commentId, String username, boolean isAdmin) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        if (!isAdmin && !comment.getUsername().equals(username)) {
            throw new SecurityException("Cannot delete another user's comment");
        }
        commentRepository.delete(comment);
    }

    public CommentResponse toggleLike(Long commentId, String username) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        Optional<CommentLike> existing = commentLikeRepository.findByCommentIdAndUsername(commentId, username);
        if (existing.isPresent()) {
            commentLikeRepository.delete(existing.get());
        } else {
            CommentLike like = new CommentLike();
            like.setCommentId(commentId);
            like.setUsername(username);
            commentLikeRepository.save(like);
        }
        List<CommentLike> likes = commentLikeRepository.findByCommentIdIn(List.of(commentId));
        long likeCount = likes.size();
        boolean likedByMe = likes.stream().anyMatch(l -> l.getUsername().equals(username));
        return toResponse(comment, likeCount, likedByMe);
    }

    private CommentResponse toResponse(Comment comment, long likeCount, boolean likedByMe) {
        CommentResponse r = new CommentResponse();
        r.setId(comment.getId());
        r.setContent(comment.getContent());
        r.setUsername(comment.getUsername());
        r.setCreatedAt(comment.getCreatedAt());
        r.setLikeCount(likeCount);
        r.setLikedByMe(likedByMe);
        return r;
    }
}

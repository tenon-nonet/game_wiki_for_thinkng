package com.gamewiki.service;

import com.gamewiki.dto.CommentResponse;
import com.gamewiki.dto.MyCommentResponse;
import com.gamewiki.entity.Comment;
import com.gamewiki.entity.CommentLike;
import com.gamewiki.entity.Item;
import com.gamewiki.repository.CommentLikeRepository;
import com.gamewiki.repository.CommentRepository;
import com.gamewiki.repository.ItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final ItemRepository itemRepository;
    private final CommentLikeRepository commentLikeRepository;

    public List<CommentResponse> findByItemId(Long itemId, String currentUsername) {
        List<Comment> topLevel = commentRepository.findByItemIdAndParentIdIsNullOrderByCreatedAtDesc(itemId);
        List<Long> topIds = topLevel.stream().map(Comment::getId).toList();
        List<Comment> replies = topIds.isEmpty() ? List.of()
                : commentRepository.findByParentIdInOrderByCreatedAtAsc(topIds);

        // collect all comment IDs for batch like lookup
        List<Long> allIds = Stream.concat(topIds.stream(), replies.stream().map(Comment::getId)).toList();
        List<CommentLike> allLikes = allIds.isEmpty() ? List.of()
                : commentLikeRepository.findByCommentIdIn(allIds);

        Map<Long, Long> likeCounts = allLikes.stream()
                .collect(Collectors.groupingBy(CommentLike::getCommentId, Collectors.counting()));
        Set<Long> likedIds = currentUsername != null
                ? allLikes.stream()
                        .filter(l -> l.getUsername().equals(currentUsername))
                        .map(CommentLike::getCommentId)
                        .collect(Collectors.toSet())
                : Set.of();

        // group replies by parentId
        Map<Long, List<Comment>> replyMap = replies.stream()
                .collect(Collectors.groupingBy(Comment::getParentId));

        return topLevel.stream().map(c -> {
            CommentResponse r = toResponse(c, likeCounts.getOrDefault(c.getId(), 0L), likedIds.contains(c.getId()));
            List<Comment> childList = replyMap.getOrDefault(c.getId(), List.of());
            r.setReplies(childList.stream()
                    .map(rep -> toResponse(rep, likeCounts.getOrDefault(rep.getId(), 0L), likedIds.contains(rep.getId())))
                    .toList());
            return r;
        }).toList();
    }

    public CommentResponse create(Long itemId, String content, String username, Long parentId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Item not found: " + itemId));
        Comment comment = new Comment();
        comment.setContent(content);
        comment.setUsername(username);
        comment.setItem(item);
        comment.setParentId(parentId);
        Comment saved = commentRepository.save(comment);
        CommentResponse r = toResponse(saved, 0L, false);
        r.setReplies(new ArrayList<>());
        return r;
    }

    public CommentResponse update(Long commentId, String content, String username) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found: " + commentId));
        if (!comment.getUsername().equals(username)) {
            throw new SecurityException("Cannot edit another user's comment");
        }
        comment.setContent(content);
        Comment saved = commentRepository.save(comment);
        List<CommentLike> likes = commentLikeRepository.findByCommentIdIn(List.of(saved.getId()));
        boolean likedByMe = likes.stream().anyMatch(l -> l.getUsername().equals(username));
        CommentResponse r = toResponse(saved, likes.size(), likedByMe);
        r.setReplies(new ArrayList<>());
        return r;
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
        boolean likedByMe = likes.stream().anyMatch(l -> l.getUsername().equals(username));
        CommentResponse r = toResponse(comment, likes.size(), likedByMe);
        r.setReplies(new ArrayList<>());
        return r;
    }

    public List<MyCommentResponse> findByUsername(String username) {
        return commentRepository.findTop100ByUsernameOrderByCreatedAtDesc(username)
                .stream()
                .map(this::toMyCommentResponse)
                .toList();
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

    private MyCommentResponse toMyCommentResponse(Comment comment) {
        MyCommentResponse response = new MyCommentResponse();
        response.setId(comment.getId());
        response.setItemId(comment.getItem().getId());
        response.setItemName(comment.getItem().getName());
        response.setContent(comment.getContent());
        response.setCreatedAt(comment.getCreatedAt());
        return response;
    }
}

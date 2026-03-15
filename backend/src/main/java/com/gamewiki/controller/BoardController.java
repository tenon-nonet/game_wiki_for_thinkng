package com.gamewiki.controller;

import com.gamewiki.dto.BoardGameSummaryResponse;
import com.gamewiki.dto.BoardPostRequest;
import com.gamewiki.dto.BoardPostResponse;
import com.gamewiki.dto.BoardThreadDetailResponse;
import com.gamewiki.dto.BoardThreadRequest;
import com.gamewiki.dto.BoardThreadSummaryResponse;
import com.gamewiki.service.BoardService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boards")
@RequiredArgsConstructor
public class BoardController {

    private final BoardService boardService;

    @GetMapping
    public ResponseEntity<List<BoardGameSummaryResponse>> listBoardGames() {
        return ResponseEntity.ok(boardService.getBoardGames());
    }

    @GetMapping("/general/threads")
    public ResponseEntity<List<BoardThreadSummaryResponse>> listGeneralThreads() {
        return ResponseEntity.ok(boardService.getGeneralThreads());
    }

    @GetMapping("/{gameId}/threads")
    public ResponseEntity<List<BoardThreadSummaryResponse>> listThreads(@PathVariable Long gameId) {
        return ResponseEntity.ok(boardService.getThreads(gameId));
    }

    @GetMapping("/general/threads/{threadId}")
    public ResponseEntity<BoardThreadDetailResponse> getGeneralThread(@PathVariable Long threadId) {
        return ResponseEntity.ok(boardService.getGeneralThread(threadId));
    }

    @GetMapping("/{gameId}/threads/{threadId}")
    public ResponseEntity<BoardThreadDetailResponse> getThread(@PathVariable Long gameId, @PathVariable Long threadId) {
        return ResponseEntity.ok(boardService.getThread(gameId, threadId));
    }

    @PostMapping("/{gameId}/threads")
    public ResponseEntity<BoardThreadSummaryResponse> createThread(
            @PathVariable Long gameId,
            @Valid @RequestBody BoardThreadRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpServletRequest) {
        String username = userDetails != null ? userDetails.getUsername() : "名もなき褪せ人";
        return ResponseEntity.ok(boardService.createThread(gameId, request, username, resolveAuthorKey(httpServletRequest), canPin(userDetails)));
    }

    @PostMapping("/general/threads")
    public ResponseEntity<BoardThreadSummaryResponse> createGeneralThread(
            @Valid @RequestBody BoardThreadRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpServletRequest) {
        String username = userDetails != null ? userDetails.getUsername() : "名もなき褪せ人";
        return ResponseEntity.ok(boardService.createGeneralThread(request, username, resolveAuthorKey(httpServletRequest), canPin(userDetails)));
    }

    @PostMapping("/{gameId}/threads/{threadId}/posts")
    public ResponseEntity<BoardPostResponse> createPost(
            @PathVariable Long gameId,
            @PathVariable Long threadId,
            @Valid @RequestBody BoardPostRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpServletRequest) {
        String username = userDetails != null ? userDetails.getUsername() : "名もなき褪せ人";
        return ResponseEntity.ok(boardService.createPost(gameId, threadId, request, username, resolveAuthorKey(httpServletRequest)));
    }

    @PostMapping("/general/threads/{threadId}/posts")
    public ResponseEntity<BoardPostResponse> createGeneralPost(
            @PathVariable Long threadId,
            @Valid @RequestBody BoardPostRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpServletRequest) {
        String username = userDetails != null ? userDetails.getUsername() : "名もなき褪せ人";
        return ResponseEntity.ok(boardService.createGeneralPost(threadId, request, username, resolveAuthorKey(httpServletRequest)));
    }

    @DeleteMapping("/{gameId}/threads/{threadId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteThread(@PathVariable Long gameId, @PathVariable Long threadId) {
        boardService.deleteThread(gameId, threadId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/general/threads/{threadId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteGeneralThread(@PathVariable Long threadId) {
        boardService.deleteGeneralThread(threadId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{gameId}/threads/{threadId}/posts/{postId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deletePost(@PathVariable Long gameId, @PathVariable Long threadId, @PathVariable Long postId) {
        boardService.deletePost(gameId, threadId, postId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/general/threads/{threadId}/posts/{postId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteGeneralPost(@PathVariable Long threadId, @PathVariable Long postId) {
        boardService.deleteGeneralPost(threadId, postId);
        return ResponseEntity.noContent().build();
    }

    private String resolveAuthorKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr != null && !remoteAddr.isBlank() ? remoteAddr : "unknown";
    }

    private boolean canPin(UserDetails userDetails) {
        return userDetails != null && userDetails.getAuthorities().stream()
                .anyMatch(authority -> "ROLE_ADMIN".equals(authority.getAuthority()));
    }
}
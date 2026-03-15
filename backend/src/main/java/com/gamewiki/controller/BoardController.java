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
    public ResponseEntity<BoardThreadDetailResponse> getThread(
            @PathVariable Long gameId,
            @PathVariable Long threadId) {
        return ResponseEntity.ok(boardService.getThread(gameId, threadId));
    }

    @PostMapping("/{gameId}/threads")
    public ResponseEntity<BoardThreadSummaryResponse> createThread(
            @PathVariable Long gameId,
            @Valid @RequestBody BoardThreadRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpServletRequest) {
        String username = userDetails != null ? userDetails.getUsername() : "名もなき褪せ人";
        return ResponseEntity.ok(boardService.createThread(gameId, request, username, resolveAuthorKey(httpServletRequest)));
    }

    @PostMapping("/general/threads")
    public ResponseEntity<BoardThreadSummaryResponse> createGeneralThread(
            @Valid @RequestBody BoardThreadRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpServletRequest) {
        String username = userDetails != null ? userDetails.getUsername() : "名もなき褪せ人";
        return ResponseEntity.ok(boardService.createGeneralThread(request, username, resolveAuthorKey(httpServletRequest)));
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

    private String resolveAuthorKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr != null && !remoteAddr.isBlank() ? remoteAddr : "unknown";
    }
}
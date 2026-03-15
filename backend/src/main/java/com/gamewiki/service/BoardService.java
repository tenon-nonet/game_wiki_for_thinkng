package com.gamewiki.service;

import com.gamewiki.dto.*;
import com.gamewiki.entity.BoardPost;
import com.gamewiki.entity.BoardThread;
import com.gamewiki.entity.Game;
import com.gamewiki.repository.BoardPostRepository;
import com.gamewiki.repository.BoardThreadRepository;
import com.gamewiki.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {
    private static final String BOARD_TYPE_GAME = "GAME";
    private static final String BOARD_TYPE_GENERAL = "GENERAL";

    private final GameRepository gameRepository;
    private final BoardThreadRepository boardThreadRepository;
    private final BoardPostRepository boardPostRepository;

    public List<BoardGameSummaryResponse> getBoardGames() {
        List<Game> games = gameRepository.findAllByVisibleTrueOrderBySortOrderAscIdAsc();
        List<Long> gameIds = games.stream().map(Game::getId).toList();
        List<BoardThread> threads = gameIds.isEmpty() ? List.of() : boardThreadRepository.findAllByGameIdIn(gameIds);
        Map<Long, List<BoardThread>> threadsByGameId = threads.stream().collect(Collectors.groupingBy(thread -> thread.getGame().getId()));

        return games.stream().map(game -> {
            List<BoardThread> gameThreads = threadsByGameId.getOrDefault(game.getId(), List.of());
            BoardGameSummaryResponse response = new BoardGameSummaryResponse();
            response.setGameId(game.getId());
            response.setGameName(game.getName());
            response.setImagePath(game.getImagePath());
            response.setThreadCount(gameThreads.size());
            response.setLatestPostedAt(
                    gameThreads.stream()
                            .map(BoardThread::getLastPostedAt)
                            .max(Comparator.naturalOrder())
                            .orElse(null)
            );
            return response;
        }).toList();
    }

    public List<BoardThreadSummaryResponse> getGeneralThreads() {
        return boardThreadRepository.findByBoardTypeOrderByPinnedDescLastPostedAtDescIdDesc(BOARD_TYPE_GENERAL)
                .stream()
                .map(this::toThreadSummary)
                .toList();
    }

    public List<BoardThreadSummaryResponse> getThreads(Long gameId) {
        getVisibleGame(gameId);
        return boardThreadRepository.findByGameIdOrderByPinnedDescLastPostedAtDescIdDesc(gameId)
                .stream()
                .map(this::toThreadSummary)
                .toList();
    }

    public BoardThreadDetailResponse getThread(Long gameId, Long threadId) {
        BoardThread thread = getThreadEntity(gameId, threadId);
        List<BoardPostResponse> posts = boardPostRepository.findByThreadIdOrderByCreatedAtAscIdAsc(threadId)
                .stream()
                .map(this::toPostResponse)
                .toList();

        BoardThreadDetailResponse response = new BoardThreadDetailResponse();
        response.setThread(toThreadSummary(thread));
        response.setPosts(posts);
        return response;
    }

    public BoardThreadDetailResponse getGeneralThread(Long threadId) {
        BoardThread thread = getGeneralThreadEntity(threadId);
        List<BoardPostResponse> posts = boardPostRepository.findByThreadIdOrderByCreatedAtAscIdAsc(threadId)
                .stream()
                .map(this::toPostResponse)
                .toList();

        BoardThreadDetailResponse response = new BoardThreadDetailResponse();
        response.setThread(toThreadSummary(thread));
        response.setPosts(posts);
        return response;
    }

    @Transactional
    public BoardThreadSummaryResponse createThread(Long gameId, BoardThreadRequest request, String username) {
        Game game = getVisibleGame(gameId);

        BoardThread thread = new BoardThread();
        thread.setGame(game);
        thread.setBoardType(BOARD_TYPE_GAME);
        thread.setTitle(request.getTitle().trim());
        thread.setContent(request.getContent().trim());
        thread.setUsername(username);
        thread.setLastPostedAt(LocalDateTime.now());

        return toThreadSummary(boardThreadRepository.save(thread));
    }

    @Transactional
    public BoardThreadSummaryResponse createGeneralThread(BoardThreadRequest request, String username) {
        BoardThread thread = new BoardThread();
        thread.setGame(null);
        thread.setBoardType(BOARD_TYPE_GENERAL);
        thread.setTitle(request.getTitle().trim());
        thread.setContent(request.getContent().trim());
        thread.setUsername(username);
        thread.setLastPostedAt(LocalDateTime.now());

        return toThreadSummary(boardThreadRepository.save(thread));
    }

    @Transactional
    public BoardPostResponse createPost(Long gameId, Long threadId, BoardPostRequest request, String username) {
        BoardThread thread = getThreadEntity(gameId, threadId);
        if (thread.isLocked()) {
            throw new IllegalArgumentException("このスレッドはロックされています");
        }

        BoardPost post = new BoardPost();
        post.setThread(thread);
        post.setContent(request.getContent().trim());
        post.setUsername(username);
        BoardPost saved = boardPostRepository.save(post);

        thread.setReplyCount(thread.getReplyCount() + 1);
        thread.setLastPostedAt(LocalDateTime.now());
        boardThreadRepository.save(thread);

        return toPostResponse(saved);
    }

    @Transactional
    public BoardPostResponse createGeneralPost(Long threadId, BoardPostRequest request, String username) {
        BoardThread thread = getGeneralThreadEntity(threadId);
        if (thread.isLocked()) {
            throw new IllegalArgumentException("このスレッドはロックされています");
        }

        BoardPost post = new BoardPost();
        post.setThread(thread);
        post.setContent(request.getContent().trim());
        post.setUsername(username);
        BoardPost saved = boardPostRepository.save(post);

        thread.setReplyCount(thread.getReplyCount() + 1);
        thread.setLastPostedAt(LocalDateTime.now());
        boardThreadRepository.save(thread);

        return toPostResponse(saved);
    }

    private Game getVisibleGame(Long gameId) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));
        if (!game.isVisible()) {
            throw new IllegalArgumentException("Game not found: " + gameId);
        }
        return game;
    }

    private BoardThread getThreadEntity(Long gameId, Long threadId) {
        getVisibleGame(gameId);
        return boardThreadRepository.findByIdAndGameId(threadId, gameId)
                .orElseThrow(() -> new IllegalArgumentException("Thread not found: " + threadId));
    }

    private BoardThread getGeneralThreadEntity(Long threadId) {
        return boardThreadRepository.findByIdAndBoardType(threadId, BOARD_TYPE_GENERAL)
                .orElseThrow(() -> new IllegalArgumentException("Thread not found: " + threadId));
    }

    private BoardThreadSummaryResponse toThreadSummary(BoardThread thread) {
        BoardThreadSummaryResponse response = new BoardThreadSummaryResponse();
        response.setId(thread.getId());
        response.setGameId(thread.getGame() != null ? thread.getGame().getId() : null);
        response.setGameName(thread.getGame() != null ? thread.getGame().getName() : "総合掲示板");
        response.setTitle(thread.getTitle());
        response.setContent(thread.getContent());
        response.setUsername(thread.getUsername());
        response.setPinned(thread.isPinned());
        response.setLocked(thread.isLocked());
        response.setReplyCount(thread.getReplyCount());
        response.setLastPostedAt(thread.getLastPostedAt());
        response.setCreatedAt(thread.getCreatedAt());
        response.setUpdatedAt(thread.getUpdatedAt());
        return response;
    }

    private BoardPostResponse toPostResponse(BoardPost post) {
        BoardPostResponse response = new BoardPostResponse();
        response.setId(post.getId());
        response.setContent(post.getContent());
        response.setUsername(post.getUsername());
        response.setCreatedAt(post.getCreatedAt());
        response.setUpdatedAt(post.getUpdatedAt());
        return response;
    }
}

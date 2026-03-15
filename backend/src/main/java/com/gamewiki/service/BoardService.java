package com.gamewiki.service;

import com.gamewiki.dto.BoardGameSummaryResponse;
import com.gamewiki.dto.BoardPostRequest;
import com.gamewiki.dto.BoardPostResponse;
import com.gamewiki.dto.BoardThreadDetailResponse;
import com.gamewiki.dto.BoardThreadRequest;
import com.gamewiki.dto.BoardThreadSummaryResponse;
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
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoardService {
    private static final String BOARD_TYPE_GAME = "GAME";
    private static final String BOARD_TYPE_GENERAL = "GENERAL";
    private static final long THREAD_INTERVAL_MINUTES = 5;
    private static final long POST_INTERVAL_SECONDS = 10;
    private static final Pattern URL_PATTERN = Pattern.compile("(?i)\\b(?:https?://|www\\.)\\S+");

    private final GameRepository gameRepository;
    private final BoardThreadRepository boardThreadRepository;
    private final BoardPostRepository boardPostRepository;
    private final BanService banService;

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
    public BoardThreadSummaryResponse createThread(Long gameId, BoardThreadRequest request, String username, String authorKey, boolean canModerate) {
        Game game = getVisibleGame(gameId);
        validateThreadRequest(request, authorKey, canModerate);

        BoardThread thread = new BoardThread();
        thread.setGame(game);
        thread.setBoardType(BOARD_TYPE_GAME);
        thread.setTitle(request.getTitle().trim());
        thread.setContent(request.getContent().trim());
        thread.setUsername(username);
        thread.setAuthorKey(authorKey);
        thread.setPinned(canModerate && request.isPinned());
        thread.setLastPostedAt(LocalDateTime.now());

        return toThreadSummary(boardThreadRepository.save(thread));
    }

    @Transactional
    public BoardThreadSummaryResponse createGeneralThread(BoardThreadRequest request, String username, String authorKey, boolean canModerate) {
        validateThreadRequest(request, authorKey, canModerate);

        BoardThread thread = new BoardThread();
        thread.setGame(null);
        thread.setBoardType(BOARD_TYPE_GENERAL);
        thread.setTitle(request.getTitle().trim());
        thread.setContent(request.getContent().trim());
        thread.setUsername(username);
        thread.setAuthorKey(authorKey);
        thread.setPinned(canModerate && request.isPinned());
        thread.setLastPostedAt(LocalDateTime.now());

        return toThreadSummary(boardThreadRepository.save(thread));
    }

    @Transactional
    public BoardPostResponse createPost(Long gameId, Long threadId, BoardPostRequest request, String username, String authorKey, boolean canModerate) {
        BoardThread thread = getThreadEntity(gameId, threadId);
        if (thread.isLocked()) {
            throw new IllegalArgumentException("このスレッドはロックされています");
        }
        validatePostRequest(request, authorKey, canModerate);

        BoardPost post = new BoardPost();
        post.setThread(thread);
        post.setContent(request.getContent().trim());
        post.setUsername(username);
        post.setAuthorKey(authorKey);
        BoardPost saved = boardPostRepository.save(post);

        thread.setReplyCount(thread.getReplyCount() + 1);
        thread.setLastPostedAt(LocalDateTime.now());
        boardThreadRepository.save(thread);

        return toPostResponse(saved);
    }

    @Transactional
    public BoardPostResponse createGeneralPost(Long threadId, BoardPostRequest request, String username, String authorKey, boolean canModerate) {
        BoardThread thread = getGeneralThreadEntity(threadId);
        if (thread.isLocked()) {
            throw new IllegalArgumentException("このスレッドはロックされています");
        }
        validatePostRequest(request, authorKey, canModerate);

        BoardPost post = new BoardPost();
        post.setThread(thread);
        post.setContent(request.getContent().trim());
        post.setUsername(username);
        post.setAuthorKey(authorKey);
        BoardPost saved = boardPostRepository.save(post);

        thread.setReplyCount(thread.getReplyCount() + 1);
        thread.setLastPostedAt(LocalDateTime.now());
        boardThreadRepository.save(thread);

        return toPostResponse(saved);
    }

    @Transactional
    public void deleteThread(Long gameId, Long threadId) {
        BoardThread thread = getThreadEntity(gameId, threadId);
        boardPostRepository.deleteByThreadId(thread.getId());
        boardThreadRepository.delete(thread);
    }

    @Transactional
    public void deleteGeneralThread(Long threadId) {
        BoardThread thread = getGeneralThreadEntity(threadId);
        boardPostRepository.deleteByThreadId(thread.getId());
        boardThreadRepository.delete(thread);
    }

    @Transactional
    public void deletePost(Long gameId, Long threadId, Long postId) {
        BoardThread thread = getThreadEntity(gameId, threadId);
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));
        if (!post.getThread().getId().equals(thread.getId())) {
            throw new IllegalArgumentException("Post not found: " + postId);
        }
        boardPostRepository.delete(post);
        syncThreadAfterPostDelete(thread);
    }

    @Transactional
    public void deleteGeneralPost(Long threadId, Long postId) {
        BoardThread thread = getGeneralThreadEntity(threadId);
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));
        if (!post.getThread().getId().equals(thread.getId())) {
            throw new IllegalArgumentException("Post not found: " + postId);
        }
        boardPostRepository.delete(post);
        syncThreadAfterPostDelete(thread);
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

    private void validateThreadRequest(BoardThreadRequest request, String authorKey, boolean canModerate) {
        ensureNotBanned(authorKey);
        String normalizedBody = normalizeText(request.getContent());
        String normalizedTitle = normalizeText(request.getTitle());
        if (!canModerate && normalizedBody.length() > 300) {
            throw new IllegalArgumentException("スレッド本文は300文字以内で入力してください");
        }
        if (canModerate) {
            return;
        }
        validateUrlCount(normalizedTitle + "\n" + normalizedBody);

        Optional<BoardThread> latestThread = boardThreadRepository.findTopByAuthorKeyOrderByCreatedAtDescIdDesc(authorKey);
        if (latestThread.isPresent()) {
            BoardThread previous = latestThread.get();
            if (minutesBetween(previous.getCreatedAt(), LocalDateTime.now()) < THREAD_INTERVAL_MINUTES) {
                throw new IllegalArgumentException("スレ立ては5分に1回までです");
            }
            String previousNormalized = normalizeText(previous.getTitle()) + "\n" + normalizeText(previous.getContent());
            if (previousNormalized.equals(normalizedTitle + "\n" + normalizedBody)) {
                throw new IllegalArgumentException("同じ内容のスレッドは連投できません");
            }
        }
    }

    private void validatePostRequest(BoardPostRequest request, String authorKey, boolean canModerate) {
        ensureNotBanned(authorKey);
        String normalizedBody = normalizeText(request.getContent());
        if (!canModerate && normalizedBody.length() > 300) {
            throw new IllegalArgumentException("返信は300文字以内で入力してください");
        }
        if (canModerate) {
            return;
        }
        validateUrlCount(normalizedBody);

        Optional<BoardPost> latestPost = boardPostRepository.findTopByAuthorKeyOrderByCreatedAtDescIdDesc(authorKey);
        if (latestPost.isPresent()) {
            BoardPost previous = latestPost.get();
            if (secondsBetween(previous.getCreatedAt(), LocalDateTime.now()) < POST_INTERVAL_SECONDS) {
                throw new IllegalArgumentException("返信は10秒に1回までです");
            }
            if (normalizeText(previous.getContent()).equals(normalizedBody)) {
                throw new IllegalArgumentException("同じ内容の返信は連投できません");
            }
        }
    }

    private void ensureNotBanned(String authorKey) {
        if (banService.isBanned(authorKey)) {
            throw new IllegalArgumentException("現在この環境からは投稿できません");
        }
    }

    private void syncThreadAfterPostDelete(BoardThread thread) {
        long replyCount = boardPostRepository.countByThreadId(thread.getId());
        thread.setReplyCount((int) replyCount);
        LocalDateTime lastPostedAt = boardPostRepository.findTopByThreadIdOrderByCreatedAtDescIdDesc(thread.getId())
                .map(BoardPost::getCreatedAt)
                .orElse(thread.getCreatedAt());
        thread.setLastPostedAt(lastPostedAt);
        boardThreadRepository.save(thread);
    }

    private void validateUrlCount(String text) {
        Matcher matcher = URL_PATTERN.matcher(text);
        int count = 0;
        while (matcher.find()) {
            count++;
            if (count >= 2) {
                throw new IllegalArgumentException("URLは2個以上投稿できません");
            }
        }
    }

    private String normalizeText(String raw) {
        return raw == null ? "" : raw.trim().replaceAll("\\s+", " ");
    }

    private long minutesBetween(LocalDateTime from, LocalDateTime to) {
        if (from == null) return Long.MAX_VALUE;
        return ChronoUnit.MINUTES.between(from, to);
    }

    private long secondsBetween(LocalDateTime from, LocalDateTime to) {
        if (from == null) return Long.MAX_VALUE;
        return ChronoUnit.SECONDS.between(from, to);
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

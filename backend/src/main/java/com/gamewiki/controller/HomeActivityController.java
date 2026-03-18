package com.gamewiki.controller;

import com.gamewiki.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/home")
@RequiredArgsConstructor
public class HomeActivityController {

    private final ItemRepository itemRepository;
    private final BossRepository bossRepository;
    private final NpcRepository npcRepository;
    private final CommentRepository commentRepository;
    private final BoardThreadRepository boardThreadRepository;
    private final GameRepository gameRepository;

    @GetMapping("/activity")
    public ResponseEntity<Map<String, Object>> getActivity() {
        // 最近の更新 (item/boss/npc をマージして上位10件)
        Stream<Map<String, Object>> recentItems = itemRepository.findTop6ByOrderByUpdatedAtDesc().stream()
                .map(i -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("type", "item"); m.put("id", i.getId()); m.put("name", i.getName());
                    m.put("gameName", i.getGame() != null ? i.getGame().getName() : "");
                    m.put("updatedAt", i.getUpdatedAt() != null ? i.getUpdatedAt().toString() : "");
                    return m;
                });
        Stream<Map<String, Object>> recentBosses = bossRepository.findTop6ByOrderByUpdatedAtDesc().stream()
                .map(b -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("type", "boss"); m.put("id", b.getId()); m.put("name", b.getName());
                    m.put("gameName", b.getGame() != null ? b.getGame().getName() : "");
                    m.put("updatedAt", b.getUpdatedAt() != null ? b.getUpdatedAt().toString() : "");
                    return m;
                });
        Stream<Map<String, Object>> recentNpcs = npcRepository.findTop6ByOrderByUpdatedAtDesc().stream()
                .map(n -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("type", "npc"); m.put("id", n.getId()); m.put("name", n.getName());
                    m.put("gameName", n.getGame() != null ? n.getGame().getName() : "");
                    m.put("updatedAt", n.getUpdatedAt() != null ? n.getUpdatedAt().toString() : "");
                    return m;
                });

        List<Map<String, Object>> recentUpdates = Stream.of(recentItems, recentBosses, recentNpcs)
                .flatMap(s -> s)
                .sorted(Comparator.comparing((Map<String, Object> m) -> m.get("updatedAt").toString()).reversed())
                .limit(10)
                .collect(Collectors.toList());

        // 新着コメント
        List<Map<String, Object>> recentComments = commentRepository.findTop6ByParentIdIsNullOrderByCreatedAtDesc()
                .stream()
                .map(c -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", c.getId());
                    m.put("content", c.getContent().length() > 60
                            ? c.getContent().substring(0, 60) + "…"
                            : c.getContent());
                    m.put("username", c.getUsername());
                    m.put("itemId", c.getItem() != null ? c.getItem().getId() : null);
                    m.put("itemName", c.getItem() != null ? c.getItem().getName() : "");
                    m.put("createdAt", c.getCreatedAt() != null ? c.getCreatedAt().toString() : "");
                    return m;
                })
                .collect(Collectors.toList());

        // 最新掲示板スレッド
        List<Map<String, Object>> recentThreads = boardThreadRepository.findTop6ByOrderByCreatedAtDesc()
                .stream()
                .map(t -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", t.getId());
                    m.put("title", t.getTitle());
                    m.put("username", t.getUsername());
                    m.put("boardType", t.getBoardType());
                    m.put("gameId", t.getGame() != null ? t.getGame().getId() : null);
                    m.put("gameName", t.getGame() != null ? t.getGame().getName() : "");
                    m.put("replyCount", t.getReplyCount());
                    m.put("createdAt", t.getCreatedAt() != null ? t.getCreatedAt().toString() : "");
                    return m;
                })
                .collect(Collectors.toList());

        // ゲーム別統計
        List<Map<String, Object>> gameStats = gameRepository.findAllByVisibleTrueOrderBySortOrderAscIdAsc()
                .stream()
                .map(g -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("gameId", g.getId());
                    m.put("gameName", g.getName());
                    m.put("itemCount", itemRepository.countByGameId(g.getId()));
                    m.put("bossCount", bossRepository.countByGameId(g.getId()));
                    m.put("npcCount", npcRepository.countByGameId(g.getId()));
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("recentUpdates", recentUpdates);
        result.put("recentComments", recentComments);
        result.put("recentThreads", recentThreads);
        result.put("gameStats", gameStats);

        return ResponseEntity.ok(result);
    }
}

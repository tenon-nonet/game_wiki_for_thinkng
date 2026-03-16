package com.gamewiki.service;

import com.gamewiki.dto.RelationGraphResponse;
import com.gamewiki.entity.Game;
import com.gamewiki.entity.RelationGraph;
import com.gamewiki.repository.GameRepository;
import com.gamewiki.repository.RelationGraphRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RelationGraphService {

    private final RelationGraphRepository relationGraphRepository;
    private final GameRepository gameRepository;

    /** 公式グラフを取得（username = null） */
    public Optional<RelationGraphResponse> findOfficial(Long gameId) {
        return relationGraphRepository.findByGameIdAndUsernameIsNull(gameId)
                .map(this::toResponse);
    }

    /** ユーザー個人グラフを取得 */
    public Optional<RelationGraphResponse> findByUser(Long gameId, String username) {
        return relationGraphRepository.findByGameIdAndUsername(gameId, username)
                .map(this::toResponse);
    }

    /** 公式グラフを保存（管理者のみ） */
    @Transactional
    public RelationGraphResponse saveOfficial(Long gameId, String graphData, String updatedBy) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));

        RelationGraph graph = relationGraphRepository.findByGameIdAndUsernameIsNull(game.getId())
                .orElseGet(() -> {
                    RelationGraph g = new RelationGraph();
                    g.setGame(game);
                    g.setUsername(null);
                    return g;
                });

        graph.setGraphData(graphData);
        graph.setUpdatedBy(updatedBy);
        return toResponse(relationGraphRepository.save(graph));
    }

    /** ユーザー個人グラフを保存 */
    @Transactional
    public RelationGraphResponse saveUserGraph(Long gameId, String graphData, String username) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));

        RelationGraph graph = relationGraphRepository.findByGameIdAndUsername(game.getId(), username)
                .orElseGet(() -> {
                    RelationGraph g = new RelationGraph();
                    g.setGame(game);
                    g.setUsername(username);
                    return g;
                });

        graph.setGraphData(graphData);
        graph.setUpdatedBy(username);
        return toResponse(relationGraphRepository.save(graph));
    }

    private RelationGraphResponse toResponse(RelationGraph g) {
        return new RelationGraphResponse(
                g.getId(),
                g.getGame().getId(),
                g.getGraphData(),
                g.getUpdatedBy(),
                g.getUpdatedAt() != null ? g.getUpdatedAt().toString() : null
        );
    }
}

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

    public Optional<RelationGraphResponse> findByGameId(Long gameId) {
        return relationGraphRepository.findByGameId(gameId).map(this::toResponse);
    }

    @Transactional
    public RelationGraphResponse save(Long gameId, String graphData, String username) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));

        RelationGraph graph = relationGraphRepository.findByGameId(game.getId())
                .orElseGet(() -> {
                    RelationGraph g = new RelationGraph();
                    g.setGame(game);
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

package com.gamewiki.repository;

import com.gamewiki.entity.RelationGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RelationGraphRepository extends JpaRepository<RelationGraph, Long> {
    Optional<RelationGraph> findByGameId(Long gameId);
}

package com.gamewiki.repository;

import com.gamewiki.entity.RelationGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RelationGraphRepository extends JpaRepository<RelationGraph, Long> {
    /** 公式グラフ（username = null）を取得 */
    Optional<RelationGraph> findByGameIdAndUsernameIsNull(Long gameId);

    /** ユーザー個人グラフを取得 */
    Optional<RelationGraph> findByGameIdAndUsername(Long gameId, String username);
}

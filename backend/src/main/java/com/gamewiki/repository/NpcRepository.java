package com.gamewiki.repository;

import com.gamewiki.entity.Npc;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NpcRepository extends JpaRepository<Npc, Long> {
    List<Npc> findAllByOrderBySortOrderAscIdAsc();
    List<Npc> findByGameIdOrderBySortOrderAscIdAsc(Long gameId);
}

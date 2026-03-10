package com.gamewiki.repository;

import com.gamewiki.entity.Boss;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BossRepository extends JpaRepository<Boss, Long> {
    List<Boss> findAllByOrderBySortOrderAscIdAsc();
    List<Boss> findByGameIdOrderBySortOrderAscIdAsc(Long gameId);
}

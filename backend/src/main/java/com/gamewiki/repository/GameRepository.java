package com.gamewiki.repository;

import com.gamewiki.entity.Game;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameRepository extends JpaRepository<Game, Long> {
    List<Game> findAllByOrderBySortOrderAscIdAsc();
    List<Game> findAllByVisibleTrueOrderBySortOrderAscIdAsc();
    List<Game> findByNameContainingIgnoreCaseOrderBySortOrderAscIdAsc(String name);
    List<Game> findByNameContainingIgnoreCaseAndVisibleTrueOrderBySortOrderAscIdAsc(String name);
}

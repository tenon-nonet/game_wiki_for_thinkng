package com.gamewiki.repository;

import com.gamewiki.entity.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface ItemRepository extends JpaRepository<Item, Long>, JpaSpecificationExecutor<Item> {
    List<Item> findAllByOrderBySortOrderAscIdAsc();
    List<Item> findByGameIdOrderBySortOrderAscIdAsc(Long gameId);
}

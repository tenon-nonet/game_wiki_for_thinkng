package com.gamewiki.repository;

import com.gamewiki.entity.EditHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EditHistoryRepository extends JpaRepository<EditHistory, Long> {
    List<EditHistory> findTop100ByUsernameOrderByCreatedAtDesc(String username);
}

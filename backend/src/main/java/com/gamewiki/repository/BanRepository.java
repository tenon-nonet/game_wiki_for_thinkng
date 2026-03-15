package com.gamewiki.repository;

import com.gamewiki.entity.Ban;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface BanRepository extends JpaRepository<Ban, Long> {
    boolean existsByAuthorKey(String authorKey);
    Optional<Ban> findByAuthorKey(String authorKey);
    java.util.List<Ban> findAllByOrderByCreatedAtDescIdDesc();
}

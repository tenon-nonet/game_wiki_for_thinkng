package com.gamewiki.repository;

import com.gamewiki.entity.DailyVisitor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;

public interface DailyVisitorRepository extends JpaRepository<DailyVisitor, Long> {
    boolean existsByVisitDateAndVisitorHash(LocalDate visitDate, String visitorHash);
    long countByVisitDate(LocalDate visitDate);
}

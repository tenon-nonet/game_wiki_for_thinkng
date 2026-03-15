package com.gamewiki.repository;

import com.gamewiki.entity.Report;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReportRepository extends JpaRepository<Report, Long> {
    List<Report> findAllByOrderByCreatedAtDescIdDesc();
    Optional<Report> findByTargetTypeAndTargetIdAndReporterKey(String targetType, Long targetId, String reporterKey);
}

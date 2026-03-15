package com.gamewiki.service;

import com.gamewiki.dto.ReportResponse;
import com.gamewiki.entity.BoardPost;
import com.gamewiki.entity.BoardThread;
import com.gamewiki.entity.Report;
import com.gamewiki.repository.BoardPostRepository;
import com.gamewiki.repository.BoardThreadRepository;
import com.gamewiki.repository.ReportRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private static final List<String> ALLOWED_STATUSES = List.of("NEW", "CHECKING", "RESOLVED", "DISMISSED");

    private final ReportRepository reportRepository;
    private final BoardThreadRepository boardThreadRepository;
    private final BoardPostRepository boardPostRepository;
    private final BanService banService;

    @Transactional
    public ReportResponse createBoardThreadReport(Long threadId, String reason, String reportedBy, String reporterKey) {
        BoardThread thread = boardThreadRepository.findById(threadId)
                .orElseThrow(() -> new IllegalArgumentException("Thread not found: " + threadId));
        return createReport("BOARD_THREAD", threadId, reason, reportedBy, reporterKey, thread.getUsername(), thread.getAuthorKey(), thread.getTitle());
    }

    @Transactional
    public ReportResponse createBoardPostReport(Long postId, String reason, String reportedBy, String reporterKey) {
        BoardPost post = boardPostRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found: " + postId));
        return createReport("BOARD_POST", postId, reason, reportedBy, reporterKey, post.getUsername(), post.getAuthorKey(), summarize(post.getContent()));
    }

    public List<ReportResponse> findAll() {
        return reportRepository.findAllByOrderByCreatedAtDescIdDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public ReportResponse updateStatus(Long id, String status, String reviewedBy) {
        if (!ALLOWED_STATUSES.contains(status)) {
            throw new IllegalArgumentException("Unsupported report status: " + status);
        }
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));
        report.setStatus(status);
        report.setReviewedBy(reviewedBy);
        report.setReviewedAt(LocalDateTime.now());
        return toResponse(reportRepository.save(report));
    }

    @Transactional
    public ReportResponse banReportedAuthor(Long id, String reviewedBy) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found: " + id));
        if (report.getTargetAuthorKey() == null || report.getTargetAuthorKey().isBlank()) {
            throw new IllegalArgumentException("BAN対象を特定できません");
        }
        banService.ban(report.getTargetAuthorKey(), "通報ID " + report.getId() + " に基づくBAN", reviewedBy);
        report.setStatus("RESOLVED");
        report.setReviewedBy(reviewedBy);
        report.setReviewedAt(LocalDateTime.now());
        return toResponse(reportRepository.save(report));
    }

    private ReportResponse createReport(
            String targetType,
            Long targetId,
            String reason,
            String reportedBy,
            String reporterKey,
            String targetAuthor,
            String targetAuthorKey,
            String targetSummary
    ) {
        String trimmedReason = reason == null ? "" : reason.trim();
        if (trimmedReason.isBlank()) {
            throw new IllegalArgumentException("通報理由を入力してください");
        }
        reportRepository.findByTargetTypeAndTargetIdAndReporterKey(targetType, targetId, reporterKey)
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("同じ対象はすでに通報済みです");
                });

        Report report = new Report();
        report.setTargetType(targetType);
        report.setTargetId(targetId);
        report.setReason(trimmedReason);
        report.setReportedBy(reportedBy);
        report.setReporterKey(reporterKey);
        report.setTargetAuthor(targetAuthor);
        report.setTargetAuthorKey(targetAuthorKey);
        report.setTargetSummary(targetSummary);
        report.setStatus("NEW");

        return toResponse(reportRepository.save(report));
    }

    private String summarize(String text) {
        if (text == null) return null;
        String normalized = text.trim().replaceAll("\\s+", " ");
        return normalized.length() > 120 ? normalized.substring(0, 120) + "..." : normalized;
    }

    private ReportResponse toResponse(Report report) {
        ReportResponse response = new ReportResponse();
        response.setId(report.getId());
        response.setTargetType(report.getTargetType());
        response.setTargetId(report.getTargetId());
        response.setReason(report.getReason());
        response.setReportedBy(report.getReportedBy());
        response.setTargetAuthor(report.getTargetAuthor());
        response.setTargetSummary(report.getTargetSummary());
        response.setStatus(report.getStatus());
        response.setReviewedBy(report.getReviewedBy());
        response.setCreatedAt(report.getCreatedAt());
        response.setReviewedAt(report.getReviewedAt());
        return response;
    }
}

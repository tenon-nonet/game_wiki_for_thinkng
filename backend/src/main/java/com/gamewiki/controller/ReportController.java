package com.gamewiki.controller;

import com.gamewiki.dto.BanResponse;
import com.gamewiki.dto.ReportRequest;
import com.gamewiki.dto.ReportResponse;
import com.gamewiki.dto.ReportStatusRequest;
import com.gamewiki.service.BanService;
import com.gamewiki.service.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final BanService banService;

    @PostMapping("/board-threads/{threadId}")
    public ResponseEntity<ReportResponse> reportBoardThread(
            @PathVariable Long threadId,
            @Valid @RequestBody ReportRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpServletRequest
    ) {
        String reportedBy = userDetails != null ? userDetails.getUsername() : "名もなき褪せ人";
        return ResponseEntity.ok(
                reportService.createBoardThreadReport(threadId, request.getReason(), reportedBy, resolveReporterKey(httpServletRequest))
        );
    }

    @PostMapping("/board-posts/{postId}")
    public ResponseEntity<ReportResponse> reportBoardPost(
            @PathVariable Long postId,
            @Valid @RequestBody ReportRequest request,
            @AuthenticationPrincipal UserDetails userDetails,
            HttpServletRequest httpServletRequest
    ) {
        String reportedBy = userDetails != null ? userDetails.getUsername() : "名もなき褪せ人";
        return ResponseEntity.ok(
                reportService.createBoardPostReport(postId, request.getReason(), reportedBy, resolveReporterKey(httpServletRequest))
        );
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ReportResponse>> listReports() {
        return ResponseEntity.ok(reportService.findAll());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReportResponse> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody ReportStatusRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(reportService.updateStatus(id, request.getStatus(), userDetails.getUsername()));
    }

    @PostMapping("/{id}/ban")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ReportResponse> banReportedAuthor(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(reportService.banReportedAuthor(id, userDetails.getUsername()));
    }

    @GetMapping("/bans")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BanResponse>> listBans() {
        return ResponseEntity.ok(banService.findAll());
    }

    @DeleteMapping("/bans/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> removeBan(@PathVariable Long id) {
        banService.remove(id);
        return ResponseEntity.noContent().build();
    }

    private String resolveReporterKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        String remoteAddr = request.getRemoteAddr();
        return remoteAddr != null && !remoteAddr.isBlank() ? remoteAddr : "unknown";
    }
}
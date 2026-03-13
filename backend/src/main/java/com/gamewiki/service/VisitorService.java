package com.gamewiki.service;

import com.gamewiki.dto.VisitorStatsResponse;
import com.gamewiki.entity.DailyVisitor;
import com.gamewiki.repository.DailyVisitorRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class VisitorService {

    private final DailyVisitorRepository dailyVisitorRepository;

    @Transactional
    public VisitorStatsResponse trackHomeVisit(HttpServletRequest request) {
        LocalDate today = LocalDate.now();
        String visitorHash = buildVisitorHash(request, today);

        if (!dailyVisitorRepository.existsByVisitDateAndVisitorHash(today, visitorHash)) {
            DailyVisitor dailyVisitor = new DailyVisitor();
            dailyVisitor.setVisitDate(today);
            dailyVisitor.setVisitorHash(visitorHash);
            dailyVisitorRepository.save(dailyVisitor);
        }

        long todayCount = dailyVisitorRepository.countByVisitDate(today);
        long totalCount = dailyVisitorRepository.count();
        return new VisitorStatsResponse(todayCount, totalCount);
    }

    private String buildVisitorHash(HttpServletRequest request, LocalDate today) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        String realIp = request.getHeader("X-Real-IP");
        String userAgent = normalize(request.getHeader("User-Agent"));
        String ip = extractClientIp(forwardedFor, realIp, request.getRemoteAddr());
        String raw = ip + "|" + userAgent + "|" + today;
        return sha256Hex(raw);
    }

    private String extractClientIp(String forwardedFor, String realIp, String remoteAddr) {
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            String first = forwardedFor.split(",")[0].trim();
            if (!first.isBlank()) return first;
        }
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return normalize(remoteAddr);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim();
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}

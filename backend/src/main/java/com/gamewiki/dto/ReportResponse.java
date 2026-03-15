package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ReportResponse {
    private Long id;
    private String targetType;
    private Long targetId;
    private String reason;
    private String reportedBy;
    private String targetAuthor;
    private String targetSummary;
    private String status;
    private String reviewedBy;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}

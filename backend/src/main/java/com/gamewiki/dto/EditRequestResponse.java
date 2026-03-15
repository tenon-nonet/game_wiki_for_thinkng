package com.gamewiki.dto;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class EditRequestResponse {
    private Long id;
    private String entityType;
    private Long entityId;
    private String actionType;
    private String status;
    private String requestedBy;
    private String reviewedBy;
    private String entityName;
    private Long gameId;
    private String gameName;
    private JsonNode payload;
    private String pendingImagePath;
    private String reviewComment;
    private LocalDateTime reviewedAt;
    private LocalDateTime createdAt;
}

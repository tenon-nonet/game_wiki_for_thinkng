package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class EditHistoryResponse {
    private Long id;
    private String entityType;
    private Long entityId;
    private String entityName;
    private String actionType;
    private String gameName;
    private LocalDateTime createdAt;
}

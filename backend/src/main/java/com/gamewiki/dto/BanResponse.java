package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class BanResponse {
    private Long id;
    private String authorKey;
    private String reason;
    private String createdBy;
    private LocalDateTime createdAt;
}

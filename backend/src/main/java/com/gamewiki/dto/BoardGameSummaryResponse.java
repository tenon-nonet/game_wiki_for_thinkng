package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class BoardGameSummaryResponse {
    private Long gameId;
    private String gameName;
    private String imagePath;
    private int threadCount;
    private LocalDateTime latestPostedAt;
}

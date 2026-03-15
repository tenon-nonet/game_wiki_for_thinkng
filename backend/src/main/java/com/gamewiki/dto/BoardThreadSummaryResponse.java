package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class BoardThreadSummaryResponse {
    private Long id;
    private Long gameId;
    private String gameName;
    private String title;
    private String content;
    private String username;
    private boolean pinned;
    private boolean locked;
    private int replyCount;
    private LocalDateTime lastPostedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

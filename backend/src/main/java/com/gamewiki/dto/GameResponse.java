package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class GameResponse {
    private Long id;
    private String name;
    private String description;
    private String imagePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

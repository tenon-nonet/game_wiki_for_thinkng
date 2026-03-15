package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class GameResponse {
    private Long id;
    private String name;
    private String description;
    private String imagePath;
    private String platforms;
    private String releaseDates;
    private String awards;
    private String staff;
    private List<String> categories;
    private boolean visible;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

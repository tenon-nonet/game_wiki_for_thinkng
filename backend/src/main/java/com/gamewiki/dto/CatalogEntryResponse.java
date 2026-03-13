package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CatalogEntryResponse {
    private Long id;
    private String name;
    private String type;
    private Long gameId;
    private String gameName;
    private String category;
    private LocalDateTime createdAt;
}

package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Getter
@Setter
public class NpcResponse {
    private Long id;
    private String name;
    private String description;
    private String imagePath;
    private Long gameId;
    private String gameName;
    private Set<TagResponse> tags;
    private List<String> dialogues;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String updatedBy;
}

package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class TimelineEventRequest {
    private Long id;            // 既存イベントの場合はID、新規はnull
    private String title;
    private String description;
    private String imagePath;
    private String eraLabel;
    private int orderIndex;
    private List<String> organizations;
    private List<Long> bossIds;
    private List<Long> npcIds;
    private List<Long> itemIds;
}

package com.gamewiki.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class TimelineEventResponse {
    private Long id;
    private String title;
    private String description;
    private String imagePath;
    private String eraLabel;
    private int orderIndex;
    private List<String> organizations;
    private List<DropItemInfo> bosses;
    private List<DropItemInfo> npcs;
    private List<DropItemInfo> items;
}

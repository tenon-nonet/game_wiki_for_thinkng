package com.gamewiki.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor
public class TimelineResponse {
    private Long id;
    private Long gameId;
    private String username;
    private String updatedBy;
    private String updatedAt;
    private List<TimelineEventResponse> events;
}

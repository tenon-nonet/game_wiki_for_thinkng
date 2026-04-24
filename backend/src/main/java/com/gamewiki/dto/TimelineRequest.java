package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class TimelineRequest {
    private List<TimelineEventRequest> events;
}

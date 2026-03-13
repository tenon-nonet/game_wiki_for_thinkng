package com.gamewiki.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class VisitorStatsResponse {
    private long todayUniqueVisitors;
    private long totalUniqueDailyVisitors;
}

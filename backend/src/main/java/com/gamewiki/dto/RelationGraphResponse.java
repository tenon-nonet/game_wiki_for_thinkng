package com.gamewiki.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class RelationGraphResponse {
    private Long id;
    private Long gameId;
    private String graphData;
    private String updatedBy;
    private String updatedAt;
}

package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BoardThreadDetailResponse {
    private BoardThreadSummaryResponse thread;
    private List<BoardPostResponse> posts;
}

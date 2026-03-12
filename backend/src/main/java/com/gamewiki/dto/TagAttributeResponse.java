package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TagAttributeResponse {
    private Long id;
    private String name;
    private Long gameId;
}

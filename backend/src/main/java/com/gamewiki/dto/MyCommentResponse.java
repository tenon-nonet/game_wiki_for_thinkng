package com.gamewiki.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class MyCommentResponse {
    private Long id;
    private Long itemId;
    private String itemName;
    private String content;
    private LocalDateTime createdAt;
}

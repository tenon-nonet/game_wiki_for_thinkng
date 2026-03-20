package com.gamewiki.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class DropItemInfo {
    private Long id;
    private String name;
    private String imagePath;
}

package com.gamewiki.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class GameRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    private String description;
    private String platforms;
    private String releaseDates;
    private String awards;
    private String staff;
}

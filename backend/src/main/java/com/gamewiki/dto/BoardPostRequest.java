package com.gamewiki.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BoardPostRequest {
    @NotBlank
    @Size(max = 300)
    private String content;
}

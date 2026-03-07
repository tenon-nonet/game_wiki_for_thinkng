package com.gamewiki.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
public class ItemRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    private String description;

    @NotNull
    private Long gameId;

    private Set<String> tags;
}

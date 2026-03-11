package com.gamewiki.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CatalogEntryRequest {

    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    private String type;

    @NotNull
    private Long gameId;

    private String category;
}

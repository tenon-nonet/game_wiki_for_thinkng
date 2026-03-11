package com.gamewiki.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CatalogBulkRequest {

    @NotNull
    private List<String> names;

    @NotBlank
    private String type;

    @NotNull
    private Long gameId;

    private String category;
}

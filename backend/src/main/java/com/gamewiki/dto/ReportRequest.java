package com.gamewiki.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportRequest {
    @NotBlank
    @Size(max = 200)
    private String reason;
}

package com.gamewiki.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ReportStatusRequest {
    @NotBlank
    private String status;
}

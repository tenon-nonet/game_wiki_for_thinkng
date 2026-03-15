package com.gamewiki.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class EditSubmissionResponse {
    private boolean pendingApproval;
    private String message;
}

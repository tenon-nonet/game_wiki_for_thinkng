package com.gamewiki.controller;

import com.gamewiki.dto.VisitorStatsResponse;
import com.gamewiki.service.VisitorService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/visitors")
@RequiredArgsConstructor
public class VisitorController {

    private final VisitorService visitorService;

    @PostMapping("/home")
    public ResponseEntity<VisitorStatsResponse> trackHomeVisit(HttpServletRequest request) {
        return ResponseEntity.ok(visitorService.trackHomeVisit(request));
    }
}

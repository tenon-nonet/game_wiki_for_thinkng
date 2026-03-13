package com.gamewiki.controller;

import com.gamewiki.service.ImageAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/analyze")
@RequiredArgsConstructor
public class ImageAnalysisController {

    private final ImageAnalysisService imageAnalysisService;

    @PostMapping("/image-text")
    public ResponseEntity<Map<String, String>> extractText(
            @RequestParam("image") MultipartFile image) {
        try {
            String text = imageAnalysisService.extractText(image);
            return ResponseEntity.ok(Map.of("text", text));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "テキスト抽出に失敗しました: " + e.getMessage()));
        }
    }
}

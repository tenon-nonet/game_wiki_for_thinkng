package com.gamewiki.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Base64;

@Service
public class ImageAnalysisService {

    @Value("${app.anthropic.api-key}")
    private String apiKey;

    private static final String API_URL = "https://api.anthropic.com/v1/messages";
    private static final String MODEL = "claude-haiku-4-5-20251001";

    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String extractText(MultipartFile image) throws IOException, InterruptedException {
        String base64 = Base64.getEncoder().encodeToString(image.getBytes());
        String mediaType = image.getContentType() != null ? image.getContentType() : "image/jpeg";

        String requestBody = objectMapper.writeValueAsString(new java.util.LinkedHashMap<>() {{
            put("model", MODEL);
            put("max_tokens", 1024);
            put("messages", java.util.List.of(
                new java.util.LinkedHashMap<>() {{
                    put("role", "user");
                    put("content", java.util.List.of(
                        new java.util.LinkedHashMap<>() {{
                            put("type", "image");
                            put("source", new java.util.LinkedHashMap<>() {{
                                put("type", "base64");
                                put("media_type", mediaType);
                                put("data", base64);
                            }});
                        }},
                        new java.util.LinkedHashMap<>() {{
                            put("type", "text");
                            put("text", "この画像に含まれているテキストをすべて抽出してください。テキストのみを出力し、余分な説明は不要です。テキストが含まれていない場合は空文字を返してください。");
                        }}
                    ));
                }}
            ));
        }});

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(API_URL))
                .header("x-api-key", apiKey)
                .header("anthropic-version", "2023-06-01")
                .header("content-type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new RuntimeException("Anthropic API error: " + response.statusCode() + " - " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        return root.path("content").get(0).path("text").asText("");
    }
}

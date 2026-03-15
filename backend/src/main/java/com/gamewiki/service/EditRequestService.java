package com.gamewiki.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gamewiki.dto.*;
import com.gamewiki.entity.EditRequest;
import com.gamewiki.repository.GameRepository;
import com.gamewiki.repository.EditRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EditRequestService {

    private final EditRequestRepository editRequestRepository;
    private final FileStorageService fileStorageService;
    private final ItemService itemService;
    private final BossService bossService;
    private final NpcService npcService;
    private final GameRepository gameRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public List<EditRequestResponse> findPending() {
        return editRequestRepository.findByStatusOrderByCreatedAtAsc("PENDING").stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void createItemRequest(String actionType, Long entityId, ItemRequest request, MultipartFile image, String requestedBy) {
        saveRequest("ITEM", actionType, entityId, request.getName(), request.getGameId(), image, request, requestedBy);
    }

    @Transactional
    public void createBossRequest(String actionType, Long entityId, BossRequest request, MultipartFile image, String requestedBy) {
        saveRequest("BOSS", actionType, entityId, request.getName(), request.getGameId(), image, request, requestedBy);
    }

    @Transactional
    public void createNpcRequest(String actionType, Long entityId, NpcRequest request, MultipartFile image, String requestedBy) {
        saveRequest("NPC", actionType, entityId, request.getName(), request.getGameId(), image, request, requestedBy);
    }

    @Transactional
    public EditRequestResponse approve(Long id, String reviewerUsername) {
        EditRequest editRequest = getPendingRequest(id);
        try {
            apply(editRequest, reviewerUsername);
            editRequest.setStatus("APPROVED");
            editRequest.setReviewedBy(reviewerUsername);
            editRequest.setReviewedAt(java.time.LocalDateTime.now());
            return toResponse(editRequestRepository.save(editRequest));
        } catch (IOException e) {
            throw new IllegalArgumentException("編集申請の承認処理に失敗しました");
        }
    }

    @Transactional
    public EditRequestResponse reject(Long id, String reviewerUsername, String reviewComment) {
        EditRequest editRequest = getPendingRequest(id);
        editRequest.setStatus("REJECTED");
        editRequest.setReviewedBy(reviewerUsername);
        editRequest.setReviewedAt(java.time.LocalDateTime.now());
        editRequest.setReviewComment(reviewComment);
        fileStorageService.delete(editRequest.getPendingImagePath());
        return toResponse(editRequestRepository.save(editRequest));
    }

    private void saveRequest(
            String entityType,
            String actionType,
            Long entityId,
            String entityName,
            Long gameId,
            MultipartFile image,
            Object payload,
            String requestedBy
    ) {
        EditRequest editRequest = new EditRequest();
        editRequest.setEntityType(entityType);
        editRequest.setActionType(actionType);
        editRequest.setEntityId(entityId);
        editRequest.setEntityName(entityName);
        editRequest.setGameId(gameId);
        editRequest.setGameName(
                gameId != null
                        ? gameRepository.findById(gameId).map(game -> game.getName()).orElse(null)
                        : null
        );
        editRequest.setRequestedBy(resolveRequester(requestedBy));
        editRequest.setStatus("PENDING");
        editRequest.setPayload(writePayload(payload));
        if (image != null && !image.isEmpty()) {
            editRequest.setPendingImagePath(fileStorageService.store(image));
        }
        editRequestRepository.save(editRequest);
    }

    private void apply(EditRequest editRequest, String reviewerUsername) throws IOException {
        switch (editRequest.getEntityType()) {
            case "ITEM" -> {
                ItemRequest payload = objectMapper.readValue(editRequest.getPayload(), ItemRequest.class);
                if ("CREATE".equals(editRequest.getActionType())) {
                    itemService.createFromStoredImage(payload, editRequest.getPendingImagePath(), reviewerUsername);
                } else {
                    itemService.updateFromStoredImage(editRequest.getEntityId(), payload, editRequest.getPendingImagePath(), reviewerUsername);
                }
            }
            case "BOSS" -> {
                BossRequest payload = objectMapper.readValue(editRequest.getPayload(), BossRequest.class);
                if ("CREATE".equals(editRequest.getActionType())) {
                    bossService.createFromStoredImage(payload, editRequest.getPendingImagePath(), reviewerUsername);
                } else {
                    bossService.updateFromStoredImage(editRequest.getEntityId(), payload, editRequest.getPendingImagePath(), reviewerUsername);
                }
            }
            case "NPC" -> {
                NpcRequest payload = objectMapper.readValue(editRequest.getPayload(), NpcRequest.class);
                if ("CREATE".equals(editRequest.getActionType())) {
                    npcService.createFromStoredImage(payload, editRequest.getPendingImagePath(), reviewerUsername);
                } else {
                    npcService.updateFromStoredImage(editRequest.getEntityId(), payload, editRequest.getPendingImagePath(), reviewerUsername);
                }
            }
            default -> throw new IllegalArgumentException("Unsupported entity type");
        }
    }

    private EditRequest getPendingRequest(Long id) {
        EditRequest editRequest = editRequestRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Edit request not found"));
        if (!"PENDING".equals(editRequest.getStatus())) {
            throw new IllegalArgumentException("この編集申請はすでに処理済みです");
        }
        return editRequest;
    }

    private String writePayload(Object payload) {
        try {
            return objectMapper.writeValueAsString(payload);
        } catch (IOException e) {
            throw new IllegalArgumentException("編集申請の保存に失敗しました");
        }
    }

    private String resolveRequester(String requestedBy) {
        return requestedBy != null && !requestedBy.isBlank() ? requestedBy : "名もなき褪せ人";
    }

    private EditRequestResponse toResponse(EditRequest editRequest) {
        EditRequestResponse response = new EditRequestResponse();
        response.setId(editRequest.getId());
        response.setEntityType(editRequest.getEntityType());
        response.setEntityId(editRequest.getEntityId());
        response.setActionType(editRequest.getActionType());
        response.setStatus(editRequest.getStatus());
        response.setRequestedBy(editRequest.getRequestedBy());
        response.setReviewedBy(editRequest.getReviewedBy());
        response.setEntityName(editRequest.getEntityName());
        response.setGameId(editRequest.getGameId());
        response.setGameName(editRequest.getGameName());
        response.setPendingImagePath(editRequest.getPendingImagePath());
        response.setReviewComment(editRequest.getReviewComment());
        response.setReviewedAt(editRequest.getReviewedAt());
        response.setCreatedAt(editRequest.getCreatedAt());
        try {
            JsonNode payload = editRequest.getPayload() != null ? objectMapper.readTree(editRequest.getPayload()) : null;
            response.setPayload(payload);
        } catch (IOException e) {
            response.setPayload(null);
        }
        return response;
    }
}

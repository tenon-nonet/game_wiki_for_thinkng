package com.gamewiki.service;

import com.gamewiki.dto.EditHistoryResponse;
import com.gamewiki.entity.EditHistory;
import com.gamewiki.repository.EditHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EditHistoryService {

    private final EditHistoryRepository editHistoryRepository;

    public void record(String username, String entityType, Long entityId, String entityName, String actionType, String gameName) {
        if (username == null || username.isBlank()) {
            return;
        }

        EditHistory history = new EditHistory();
        history.setUsername(username);
        history.setEntityType(entityType);
        history.setEntityId(entityId);
        history.setEntityName(entityName);
        history.setActionType(actionType);
        history.setGameName(gameName);
        editHistoryRepository.save(history);
    }

    public List<EditHistoryResponse> findByUsername(String username) {
        return editHistoryRepository.findTop100ByUsernameOrderByCreatedAtDesc(username)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private EditHistoryResponse toResponse(EditHistory history) {
        EditHistoryResponse response = new EditHistoryResponse();
        response.setId(history.getId());
        response.setEntityType(history.getEntityType());
        response.setEntityId(history.getEntityId());
        response.setEntityName(history.getEntityName());
        response.setActionType(history.getActionType());
        response.setGameName(history.getGameName());
        response.setCreatedAt(history.getCreatedAt());
        return response;
    }
}

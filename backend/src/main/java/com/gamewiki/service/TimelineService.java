package com.gamewiki.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gamewiki.dto.DropItemInfo;
import com.gamewiki.dto.TimelineEventRequest;
import com.gamewiki.dto.TimelineEventResponse;
import com.gamewiki.dto.TimelineRequest;
import com.gamewiki.dto.TimelineResponse;
import com.gamewiki.entity.*;
import com.gamewiki.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TimelineService {

    private final TimelineRepository timelineRepository;
    private final GameRepository gameRepository;
    private final BossRepository bossRepository;
    private final NpcRepository npcRepository;
    private final ItemRepository itemRepository;
    private final ObjectMapper objectMapper;

    public Optional<TimelineResponse> findOfficial(Long gameId) {
        return timelineRepository.findByGameIdAndUsernameIsNull(gameId)
                .map(this::toResponse);
    }

    public Optional<TimelineResponse> findByUser(Long gameId, String username) {
        return timelineRepository.findByGameIdAndUsername(gameId, username)
                .map(this::toResponse);
    }

    @Transactional
    public TimelineResponse saveOfficial(Long gameId, TimelineRequest request, String updatedBy) {
        return save(gameId, null, request, updatedBy);
    }

    @Transactional
    public TimelineResponse saveUserTimeline(Long gameId, String username, TimelineRequest request) {
        return save(gameId, username, request, username);
    }

    private TimelineResponse save(Long gameId, String username, TimelineRequest request, String updatedBy) {
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + gameId));

        Timeline timeline = (username == null
                ? timelineRepository.findByGameIdAndUsernameIsNull(gameId)
                : timelineRepository.findByGameIdAndUsername(gameId, username))
                .orElseGet(() -> {
                    Timeline t = new Timeline();
                    t.setGame(game);
                    t.setUsername(username);
                    return t;
                });

        timeline.setUpdatedBy(updatedBy);
        timeline.getEvents().clear();

        if (request.getEvents() != null) {
            int idx = 0;
            for (TimelineEventRequest req : request.getEvents()) {
                TimelineEvent event = new TimelineEvent();
                event.setTimeline(timeline);
                event.setTitle(req.getTitle());
                event.setDescription(req.getDescription());
                event.setImagePath(req.getImagePath());
                event.setEraLabel(req.getEraLabel());
                event.setOrderIndex(idx++);

                // 組織リスト → JSON
                event.setOrganizations(toJson(req.getOrganizations()));

                // 関連エンティティ
                if (req.getBossIds() != null && !req.getBossIds().isEmpty()) {
                    event.setBosses(new HashSet<>(bossRepository.findAllById(req.getBossIds())));
                }
                if (req.getNpcIds() != null && !req.getNpcIds().isEmpty()) {
                    event.setNpcs(new HashSet<>(npcRepository.findAllById(req.getNpcIds())));
                }
                if (req.getItemIds() != null && !req.getItemIds().isEmpty()) {
                    event.setItems(new HashSet<>(itemRepository.findAllById(req.getItemIds())));
                }

                timeline.getEvents().add(event);
            }
        }

        return toResponse(timelineRepository.save(timeline));
    }

    private TimelineResponse toResponse(Timeline t) {
        List<TimelineEventResponse> events = t.getEvents().stream()
                .map(this::toEventResponse)
                .collect(Collectors.toList());
        return new TimelineResponse(
                t.getId(),
                t.getGame().getId(),
                t.getUsername(),
                t.getUpdatedBy(),
                t.getUpdatedAt() != null ? t.getUpdatedAt().toString() : null,
                events
        );
    }

    private TimelineEventResponse toEventResponse(TimelineEvent e) {
        List<DropItemInfo> bosses = e.getBosses().stream()
                .map(b -> new DropItemInfo(b.getId(), b.getName(), b.getImagePath()))
                .collect(Collectors.toList());
        List<DropItemInfo> npcs = e.getNpcs().stream()
                .map(n -> new DropItemInfo(n.getId(), n.getName(), n.getImagePath()))
                .collect(Collectors.toList());
        List<DropItemInfo> items = e.getItems().stream()
                .map(i -> new DropItemInfo(i.getId(), i.getName(), i.getImagePath()))
                .collect(Collectors.toList());

        return new TimelineEventResponse(
                e.getId(),
                e.getTitle(),
                e.getDescription(),
                e.getImagePath(),
                e.getEraLabel(),
                e.getOrderIndex(),
                fromJson(e.getOrganizations()),
                bosses,
                npcs,
                items
        );
    }

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(list);
        } catch (Exception ex) {
            return null;
        }
    }

    private List<String> fromJson(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception ex) {
            return List.of();
        }
    }
}

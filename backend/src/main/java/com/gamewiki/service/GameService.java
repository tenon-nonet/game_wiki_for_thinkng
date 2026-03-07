package com.gamewiki.service;

import com.gamewiki.dto.GameRequest;
import com.gamewiki.dto.GameResponse;
import com.gamewiki.entity.Game;
import com.gamewiki.repository.GameRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;
    private final FileStorageService fileStorageService;

    public List<GameResponse> findAll() {
        return gameRepository.findAll().stream().map(this::toResponse).toList();
    }

    public List<GameResponse> search(String name) {
        return gameRepository.findByNameContainingIgnoreCase(name).stream().map(this::toResponse).toList();
    }

    public GameResponse findById(Long id) {
        return toResponse(getGame(id));
    }

    public GameResponse create(GameRequest request, MultipartFile image) {
        Game game = new Game();
        game.setName(request.getName());
        game.setDescription(request.getDescription());
        if (image != null && !image.isEmpty()) {
            game.setImagePath(fileStorageService.store(image));
        }
        return toResponse(gameRepository.save(game));
    }

    public GameResponse update(Long id, GameRequest request, MultipartFile image) {
        Game game = getGame(id);
        game.setName(request.getName());
        game.setDescription(request.getDescription());
        if (image != null && !image.isEmpty()) {
            fileStorageService.delete(game.getImagePath());
            game.setImagePath(fileStorageService.store(image));
        }
        return toResponse(gameRepository.save(game));
    }

    public void delete(Long id) {
        Game game = getGame(id);
        fileStorageService.delete(game.getImagePath());
        gameRepository.delete(game);
    }

    private Game getGame(Long id) {
        return gameRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Game not found: " + id));
    }

    private GameResponse toResponse(Game game) {
        GameResponse r = new GameResponse();
        r.setId(game.getId());
        r.setName(game.getName());
        r.setDescription(game.getDescription());
        r.setImagePath(game.getImagePath());
        r.setCreatedAt(game.getCreatedAt());
        r.setUpdatedAt(game.getUpdatedAt());
        return r;
    }
}

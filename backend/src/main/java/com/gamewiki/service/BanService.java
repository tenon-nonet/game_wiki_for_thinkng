package com.gamewiki.service;

import com.gamewiki.dto.BanResponse;
import com.gamewiki.entity.Ban;
import com.gamewiki.repository.BanRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BanService {

    private final BanRepository banRepository;

    public boolean isBanned(String authorKey) {
        return authorKey != null && !authorKey.isBlank() && banRepository.existsByAuthorKey(authorKey);
    }

    public List<BanResponse> findAll() {
        return banRepository.findAllByOrderByCreatedAtDescIdDesc().stream().map(this::toResponse).toList();
    }

    @Transactional
    public void ban(String authorKey, String reason, String createdBy) {
        if (authorKey == null || authorKey.isBlank()) {
            throw new IllegalArgumentException("BAN対象を特定できません");
        }
        if (banRepository.existsByAuthorKey(authorKey)) {
            throw new IllegalArgumentException("この投稿元はすでにBAN済みです");
        }
        Ban ban = new Ban();
        ban.setAuthorKey(authorKey);
        ban.setReason(reason);
        ban.setCreatedBy(createdBy);
        banRepository.save(ban);
    }

    @Transactional
    public void remove(Long id) {
        Ban ban = banRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("BAN情報が見つかりません"));
        banRepository.delete(ban);
    }

    private BanResponse toResponse(Ban ban) {
        BanResponse response = new BanResponse();
        response.setId(ban.getId());
        response.setAuthorKey(ban.getAuthorKey());
        response.setReason(ban.getReason());
        response.setCreatedBy(ban.getCreatedBy());
        response.setCreatedAt(ban.getCreatedAt());
        return response;
    }
}
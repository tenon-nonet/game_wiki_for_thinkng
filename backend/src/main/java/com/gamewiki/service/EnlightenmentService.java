package com.gamewiki.service;

import com.gamewiki.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EnlightenmentService {

    private final UserRepository userRepository;

    @Transactional
    public void add(String username, int amount) {
        if (username == null || username.isBlank()) return;
        userRepository.addEnlightenment(username, amount);
    }
}

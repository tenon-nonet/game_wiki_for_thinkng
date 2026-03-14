package com.gamewiki.controller;

import com.gamewiki.dto.MyCommentResponse;
import com.gamewiki.service.CommentService;
import com.gamewiki.dto.EditHistoryResponse;
import com.gamewiki.service.EditHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/mypage")
@RequiredArgsConstructor
public class MyPageController {

    private final EditHistoryService editHistoryService;
    private final CommentService commentService;

    @GetMapping("/edit-histories")
    public ResponseEntity<List<EditHistoryResponse>> editHistories(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(editHistoryService.findByUsername(userDetails.getUsername()));
    }

    @GetMapping("/comments")
    public ResponseEntity<List<MyCommentResponse>> comments(
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        return ResponseEntity.ok(commentService.findByUsername(userDetails.getUsername()));
    }
}

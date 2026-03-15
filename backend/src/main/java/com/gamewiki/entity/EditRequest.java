package com.gamewiki.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "edit_requests")
@Getter
@Setter
public class EditRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String entityType;

    private Long entityId;

    @Column(nullable = false, length = 20)
    private String actionType;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(nullable = false, length = 100)
    private String requestedBy;

    @Column(length = 100)
    private String reviewedBy;

    @Column(length = 100)
    private String entityName;

    private Long gameId;

    @Column(length = 100)
    private String gameName;

    @Column(columnDefinition = "TEXT")
    private String payload;

    private String pendingImagePath;

    @Column(columnDefinition = "TEXT")
    private String reviewComment;

    private LocalDateTime reviewedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

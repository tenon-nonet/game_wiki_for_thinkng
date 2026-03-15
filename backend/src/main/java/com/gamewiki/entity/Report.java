package com.gamewiki.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Getter
@Setter
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String targetType;

    @Column(nullable = false)
    private Long targetId;

    @Column(nullable = false, length = 200)
    private String reason;

    @Column(nullable = false, length = 100)
    private String reportedBy;

    @Column(nullable = false, length = 255)
    private String reporterKey;

    @Column(length = 100)
    private String targetAuthor;

    @Column(length = 255)
    private String targetAuthorKey;

    @Column(columnDefinition = "TEXT")
    private String targetSummary;

    @Column(nullable = false, length = 20)
    private String status = "NEW";

    @CreationTimestamp
    private LocalDateTime createdAt;

    @Column(length = 100)
    private String reviewedBy;

    private LocalDateTime reviewedAt;
}

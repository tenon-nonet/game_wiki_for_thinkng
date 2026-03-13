package com.gamewiki.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "games")
@Getter
@Setter
public class Game {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String imagePath;

    @Column(columnDefinition = "TEXT")
    private String platforms;

    @Column(columnDefinition = "TEXT")
    private String releaseDates;

    @Column(columnDefinition = "TEXT")
    private String awards;

    @Column(columnDefinition = "TEXT")
    private String staff;

    @Column(columnDefinition = "TEXT")
    private String categories;

    @Column(nullable = false, columnDefinition = "INTEGER DEFAULT 0")
    private int sortOrder = 0;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}

package com.gamewiki.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "bans")
@Getter
@Setter
public class Ban {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255, unique = true)
    private String authorKey;

    @Column(nullable = false, length = 255)
    private String reason;

    @Column(nullable = false, length = 100)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

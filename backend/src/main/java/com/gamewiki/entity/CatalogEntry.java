package com.gamewiki.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "catalog_entries",
    uniqueConstraints = @UniqueConstraint(columnNames = {"name", "type", "game_id"}))
@Getter
@Setter
public class CatalogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String type; // ITEM, BOSS, NPC

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(length = 50)
    private String category;

    @Column(length = 50)
    private String createdBy;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

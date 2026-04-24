package com.gamewiki.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "timeline_events")
@Getter
@Setter
public class TimelineEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "timeline_id", nullable = false)
    private Timeline timeline;

    @Column(length = 200, nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String imagePath;

    @Column(length = 100)
    private String eraLabel;

    @Column(nullable = false)
    private int orderIndex;

    /** 関連組織名（JSON配列として保存: ["組織A","組織B"]） */
    @Column(columnDefinition = "TEXT")
    private String organizations;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "timeline_event_bosses",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "boss_id"))
    private Set<Boss> bosses = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "timeline_event_npcs",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "npc_id"))
    private Set<Npc> npcs = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "timeline_event_items",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "item_id"))
    private Set<Item> items = new HashSet<>();
}

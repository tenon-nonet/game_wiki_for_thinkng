package com.gamewiki.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "edit_histories")
@Getter
@Setter
public class EditHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 50)
    private String username;

    @Column(nullable = false, length = 20)
    private String entityType;

    @Column(nullable = false)
    private Long entityId;

    @Column(nullable = false, length = 100)
    private String entityName;

    @Column(nullable = false, length = 20)
    private String actionType;

    @Column(nullable = false, length = 100)
    private String gameName;

    @CreationTimestamp
    private LocalDateTime createdAt;
}

package com.gamewiki.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "daily_visitors",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_daily_visitors_date_hash", columnNames = {"visit_date", "visitor_hash"})
    }
)
@Getter
@Setter
public class DailyVisitor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Column(name = "visitor_hash", nullable = false, length = 64)
    private String visitorHash;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

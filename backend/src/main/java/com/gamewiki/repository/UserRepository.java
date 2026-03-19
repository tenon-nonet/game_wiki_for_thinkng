package com.gamewiki.repository;

import com.gamewiki.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    List<User> findAllByOrderByCreatedAtDesc();
    long countByCreatedAtAfter(LocalDateTime since);

    @Modifying
    @Query("UPDATE User u SET u.enlightenment = u.enlightenment + :amount WHERE u.username = :username")
    void addEnlightenment(@Param("username") String username, @Param("amount") int amount);
}

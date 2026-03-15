package com.gamewiki.repository;

import com.gamewiki.entity.EditRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EditRequestRepository extends JpaRepository<EditRequest, Long> {
    List<EditRequest> findByStatusOrderByCreatedAtAsc(String status);
}

package com.pathfinder.backend.repository;

import com.pathfinder.backend.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByStudentEmailOrderByCreatedAtDesc(String studentEmail);
    List<InterviewSession> findByStudentIdOrderByCreatedAtDesc(Long studentId);
}

package com.pathfinder.backend.repository;

import com.pathfinder.backend.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByStudentId(Long studentId);
    List<Application> findByInternshipId(Long internshipId);
    Optional<Application> findByStudentIdAndInternshipId(Long studentId, Long internshipId);
}
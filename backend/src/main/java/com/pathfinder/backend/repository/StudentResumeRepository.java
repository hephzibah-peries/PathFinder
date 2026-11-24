package com.pathfinder.backend.repository;

import com.pathfinder.backend.entity.StudentResume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentResumeRepository extends JpaRepository<StudentResume, Long> {
    List<StudentResume> findByStudentIdOrderByUploadedAtDesc(Long studentId);
    Optional<StudentResume> findByIdAndStudentId(Long id, Long studentId);
}

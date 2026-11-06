package com.pathfinder.backend.repository;

import com.pathfinder.backend.entity.Internship;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InternshipRepository extends JpaRepository<Internship, Long> {
    List<Internship> findByCompanyId(Long companyId);
}
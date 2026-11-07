package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.InternshipDto;
import com.pathfinder.backend.service.InternshipService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/internships")
public class InternshipController {

    private final InternshipService internshipService;

    public InternshipController(InternshipService internshipService) {
        this.internshipService = internshipService;
    }

    @PostMapping
    @PreAuthorize("hasRole('COMPANY') or hasRole('ADMIN')")
    public ResponseEntity<InternshipDto> createInternship(
            Authentication authentication,
            @RequestBody InternshipDto dto) {
        return ResponseEntity.ok(internshipService.createInternship(authentication.getName(), dto));
    }

    @GetMapping
    public ResponseEntity<List<InternshipDto>> getAllInternships() {
        return ResponseEntity.ok(internshipService.getAllInternships());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InternshipDto> getInternshipById(@PathVariable Long id) {
        return ResponseEntity.ok(internshipService.getInternshipById(id));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('COMPANY') or hasRole('ADMIN')")
    public ResponseEntity<List<InternshipDto>> getMyInternships(Authentication authentication) {
        return ResponseEntity.ok(internshipService.getMyInternships(authentication.getName()));
    }
}

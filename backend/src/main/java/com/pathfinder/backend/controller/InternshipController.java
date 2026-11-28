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
    @PreAuthorize("hasAnyRole('COMPANY', 'ADMIN') or hasAnyAuthority('COMPANY', 'ROLE_COMPANY', 'ADMIN', 'ROLE_ADMIN') or isAuthenticated()")
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
    @PreAuthorize("hasAnyRole('COMPANY', 'ADMIN') or hasAnyAuthority('COMPANY', 'ROLE_COMPANY', 'ADMIN', 'ROLE_ADMIN') or isAuthenticated()")
    public ResponseEntity<List<InternshipDto>> getMyInternships(Authentication authentication) {
        return ResponseEntity.ok(internshipService.getMyInternships(authentication.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COMPANY', 'ADMIN') or hasAnyAuthority('COMPANY', 'ROLE_COMPANY', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<InternshipDto> updateInternship(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody InternshipDto dto) {
        return ResponseEntity.ok(internshipService.updateInternship(id, authentication.getName(), dto));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('COMPANY', 'ADMIN') or hasAnyAuthority('COMPANY', 'ROLE_COMPANY', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<InternshipDto> updateInternshipStatus(
            Authentication authentication,
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body) {
        String status = body != null ? body.get("status") : "ACTIVE";
        return ResponseEntity.ok(internshipService.updateInternshipStatus(id, authentication.getName(), status));
    }
}

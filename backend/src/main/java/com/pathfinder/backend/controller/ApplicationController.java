package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.ApplicationDto;
import com.pathfinder.backend.dto.ApplicationStatusUpdateRequest;
import com.pathfinder.backend.service.ApplicationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping("/apply/{internshipId}")
    public ResponseEntity<ApplicationDto> applyForInternship(
            Authentication authentication,
            @PathVariable Long internshipId) {
        return ResponseEntity.ok(applicationService.applyForInternship(authentication.getName(), internshipId));
    }

    @GetMapping("/my-applications")
    public ResponseEntity<List<ApplicationDto>> getStudentApplications(Authentication authentication) {
        return ResponseEntity.ok(applicationService.getStudentApplications(authentication.getName()));
    }

    @GetMapping("/internship/{internshipId}")
    public ResponseEntity<List<ApplicationDto>> getApplicationsForInternship(@PathVariable Long internshipId) {
        return ResponseEntity.ok(applicationService.getApplicationsForInternship(internshipId));
    }

    @PutMapping("/{applicationId}/status")
    public ResponseEntity<ApplicationDto> updateStatus(
            @PathVariable Long applicationId,
            @RequestBody ApplicationStatusUpdateRequest request) {
        return ResponseEntity.ok(applicationService.updateApplicationStatus(applicationId, request.getStatus()));
    }
}

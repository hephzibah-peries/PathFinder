package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.ApplicationDto;
import com.pathfinder.backend.dto.ApplicationStatusUpdateRequest;
import com.pathfinder.backend.service.ApplicationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private static final Logger log = LoggerFactory.getLogger(ApplicationController.class);
    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping("/apply/{internshipId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> applyForInternship(
            Authentication authentication,
            @PathVariable Long internshipId,
            @RequestParam(value = "resumeId", required = false) Long resumeId) {
        try {
            log.info("Apply request: user='{}', internshipId={}, resumeId={}",
                    authentication != null ? authentication.getName() : "unknown", internshipId, resumeId);
            ApplicationDto dto = applicationService.applyForInternship(authentication.getName(), internshipId, resumeId);
            return ResponseEntity.ok(dto);
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in applyForInternship: {} - {}", rse.getStatusCode(), rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (IllegalArgumentException | IllegalStateException ex) {
            log.warn("Validation error in applyForInternship: {}", ex.getMessage());
            return buildErrorResponse(HttpStatus.BAD_REQUEST.value(), ex.getMessage());
        } catch (Exception e) {
            log.error("Failed to apply for internship {} by '{}': {}", internshipId, authentication != null ? authentication.getName() : "unknown", e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to apply for internship: " + e.getMessage());
        }
    }

    @GetMapping("/my-applications")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<?> getStudentApplications(Authentication authentication) {
        try {
            List<ApplicationDto> dtos = applicationService.getStudentApplications(authentication.getName());
            return ResponseEntity.ok(dtos);
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in getStudentApplications: {} - {}", rse.getStatusCode(), rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (Exception e) {
            log.error("Failed to fetch applications for '{}': {}", authentication != null ? authentication.getName() : "unknown", e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to fetch applications: " + e.getMessage());
        }
    }

    @GetMapping("/internship/{internshipId}")
    @PreAuthorize("hasAnyRole('COMPANY', 'ADMIN') or hasAnyAuthority('COMPANY', 'ROLE_COMPANY', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> getApplicationsForInternship(
            Authentication authentication,
            @PathVariable Long internshipId) {
        try {
            String companyEmail = authentication != null ? authentication.getName() : null;
            List<ApplicationDto> dtos = applicationService.getApplicationsForInternship(internshipId, companyEmail);
            return ResponseEntity.ok(dtos);
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in getApplicationsForInternship: {} - {}", rse.getStatusCode(), rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (Exception e) {
            log.error("Failed to fetch applications for internship {}: {}", internshipId, e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to fetch internship applications: " + e.getMessage());
        }
    }

    @PutMapping("/{applicationId}/status")
    @PreAuthorize("hasAnyRole('COMPANY', 'ADMIN') or hasAnyAuthority('COMPANY', 'ROLE_COMPANY', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<?> updateStatus(
            Authentication authentication,
            @PathVariable Long applicationId,
            @RequestBody ApplicationStatusUpdateRequest request) {
        try {
            String companyEmail = authentication != null ? authentication.getName() : null;
            String newStatus = request != null ? request.getStatus() : null;
            String note = request != null ? request.getNote() : null;
            ApplicationDto updated = applicationService.updateApplicationStatus(applicationId, newStatus, note, companyEmail);
            return ResponseEntity.ok(updated);
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in updateStatus: {} - {}", rse.getStatusCode(), rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (Exception e) {
            log.error("Failed to update status for application {}: {}", applicationId, e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to update application status: " + e.getMessage());
        }
    }

    @GetMapping("/{applicationId}/resume")
    @PreAuthorize("hasAnyRole('COMPANY', 'ADMIN') or hasAnyAuthority('COMPANY', 'ROLE_COMPANY', 'ADMIN', 'ROLE_ADMIN')")
    public ResponseEntity<byte[]> getApplicantResume(
            Authentication authentication,
            @PathVariable Long applicationId) {
        String companyEmail = authentication != null ? authentication.getName() : null;
        ApplicationService.ApplicantResumeData resumeData = applicationService.getApplicantResumeForCompany(applicationId, companyEmail);

        MediaType mediaType = MediaType.APPLICATION_PDF;
        if (resumeData.getContentType() != null && !resumeData.getContentType().isBlank()) {
            try {
                mediaType = MediaType.parseMediaType(resumeData.getContentType());
            } catch (Exception ignored) {
            }
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resumeData.getFileName() + "\"")
                .body(resumeData.getFileData());
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(int status, String message) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", status);
        body.put("error", HttpStatus.resolve(status) != null ? HttpStatus.resolve(status).getReasonPhrase() : "Error");
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}

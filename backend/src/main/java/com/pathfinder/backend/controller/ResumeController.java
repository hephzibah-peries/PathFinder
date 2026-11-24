package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.ResumeAnalysisDto;
import com.pathfinder.backend.dto.SkillDiagnosisRequest;
import com.pathfinder.backend.dto.SkillDiagnosisResponse;
import com.pathfinder.backend.dto.StudentResumeDto;
import com.pathfinder.backend.service.ResumeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/resume", "/api/resumes", "/api/student/resumes", "/api/student/resume"})
public class ResumeController {

    private static final Logger log = LoggerFactory.getLogger(ResumeController.class);
    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> analyzeResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "internshipId", required = false) Long internshipId) {
        try {
            return ResponseEntity.ok(resumeService.analyzeResume(file, internshipId));
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in analyzeResume: {}", rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (Exception e) {
            log.error("Failed to analyze resume: {}", e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to analyze resume: " + e.getMessage());
        }
    }

    @GetMapping({"/my-resumes", "", "/resumes"})
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<?> getMyResumes(Authentication authentication) {
        try {
            List<StudentResumeDto> resumes = resumeService.getStudentResumes(authentication.getName());
            return ResponseEntity.ok(resumes);
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in getMyResumes for user '{}': {}", authentication != null ? authentication.getName() : "unknown", rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (Exception e) {
            log.error("Failed to fetch resumes for user '{}': {}", authentication != null ? authentication.getName() : "unknown", e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to fetch student resumes: " + e.getMessage());
        }
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<?> uploadResume(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        try {
            log.info("Uploading resume for user '{}': fileName='{}', size={} bytes",
                    authentication != null ? authentication.getName() : "unknown",
                    file != null ? file.getOriginalFilename() : "null",
                    file != null ? file.getSize() : 0);
            StudentResumeDto dto = resumeService.uploadStudentResume(authentication.getName(), file);
            return ResponseEntity.ok(dto);
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in uploadResume for user '{}': {}", authentication != null ? authentication.getName() : "unknown", rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (Exception e) {
            log.error("Failed to upload resume for user '{}': {}", authentication != null ? authentication.getName() : "unknown", e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to upload resume: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<?> deleteResume(
            Authentication authentication,
            @PathVariable Long id) {
        try {
            resumeService.deleteStudentResume(authentication.getName(), id);
            return ResponseEntity.noContent().build();
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in deleteResume for id {}: {}", id, rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (Exception e) {
            log.error("Failed to delete resume id {} for user '{}': {}", id, authentication != null ? authentication.getName() : "unknown", e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to delete resume: " + e.getMessage());
        }
    }

    @GetMapping({"/{id}/file", "/{id}/download", "/{id}/view"})
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<?> getResumeFile(
            Authentication authentication,
            @PathVariable Long id) {
        try {
            return resumeService.getStudentResumeFile(authentication.getName(), id);
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in getResumeFile for id {}: {}", id, rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (Exception e) {
            log.error("Failed to fetch resume file id {} for user '{}': {}", id, authentication != null ? authentication.getName() : "unknown", e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to retrieve resume file: " + e.getMessage());
        }
    }

    @PostMapping("/diagnose")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<?> diagnoseSkillGap(
            Authentication authentication,
            @RequestBody SkillDiagnosisRequest request) {
        try {
            return ResponseEntity.ok(resumeService.diagnoseSkillGap(authentication.getName(), request));
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in diagnoseSkillGap: {}", rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (Exception e) {
            log.error("Failed to diagnose skill gap: {}", e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to diagnose skill gap: " + e.getMessage());
        }
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


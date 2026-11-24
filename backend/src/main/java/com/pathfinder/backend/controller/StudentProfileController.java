package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.StudentProfileDto;
import com.pathfinder.backend.service.StudentProfileService;
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
import java.util.Map;

@RestController
@RequestMapping({"/api/students", "/api/student"})
public class StudentProfileController {

    private static final Logger log = LoggerFactory.getLogger(StudentProfileController.class);
    private final StudentProfileService studentProfileService;

    public StudentProfileController(StudentProfileService studentProfileService) {
        this.studentProfileService = studentProfileService;
    }

    @GetMapping({"/me", "/profile"})
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<?> getMyProfile(Authentication authentication) {
        try {
            StudentProfileDto dto = studentProfileService.getProfileByEmail(authentication.getName());
            return ResponseEntity.ok(dto);
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in getMyProfile for '{}': {}", authentication != null ? authentication.getName() : "unknown", rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (Exception e) {
            log.error("Failed to get profile for '{}': {}", authentication != null ? authentication.getName() : "unknown", e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to get profile: " + e.getMessage());
        }
    }

    @PutMapping({"/me", "/profile"})
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<?> updateMyProfile(
            Authentication authentication,
            @RequestBody StudentProfileDto dto) {
        try {
            StudentProfileDto updated = studentProfileService.updateProfile(authentication.getName(), dto);
            return ResponseEntity.ok(updated);
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in updateMyProfile: {}", rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (Exception e) {
            log.error("Failed to update profile for '{}': {}", authentication != null ? authentication.getName() : "unknown", e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to update profile: " + e.getMessage());
        }
    }

    @PostMapping(value = {"/me/photo", "/profile/photo"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<?> uploadPhoto(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        try {
            StudentProfileDto updated = studentProfileService.uploadProfilePicture(authentication.getName(), file);
            return ResponseEntity.ok(updated);
        } catch (ResponseStatusException rse) {
            log.warn("ResponseStatusException in uploadPhoto: {}", rse.getReason());
            return buildErrorResponse(rse.getStatusCode().value(), rse.getReason() != null ? rse.getReason() : rse.getMessage());
        } catch (Exception e) {
            log.error("Failed to upload profile photo for '{}': {}", authentication != null ? authentication.getName() : "unknown", e.getMessage(), e);
            return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Failed to upload photo: " + e.getMessage());
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

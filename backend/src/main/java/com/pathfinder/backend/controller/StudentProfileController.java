package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.StudentProfileDto;
import com.pathfinder.backend.service.StudentProfileService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping({"/api/students", "/api/student"})
public class StudentProfileController {

    private final StudentProfileService studentProfileService;

    public StudentProfileController(StudentProfileService studentProfileService) {
        this.studentProfileService = studentProfileService;
    }

    @GetMapping({"/me", "/profile"})
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<StudentProfileDto> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(studentProfileService.getProfileByEmail(authentication.getName()));
    }

    @PutMapping({"/me", "/profile"})
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<StudentProfileDto> updateMyProfile(
            Authentication authentication,
            @RequestBody StudentProfileDto dto) {
        return ResponseEntity.ok(studentProfileService.updateProfile(authentication.getName(), dto));
    }

    @PostMapping(value = {"/me/photo", "/profile/photo"}, consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<StudentProfileDto> uploadPhoto(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(studentProfileService.uploadProfilePicture(authentication.getName(), file));
    }
}

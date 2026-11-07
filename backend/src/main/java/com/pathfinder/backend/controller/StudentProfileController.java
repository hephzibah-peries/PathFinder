package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.StudentProfileDto;
import com.pathfinder.backend.service.StudentProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
public class StudentProfileController {

    private final StudentProfileService studentProfileService;

    public StudentProfileController(StudentProfileService studentProfileService) {
        this.studentProfileService = studentProfileService;
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<StudentProfileDto> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(studentProfileService.getProfileByEmail(authentication.getName()));
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<StudentProfileDto> updateMyProfile(
            Authentication authentication,
            @RequestBody StudentProfileDto dto) {
        return ResponseEntity.ok(studentProfileService.updateProfile(authentication.getName(), dto));
    }
}

package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.StudentProfileDto;
import com.pathfinder.backend.service.StudentProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentProfileController {

    private final StudentProfileService studentProfileService;

    @GetMapping("/me")
    public ResponseEntity<StudentProfileDto> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(studentProfileService.getProfileByEmail(authentication.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<StudentProfileDto> updateMyProfile(
            Authentication authentication,
            @RequestBody StudentProfileDto dto) {
        return ResponseEntity.ok(studentProfileService.updateProfile(authentication.getName(), dto));
    }
}
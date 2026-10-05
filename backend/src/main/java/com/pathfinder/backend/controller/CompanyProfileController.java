package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.CompanyProfileDto;
import com.pathfinder.backend.service.CompanyProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/companies")
public class CompanyProfileController {

    private final CompanyProfileService companyProfileService;

    public CompanyProfileController(CompanyProfileService companyProfileService) {
        this.companyProfileService = companyProfileService;
    }

    @GetMapping("/me")
    public ResponseEntity<CompanyProfileDto> getMyProfile(Authentication authentication) {
        return ResponseEntity.ok(companyProfileService.getProfileByEmail(authentication.getName()));
    }

    @PutMapping("/me")
    public ResponseEntity<CompanyProfileDto> updateMyProfile(
            Authentication authentication,
            @RequestBody CompanyProfileDto dto) {
        return ResponseEntity.ok(companyProfileService.updateProfile(authentication.getName(), dto));
    }
}
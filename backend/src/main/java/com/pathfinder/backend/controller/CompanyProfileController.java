package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.CompanyProfileDto;
import com.pathfinder.backend.service.CompanyProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping({"/api/companies", "/api/company"})
public class CompanyProfileController {

    private final CompanyProfileService companyProfileService;

    public CompanyProfileController(CompanyProfileService companyProfileService) {
        this.companyProfileService = companyProfileService;
    }

    @GetMapping({"/me", "/profile"})
    public ResponseEntity<CompanyProfileDto> getMyProfile(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return ResponseEntity.ok(companyProfileService.getProfileByEmail(authentication.getName()));
    }

    @PutMapping({"/me", "/profile"})
    public ResponseEntity<CompanyProfileDto> updateMyProfile(
            Authentication authentication,
            @RequestBody CompanyProfileDto dto) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not authenticated");
        }
        return ResponseEntity.ok(companyProfileService.updateProfile(authentication.getName(), dto));
    }
}

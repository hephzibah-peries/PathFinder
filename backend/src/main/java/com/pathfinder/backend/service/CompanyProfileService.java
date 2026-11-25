package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.CompanyProfileDto;
import com.pathfinder.backend.entity.CompanyProfile;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.repository.CompanyProfileRepository;
import com.pathfinder.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class CompanyProfileService {

    private final CompanyProfileRepository companyProfileRepository;
    private final UserRepository userRepository;

    public CompanyProfileService(CompanyProfileRepository companyProfileRepository, UserRepository userRepository) {
        this.companyProfileRepository = companyProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public CompanyProfileDto getProfileByEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email not provided in authentication context");
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found for email: " + email);
        }

        // Auto-provision default CompanyProfile if not present (e.g. fresh account or DB reset)
        CompanyProfile profile = companyProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    String defaultName = user.getEmail() != null && user.getEmail().contains("@")
                            ? user.getEmail().split("@")[0]
                            : "My Company";
                    CompanyProfile newProfile = CompanyProfile.builder()
                            .user(user)
                            .companyName(defaultName)
                            .industry("Technology")
                            .description("Company profile")
                            .website("")
                            .verified(false)
                            .build();
                    return companyProfileRepository.save(newProfile);
                });

        return mapToDto(profile);
    }

    @Transactional
    public CompanyProfileDto updateProfile(String email, CompanyProfileDto dto) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email not provided in authentication context");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found for email: " + email));

        CompanyProfile profile = companyProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    String defaultName = (dto != null && dto.getCompanyName() != null && !dto.getCompanyName().isBlank())
                            ? dto.getCompanyName()
                            : (user.getEmail() != null ? user.getEmail().split("@")[0] : "My Company");
                    CompanyProfile newProfile = CompanyProfile.builder()
                            .user(user)
                            .companyName(defaultName)
                            .verified(false)
                            .build();
                    return companyProfileRepository.save(newProfile);
                });

        if (dto != null) {
            if (dto.getCompanyName() != null) profile.setCompanyName(dto.getCompanyName());
            if (dto.getIndustry() != null) profile.setIndustry(dto.getIndustry());
            if (dto.getDescription() != null) profile.setDescription(dto.getDescription());
            if (dto.getWebsite() != null) profile.setWebsite(dto.getWebsite());
        }

        return mapToDto(companyProfileRepository.save(profile));
    }

    private CompanyProfileDto mapToDto(CompanyProfile profile) {
        if (profile == null) return null;
        Long userId = profile.getUser() != null ? profile.getUser().getId() : null;
        String email = profile.getUser() != null ? profile.getUser().getEmail() : null;
        return CompanyProfileDto.builder()
                .id(profile.getId())
                .userId(userId)
                .email(email)
                .companyName(profile.getCompanyName() != null ? profile.getCompanyName() : "")
                .industry(profile.getIndustry() != null ? profile.getIndustry() : "")
                .description(profile.getDescription() != null ? profile.getDescription() : "")
                .website(profile.getWebsite() != null ? profile.getWebsite() : "")
                .verified(profile.getVerified() != null ? profile.getVerified() : false)
                .build();
    }
}
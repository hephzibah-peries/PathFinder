package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.CompanyProfileDto;
import com.pathfinder.backend.entity.CompanyProfile;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.enums.UserRole;
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

        User initialUser = userRepository.findByEmail(email).orElse(null);
        if (initialUser == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found for email: " + email);
        }

        // Ensure user has COMPANY role when managing company profile
        if (initialUser.getRole() != UserRole.COMPANY && initialUser.getRole() != UserRole.ADMIN) {
            initialUser.setRole(UserRole.COMPANY);
            initialUser = userRepository.save(initialUser);
        }
        final User user = initialUser;

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

        // Auto-verify existing company if required details are completed
        if (Boolean.FALSE.equals(profile.getVerified()) || profile.getVerified() == null) {
            if (isProfileComplete(profile)) {
                profile.setVerified(true);
                profile = companyProfileRepository.save(profile);
            }
        }

        return mapToDto(profile);
    }

    @Transactional
    public CompanyProfileDto updateProfile(String email, CompanyProfileDto dto) {
        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Email not provided in authentication context");
        }

        User initialUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found for email: " + email));

        // Ensure user has COMPANY role when updating company profile
        if (initialUser.getRole() != UserRole.COMPANY && initialUser.getRole() != UserRole.ADMIN) {
            initialUser.setRole(UserRole.COMPANY);
            initialUser = userRepository.save(initialUser);
        }
        final User user = initialUser;

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

        // Auto-verify when required details (name, industry, website, description) are completed and saved
        if (isProfileComplete(profile)) {
            profile.setVerified(true);
        }

        return mapToDto(companyProfileRepository.save(profile));
    }

    private boolean isProfileComplete(CompanyProfile profile) {
        if (profile == null) return false;
        return profile.getCompanyName() != null && !profile.getCompanyName().isBlank()
                && profile.getIndustry() != null && !profile.getIndustry().isBlank()
                && profile.getWebsite() != null && !profile.getWebsite().isBlank()
                && profile.getDescription() != null && !profile.getDescription().isBlank();
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
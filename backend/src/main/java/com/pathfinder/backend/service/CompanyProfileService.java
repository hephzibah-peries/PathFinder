package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.CompanyProfileDto;
import com.pathfinder.backend.entity.CompanyProfile;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.repository.CompanyProfileRepository;
import com.pathfinder.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class CompanyProfileService {

    private final CompanyProfileRepository companyProfileRepository;
    private final UserRepository userRepository;

    public CompanyProfileService(CompanyProfileRepository companyProfileRepository, UserRepository userRepository) {
        this.companyProfileRepository = companyProfileRepository;
        this.userRepository = userRepository;
    }

    public CompanyProfileDto getProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CompanyProfile profile = companyProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> companyProfileRepository.save(
                        CompanyProfile.builder().user(user).build()
                ));

        return mapToDto(profile);
    }

    public CompanyProfileDto updateProfile(String email, CompanyProfileDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        CompanyProfile profile = companyProfileRepository.findByUserId(user.getId())
                .orElse(CompanyProfile.builder().user(user).build());

        profile.setCompanyName(dto.getCompanyName());
        profile.setIndustry(dto.getIndustry());
        profile.setDescription(dto.getDescription());
        profile.setWebsite(dto.getWebsite());

        return mapToDto(companyProfileRepository.save(profile));
    }

    private CompanyProfileDto mapToDto(CompanyProfile profile) {
        return CompanyProfileDto.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .email(profile.getUser().getEmail())
                .companyName(profile.getCompanyName())
                .industry(profile.getIndustry())
                .description(profile.getDescription())
                .website(profile.getWebsite())
                .verified(profile.getVerified())
                .build();
    }
}
package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.InternshipDto;
import com.pathfinder.backend.entity.CompanyProfile;
import com.pathfinder.backend.entity.Internship;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.repository.CompanyProfileRepository;
import com.pathfinder.backend.repository.InternshipRepository;
import com.pathfinder.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InternshipService {

    private final InternshipRepository internshipRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final UserRepository userRepository;

    public InternshipDto createInternship(String companyEmail, InternshipDto dto) {
        User user = userRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        CompanyProfile company = companyProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Company profile not found"));

        Internship internship = Internship.builder()
                .company(company)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .location(dto.getLocation())
                .workMode(dto.getWorkMode())
                .requirements(dto.getRequirements())
                .stipend(dto.getStipend())
                .deadline(dto.getDeadline())
                .build();

        return mapToDto(internshipRepository.save(internship));
    }

    public List<InternshipDto> getAllInternships() {
        return internshipRepository.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<InternshipDto> getMyInternships(String companyEmail) {
        User user = userRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        CompanyProfile company = companyProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Company profile not found"));

        return internshipRepository.findByCompanyId(company.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private InternshipDto mapToDto(Internship internship) {
        return InternshipDto.builder()
                .id(internship.getId())
                .companyId(internship.getCompany().getId())
                .companyName(internship.getCompany().getCompanyName())
                .title(internship.getTitle())
                .description(internship.getDescription())
                .location(internship.getLocation())
                .workMode(internship.getWorkMode())
                .requirements(internship.getRequirements())
                .stipend(internship.getStipend())
                .deadline(internship.getDeadline())
                .build();
    }
}
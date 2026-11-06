package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.InternshipDto;
import com.pathfinder.backend.entity.CompanyProfile;
import com.pathfinder.backend.entity.Internship;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.repository.CompanyProfileRepository;
import com.pathfinder.backend.repository.InternshipRepository;
import com.pathfinder.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InternshipService {

    private final InternshipRepository internshipRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final UserRepository userRepository;

    public InternshipService(InternshipRepository internshipRepository,
                             CompanyProfileRepository companyProfileRepository, UserRepository userRepository) {
        this.internshipRepository = internshipRepository;
        this.companyProfileRepository = companyProfileRepository;
        this.userRepository = userRepository;
    }

    public InternshipDto createInternship(String companyEmail, InternshipDto dto) {
        User user = userRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        CompanyProfile company = companyProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> companyProfileRepository.save(
                        CompanyProfile.builder().user(user).companyName(user.getEmail().split("@")[0]).build()
                ));

        Internship internship = Internship.builder()
                .company(company)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .location(dto.getLocation())
                .workMode(dto.getWorkMode())
                .requirements(dto.getRequirements())
                .skills(dto.getSkills())
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

    public InternshipDto getInternshipById(Long id) {
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Internship not found with id: " + id));
        return mapToDto(internship);
    }

    public List<InternshipDto> getMyInternships(String companyEmail) {
        User user = userRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        CompanyProfile company = companyProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> companyProfileRepository.save(
                        CompanyProfile.builder().user(user).companyName(user.getEmail().split("@")[0]).build()
                ));

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
                .skills(internship.getSkills())
                .stipend(internship.getStipend())
                .deadline(internship.getDeadline())
                .build();
    }
}

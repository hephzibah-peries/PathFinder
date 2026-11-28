package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.InternshipDto;
import com.pathfinder.backend.entity.CompanyProfile;
import com.pathfinder.backend.entity.Internship;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.repository.CompanyProfileRepository;
import com.pathfinder.backend.repository.InternshipRepository;
import com.pathfinder.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class InternshipService {

    private final InternshipRepository internshipRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final UserRepository userRepository;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private NotificationService notificationService;

    public InternshipService(InternshipRepository internshipRepository,
                             CompanyProfileRepository companyProfileRepository, UserRepository userRepository) {
        this.internshipRepository = internshipRepository;
        this.companyProfileRepository = companyProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public InternshipDto createInternship(String companyEmail, InternshipDto dto) {
        User user = userRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        CompanyProfile company = companyProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> companyProfileRepository.save(
                        CompanyProfile.builder().user(user).companyName(user.getEmail().split("@")[0]).build()
                ));

        String status = (dto.getStatus() != null && !dto.getStatus().isBlank())
                ? dto.getStatus().trim().toUpperCase()
                : "ACTIVE";

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
                .status(status)
                .build();

        Internship saved = internshipRepository.save(internship);
        if (notificationService != null) {
            try {
                notificationService.notifyNewInternship(saved);
            } catch (Exception e) {
                // Ignore notification failure to ensure createInternship always succeeds
            }
        }
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<InternshipDto> getAllInternships() {
        return internshipRepository.findAll().stream()
                .filter(i -> i.getStatus() == null || "ACTIVE".equalsIgnoreCase(i.getStatus()))
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public InternshipDto getInternshipById(Long id) {
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Internship not found with id: " + id));
        return mapToDto(internship);
    }

    @Transactional(readOnly = true)
    public List<InternshipDto> getMyInternships(String companyEmail) {
        User user = userRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        CompanyProfile company = companyProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> companyProfileRepository.save(
                        CompanyProfile.builder().user(user).companyName(user.getEmail().split("@")[0]).build()
                ));

        return internshipRepository.findByCompanyId(company.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public InternshipDto updateInternship(Long id, String companyEmail, InternshipDto dto) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Internship ID must be provided");
        }
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Internship not found with id: " + id));

        User authUser = userRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + companyEmail));
        boolean isAdmin = authUser.getRole() != null && "ADMIN".equalsIgnoreCase(authUser.getRole().name());
        if (!isAdmin) {
            String ownerEmail = internship.getCompany() != null && internship.getCompany().getUser() != null
                    ? internship.getCompany().getUser().getEmail() : null;
            if (ownerEmail == null || !ownerEmail.equalsIgnoreCase(companyEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You do not own this internship");
            }
        }

        if (dto.getTitle() != null && !dto.getTitle().isBlank()) {
            internship.setTitle(dto.getTitle().trim());
        }
        if (dto.getDescription() != null) {
            internship.setDescription(dto.getDescription());
        }
        if (dto.getLocation() != null) {
            internship.setLocation(dto.getLocation());
        }
        if (dto.getWorkMode() != null) {
            internship.setWorkMode(dto.getWorkMode());
        }
        if (dto.getRequirements() != null) {
            internship.setRequirements(dto.getRequirements());
        }
        if (dto.getSkills() != null) {
            internship.setSkills(dto.getSkills());
        }
        if (dto.getStipend() != null) {
            internship.setStipend(dto.getStipend());
        }
        if (dto.getDeadline() != null) {
            internship.setDeadline(dto.getDeadline());
        }
        if (dto.getStatus() != null && !dto.getStatus().isBlank()) {
            internship.setStatus(dto.getStatus().trim().toUpperCase());
        }

        Internship saved = internshipRepository.save(internship);
        return mapToDto(saved);
    }

    @Transactional
    public InternshipDto updateInternshipStatus(Long id, String companyEmail, String status) {
        if (id == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Internship ID must be provided");
        }
        Internship internship = internshipRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Internship not found with id: " + id));

        User authUser = userRepository.findByEmail(companyEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + companyEmail));
        boolean isAdmin = authUser.getRole() != null && "ADMIN".equalsIgnoreCase(authUser.getRole().name());
        if (!isAdmin) {
            String ownerEmail = internship.getCompany() != null && internship.getCompany().getUser() != null
                    ? internship.getCompany().getUser().getEmail() : null;
            if (ownerEmail == null || !ownerEmail.equalsIgnoreCase(companyEmail)) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: You do not own this internship");
            }
        }

        internship.setStatus(status != null && !status.isBlank() ? status.trim().toUpperCase() : "ACTIVE");
        Internship saved = internshipRepository.save(internship);
        return mapToDto(saved);
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
                .status(internship.getStatus())
                .build();
    }
}

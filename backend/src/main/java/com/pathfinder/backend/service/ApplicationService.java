package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.ApplicationDto;
import com.pathfinder.backend.entity.Application;
import com.pathfinder.backend.entity.Internship;
import com.pathfinder.backend.entity.StudentProfile;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.repository.ApplicationRepository;
import com.pathfinder.backend.repository.InternshipRepository;
import com.pathfinder.backend.repository.StudentProfileRepository;
import com.pathfinder.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final InternshipRepository internshipRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;

    public ApplicationDto applyForInternship(String studentEmail, Long internshipId) {
        User user = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Student profile not found"));
        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new RuntimeException("Internship not found"));

        applicationRepository.findByStudentIdAndInternshipId(student.getId(), internshipId)
                .ifPresent(a -> { throw new RuntimeException("Already applied to this internship"); });

        Application application = Application.builder()
                .student(student)
                .internship(internship)
                .status("PENDING")
                .build();

        return mapToDto(applicationRepository.save(application));
    }

    public List<ApplicationDto> getStudentApplications(String studentEmail) {
        User user = userRepository.findByEmail(studentEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));
        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Student profile not found"));

        return applicationRepository.findByStudentId(student.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public List<ApplicationDto> getApplicationsForInternship(Long internshipId) {
        return applicationRepository.findByInternshipId(internshipId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public ApplicationDto updateApplicationStatus(Long applicationId, String status) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));
        application.setStatus(status);
        return mapToDto(applicationRepository.save(application));
    }

    private ApplicationDto mapToDto(Application app) {
        return ApplicationDto.builder()
                .id(app.getId())
                .internshipId(app.getInternship().getId())
                .internshipTitle(app.getInternship().getTitle())
                .companyName(app.getInternship().getCompany().getCompanyName())
                .studentId(app.getStudent().getId())
                .studentName(app.getStudent().getFullName())
                .status(app.getStatus())
                .appliedAt(app.getAppliedAt().toString())
                .build();
    }
}
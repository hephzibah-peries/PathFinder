package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.ApplicationDto;
import com.pathfinder.backend.entity.Application;
import com.pathfinder.backend.entity.Internship;
import com.pathfinder.backend.entity.StudentProfile;
import com.pathfinder.backend.entity.StudentResume;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.repository.ApplicationRepository;
import com.pathfinder.backend.repository.InternshipRepository;
import com.pathfinder.backend.repository.StudentProfileRepository;
import com.pathfinder.backend.repository.StudentResumeRepository;
import com.pathfinder.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

    private final ApplicationRepository applicationRepository;
    private final InternshipRepository internshipRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final StudentResumeRepository studentResumeRepository;
    private final UserRepository userRepository;

    public ApplicationService(ApplicationRepository applicationRepository, InternshipRepository internshipRepository,
                              StudentProfileRepository studentProfileRepository, UserRepository userRepository) {
        this(applicationRepository, internshipRepository, studentProfileRepository, null, userRepository);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ApplicationService(ApplicationRepository applicationRepository, InternshipRepository internshipRepository,
                              StudentProfileRepository studentProfileRepository, StudentResumeRepository studentResumeRepository,
                              UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.internshipRepository = internshipRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.studentResumeRepository = studentResumeRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ApplicationDto applyForInternship(String studentEmail, Long internshipId) {
        return applyForInternship(studentEmail, internshipId, null);
    }

    @Transactional
    public ApplicationDto applyToInternship(String studentEmail, Long internshipId) {
        return applyForInternship(studentEmail, internshipId, null);
    }

    @Transactional
    public ApplicationDto applyToInternship(String studentEmail, Long internshipId, Long resumeId) {
        return applyForInternship(studentEmail, internshipId, resumeId);
    }

    @Transactional
    public ApplicationDto applyForInternship(String studentEmail, Long internshipId, Long resumeId) {
        if (studentEmail == null || studentEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User authentication required");
        }
        if (internshipId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Internship ID must be provided");
        }

        User user = userRepository.findByEmail(studentEmail)
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(studentEmail))
                        .findFirst()
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User account not found: " + studentEmail)));

        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> studentProfileRepository.save(
                        StudentProfile.builder()
                                .user(user)
                                .fullName(user.getEmail().split("@")[0])
                                .build()
                ));

        Internship internship = internshipRepository.findById(internshipId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Internship not found: " + internshipId));

        if (applicationRepository.findByStudentIdAndInternshipId(student.getId(), internshipId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You have already applied to this internship");
        }

        String resumeFileName = null;
        if (resumeId != null && studentResumeRepository != null) {
            StudentResume resume = studentResumeRepository.findByIdAndStudentId(resumeId, student.getId())
                    .orElse(null);
            if (resume != null) {
                resumeFileName = resume.getFileName();
            }
        }

        Application application = Application.builder()
                .student(student)
                .internship(internship)
                .status("PENDING")
                .appliedAt(LocalDateTime.now())
                .resumeId(resumeId)
                .resumeFileName(resumeFileName)
                .build();

        Application saved = applicationRepository.save(application);
        log.info("Saved application id {} for student '{}' on internship {}", saved.getId(), studentEmail, internshipId);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getMyApplications(String studentEmail) {
        return getStudentApplications(studentEmail);
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getStudentApplications(String studentEmail) {
        if (studentEmail == null || studentEmail.isBlank()) {
            return List.of();
        }

        User user = userRepository.findByEmail(studentEmail)
                .orElseGet(() -> userRepository.findAll().stream()
                        .filter(u -> u.getEmail() != null && u.getEmail().equalsIgnoreCase(studentEmail))
                        .findFirst()
                        .orElse(null));

        if (user == null) {
            return List.of();
        }

        StudentProfile student = studentProfileRepository.findByUserId(user.getId()).orElse(null);
        if (student == null) {
            return List.of();
        }

        return applicationRepository.findByStudentId(student.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationDto> getApplicationsForInternship(Long internshipId) {
        if (internshipId == null) {
            return List.of();
        }
        return applicationRepository.findByInternshipId(internshipId).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public ApplicationDto updateApplicationStatus(Long applicationId, String status) {
        if (applicationId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Application ID must be provided");
        }
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found: " + applicationId));
        application.setStatus(status != null ? status : "PENDING");
        return mapToDto(applicationRepository.save(application));
    }

    private ApplicationDto mapToDto(Application app) {
        Long internshipId = null;
        String internshipTitle = null;
        String companyName = null;
        String location = null;
        if (app.getInternship() != null) {
            internshipId = app.getInternship().getId();
            internshipTitle = app.getInternship().getTitle();
            location = app.getInternship().getLocation();
            if (app.getInternship().getCompany() != null) {
                companyName = app.getInternship().getCompany().getCompanyName();
            }
        }

        Long studentId = null;
        String studentName = null;
        if (app.getStudent() != null) {
            studentId = app.getStudent().getId();
            studentName = app.getStudent().getFullName();
        }

        String appliedAt = app.getAppliedAt() != null
                ? app.getAppliedAt().toString()
                : LocalDateTime.now().toString();

        return ApplicationDto.builder()
                .id(app.getId())
                .internshipId(internshipId)
                .internshipTitle(internshipTitle != null ? internshipTitle : "Internship")
                .companyName(companyName != null ? companyName : "Company")
                .location(location != null ? location : "")
                .studentId(studentId)
                .studentName(studentName != null ? studentName : "")
                .status(app.getStatus() != null ? app.getStatus() : "PENDING")
                .appliedAt(appliedAt)
                .resumeId(app.getResumeId())
                .resumeFileName(app.getResumeFileName())
                .coverLetter(app.getCoverLetter())
                .build();
    }
}

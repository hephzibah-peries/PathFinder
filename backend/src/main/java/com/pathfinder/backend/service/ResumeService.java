package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.ResumeAnalysisDto;
import com.pathfinder.backend.dto.RoadmapStepDto;
import com.pathfinder.backend.dto.SkillDiagnosisRequest;
import com.pathfinder.backend.dto.SkillDiagnosisResponse;
import com.pathfinder.backend.dto.StudentResumeDto;
import com.pathfinder.backend.entity.Internship;
import com.pathfinder.backend.entity.StudentProfile;
import com.pathfinder.backend.entity.StudentResume;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.repository.InternshipRepository;
import com.pathfinder.backend.repository.StudentProfileRepository;
import com.pathfinder.backend.repository.StudentResumeRepository;
import com.pathfinder.backend.repository.UserRepository;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ResumeService {

    private static final int MAX_EXTRACTED_CHARACTERS = 5_000_000;
    private static final List<String> KNOWN_SKILLS = List.of(
            "Spring Boot", "Spring", "JavaScript", "TypeScript", "Node.js", "React", "Angular",
            "Python", "Django", "Flask", "C++", "C#", ".NET", "ASP.NET", "PostgreSQL", "MySQL",
            "MongoDB", "Kubernetes", "Machine Learning", "Data Analysis", "REST API", "GraphQL",
            "Microservices", "Docker", "Redis", "HTML", "CSS", "SQL", "Java", "AWS", "Azure",
            "Git", "Excel", "Figma", "Agile", "Kotlin", "Go"
    );

    private final InternshipRepository internshipRepository;
    private final StudentResumeRepository studentResumeRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;
    private final Tika tika;

    public ResumeService(InternshipRepository internshipRepository) {
        this(internshipRepository, null, null, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ResumeService(InternshipRepository internshipRepository,
                         StudentResumeRepository studentResumeRepository,
                         StudentProfileRepository studentProfileRepository,
                         UserRepository userRepository) {
        this.internshipRepository = internshipRepository;
        this.studentResumeRepository = studentResumeRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.userRepository = userRepository;
        this.tika = new Tika();
        this.tika.setMaxStringLength(MAX_EXTRACTED_CHARACTERS);
    }

    public ResumeAnalysisDto analyzeResume(MultipartFile resume, Long internshipId) {
        if (resume == null || resume.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume file must not be empty");
        }

        try {
            String extractedText = tika.parseToString(resume.getInputStream()).strip();
            List<String> extractedSkills = extractSkills(extractedText);

            if (internshipId == null) {
                return new ResumeAnalysisDto(extractedText, extractedSkills, List.of(), 0.0);
            }

            Internship internship = internshipRepository.findById(internshipId)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Internship not found: " + internshipId));

            List<String> targetSkills = extractTargetSkills(internship);
            Set<String> extractedSkillKeys = toSkillKeys(extractedSkills);
            List<String> missingSkills = targetSkills.stream()
                    .filter(skill -> !extractedSkillKeys.contains(skill.toLowerCase(Locale.ROOT)))
                    .toList();

            double matchScore = targetSkills.isEmpty()
                    ? 0.0
                    : (double) (targetSkills.size() - missingSkills.size()) / targetSkills.size() * 100.0;

            return new ResumeAnalysisDto(extractedText, extractedSkills, missingSkills, matchScore);
        } catch (IOException | TikaException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unable to parse the uploaded resume", exception);
        }
    }

    private List<String> extractSkills(String text) {
        String searchableText = text.toLowerCase(Locale.ROOT);
        List<SkillMatch> matches = new ArrayList<>();

        for (String skill : KNOWN_SKILLS) {
            Pattern skillPattern = Pattern.compile(
                    "(?<![\\p{L}\\p{N}])" + Pattern.quote(skill) + "(?![\\p{L}\\p{N}])",
                    Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
            var matcher = skillPattern.matcher(searchableText);
            while (matcher.find()) {
                matches.add(new SkillMatch(matcher.start(), matcher.end(), skill));
            }
        }

        matches.sort(Comparator.comparingInt(SkillMatch::start)
                .thenComparing(Comparator.comparingInt(SkillMatch::end).reversed()));
        LinkedHashSet<String> skills = new LinkedHashSet<>();
        int acceptedMatchEnd = -1;
        for (SkillMatch match : matches) {
            if (match.start() >= acceptedMatchEnd) {
                skills.add(match.skill());
                acceptedMatchEnd = match.end();
            }
        }
        return new ArrayList<>(skills);
    }

    private List<String> extractTargetSkills(Internship internship) {
        LinkedHashSet<String> targetSkills = new LinkedHashSet<>();
        targetSkills.addAll(extractSkills(nullToEmpty(internship.getSkills())));
        targetSkills.addAll(extractSkills(nullToEmpty(internship.getRequirements())));
        return new ArrayList<>(targetSkills);
    }

    private Set<String> toSkillKeys(List<String> skills) {
        Set<String> keys = new LinkedHashSet<>();
        for (String skill : skills) {
            keys.add(skill.toLowerCase(Locale.ROOT));
        }
        return keys;
    }

    public StudentResumeDto uploadStudentResume(String email, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume file must not be empty");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> studentProfileRepository.save(StudentProfile.builder().user(user).build()));

        try {
            String extractedText = tika.parseToString(file.getInputStream()).strip();
            List<String> skills = extractSkills(extractedText);
            String skillsCsv = String.join(", ", skills);

            StudentResume resume = StudentResume.builder()
                    .student(student)
                    .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "Resume.pdf")
                    .fileType(file.getContentType())
                    .fileSize(file.getSize())
                    .extractedText(extractedText)
                    .extractedSkills(skillsCsv)
                    .fileData(file.getBytes())
                    .build();

            StudentResume saved = studentResumeRepository.save(resume);

            // Also update student profile skills if profile has none yet
            if (student.getSkills() == null || student.getSkills().isBlank()) {
                student.setSkills(skillsCsv);
                studentProfileRepository.save(student);
            }

            return mapToDto(saved);
        } catch (IOException | TikaException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to parse resume document: " + e.getMessage(), e);
        }
    }

    public List<StudentResumeDto> getStudentResumes(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElse(null);
        if (student == null) {
            return List.of();
        }
        return studentResumeRepository.findByStudentIdOrderByUploadedAtDesc(student.getId()).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public void deleteStudentResume(String email, Long resumeId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found"));

        StudentResume resume = studentResumeRepository.findByIdAndStudentId(resumeId, student.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found"));

        studentResumeRepository.delete(resume);
    }

    public org.springframework.http.ResponseEntity<byte[]> getStudentResumeFile(String email, Long resumeId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found"));

        StudentResume resume = studentResumeRepository.findByIdAndStudentId(resumeId, student.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found"));

        byte[] data = resume.getFileData();
        if (data == null || data.length == 0) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Original resume file data is not available");
        }

        String contentType = resume.getFileType() != null && !resume.getFileType().isBlank()
                ? resume.getFileType()
                : "application/pdf";

        return org.springframework.http.ResponseEntity.ok()
                .contentType(org.springframework.http.MediaType.parseMediaType(contentType))
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resume.getFileName() + "\"")
                .body(data);
    }

    public SkillDiagnosisResponse diagnoseSkillGap(String email, SkillDiagnosisRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found"));

        List<String> resumeSkills = new ArrayList<>();
        String resumeFileName = "Profile Skills";

        if (request.getResumeId() != null) {
            StudentResume resume = studentResumeRepository.findByIdAndStudentId(request.getResumeId(), student.getId())
                    .orElse(null);
            if (resume != null) {
                resumeFileName = resume.getFileName();
                if (resume.getExtractedSkills() != null && !resume.getExtractedSkills().isBlank()) {
                    resumeSkills = Arrays.stream(resume.getExtractedSkills().split(","))
                            .map(String::trim)
                            .filter(s -> !s.isEmpty())
                            .collect(Collectors.toList());
                }
            }
        }

        if (resumeSkills.isEmpty() && student.getSkills() != null && !student.getSkills().isBlank()) {
            resumeSkills = Arrays.stream(student.getSkills().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        // Determine target skills
        List<String> targetSkills = new ArrayList<>();
        String roleName = request.getTargetRole() != null && !request.getTargetRole().isBlank()
                ? request.getTargetRole()
                : "Software Engineer Intern";

        if (request.getInternshipId() != null) {
            internshipRepository.findById(request.getInternshipId()).ifPresent(i -> {
                targetSkills.addAll(extractTargetSkills(i));
            });
        }

        if (targetSkills.isEmpty()) {
            targetSkills.addAll(determineRoleSkills(roleName));
        }

        Set<String> resumeSkillKeys = toSkillKeys(resumeSkills);
        List<String> matchedSkills = new ArrayList<>();
        List<String> missingSkills = new ArrayList<>();

        for (String targetSkill : targetSkills) {
            if (resumeSkillKeys.contains(targetSkill.toLowerCase(Locale.ROOT))) {
                matchedSkills.add(targetSkill);
            } else {
                missingSkills.add(targetSkill);
            }
        }

        int matchScore = targetSkills.isEmpty()
                ? 85
                : (int) Math.round(((double) matchedSkills.size() / targetSkills.size()) * 100.0);

        List<RoadmapStepDto> roadmap = generateRoadmap(roleName, matchedSkills, missingSkills);

        return SkillDiagnosisResponse.builder()
                .targetRole(roleName)
                .resumeFileName(resumeFileName)
                .matchScore(matchScore)
                .matchedSkills(matchedSkills)
                .missingSkills(missingSkills)
                .roadmap(roadmap)
                .build();
    }

    private List<String> determineRoleSkills(String role) {
        String lower = role.toLowerCase(Locale.ROOT);
        if (lower.contains("frontend") || lower.contains("front-end") || lower.contains("ui") || lower.contains("react")) {
            return List.of("React", "TypeScript", "JavaScript", "HTML", "CSS", "Git", "REST API");
        } else if (lower.contains("devops") || lower.contains("cloud") || lower.contains("site reliability") || lower.contains("sre")) {
            return List.of("Docker", "Kubernetes", "AWS", "Git", "Python", "Microservices");
        } else if (lower.contains("data") || lower.contains("machine learning") || lower.contains("ai") || lower.contains("analytics")) {
            return List.of("Python", "SQL", "Machine Learning", "Data Analysis", "PostgreSQL");
        } else if (lower.contains("full stack") || lower.contains("fullstack")) {
            return List.of("Java", "Spring Boot", "React", "TypeScript", "PostgreSQL", "Docker", "REST API");
        } else {
            // Default backend / software engineer
            return List.of("Java", "Spring Boot", "SQL", "PostgreSQL", "REST API", "Docker", "Git");
        }
    }

    private List<RoadmapStepDto> generateRoadmap(String role, List<String> matchedSkills, List<String> missingSkills) {
        List<RoadmapStepDto> steps = new ArrayList<>();

        if (missingSkills.isEmpty()) {
            steps.add(new RoadmapStepDto(
                    1,
                    "Technical Mastery & Code Review",
                    "1-2 Weeks",
                    "You have met all primary skills for " + role + "! Deepen your knowledge by writing comprehensive unit/integration tests and reviewing architectural trade-offs.",
                    List.of("Clean Code Principles", "Spring Boot / React Testing Best Practices")
            ));
            steps.add(new RoadmapStepDto(
                    2,
                    "AI Mock Interview Simulation",
                    "3-5 Days",
                    "Practice answering technical and scenario-based interview questions on PathFinder AI Mock Interview with real-time feedback.",
                    List.of("PathFinder AI Interviewer", "System Design Primer")
            ));
            steps.add(new RoadmapStepDto(
                    3,
                    "Submit Application with Confidence",
                    "Immediate",
                    "Your profile shows a top match score. Select your preferred CV and submit your application to open positions.",
                    List.of("PathFinder Explore Internships")
            ));
            return steps;
        }

        String primaryMissing = missingSkills.get(0);
        String secondaryMissing = missingSkills.size() > 1 ? missingSkills.get(1) : null;

        steps.add(new RoadmapStepDto(
                1,
                "Core Foundations: Master " + primaryMissing,
                "1-2 Weeks",
                "Dedicate dedicated hands-on practice to core mechanics of " + primaryMissing + ". Complete fundamental exercises and understand idiomatic patterns.",
                List.of(primaryMissing + " Official Documentation", "FreeCodeCamp / Baeldung Tutorials")
        ));

        if (secondaryMissing != null) {
            steps.add(new RoadmapStepDto(
                    2,
                    "Integration & Hands-On Practice with " + secondaryMissing,
                    "2 Weeks",
                    "Build a working micro-project combining " + primaryMissing + " and " + secondaryMissing + " into a functional application stack.",
                    List.of(secondaryMissing + " Guides", "GitHub Sample Repositories")
            ));
        }

        steps.add(new RoadmapStepDto(
                steps.size() + 1,
                "Portfolio Project & Deployment",
                "1-2 Weeks",
                "Construct a full-stack demo showcasing your newly acquired skills (" + String.join(", ", missingSkills) + "). Containerize with Docker and commit to GitHub.",
                List.of("GitHub Portfolio Showcase", "Docker & CI/CD Deployment")
        ));

        steps.add(new RoadmapStepDto(
                steps.size() + 1,
                "Mock Interview & Corporate Readiness",
                "3-5 Days",
                "Test your articulation of " + role + " competencies in PathFinder AI Mock Interview to ensure confidence in recruiter screenings.",
                List.of("PathFinder AI Mock Interview", "STAR Behavioral Framework")
        ));

        return steps;
    }

    private StudentResumeDto mapToDto(StudentResume resume) {
        List<String> skills = new ArrayList<>();
        if (resume.getExtractedSkills() != null && !resume.getExtractedSkills().isBlank()) {
            skills = Arrays.stream(resume.getExtractedSkills().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }

        return StudentResumeDto.builder()
                .id(resume.getId())
                .studentId(resume.getStudent().getId())
                .fileName(resume.getFileName())
                .fileType(resume.getFileType())
                .fileSize(resume.getFileSize())
                .uploadedAt(resume.getUploadedAt())
                .extractedSkills(skills)
                .build();
    }

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private record SkillMatch(int start, int end, String skill) {
    }
}

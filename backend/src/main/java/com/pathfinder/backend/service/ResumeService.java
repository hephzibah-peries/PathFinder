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
import com.pathfinder.backend.repository.ApplicationRepository;
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

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ResumeService.class);
    private static final int MAX_EXTRACTED_CHARACTERS = 5_000_000;
    private static final List<String> KNOWN_SKILLS = List.of(
            // Software & IT
            "Spring Boot", "Spring", "JavaScript", "TypeScript", "Node.js", "React", "Angular",
            "Python", "Django", "Flask", "C++", "C#", ".NET", "ASP.NET", "PostgreSQL", "MySQL",
            "MongoDB", "Kubernetes", "Machine Learning", "Data Analysis", "REST API", "GraphQL",
            "Microservices", "Docker", "Redis", "HTML", "CSS", "SQL", "Java", "AWS", "Azure",
            "Git", "Excel", "Figma", "Agile", "Kotlin", "Go",
            // Engineering & Physical Sciences
            "AutoCAD", "SolidWorks", "MATLAB", "Circuit Design", "Thermodynamics", "PLC", "LabVIEW",
            "Embedded Systems", "ANSYS", "Finite Element Analysis", "CATIA",
            // Finance, Business & Accounting
            "Financial Modeling", "Accounting", "Financial Analysis", "Auditing", "Taxation",
            "Valuation", "Risk Management", "Corporate Finance", "PowerBI", "Tableau", "QuickBooks",
            "Budgeting", "Forecasting",
            // Marketing, Media & Design
            "Digital Marketing", "SEO", "Content Strategy", "Social Media Marketing", "Copywriting",
            "Google Analytics", "Adobe Creative Suite", "Photoshop", "Illustrator", "InDesign",
            "UI/UX Design", "Wireframing", "User Research", "Brand Management",
            // Healthcare & Life Sciences
            "Clinical Research", "Biostatistics", "Molecular Biology", "Biochemistry", "PCR",
            "Laboratory Safety", "Good Laboratory Practice", "Pharmacology", "Bioinformatics",
            // Operations, HR & Law
            "Talent Acquisition", "Human Resources", "Onboarding", "HR Policies", "Supply Chain",
            "Logistics", "Procurement", "Inventory Management", "Project Management", "Compliance",
            "Contract Law", "Legal Research", "Due Diligence"
    );

    private final InternshipRepository internshipRepository;
    private final StudentResumeRepository studentResumeRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final Tika tika;

    public ResumeService(InternshipRepository internshipRepository) {
        this(internshipRepository, null, null, null, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public ResumeService(InternshipRepository internshipRepository,
                         StudentResumeRepository studentResumeRepository,
                         StudentProfileRepository studentProfileRepository,
                         UserRepository userRepository,
                         @org.springframework.beans.factory.annotation.Autowired(required = false) ApplicationRepository applicationRepository) {
        this.internshipRepository = internshipRepository;
        this.studentResumeRepository = studentResumeRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
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

    @org.springframework.transaction.annotation.Transactional
    public StudentResumeDto uploadStudentResume(String email, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Resume file must not be empty");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> studentProfileRepository.save(StudentProfile.builder().user(user).build()));

        String extractedText = "";
        List<String> skills = List.of();
        String skillsCsv = "";
        try {
            extractedText = tika.parseToString(file.getInputStream()).strip();
            skills = extractSkills(extractedText);
            skillsCsv = String.join(", ", skills);
        } catch (Exception parseEx) {
            log.warn("Tika text/skills extraction warning for file '{}': {}",
                    file.getOriginalFilename(), parseEx.getMessage());
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException ioEx) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to read resume file content: " + ioEx.getMessage(), ioEx);
        }

        StudentResume resume = StudentResume.builder()
                .student(student)
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : "Resume.pdf")
                .fileType(file.getContentType())
                .fileSize(file.getSize())
                .extractedText(extractedText)
                .extractedSkills(skillsCsv)
                .fileData(fileBytes)
                .build();

        StudentResume saved = studentResumeRepository.save(resume);

        // Also update student profile skills if profile has none yet
        if ((student.getSkills() == null || student.getSkills().isBlank()) && !skillsCsv.isBlank()) {
            student.setSkills(skillsCsv);
            studentProfileRepository.save(student);
        }

        return mapToDto(saved);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public List<StudentResumeDto> getStudentResumes(String email) {
        if (email == null || email.isBlank()) {
            return List.of();
        }
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return List.of();
        }
        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElse(null);
        if (student == null) {
            return List.of();
        }
        return studentResumeRepository.findByStudentIdOrderByUploadedAtDesc(student.getId()).stream()
                .filter(r -> r.getArchived() == null || !r.getArchived())
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @org.springframework.transaction.annotation.Transactional
    public void deleteStudentResume(String email, Long resumeId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        StudentProfile student = studentProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Student profile not found"));

        StudentResume resume = studentResumeRepository.findByIdAndStudentId(resumeId, student.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resume not found"));

        boolean isReferenced = applicationRepository != null && applicationRepository.existsByResumeId(resumeId);
        if (isReferenced) {
            resume.setArchived(true);
            studentResumeRepository.save(resume);
            log.info("Archived submitted resume id {} for student '{}' (referenced in applications)", resumeId, email);
        } else {
            studentResumeRepository.delete(resume);
            log.info("Deleted unreferenced resume id {} for student '{}'", resumeId, email);
        }
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
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

        org.springframework.http.MediaType mediaType = org.springframework.http.MediaType.APPLICATION_PDF;
        if (resume.getFileType() != null && !resume.getFileType().isBlank()) {
            try {
                mediaType = org.springframework.http.MediaType.parseMediaType(resume.getFileType());
            } catch (Exception e) {
                mediaType = org.springframework.http.MediaType.APPLICATION_PDF;
            }
        }

        return org.springframework.http.ResponseEntity.ok()
                .contentType(mediaType)
                .contentLength(data.length)
                .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resume.getFileName() + "\"")
                .header(org.springframework.http.HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate")
                .body(data);
    }

    @org.springframework.transaction.annotation.Transactional(readOnly = true)
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
            if (isSkillMatch(resumeSkillKeys, targetSkill)) {
                matchedSkills.add(targetSkill);
            } else {
                missingSkills.add(targetSkill);
            }
        }

        int matchScore = targetSkills.isEmpty()
                ? 75
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

    private boolean isSkillMatch(Set<String> resumeSkillKeys, String targetSkill) {
        String targetLower = targetSkill.toLowerCase(Locale.ROOT).trim();
        if (resumeSkillKeys.contains(targetLower)) {
            return true;
        }
        for (String r : resumeSkillKeys) {
            if (r.equalsIgnoreCase(targetLower)) {
                return true;
            }
            if (r.length() > 2 && targetLower.length() > 2) {
                if (r.contains(targetLower) || targetLower.contains(r)) {
                    return true;
                }
            }
        }
        return false;
    }

    private List<String> determineRoleSkills(String role) {
        String lower = role.toLowerCase(Locale.ROOT);
        if (lower.contains("data") || lower.contains("machine learning") || lower.contains("ai") || lower.contains("analytics")) {
            return List.of("Python", "SQL", "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "NLP", "Pandas", "Scikit-Learn", "Statistics", "PostgreSQL", "MLOps");
        } else if (lower.contains("frontend") || lower.contains("front-end") || lower.contains("ui") || lower.contains("react")) {
            return List.of("React", "TypeScript", "JavaScript", "HTML", "CSS", "TailwindCSS", "Redux", "REST APIs", "Git", "Webpack", "Responsive Design");
        } else if (lower.contains("devops") || lower.contains("cloud") || lower.contains("site reliability") || lower.contains("sre")) {
            return List.of("Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux", "Git", "Python", "Prometheus", "Bash", "Microservices");
        } else if (lower.contains("full stack") || lower.contains("fullstack")) {
            return List.of("Java", "Spring Boot", "React", "TypeScript", "JavaScript", "SQL", "PostgreSQL", "Docker", "REST APIs", "Git", "HTML/CSS");
        } else if (lower.contains("mobile") || lower.contains("android") || lower.contains("ios") || lower.contains("flutter")) {
            return List.of("Flutter", "Dart", "React Native", "Android", "iOS", "Kotlin", "Swift", "REST APIs", "Git", "State Management", "Firebase");
        } else if (lower.contains("qa") || lower.contains("test") || lower.contains("quality")) {
            return List.of("Selenium", "Test Automation", "JUnit", "Cypress", "API Testing", "Postman", "JIRA", "Regression Testing", "SQL", "Python", "Performance Testing");
        } else if (lower.contains("cyber") || lower.contains("security")) {
            return List.of("Network Security", "Penetration Testing", "Linux", "Python", "Vulnerability Assessment", "Cryptography", "SIEM", "Firewalls", "OWASP", "Ethical Hacking");
        } else if (lower.contains("ui/ux") || lower.contains("graphic") || lower.contains("design") || lower.contains("creative")) {
            return List.of("Figma", "Wireframing", "Prototyping", "User Research", "Usability Testing", "UI Design", "Design Systems", "Adobe Creative Suite", "Photoshop", "Illustrator");
        } else if (lower.contains("finance") || lower.contains("financial") || lower.contains("accounting") || lower.contains("audit")) {
            return List.of("Financial Modeling", "Excel", "Data Analysis", "Financial Reporting", "Accounting", "Valuation", "Forecasting", "Budgeting", "SQL", "Risk Management", "PowerBI");
        } else if (lower.contains("mechanical") || lower.contains("civil") || lower.contains("electrical") || lower.contains("hardware") || (lower.contains("engineer") && !lower.contains("software"))) {
            return List.of("AutoCAD", "SolidWorks", "MATLAB", "Engineering Design", "Circuit Design", "Thermodynamics", "Project Planning", "Quality Assurance", "Technical Documentation", "Problem Solving");
        } else if (lower.contains("marketing") || lower.contains("brand") || lower.contains("content") || lower.contains("social media")) {
            return List.of("Digital Marketing", "Social Media Strategy", "Content Creation", "SEO", "Google Analytics", "Brand Management", "Copywriting", "Market Research", "Email Marketing", "Campaign Management");
        } else if (lower.contains("hr") || lower.contains("human resource") || lower.contains("talent") || lower.contains("recruiting")) {
            return List.of("Talent Acquisition", "HR Policies", "Employee Engagement", "Onboarding", "Interviewing", "HRIS", "Communication", "Labor Compliance", "Workplace Relations", "Organizational Development");
        } else if (lower.contains("health") || lower.contains("clinical") || lower.contains("biology") || lower.contains("lab") || lower.contains("medical") || lower.contains("biomedical") || lower.contains("pharm")) {
            return List.of("Clinical Research", "Laboratory Safety", "Data Analysis", "Biostatistics", "Quality Control", "Research Methodology", "Regulatory Compliance", "Documentation", "Scientific Writing", "Good Laboratory Practice");
        } else if (lower.contains("supply chain") || lower.contains("logistics") || lower.contains("operation")) {
            return List.of("Supply Chain", "Logistics", "Process Optimization", "Inventory Management", "Data Analysis", "ERP Systems", "Vendor Management", "Lean Six Sigma", "Forecasting", "Project Management");
        } else if (lower.contains("law") || lower.contains("legal") || lower.contains("policy") || lower.contains("compliance")) {
            return List.of("Legal Research", "Contract Law", "Compliance", "Due Diligence", "Legal Writing", "Regulatory Analysis", "Risk Assessment", "Policy Drafting", "Ethics", "Communication");
        } else if (lower.contains("software") || lower.contains("backend") || lower.contains("developer") || lower.contains("programmer")) {
            return List.of("Java", "Spring Boot", "SQL", "PostgreSQL", "REST APIs", "Docker", "Git", "Data Structures", "Microservices", "Unit Testing", "CI/CD");
        } else {
            // General multi-disciplinary internship role
            return List.of("Project Management", "Data Analysis", "Communication", "Problem Solving", "Excel", "Research", "Documentation", "Quality Assurance", "Critical Thinking", "Stakeholder Management");
        }
    }

    private List<RoadmapStepDto> generateRoadmap(String role, List<String> matchedSkills, List<String> missingSkills) {
        List<RoadmapStepDto> steps = new ArrayList<>();

        if (missingSkills.isEmpty()) {
            String masteryTitle = (role.toLowerCase().contains("software") || role.toLowerCase().contains("developer"))
                    ? "Technical Mastery & Code Review"
                    : "Domain Mastery & Best Practices";
            steps.add(new RoadmapStepDto(
                    1,
                    masteryTitle,
                    "1-2 Weeks",
                    "You have met all primary skills for " + role + "! Deepen your knowledge by reviewing advanced case studies, practical standards, and industry best practices.",
                    List.of(role + " Advanced Standards", "Professional Best Practices")
            ));
            steps.add(new RoadmapStepDto(
                    2,
                    "AI Mock Interview Simulation",
                    "3-5 Days",
                    "Practice answering domain and scenario-based interview questions on PathFinder AI Mock Interview with real-time feedback.",
                    List.of("PathFinder AI Interviewer", "STAR Behavioral Framework")
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
                "Dedicate focused hands-on practice to core mechanics of " + primaryMissing + ". Complete fundamental exercises and understand key principles.",
                List.of(primaryMissing + " Official Guides", "Curated Reference Tutorials")
        ));

        if (secondaryMissing != null) {
            steps.add(new RoadmapStepDto(
                    2,
                    "Integration & Practical Application with " + secondaryMissing,
                    "2 Weeks",
                    "Build a working project or case study combining " + primaryMissing + " and " + secondaryMissing + " into a cohesive deliverable.",
                    List.of(secondaryMissing + " Practical Guides", "Sample Templates & Exercises")
            ));
        }

        String portfolioTitle = (role.toLowerCase().contains("software") || role.toLowerCase().contains("developer") || role.toLowerCase().contains("devops"))
                ? "Portfolio Project & Deployment"
                : "Professional Portfolio & Practical Case Study";
        String portfolioDesc = (role.toLowerCase().contains("software") || role.toLowerCase().contains("developer"))
                ? "Construct a demo project showcasing your newly acquired skills (" + String.join(", ", missingSkills) + "). Commit to GitHub and document architectural decisions."
                : "Develop a comprehensive portfolio piece or case study showcasing your newly acquired skills (" + String.join(", ", missingSkills) + ") to present to recruiters.";
        List<String> portfolioRes = (role.toLowerCase().contains("software") || role.toLowerCase().contains("developer"))
                ? List.of("GitHub Portfolio Showcase", "Project Deployment Guide")
                : List.of("Portfolio & Case Study Presentation", "Professional Documentation Best Practices");

        steps.add(new RoadmapStepDto(
                steps.size() + 1,
                portfolioTitle,
                "1-2 Weeks",
                portfolioDesc,
                portfolioRes
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

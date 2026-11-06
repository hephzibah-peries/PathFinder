package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.ResumeAnalysisDto;
import com.pathfinder.backend.entity.Internship;
import com.pathfinder.backend.repository.InternshipRepository;
import org.apache.tika.Tika;
import org.apache.tika.exception.TikaException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

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
    private final Tika tika;

    public ResumeService(InternshipRepository internshipRepository) {
        this.internshipRepository = internshipRepository;
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

    private String nullToEmpty(String value) {
        return value == null ? "" : value;
    }

    private record SkillMatch(int start, int end, String skill) {
    }
}

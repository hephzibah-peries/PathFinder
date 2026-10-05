package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.InternshipDto;
import com.pathfinder.backend.dto.RecommendationDto;
import com.pathfinder.backend.dto.StudentProfileDto;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    private final StudentProfileService studentProfileService;
    private final InternshipService internshipService;

    public RecommendationService(StudentProfileService studentProfileService, InternshipService internshipService) {
        this.studentProfileService = studentProfileService;
        this.internshipService = internshipService;
    }

    public List<RecommendationDto> getRecommendations(String studentEmail) {
        StudentProfileDto student = studentProfileService.getProfileByEmail(studentEmail);
        Set<String> studentSkills = parseSkills(student.getSkills()).stream()
                .map(skill -> skill.toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        List<RecommendationDto> recommendations = new ArrayList<>();
        for (InternshipDto internship : internshipService.getAllInternships()) {
            List<String> requiredSkills = parseSkills(internship.getSkills());
            List<String> matchedSkills = new ArrayList<>();
            List<String> missingSkills = new ArrayList<>();

            for (String requiredSkill : requiredSkills) {
                if (studentSkills.contains(requiredSkill.toLowerCase(Locale.ROOT))) {
                    matchedSkills.add(requiredSkill);
                } else {
                    missingSkills.add(requiredSkill);
                }
            }

            double matchPercentage = requiredSkills.isEmpty()
                    ? 0.0
                    : (double) matchedSkills.size() / requiredSkills.size() * 100.0;

            recommendations.add(RecommendationDto.builder()
                    .internship(internship)
                    .matchPercentage(matchPercentage)
                    .matchedSkills(matchedSkills)
                    .missingSkills(missingSkills)
                    .build());
        }

        recommendations.sort((first, second) ->
                Double.compare(second.getMatchPercentage(), first.getMatchPercentage()));
        return recommendations;
    }

    private List<String> parseSkills(String skills) {
        if (skills == null || skills.isBlank()) {
            return List.of();
        }

        Map<String, String> uniqueSkills = new LinkedHashMap<>();
        for (String skill : skills.split(",")) {
            String normalizedSkill = skill.trim();
            if (!normalizedSkill.isEmpty()) {
                uniqueSkills.putIfAbsent(normalizedSkill.toLowerCase(Locale.ROOT), normalizedSkill);
            }
        }
        return new ArrayList<>(uniqueSkills.values());
    }
}

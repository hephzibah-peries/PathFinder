package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.InternshipDto;
import com.pathfinder.backend.dto.RecommendationDto;
import com.pathfinder.backend.dto.StudentProfileDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RecommendationServiceTest {

    @Test
    void recommendsInternshipsByCaseInsensitiveUniqueSkillMatch() {
        StudentProfileService studentProfileService = new StudentProfileService(null, null) {
            @Override
            public StudentProfileDto getProfileByEmail(String email) {
                return StudentProfileDto.builder().skills("Java, spring, JAVA").build();
            }
        };
        InternshipService internshipService = new InternshipService(null, null, null) {
            @Override
            public List<InternshipDto> getAllInternships() {
                return List.of(
                        internship("Low match", "Python"),
                        internship("Best match", "JAVA, Python, Spring"),
                        internship("No listed skills", null)
                );
            }
        };
        RecommendationService recommendationService =
                new RecommendationService(studentProfileService, internshipService);

        List<RecommendationDto> recommendations = recommendationService.getRecommendations("student@example.com");

        assertEquals(3, recommendations.size());
        assertEquals("Best match", recommendations.get(0).getInternship().getTitle());
        assertEquals(200.0 / 3.0, recommendations.get(0).getMatchPercentage(), 0.0001);
        assertEquals(List.of("JAVA", "Spring"), recommendations.get(0).getMatchedSkills());
        assertEquals(List.of("Python"), recommendations.get(0).getMissingSkills());
        assertEquals(List.of("Low match", "No listed skills"),
                recommendations.subList(1, 3).stream()
                        .map(recommendation -> recommendation.getInternship().getTitle())
                        .toList());
        assertEquals(0.0, recommendations.get(1).getMatchPercentage());
        assertEquals(List.of(), recommendations.get(2).getMissingSkills());
    }

    private InternshipDto internship(String title, String skills) {
        return InternshipDto.builder()
                .title(title)
                .skills(skills)
                .build();
    }
}

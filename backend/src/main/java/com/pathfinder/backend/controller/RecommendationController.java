package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.RecommendationDto;
import com.pathfinder.backend.service.RecommendationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping
    public ResponseEntity<List<RecommendationDto>> getRecommendations(Authentication authentication) {
        return ResponseEntity.ok(recommendationService.getRecommendations(authentication.getName()));
    }
}

package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.MlBatchItemDto;
import com.pathfinder.backend.dto.MlBatchRankRequestDto;
import com.pathfinder.backend.dto.MlMatchRequestDto;
import com.pathfinder.backend.dto.MlMatchResponseDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;
import java.util.*;
import java.util.regex.Pattern;

@Service
public class MlMatchingService {

    private static final Logger log = LoggerFactory.getLogger(MlMatchingService.class);

    private final String mlServiceUrl;
    private final RestTemplate restTemplate;

    public MlMatchingService(
            @Value("${ml.service.url:http://localhost:8000}") String mlServiceUrl,
            RestTemplateBuilder restTemplateBuilder) {
        this.mlServiceUrl = mlServiceUrl != null && !mlServiceUrl.isBlank() ? mlServiceUrl : "http://localhost:8000";
        this.restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(3000))
                .setReadTimeout(Duration.ofMillis(3000))
                .build();
        log.info("Initialized MlMatchingService with ML service URL: {}", this.mlServiceUrl);
    }

    public MlMatchResponseDto predictMatch(MlMatchRequestDto request) {
        if (request == null) {
            request = new MlMatchRequestDto();
        }

        // 1. Attempt call to FastAPI ML Service with 3s timeout
        try {
            String targetUrl = mlServiceUrl.replaceAll("/+$", "") + "/predict-match";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<MlMatchRequestDto> entity = new HttpEntity<>(request, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(targetUrl, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();

                Double prob = parseDouble(body.get("shortlistProbability"), 50.0);
                Double sem = parseDouble(body.get("semanticScore"), 50.0);
                String fitCategory = body.get("fitCategory") != null ? body.get("fitCategory").toString() : "Moderate Fit";

                List<String> factors = parseStringList(body.get("topFactors"));
                if (factors.isEmpty()) {
                    factors = parseStringList(body.get("explanationFactors"));
                }
                List<String> matched = parseStringList(body.get("matchedSkills"));
                List<String> missing = parseStringList(body.get("missingSkills"));

                return MlMatchResponseDto.builder()
                        .shortlistProbability(prob)
                        .semanticScore(sem)
                        .fitCategory(fitCategory)
                        .explanationFactors(factors)
                        .modelSource("RandomForest + all-MiniLM-L6-v2 (ML Microservice)")
                        .matchedSkills(matched)
                        .missingSkills(missing)
                        .build();
            }
        } catch (Exception e) {
            log.info("ML Service unreachable or timed out at {}: {}. Executing deterministic fallback.", mlServiceUrl, e.getMessage());
        }

        // 2. Graceful deterministic fallback (never fails, never throws 500)
        return deterministicFallback(request);
    }

    public List<MlMatchResponseDto> rankBatch(MlBatchRankRequestDto batchRequest) {
        if (batchRequest == null || batchRequest.getItems() == null || batchRequest.getItems().isEmpty()) {
            return Collections.emptyList();
        }

        List<MlMatchResponseDto> results = new ArrayList<>();
        String baseCv = batchRequest.getCvText();

        for (MlBatchItemDto item : batchRequest.getItems()) {
            MlMatchRequestDto singleReq = new MlMatchRequestDto();

            if (item.getCandidateCvText() != null && !item.getCandidateCvText().isBlank()) {
                // Ranking applicants for an internship
                singleReq.setCvText(item.getCandidateCvText());
                singleReq.setJobTitle(batchRequest.getJobTitle());
                singleReq.setJobDescription(batchRequest.getJobDescription());
                singleReq.setRequiredSkills(batchRequest.getRequiredSkills());
            } else {
                // Ranking internships for a student CV
                singleReq.setCvText(baseCv);
                singleReq.setJobTitle(item.getTitle());
                singleReq.setJobDescription(item.getDescription());
                singleReq.setRequiredSkills(item.getSkills());
            }

            MlMatchResponseDto score = predictMatch(singleReq);
            score.setItemId(item.getId());
            results.add(score);
        }

        // Sort highest-to-lowest by shortlistProbability
        results.sort((a, b) -> Double.compare(
                b.getShortlistProbability() != null ? b.getShortlistProbability() : 0.0,
                a.getShortlistProbability() != null ? a.getShortlistProbability() : 0.0
        ));

        return results;
    }

    public MlMatchResponseDto deterministicFallback(MlMatchRequestDto request) {
        String cv = request.getCvText() != null ? request.getCvText().toLowerCase() : "";
        List<String> required = request.getRequiredSkills() != null ? request.getRequiredSkills() : Collections.emptyList();

        List<String> matched = new ArrayList<>();
        List<String> missing = new ArrayList<>();

        for (String skill : required) {
            if (skill == null || skill.isBlank()) continue;
            String trimmed = skill.trim();
            // Word boundary match
            String pattern = "\\b" + Pattern.quote(trimmed.toLowerCase()) + "\\b";
            if (Pattern.compile(pattern).matcher(cv).find()) {
                matched.add(trimmed);
            } else {
                missing.add(trimmed);
            }
        }

        int totalReq = required.size();
        double skillOverlapRatio = totalReq > 0 ? (double) matched.size() / totalReq : 0.65;

        // Context / completeness checks
        boolean hasProjects = cv.contains("project") || cv.contains("developed") || cv.contains("built") || cv.contains("github");
        boolean hasEducation = cv.contains("education") || cv.contains("university") || cv.contains("degree") || cv.contains("bachelor");
        boolean hasExperience = cv.contains("experience") || cv.contains("intern") || cv.contains("work");

        double semanticScore = 40.0 + (skillOverlapRatio * 45.0) + (hasProjects ? 6.0 : 0.0) + (hasExperience ? 5.0 : 0.0);
        semanticScore = Math.max(25.0, Math.min(96.0, semanticScore));

        double shortlistProb = (skillOverlapRatio * 52.0) + ((semanticScore / 100.0) * 32.0) + (hasProjects ? 10.0 : 4.0) + (hasEducation ? 6.0 : 2.0);
        shortlistProb = Math.max(10.0, Math.min(98.0, shortlistProb));

        String fitCategory;
        if (shortlistProb >= 75.0) {
            fitCategory = "Strong Fit";
        } else if (shortlistProb >= 50.0) {
            fitCategory = "Moderate Fit";
        } else {
            fitCategory = "Low Fit";
        }

        List<String> factors = new ArrayList<>();
        if (totalReq > 0) {
            int matchPct = (int) Math.round(skillOverlapRatio * 100);
            factors.add(String.format("Matched %d of %d required skills (%d%%)", matched.size(), totalReq, matchPct));
            if (!missing.isEmpty()) {
                factors.add("Missing core skills: " + String.join(", ", missing.subList(0, Math.min(3, missing.size()))));
            }
        }
        factors.add(String.format("Semantic skill match estimated at %d%%", (int) Math.round(semanticScore)));
        if (hasProjects) {
            factors.add("Practical hands-on projects identified in profile");
        }

        return MlMatchResponseDto.builder()
                .shortlistProbability(Math.round(shortlistProb * 10.0) / 10.0)
                .semanticScore(Math.round(semanticScore * 10.0) / 10.0)
                .fitCategory(fitCategory)
                .explanationFactors(factors)
                .modelSource("Deterministic Skill Match Engine (Fallback)")
                .matchedSkills(matched)
                .missingSkills(missing)
                .build();
    }

    private Double parseDouble(Object obj, Double defaultVal) {
        if (obj == null) return defaultVal;
        try {
            return Double.valueOf(obj.toString());
        } catch (Exception e) {
            return defaultVal;
        }
    }

    private List<String> parseStringList(Object obj) {
        if (obj instanceof List) {
            List<?> list = (List<?>) obj;
            return list.stream().filter(Objects::nonNull).map(Object::toString).collect(java.util.stream.Collectors.toList());
        }
        return Collections.emptyList();
    }
}

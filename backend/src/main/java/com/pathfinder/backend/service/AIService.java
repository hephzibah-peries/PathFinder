package com.pathfinder.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pathfinder.backend.dto.InterviewEvaluationDto;
import com.pathfinder.backend.dto.InterviewQuestionDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AIService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    /**
     * Generates a 5-question interview set:
     * - 3 Technical questions tailored to student skills
     * - 1 System / Scenario question based on candidate project experience
     * - 1 Behavioral / Problem-solving question
     */
    public List<InterviewQuestionDto> generateInterviewQuestions(String studentProfileJson, String targetRole) {
        if (geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.equals("YOUR_GEMINI_API_KEY")) {
            try {
                String prompt = buildQuestionGenerationPrompt(studentProfileJson, targetRole);
                String rawResponse = callGeminiApi(prompt);
                String cleanJson = extractJson(rawResponse);

                List<InterviewQuestionDto> questions = objectMapper.readValue(cleanJson, new TypeReference<List<InterviewQuestionDto>>() {});
                if (questions != null && questions.size() >= 5) {
                    return questions.subList(0, 5);
                }
            } catch (Exception ex) {
                log.warn("Gemini API question generation failed: {}. Falling back to dynamic heuristic generation.", ex.getMessage());
            }
        }
        return generateFallbackQuestions(studentProfileJson, targetRole);
    }

    /**
     * Evaluates a candidate's response for a given question returning technicalScore,
     * communicationClarity, modelAnswer, and constructiveFeedback.
     */
    public InterviewEvaluationDto evaluateInterviewResponse(String question, String candidateAnswer) {
        if (geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.equals("YOUR_GEMINI_API_KEY")) {
            try {
                String prompt = buildEvaluationPrompt(question, candidateAnswer);
                String rawResponse = callGeminiApi(prompt);
                String cleanJson = extractJson(rawResponse);

                InterviewEvaluationDto dto = objectMapper.readValue(cleanJson, InterviewEvaluationDto.class);
                if (dto != null) {
                    // Ensure bounds
                    dto.setTechnicalScore(Math.max(10, Math.min(100, dto.getTechnicalScore())));
                    dto.setCommunicationClarity(Math.max(10, Math.min(100, dto.getCommunicationClarity())));
                    return dto;
                }
            } catch (Exception ex) {
                log.warn("Gemini API answer evaluation failed: {}. Falling back to rule-based evaluation.", ex.getMessage());
            }
        }
        return evaluateFallbackResponse(question, candidateAnswer);
    }

    private String buildQuestionGenerationPrompt(String profileJson, String targetRole) {
        return """
            You are a Principal Tech Interviewer and Hiring Committee Member.
            Generate an exact structured set of 5 interview questions for a candidate:
            Target Role: %s
            Student Profile Information:
            %s

            Requirements:
            1. Exactly 3 TECHNICAL questions directly probing verified skills and core language/framework competencies.
            2. Exactly 1 SYSTEM_SCENARIO question presenting a real-world architectural design, scalability, or debugging scenario.
            3. Exactly 1 BEHAVIORAL question focused on situational problem solving, teamwork, or trade-off decisions using the STAR method.

            Respond with ONLY a valid JSON array matching this format:
            [
              {
                "id": 1,
                "question": "Specific technical question...",
                "type": "TECHNICAL",
                "focusArea": "Topic (e.g., Spring Boot Dependency Injection / React State)",
                "context": "Context rationale"
              },
              {
                "id": 2,
                "question": "...",
                "type": "TECHNICAL",
                "focusArea": "...",
                "context": "..."
              },
              {
                "id": 3,
                "question": "...",
                "type": "TECHNICAL",
                "focusArea": "...",
                "context": "..."
              },
              {
                "id": 4,
                "question": "System/Scenario design question...",
                "type": "SYSTEM_SCENARIO",
                "focusArea": "System Architecture & Resilience",
                "context": "Real-world production scenario"
              },
              {
                "id": 5,
                "question": "Behavioral question...",
                "type": "BEHAVIORAL",
                "focusArea": "Conflict Resolution & Collaboration",
                "context": "STAR situational inquiry"
              }
            ]
            """.formatted(targetRole != null ? targetRole : "Software Engineer Intern", profileJson);
    }

    private String buildEvaluationPrompt(String question, String candidateAnswer) {
        return """
            You are a Senior Technical Hiring Lead evaluating a candidate's mock interview response.
            Question:
            "%s"

            Candidate Answer:
            "%s"

            Evaluate the candidate's answer thoroughly and provide actionable, encouraging feedback.
            Return ONLY a valid JSON object matching this schema:
            {
              "technicalScore": <integer between 0 and 100>,
              "communicationClarity": <integer between 0 and 100>,
              "modelAnswer": "<An exemplary, industry-standard model response that covers all critical concepts>",
              "constructiveFeedback": "<Specific guidance detailing what was done well and exactly what to strengthen>",
              "keyStrengths": ["Strength 1", "Strength 2"]
            }
            """.formatted(question, candidateAnswer);
    }

    private String callGeminiApi(String prompt) throws Exception {
        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + geminiModel + ":generateContent?key=" + geminiApiKey;

        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> parts = Map.of("parts", List.of(textPart));
        Map<String, Object> requestPayload = Map.of(
                "contents", List.of(parts),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "responseMimeType", "application/json"
                )
        );

        String jsonPayload = objectMapper.writeValueAsString(requestPayload);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode textNode = root.path("candidates").get(0)
                    .path("content").path("parts").get(0).path("text");
            return textNode.asText();
        } else {
            throw new RuntimeException("Gemini API returned status " + response.statusCode() + ": " + response.body());
        }
    }

    private String extractJson(String rawText) {
        if (rawText == null) return "[]";
        String trimmed = rawText.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }

    private List<InterviewQuestionDto> generateFallbackQuestions(String profileJson, String targetRole) {
        String role = (targetRole != null && !targetRole.isBlank()) ? targetRole : "Software Engineering Intern";
        List<String> parsedSkills = extractSkillsFromProfile(profileJson);

        String skill1 = !parsedSkills.isEmpty() ? parsedSkills.get(0) : "Java / Spring Boot";
        String skill2 = parsedSkills.size() > 1 ? parsedSkills.get(1) : "REST APIs & Databases";
        String skill3 = parsedSkills.size() > 2 ? parsedSkills.get(2) : "Data Structures & Performance";

        List<InterviewQuestionDto> list = new ArrayList<>();

        list.add(new InterviewQuestionDto(
                1,
                "How does " + skill1 + " handle concurrency and state management in production applications, and what patterns do you apply to avoid memory leaks or thread starvation?",
                "TECHNICAL",
                skill1 + " Architecture",
                "Tailored to verified skill in " + skill1
        ));

        list.add(new InterviewQuestionDto(
                2,
                "When working with " + skill2 + ", how do you optimize database query efficiency, manage indexing strategies, and handle the N+1 select problem?",
                "TECHNICAL",
                skill2 + " & Data Persistence",
                "Tailored to verified skill in " + skill2
        ));

        list.add(new InterviewQuestionDto(
                3,
                "Explain the trade-offs between monolithic architectures and microservices. For a " + role + " role, how would you design authentication and service communication using JWT and API Gateways?",
                "TECHNICAL",
                "Microservices & Security",
                "Tailored to target role requirements: " + role
        ));

        list.add(new InterviewQuestionDto(
                4,
                "Scenario: Your application experiences a sudden 10x traffic spike during a peak recruitment drive, causing response latencies to degrade from 120ms to 4500ms. How would you systematically diagnose bottlenecks, apply caching (e.g. Redis), and scale the service gracefully?",
                "SYSTEM_SCENARIO",
                "High-Traffic System Resilience & Scalability",
                "Simulated real-world production incident"
        ));

        list.add(new InterviewQuestionDto(
                5,
                "Describe a situation where you had a disagreement with a team member or project lead regarding a technical decision or deadline. How did you communicate your reasoning, explore alternatives, and arrive at a consensus?",
                "BEHAVIORAL",
                "Collaboration & STAR Conflict Resolution",
                "Evaluates interpersonal maturity, team alignment, and emotional intelligence"
        ));

        return list;
    }

    private List<String> extractSkillsFromProfile(String profileJson) {
        List<String> skills = new ArrayList<>();
        if (profileJson == null || profileJson.isBlank()) {
            return List.of("Spring Boot", "React", "PostgreSQL", "Docker");
        }
        try {
            JsonNode node = objectMapper.readTree(profileJson);
            String rawSkills = node.path("skills").asText("");
            if (!rawSkills.isBlank()) {
                String[] tokens = rawSkills.split("[,;\\n]+");
                for (String t : tokens) {
                    String clean = t.strip();
                    if (!clean.isBlank() && !skills.contains(clean)) {
                        skills.add(clean);
                    }
                }
            }
        } catch (Exception ignored) {}

        if (skills.isEmpty()) {
            skills.addAll(List.of("Spring Boot", "React", "PostgreSQL", "Docker"));
        }
        return skills;
    }

    private InterviewEvaluationDto evaluateFallbackResponse(String question, String candidateAnswer) {
        if (candidateAnswer == null || candidateAnswer.strip().length() < 10) {
            return new InterviewEvaluationDto(
                    20,
                    25,
                    "A complete answer should address the core mechanics of the question, outline architectural trade-offs, and cite concrete technologies or methods.",
                    "Your answer is too brief or incomplete. Try detailing specific principles, architectural trade-offs, and concrete implementation examples.",
                    List.of("Prompt response provided")
            );
        }

        String lowerAnswer = candidateAnswer.toLowerCase(Locale.ROOT);
        int wordCount = candidateAnswer.trim().split("\\s+").length;

        int techScore = 65;
        int commScore = 70;

        List<String> keyTerms = List.of(
                "cache", "redis", "index", "thread", "connection", "scalab", "latency",
                "jwt", "security", "database", "spring", "react", "component", "async",
                "docker", "microservice", "transaction", "isolation", "rest", "api"
        );
        int matchedTerms = 0;
        for (String term : keyTerms) {
            if (lowerAnswer.contains(term)) matchedTerms++;
        }

        techScore += Math.min(25, matchedTerms * 5);
        if (wordCount >= 40) techScore += 5;
        if (wordCount >= 80) commScore += 10;
        if (wordCount < 20) {
            techScore = Math.max(30, techScore - 20);
            commScore = Math.max(35, commScore - 20);
        }

        techScore = Math.min(95, Math.max(35, techScore));
        commScore = Math.min(95, Math.max(40, commScore));

        String modelAnswer = "An exemplary answer directly addresses the problem by: 1) Defining the fundamental architecture or trade-off involved, 2) Explaining how key mechanisms operate in production (e.g., connection pools, caching layers, or thread management), and 3) Concluding with measurable outcomes such as latency reduction and fault tolerance.";

        String feedback = String.format(
                "You demonstrated a good fundamental grasp of the core concepts with %d technical key indicators identified. To reach a senior level, include concrete metric examples (e.g., target latency or throughput numbers) and discuss how you would test and monitor this in a staging/production pipeline.",
                matchedTerms
        );

        List<String> strengths = new ArrayList<>();
        if (matchedTerms >= 2) strengths.add("Solid technical vocabulary and concept recognition");
        if (wordCount >= 50) strengths.add("Comprehensive depth and structural elaboration");
        strengths.add("Clear logical flow and problem-oriented thinking");

        return new InterviewEvaluationDto(techScore, commScore, modelAnswer, feedback, strengths);
    }
}

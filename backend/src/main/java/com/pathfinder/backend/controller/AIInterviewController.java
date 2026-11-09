package com.pathfinder.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pathfinder.backend.dto.*;
import com.pathfinder.backend.service.AIService;
import com.pathfinder.backend.service.InternshipService;
import com.pathfinder.backend.service.InterviewSessionService;
import com.pathfinder.backend.service.StudentProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai/interview")
public class AIInterviewController {

    private final AIService aiService;
    private final StudentProfileService studentProfileService;
    private final InternshipService internshipService;
    private final InterviewSessionService sessionService;
    private final ObjectMapper objectMapper;

    public AIInterviewController(AIService aiService,
                                 StudentProfileService studentProfileService,
                                 InternshipService internshipService,
                                 InterviewSessionService sessionService,
                                 ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.studentProfileService = studentProfileService;
        this.internshipService = internshipService;
        this.sessionService = sessionService;
        this.objectMapper = objectMapper;
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<List<InterviewQuestionDto>> generateQuestions(
            Authentication authentication,
            @RequestBody(required = false) GenerateInterviewRequest request) {

        String email = authentication.getName();
        StudentProfileDto profile = studentProfileService.getProfileByEmail(email);

        String targetRole = (request != null && request.getTargetRole() != null && !request.getTargetRole().isBlank())
                ? request.getTargetRole()
                : "Software Engineering Intern";

        Map<String, Object> profileContext = new HashMap<>();
        if (profile != null) {
            profileContext.put("fullName", profile.getFullName());
            profileContext.put("university", profile.getUniversity());
            profileContext.put("skills", profile.getSkills());
            profileContext.put("bio", profile.getBio());
        }

        if (request != null && request.getInternshipId() != null) {
            try {
                InternshipDto internship = internshipService.getInternshipById(request.getInternshipId());
                if (internship != null) {
                    profileContext.put("internshipTitle", internship.getTitle());
                    profileContext.put("internshipRequirements", internship.getRequirements());
                    profileContext.put("internshipSkills", internship.getSkills());
                    if (targetRole.equals("Software Engineering Intern")) {
                        targetRole = internship.getTitle();
                    }
                }
            } catch (Exception ignored) {}
        }

        String profileJson = "{}";
        try {
            profileJson = objectMapper.writeValueAsString(profileContext);
        } catch (Exception ignored) {}

        List<InterviewQuestionDto> questions = aiService.generateInterviewQuestions(profileJson, targetRole);
        return ResponseEntity.ok(questions);
    }

    @PostMapping("/evaluate")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<InterviewEvaluationDto> evaluateResponse(
            Authentication authentication,
            @RequestBody EvaluateInterviewRequest request) {

        if (request == null || request.getQuestion() == null || request.getQuestion().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        String answer = request.getCandidateAnswer() != null ? request.getCandidateAnswer() : "";
        InterviewEvaluationDto evaluation = aiService.evaluateInterviewResponse(request.getQuestion(), answer);
        return ResponseEntity.ok(evaluation);
    }

    @PostMapping("/complete")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<InterviewSessionDto> completeSession(
            Authentication authentication,
            @RequestBody CompleteInterviewRequest request) {

        if (request == null) {
            return ResponseEntity.badRequest().build();
        }

        InterviewSessionDto session = sessionService.saveSession(authentication.getName(), request);
        return ResponseEntity.ok(session);
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<List<InterviewSessionDto>> getHistory(Authentication authentication) {
        return ResponseEntity.ok(sessionService.getStudentSessions(authentication.getName()));
    }
}

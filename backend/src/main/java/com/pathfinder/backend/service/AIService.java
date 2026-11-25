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
     * Generates a 5-question interview set tailored to candidate profile, target role, and chosen category.
     */
    public List<InterviewQuestionDto> generateInterviewQuestions(String studentProfileJson, String targetRole) {
        return generateInterviewQuestions(studentProfileJson, targetRole, "Technical Knowledge");
    }

    public List<InterviewQuestionDto> generateInterviewQuestions(String studentProfileJson, String targetRole, String questionCategory) {
        if (questionCategory == null || questionCategory.isBlank()) {
            questionCategory = "Technical Knowledge";
        }
        if (geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.equals("YOUR_GEMINI_API_KEY")) {
            try {
                String prompt = buildQuestionGenerationPrompt(studentProfileJson, targetRole, questionCategory);
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
        return generateFallbackQuestions(studentProfileJson, targetRole, questionCategory);
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

    private String determineQuestionType(String category) {
        if (category == null) return "TECHNICAL";
        return switch (category) {
            case "Situational & Scenario-Based Questions" -> "SYSTEM_SCENARIO";
            case "Communication & Behavioral Questions",
                 "Personal Introduction & Background",
                 "Company Knowledge & Motivation",
                 "Internship Availability & University Commitments",
                 "Learning Ability & Career Goals",
                 "Behavioral & Situational",
                 "Communication & Leadership" -> "BEHAVIORAL";
            default -> "TECHNICAL";
        };
    }

    private String buildQuestionGenerationPrompt(String profileJson, String targetRole, String questionCategory) {
        String role = (targetRole != null && !targetRole.isBlank()) ? targetRole : "Internship Candidate";
        String category = (questionCategory != null && !questionCategory.isBlank()) ? questionCategory : "Core Domain Knowledge";
        String qType = determineQuestionType(category);

        return """
            You are a Principal Industry Interviewer and Hiring Committee Member across engineering, business, finance, healthcare, design, marketing, HR, law, and science domains.
            Generate an exact structured set of 5 interview questions for a candidate:
            Target Role: %s
            Selected Question Category: %s
            Candidate Profile Information:
            %s

            CRITICAL DIRECTIVE:
            All 5 questions MUST be strictly, professionally, and deeply focused on the candidate's target role (%s) and chosen category: "%s".
            Adapt questions dynamically to the domain and industry standards of the target position (whether IT & Software, Engineering, Finance & Business, Healthcare & Life Sciences, Marketing & HR, Design & Media, Law, or Physical/Social Sciences).
            
            Category Guidelines:
            - "Personal Introduction & Background": Self-introduction, personal career journey into this profession, passions, core domain strengths, and motivations.
            - "Educational Background": University degree coursework, academic research, foundational principles of the discipline, and key theoretical learnings applied to the field.
            - "Technical Knowledge" / "Core Domain Knowledge": Domain-specific technical principles, tools, frameworks, industry standards, methodologies, and core analytical techniques relevant to %s.
            - "Programming & Problem-Solving" / "Practical Case Study & Problem Solving": Analytical reasoning, practical problem-solving, real-world case analysis, quantitative/qualitative evaluations, root-cause troubleshooting, and strategic solutions.
            - "Projects & Practical Experience": Hands-on projects, portfolio pieces, field work, lab research, or business initiatives; methods used, trade-offs made, and obstacles overcome.
            - "Company Knowledge & Motivation": Why this specific organization, understanding of industry domain, market ecosystem, culture fit, and long-term career drive.
            - "Communication & Behavioral Questions" / "Behavioral & Situational": Interpersonal collaboration, constructive conflict resolution, handling critical feedback, and teamwork in interdisciplinary environments (STAR format).
            - "Communication & Leadership": Explaining complex domain concepts clearly, cross-functional stakeholder presentation, project coordination, and empathy.
            - "Internship Availability & University Commitments": Time management, balancing university exams with internship deliverables, professional reliability, and full-time/hybrid commitment.
            - "Learning Ability & Career Goals": How candidate rapidly masters unfamiliar concepts/tools, adaptability, curiosity, and 1-3 year career aspirations.
            - "Situational & Scenario-Based Questions": Hypothetical workplace challenges, client/stakeholder requests, crisis or incident response, tight deadlines, and ambiguous specifications in this domain.

            Respond with ONLY a valid JSON array matching this format:
            [
              {
                "id": 1,
                "question": "First question specifically testing %s...",
                "type": "%s",
                "focusArea": "%s Focus",
                "context": "Context rationale"
              },
              {
                "id": 2,
                "question": "Second question specifically testing %s...",
                "type": "%s",
                "focusArea": "%s Focus",
                "context": "Context rationale"
              },
              {
                "id": 3,
                "question": "Third question specifically testing %s...",
                "type": "%s",
                "focusArea": "%s Focus",
                "context": "Context rationale"
              },
              {
                "id": 4,
                "question": "Fourth question specifically testing %s...",
                "type": "%s",
                "focusArea": "%s Focus",
                "context": "Context rationale"
              },
              {
                "id": 5,
                "question": "Fifth question specifically testing %s...",
                "type": "%s",
                "focusArea": "%s Focus",
                "context": "Context rationale"
              }
            ]
            """.formatted(role, category, profileJson, role, category, role, category, qType, category, category, qType, category, category, qType, category, category, qType, category, category, qType, category);
    }

    private String buildEvaluationPrompt(String question, String candidateAnswer) {
        return """
            You are a Senior Industry Hiring Lead and Expert Interviewer evaluating a candidate's mock interview response for their target field.
            Question:
            "%s"

            Candidate Answer:
            "%s"

            Evaluate the candidate's answer thoroughly and provide actionable, encouraging feedback tailored to their field (IT, Engineering, Business, Finance, Healthcare, Design, Marketing, etc.).
            Return ONLY a valid JSON object matching this schema:
            {
              "technicalScore": <integer between 0 and 100 representing domain technical/practical accuracy>,
              "communicationClarity": <integer between 0 and 100>,
              "modelAnswer": "<An exemplary, industry-standard model response that covers all critical concepts and best practices>",
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
        return generateFallbackQuestions(profileJson, targetRole, "Technical Knowledge");
    }

    private List<InterviewQuestionDto> generateFallbackQuestions(String profileJson, String targetRole, String questionCategory) {
        String role = (targetRole != null && !targetRole.isBlank()) ? targetRole : "Software Engineering Intern";
        String category = (questionCategory != null && !questionCategory.isBlank()) ? questionCategory : "Technical Knowledge";
        List<String> parsedSkills = extractSkillsFromProfile(profileJson);

        String skill1 = !parsedSkills.isEmpty() ? parsedSkills.get(0) : "Java / Spring Boot";
        String skill2 = parsedSkills.size() > 1 ? parsedSkills.get(1) : "REST APIs & Databases";
        String skill3 = parsedSkills.size() > 2 ? parsedSkills.get(2) : "Data Structures & Performance";

        List<InterviewQuestionDto> list = new ArrayList<>();

        switch (category) {
            case "Core Domain Knowledge" -> {
                list.add(new InterviewQuestionDto(1, "What core methodologies, tools, and industry standards are most essential when executing responsibilities as a " + role + "?", "TECHNICAL", "Core Methodologies & Standards", "Tailored to target role: " + role));
                list.add(new InterviewQuestionDto(2, "When applying " + skill1 + " in practical scenarios, how do you ensure quality, accuracy, and compliance with best practices?", "TECHNICAL", skill1 + " Best Practices", "Evaluates practical domain proficiency"));
                list.add(new InterviewQuestionDto(3, "How do you evaluate and integrate " + skill2 + " into your project workflows to maximize efficiency and outcomes?", "TECHNICAL", skill2 + " Workflow Integration", "Tests tools and systems mastery"));
                list.add(new InterviewQuestionDto(4, "What emerging innovations or industry shifts are currently transforming the " + role + " landscape, and how do you prepare for them?", "TECHNICAL", "Industry Trends & Innovation", "Assesses forward-looking awareness"));
                list.add(new InterviewQuestionDto(5, "How do you systematically identify and mitigate risks or errors when delivering critical work in " + role + "?", "TECHNICAL", "Risk Mitigation & Quality Control", "Tests professional rigor and dependability"));
            }
            case "Practical Case Study & Problem Solving" -> {
                list.add(new InterviewQuestionDto(1, "Describe a complex problem or project challenge you faced in your studies or experience. How did you structure your analysis to find the solution?", "TECHNICAL", "Problem Structuring & Root Cause", "Evaluates analytical methodology"));
                list.add(new InterviewQuestionDto(2, "When project constraints (time, budget, or resources) limit your options, what framework do you use to make optimal trade-offs?", "TECHNICAL", "Resource Constraints & Trade-offs", "Assesses pragmatic decision-making"));
                list.add(new InterviewQuestionDto(3, "Walk us through a time you analyzed data or qualitative evidence to recommend a concrete course of action.", "TECHNICAL", "Evidence-Based Decision Making", "Tests data-informed reasoning"));
                list.add(new InterviewQuestionDto(4, "How do you approach a project when requirements are ambiguous or critical information is missing?", "TECHNICAL", "Ambiguity Resolution", "Evaluates independence and problem framing"));
                list.add(new InterviewQuestionDto(5, "Tell us about a time an initial solution failed. How did you diagnose what went wrong and pivot effectively?", "TECHNICAL", "Resilience & Iterative Solution", "Tests diagnostic insight and adaptability"));
            }
            case "Behavioral & Situational" -> {
                list.add(new InterviewQuestionDto(1, "Tell us about a time you worked in a team where members held contrasting viewpoints. How did you build consensus and deliver results?", "BEHAVIORAL", "Conflict Resolution & Collaboration", "Evaluates interpersonal maturity (STAR format)"));
                list.add(new InterviewQuestionDto(2, "Scenario: An unexpected priority shift occurs right before a major project milestone. How do you triage your workload and communicate with leads?", "BEHAVIORAL", "Adaptability Under Pressure", "Tests poise and prioritization"));
                list.add(new InterviewQuestionDto(3, "Describe a situation where you received constructive criticism. How did you incorporate that feedback into your work?", "BEHAVIORAL", "Coachability & Growth Mindset", "Assesses self-awareness and receptiveness"));
                list.add(new InterviewQuestionDto(4, "Tell us about an initiative where you took ownership beyond your assigned responsibilities to ensure project success.", "BEHAVIORAL", "Ownership & Initiative", "Evaluates proactive commitment"));
                list.add(new InterviewQuestionDto(5, "Scenario: You notice an ethical concern, compliance issue, or quality lapse in a deliverable. How would you handle and escalate it?", "BEHAVIORAL", "Professional Ethics & Integrity", "Tests accountability and judgment"));
            }
            case "Communication & Leadership" -> {
                list.add(new InterviewQuestionDto(1, "How do you tailor your communication style when explaining complex technical or domain concepts to diverse stakeholders?", "BEHAVIORAL", "Stakeholder Communication", "Tests communication adaptability"));
                list.add(new InterviewQuestionDto(2, "Describe an instance where you motivated teammates or coordinated project milestones to achieve a shared goal.", "BEHAVIORAL", "Collaborative Leadership", "Evaluates influence without authority"));
                list.add(new InterviewQuestionDto(3, "How do you ensure transparency, active listening, and alignment across team members during fast-paced projects?", "BEHAVIORAL", "Active Listening & Alignment", "Tests empathetic leadership"));
                list.add(new InterviewQuestionDto(4, "When leading a discussion where opinions are divided, how do you facilitate constructive dialogue and reach a decision?", "BEHAVIORAL", "Facilitation & Consensus", "Evaluates decision leadership"));
                list.add(new InterviewQuestionDto(5, "What communication habits do you rely on to keep mentors, supervisors, and collaborators updated without micromanagement?", "BEHAVIORAL", "Proactive Status Reporting", "Tests professional cadence and clarity"));
            }
            case "Personal Introduction & Background" -> {
                list.add(new InterviewQuestionDto(1, "Could you walk us through your background, your journey into software engineering, and why you are interested in the " + role + " position?", "BEHAVIORAL", "Self-Introduction & Career Story", "Assesses communication clarity and personal narrative"));
                list.add(new InterviewQuestionDto(2, "What sparked your passion for technology, and what specific engineering problems excite you most?", "BEHAVIORAL", "Engineering Passion & Drive", "Evaluates intrinsic developer curiosity"));
                list.add(new InterviewQuestionDto(3, "What do you consider your greatest personal technical strength, and what is one area of development you are actively improving?", "BEHAVIORAL", "Self-Awareness & Growth Mindset", "Assesses self-reflection and candidness"));
                list.add(new InterviewQuestionDto(4, "How do you maintain focus, discipline, and curiosity when tackling ambiguous or difficult engineering tasks?", "BEHAVIORAL", "Resilience & Work Ethic", "Evaluates persistence and daily work habits"));
                list.add(new InterviewQuestionDto(5, "Outside of university coursework, how do you express your interest in technology and software craft?", "BEHAVIORAL", "Extracurricular Initiative", "Identifies proactive side projects and continuous learning"));
            }
            case "Educational Background" -> {
                list.add(new InterviewQuestionDto(1, "How has your university degree program prepared you for the practical day-to-day challenges of a " + role + "?", "TECHNICAL", "Academic Foundation & Core Principles", "Assesses theoretical grounding"));
                list.add(new InterviewQuestionDto(2, "Which university computer science course (e.g. Data Structures, OS, Database Systems, Networks) challenged you the most and why?", "TECHNICAL", "Coursework Rigor", "Evaluates ability to master challenging academic material"));
                list.add(new InterviewQuestionDto(3, "Describe an academic lab assignment or capstone project where you applied theory to build working software.", "TECHNICAL", "Applied Academic Knowledge", "Bridges university theory with software implementation"));
                list.add(new InterviewQuestionDto(4, "How do you bridge the gap between academic theory (e.g. algorithm design) and pragmatic software engineering trade-offs?", "TECHNICAL", "Theory vs. Practice", "Assesses engineering pragmatism"));
                list.add(new InterviewQuestionDto(5, "What academic research, paper, or technology topic has caught your attention recently, and how does it relate to " + role + "?", "TECHNICAL", "Academic Curiosity", "Assesses depth of intellectual engagement"));
            }
            case "Programming & Problem-Solving" -> {
                list.add(new InterviewQuestionDto(1, "Walk us through how you analyze the time and space complexity (Big-O) of an algorithm before writing the implementation.", "TECHNICAL", "Algorithmic Complexity & Big-O", "Evaluates analytical rigor"));
                list.add(new InterviewQuestionDto(2, "Describe a time you encountered a complex runtime bug (such as a concurrency issue or memory leak). How did you systematically debug it?", "TECHNICAL", "Systematic Root-Cause Debugging", "Assesses debugging methodology"));
                list.add(new InterviewQuestionDto(3, "When choosing between different data structures (e.g. HashMaps vs. Trees vs. Linked Lists), what performance factors guide your decision?", "TECHNICAL", "Data Structure Selection", "Tests core computer science foundations"));
                list.add(new InterviewQuestionDto(4, "How do you approach solving a problem when requirements are ambiguous or constraints are incomplete?", "TECHNICAL", "Ambiguity Resolution", "Evaluates boundary condition identification"));
                list.add(new InterviewQuestionDto(5, "How do you approach refactoring complex legacy code to improve readability and maintainability without introducing regressions?", "TECHNICAL", "Code Refactoring & Unit Testing", "Assesses software quality discipline"));
            }
            case "Projects & Practical Experience" -> {
                list.add(new InterviewQuestionDto(1, "Tell us about a software project you built that you are proud of. What was the overarching architecture, and why did you choose that tech stack?", "TECHNICAL", "System Architecture & Design", "Evaluates project ownership and architectural decisions"));
                list.add(new InterviewQuestionDto(2, "What was the most challenging technical roadblock you encountered in your projects, and how did you resolve it?", "TECHNICAL", "Technical Obstacle Resolution", "Assesses problem-solving in real projects"));
                list.add(new InterviewQuestionDto(3, "How did you design the database schema and handle data relationships or migrations in your application?", "TECHNICAL", "Database Modeling & Persistence", "Evaluates data layer design capabilities"));
                list.add(new InterviewQuestionDto(4, "What testing strategies (unit, integration, or end-to-end) and CI/CD tools did you configure for your project?", "TECHNICAL", "Testing & Continuous Integration", "Tests software delivery lifecycle awareness"));
                list.add(new InterviewQuestionDto(5, "If you had the opportunity to rebuild one of your past projects from scratch, what architectural choices would you do differently?", "TECHNICAL", "Retrospective Analysis & Architecture", "Tests ability to reflect and learn from mistakes"));
            }
            case "Company Knowledge & Motivation" -> {
                list.add(new InterviewQuestionDto(1, "What specifically drew your attention to our engineering team, and why do you want to intern here as a " + role + "?", "BEHAVIORAL", "Company Alignment & Motivation", "Assesses research and authentic motivation"));
                list.add(new InterviewQuestionDto(2, "What do you know about our core product domain and technology ecosystem, and which area are you most excited to contribute to?", "BEHAVIORAL", "Product & Domain Knowledge", "Tests candidate preparation and domain interest"));
                list.add(new InterviewQuestionDto(3, "How does our engineering culture and commitment to high-quality code align with your personal development goals?", "BEHAVIORAL", "Culture & Values Fit", "Evaluates mutual alignment and team harmony"));
                list.add(new InterviewQuestionDto(4, "What major industry trends do you see impacting our software products over the next 2-3 years?", "BEHAVIORAL", "Industry Foresight & Vision", "Evaluates big-picture understanding"));
                list.add(new InterviewQuestionDto(5, "What specific impact or milestone do you hope to accomplish by the end of your internship with us?", "BEHAVIORAL", "Internship Objectives & Impact", "Tests goal-setting and ambition"));
            }
            case "Communication & Behavioral Questions" -> {
                list.add(new InterviewQuestionDto(1, "Describe a situation where you had a disagreement with a peer or team member regarding a technical decision. How did you arrive at consensus?", "BEHAVIORAL", "Constructive Conflict Resolution (STAR)", "Evaluates interpersonal maturity and teamwork"));
                list.add(new InterviewQuestionDto(2, "Tell me about a time you received critical or negative feedback during a code review. How did you react and what changes did you implement?", "BEHAVIORAL", "Receptiveness to Feedback", "Tests ego management and coachability"));
                list.add(new InterviewQuestionDto(3, "How do you explain a complex technical bug or architecture constraint to a non-technical stakeholder or client?", "BEHAVIORAL", "Cross-Functional Communication", "Tests clarity and empathy in communication"));
                list.add(new InterviewQuestionDto(4, "Describe an instance where a project fell behind schedule. How did you communicate the delay and help the team recover?", "BEHAVIORAL", "Accountability & Crisis Management", "Assesses ownership under pressure"));
                list.add(new InterviewQuestionDto(5, "Tell me about a time you had to collaborate with teammates who had different skill levels or perspectives. How did you ensure success?", "BEHAVIORAL", "Team Inclusivity & Collaboration", "Evaluates teamwork in diverse groups"));
            }
            case "Internship Availability & University Commitments" -> {
                list.add(new InterviewQuestionDto(1, "What is your current university schedule and upcoming exam period, and how will you ensure dedicated commitment to this internship?", "BEHAVIORAL", "Schedule Management & Availability", "Clarifies academic timing and work hours"));
                list.add(new InterviewQuestionDto(2, "How do you manage your time when high-stakes academic deadlines coincide with urgent sprint deliverables?", "BEHAVIORAL", "Time Prioritization Under Pressure", "Tests self-discipline and stress management"));
                list.add(new InterviewQuestionDto(3, "Are you available for the full internship duration (e.g. 6 months full-time or hybrid), and are there any academic constraints we should plan for?", "BEHAVIORAL", "Contractual Availability", "Confirms duration and attendance feasibility"));
                list.add(new InterviewQuestionDto(4, "In a hybrid or remote working arrangement, how do you proactively maintain clear daily communication with your lead and mentor?", "BEHAVIORAL", "Remote Work Accountability", "Assesses communication cadence and autonomy"));
                list.add(new InterviewQuestionDto(5, "If an unexpected university conflict arises during a sprint release, what steps would you take to inform your team in advance?", "BEHAVIORAL", "Proactive Responsibility", "Tests professional workplace etiquette"));
            }
            case "Learning Ability & Career Goals" -> {
                list.add(new InterviewQuestionDto(1, "Tell us about a time you had to learn an unfamiliar programming language or framework under a tight deadline. How did you ramp up quickly?", "BEHAVIORAL", "Fast Learning & Self-Teaching", "Assesses learning agility"));
                list.add(new InterviewQuestionDto(2, "What are your specific technical milestones and career goals over the next 1 to 2 years?", "BEHAVIORAL", "Career Vision & Milestones", "Evaluates ambition and direction"));
                list.add(new InterviewQuestionDto(3, "Which emerging technologies or tools are you currently exploring on your own time, and how do you experiment with them?", "BEHAVIORAL", "Continuous Learning & Curiosity", "Identifies self-driven tech enthusiasm"));
                list.add(new InterviewQuestionDto(4, "Describe a situation where a requirement pushed you far outside your comfort zone. How did you adapt and deliver?", "BEHAVIORAL", "Adaptability & Resilience", "Tests adaptability to new environments"));
                list.add(new InterviewQuestionDto(5, "What kind of mentorship, guidance, and feedback environment helps you perform at your best?", "BEHAVIORAL", "Mentorship Alignment", "Helps matching with senior mentors"));
            }
            case "Situational & Scenario-Based Questions" -> {
                list.add(new InterviewQuestionDto(1, "Scenario: You deploy an update to a production service, and error rates immediately jump to 15%. What are your first steps to triage and stabilize the system?", "SYSTEM_SCENARIO", "Production Incident Response", "Tests incident handling and composure"));
                list.add(new InterviewQuestionDto(2, "Scenario: Halfway through a two-week sprint, a major product requirement changes, invalidating part of your code. How do you respond and reprioritize?", "SYSTEM_SCENARIO", "Agile Requirement Pivot", "Tests flexibility and pragmatism"));
                list.add(new InterviewQuestionDto(3, "Scenario: You discover an undocumented security vulnerability or hardcoded credential in a repository right before release. What is your immediate course of action?", "SYSTEM_SCENARIO", "Security Incident & Ethics", "Tests integrity and escalation protocol"));
                list.add(new InterviewQuestionDto(4, "Scenario: You are blocked on an essential API integration and the responsible team member is unavailable. How do you keep making progress?", "SYSTEM_SCENARIO", "Unblocking Development & Mocking", "Tests initiative and problem unblocking"));
                list.add(new InterviewQuestionDto(5, "Scenario: Your backend service experiences intermittent database connection timeouts during peak traffic. How would you systematically diagnose and resolve the issue?", "SYSTEM_SCENARIO", "Database Bottleneck Diagnosis", "Assesses backend troubleshooting acumen"));
            }
            default -> { // Technical Knowledge
                list.add(new InterviewQuestionDto(1, "How does " + skill1 + " handle concurrency, memory management, and thread safety in production applications?", "TECHNICAL", skill1 + " Architecture", "Tailored to target role: " + role));
                list.add(new InterviewQuestionDto(2, "When building with " + skill2 + ", how do you optimize database query performance, structure indexes, and avoid the N+1 query problem?", "TECHNICAL", skill2 + " & Data Persistence", "Tailored to core database skills"));
                list.add(new InterviewQuestionDto(3, "Explain the trade-offs between monolithic architectures and microservices. How would you design secure inter-service communication using JWTs and API gateways?", "TECHNICAL", "Microservices & Distributed Systems", "Tailored to target role: " + role));
                list.add(new InterviewQuestionDto(4, "How do you design RESTful APIs for idempotency, robust error handling, and backward compatibility in evolving distributed systems?", "TECHNICAL", "RESTful API Standards", "Tests API design excellence"));
                list.add(new InterviewQuestionDto(5, "What caching strategies (e.g. Cache-Aside, Write-Through) would you use with Redis to reduce database read pressure while avoiding stale data?", "TECHNICAL", "Distributed Caching & Redis", "Assesses high-throughput scaling skills"));
            }
        }

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
                "analysis", "design", "method", "process", "framework", "result", "metric",
                "strategy", "data", "system", "quality", "collaborat", "objective", "implement",
                "solution", "research", "compliance", "stakeholder", "performance", "optim",
                "cache", "redis", "database", "spring", "react", "docker", "api", "model", "test"
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

        String modelAnswer = "An exemplary response directly addresses the problem by: 1) Defining the fundamental principles or domain mechanisms involved, 2) Explaining how methodologies or tools operate in real-world scenarios, and 3) Concluding with measurable outcomes, quality control, or trade-off evaluation.";

        String feedback = String.format(
                "You demonstrated a solid understanding of the core concepts with %d key domain indicators identified. To further elevate your response, incorporate concrete metrics, real-world case examples, and discuss how you validate outcomes or manage trade-offs in practice.",
                matchedTerms
        );

        List<String> strengths = new ArrayList<>();
        if (matchedTerms >= 2) strengths.add("Solid domain vocabulary and concept recognition");
        if (wordCount >= 50) strengths.add("Comprehensive depth and structural elaboration");
        strengths.add("Clear logical flow and problem-oriented thinking");

        return new InterviewEvaluationDto(techScore, commScore, modelAnswer, feedback, strengths);
    }
}

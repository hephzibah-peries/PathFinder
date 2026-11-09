package com.pathfinder.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_sessions")
public class InterviewSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "student_email", nullable = false)
    private String studentEmail;

    @Column(name = "target_role", nullable = false)
    private String targetRole;

    @Column(name = "overall_score")
    private Double overallScore;

    @Column(name = "technical_average")
    private Double technicalAverage;

    @Column(name = "communication_average")
    private Double communicationAverage;

    @Column(name = "qa_breakdown_json", columnDefinition = "TEXT")
    private String qaBreakdownJson;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public InterviewSession() {}

    public InterviewSession(Long id, Long studentId, String studentEmail, String targetRole,
                            Double overallScore, Double technicalAverage, Double communicationAverage,
                            String qaBreakdownJson, LocalDateTime createdAt) {
        this.id = id;
        this.studentId = studentId;
        this.studentEmail = studentEmail;
        this.targetRole = targetRole;
        this.overallScore = overallScore;
        this.technicalAverage = technicalAverage;
        this.communicationAverage = communicationAverage;
        this.qaBreakdownJson = qaBreakdownJson;
        this.createdAt = createdAt;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    public Double getOverallScore() { return overallScore; }
    public void setOverallScore(Double overallScore) { this.overallScore = overallScore; }
    public Double getTechnicalAverage() { return technicalAverage; }
    public void setTechnicalAverage(Double technicalAverage) { this.technicalAverage = technicalAverage; }
    public Double getCommunicationAverage() { return communicationAverage; }
    public void setCommunicationAverage(Double communicationAverage) { this.communicationAverage = communicationAverage; }
    public String getQaBreakdownJson() { return qaBreakdownJson; }
    public void setQaBreakdownJson(String qaBreakdownJson) { this.qaBreakdownJson = qaBreakdownJson; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long studentId;
        private String studentEmail;
        private String targetRole;
        private Double overallScore;
        private Double technicalAverage;
        private Double communicationAverage;
        private String qaBreakdownJson;
        private LocalDateTime createdAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder studentId(Long studentId) { this.studentId = studentId; return this; }
        public Builder studentEmail(String studentEmail) { this.studentEmail = studentEmail; return this; }
        public Builder targetRole(String targetRole) { this.targetRole = targetRole; return this; }
        public Builder overallScore(Double overallScore) { this.overallScore = overallScore; return this; }
        public Builder technicalAverage(Double technicalAverage) { this.technicalAverage = technicalAverage; return this; }
        public Builder communicationAverage(Double communicationAverage) { this.communicationAverage = communicationAverage; return this; }
        public Builder qaBreakdownJson(String qaBreakdownJson) { this.qaBreakdownJson = qaBreakdownJson; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }

        public InterviewSession build() {
            return new InterviewSession(id, studentId, studentEmail, targetRole, overallScore,
                    technicalAverage, communicationAverage, qaBreakdownJson, createdAt);
        }
    }
}

package com.pathfinder.backend.dto;

import java.time.LocalDateTime;

public class InterviewSessionDto {
    private Long id;
    private Long studentId;
    private String studentEmail;
    private String targetRole;
    private Double overallScore;
    private Double technicalAverage;
    private Double communicationAverage;
    private String qaBreakdownJson;
    private LocalDateTime createdAt;

    public InterviewSessionDto() {}

    public InterviewSessionDto(Long id, Long studentId, String studentEmail, String targetRole,
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

        public InterviewSessionDto build() {
            return new InterviewSessionDto(id, studentId, studentEmail, targetRole, overallScore,
                    technicalAverage, communicationAverage, qaBreakdownJson, createdAt);
        }
    }
}

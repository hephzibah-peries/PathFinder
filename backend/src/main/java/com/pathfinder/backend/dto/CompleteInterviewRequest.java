package com.pathfinder.backend.dto;

import java.util.List;
import java.util.Map;

public class CompleteInterviewRequest {
    private String targetRole;
    private Double overallScore;
    private Double technicalAverage;
    private Double communicationAverage;
    private List<Map<String, Object>> qaBreakdown;

    public CompleteInterviewRequest() {}

    public CompleteInterviewRequest(String targetRole, Double overallScore, Double technicalAverage,
                                    Double communicationAverage, List<Map<String, Object>> qaBreakdown) {
        this.targetRole = targetRole;
        this.overallScore = overallScore;
        this.technicalAverage = technicalAverage;
        this.communicationAverage = communicationAverage;
        this.qaBreakdown = qaBreakdown;
    }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    public Double getOverallScore() { return overallScore; }
    public void setOverallScore(Double overallScore) { this.overallScore = overallScore; }
    public Double getTechnicalAverage() { return technicalAverage; }
    public void setTechnicalAverage(Double technicalAverage) { this.technicalAverage = technicalAverage; }
    public Double getCommunicationAverage() { return communicationAverage; }
    public void setCommunicationAverage(Double communicationAverage) { this.communicationAverage = communicationAverage; }
    public List<Map<String, Object>> getQaBreakdown() { return qaBreakdown; }
    public void setQaBreakdown(List<Map<String, Object>> qaBreakdown) { this.qaBreakdown = qaBreakdown; }
}

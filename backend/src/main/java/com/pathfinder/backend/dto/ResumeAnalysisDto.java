package com.pathfinder.backend.dto;

import java.util.List;

public class ResumeAnalysisDto {
    private String extractedText;
    private List<String> extractedSkills;
    private List<String> missingSkills;
    private double matchScore;

    public ResumeAnalysisDto() {
    }

    public ResumeAnalysisDto(String extractedText, List<String> extractedSkills,
                             List<String> missingSkills, double matchScore) {
        this.extractedText = extractedText;
        this.extractedSkills = extractedSkills;
        this.missingSkills = missingSkills;
        this.matchScore = matchScore;
    }

    public String getExtractedText() {
        return extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }

    public List<String> getExtractedSkills() {
        return extractedSkills;
    }

    public void setExtractedSkills(List<String> extractedSkills) {
        this.extractedSkills = extractedSkills;
    }

    public List<String> getMissingSkills() {
        return missingSkills;
    }

    public void setMissingSkills(List<String> missingSkills) {
        this.missingSkills = missingSkills;
    }

    public double getMatchScore() {
        return matchScore;
    }

    public void setMatchScore(double matchScore) {
        this.matchScore = matchScore;
    }
}

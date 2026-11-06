package com.pathfinder.backend.dto;

import java.util.List;

public class RecommendationDto {
    private InternshipDto internship;
    private double matchPercentage;
    private List<String> matchedSkills;
    private List<String> missingSkills;

    public RecommendationDto() {
    }

    public RecommendationDto(InternshipDto internship, double matchPercentage,
                            List<String> matchedSkills, List<String> missingSkills) {
        this.internship = internship;
        this.matchPercentage = matchPercentage;
        this.matchedSkills = matchedSkills;
        this.missingSkills = missingSkills;
    }

    public InternshipDto getInternship() { return internship; }
    public void setInternship(InternshipDto internship) { this.internship = internship; }
    public double getMatchPercentage() { return matchPercentage; }
    public void setMatchPercentage(double matchPercentage) { this.matchPercentage = matchPercentage; }
    public List<String> getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills; }
    public List<String> getMissingSkills() { return missingSkills; }
    public void setMissingSkills(List<String> missingSkills) { this.missingSkills = missingSkills; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private InternshipDto internship;
        private double matchPercentage;
        private List<String> matchedSkills;
        private List<String> missingSkills;

        public Builder internship(InternshipDto internship) { this.internship = internship; return this; }
        public Builder matchPercentage(double matchPercentage) { this.matchPercentage = matchPercentage; return this; }
        public Builder matchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills; return this; }
        public Builder missingSkills(List<String> missingSkills) { this.missingSkills = missingSkills; return this; }
        public RecommendationDto build() {
            return new RecommendationDto(internship, matchPercentage, matchedSkills, missingSkills);
        }
    }
}

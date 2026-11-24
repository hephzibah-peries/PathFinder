package com.pathfinder.backend.dto;

import java.util.List;

public class SkillDiagnosisResponse {
    private String targetRole;
    private String resumeFileName;
    private int matchScore;
    private List<String> matchedSkills;
    private List<String> missingSkills;
    private List<RoadmapStepDto> roadmap;

    public SkillDiagnosisResponse() {
    }

    public SkillDiagnosisResponse(String targetRole, String resumeFileName, int matchScore,
                                  List<String> matchedSkills, List<String> missingSkills,
                                  List<RoadmapStepDto> roadmap) {
        this.targetRole = targetRole;
        this.resumeFileName = resumeFileName;
        this.matchScore = matchScore;
        this.matchedSkills = matchedSkills;
        this.missingSkills = missingSkills;
        this.roadmap = roadmap;
    }

    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    public String getResumeFileName() { return resumeFileName; }
    public void setResumeFileName(String resumeFileName) { this.resumeFileName = resumeFileName; }
    public int getMatchScore() { return matchScore; }
    public void setMatchScore(int matchScore) { this.matchScore = matchScore; }
    public List<String> getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills; }
    public List<String> getMissingSkills() { return missingSkills; }
    public void setMissingSkills(List<String> missingSkills) { this.missingSkills = missingSkills; }
    public List<RoadmapStepDto> getRoadmap() { return roadmap; }
    public void setRoadmap(List<RoadmapStepDto> roadmap) { this.roadmap = roadmap; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String targetRole;
        private String resumeFileName;
        private int matchScore;
        private List<String> matchedSkills;
        private List<String> missingSkills;
        private List<RoadmapStepDto> roadmap;

        public Builder targetRole(String targetRole) { this.targetRole = targetRole; return this; }
        public Builder resumeFileName(String resumeFileName) { this.resumeFileName = resumeFileName; return this; }
        public Builder matchScore(int matchScore) { this.matchScore = matchScore; return this; }
        public Builder matchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills; return this; }
        public Builder missingSkills(List<String> missingSkills) { this.missingSkills = missingSkills; return this; }
        public Builder roadmap(List<RoadmapStepDto> roadmap) { this.roadmap = roadmap; return this; }

        public SkillDiagnosisResponse build() {
            return new SkillDiagnosisResponse(targetRole, resumeFileName, matchScore, matchedSkills, missingSkills, roadmap);
        }
    }
}

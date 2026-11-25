package com.pathfinder.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class MlMatchResponseDto {
    private Long itemId;
    private Double shortlistProbability;
    private Double semanticScore;
    private String fitCategory;
    private List<String> explanationFactors = new ArrayList<>();
    private String modelSource;
    private List<String> matchedSkills = new ArrayList<>();
    private List<String> missingSkills = new ArrayList<>();

    public MlMatchResponseDto() {
    }

    public MlMatchResponseDto(Long itemId, Double shortlistProbability, Double semanticScore, String fitCategory,
                              List<String> explanationFactors, String modelSource, List<String> matchedSkills,
                              List<String> missingSkills) {
        this.itemId = itemId;
        this.shortlistProbability = shortlistProbability;
        this.semanticScore = semanticScore;
        this.fitCategory = fitCategory;
        this.explanationFactors = explanationFactors != null ? explanationFactors : new ArrayList<>();
        this.modelSource = modelSource;
        this.matchedSkills = matchedSkills != null ? matchedSkills : new ArrayList<>();
        this.missingSkills = missingSkills != null ? missingSkills : new ArrayList<>();
    }

    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public Double getShortlistProbability() { return shortlistProbability; }
    public void setShortlistProbability(Double shortlistProbability) { this.shortlistProbability = shortlistProbability; }
    public Double getSemanticScore() { return semanticScore; }
    public void setSemanticScore(Double semanticScore) { this.semanticScore = semanticScore; }
    public String getFitCategory() { return fitCategory; }
    public void setFitCategory(String fitCategory) { this.fitCategory = fitCategory; }
    public List<String> getExplanationFactors() { return explanationFactors; }
    public void setExplanationFactors(List<String> explanationFactors) { this.explanationFactors = explanationFactors != null ? explanationFactors : new ArrayList<>(); }
    public String getModelSource() { return modelSource; }
    public void setModelSource(String modelSource) { this.modelSource = modelSource; }
    public List<String> getMatchedSkills() { return matchedSkills; }
    public void setMatchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills != null ? matchedSkills : new ArrayList<>(); }
    public List<String> getMissingSkills() { return missingSkills; }
    public void setMissingSkills(List<String> missingSkills) { this.missingSkills = missingSkills != null ? missingSkills : new ArrayList<>(); }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long itemId;
        private Double shortlistProbability;
        private Double semanticScore;
        private String fitCategory;
        private List<String> explanationFactors = new ArrayList<>();
        private String modelSource;
        private List<String> matchedSkills = new ArrayList<>();
        private List<String> missingSkills = new ArrayList<>();

        public Builder itemId(Long itemId) { this.itemId = itemId; return this; }
        public Builder shortlistProbability(Double shortlistProbability) { this.shortlistProbability = shortlistProbability; return this; }
        public Builder semanticScore(Double semanticScore) { this.semanticScore = semanticScore; return this; }
        public Builder fitCategory(String fitCategory) { this.fitCategory = fitCategory; return this; }
        public Builder explanationFactors(List<String> explanationFactors) { this.explanationFactors = explanationFactors != null ? explanationFactors : new ArrayList<>(); return this; }
        public Builder modelSource(String modelSource) { this.modelSource = modelSource; return this; }
        public Builder matchedSkills(List<String> matchedSkills) { this.matchedSkills = matchedSkills != null ? matchedSkills : new ArrayList<>(); return this; }
        public Builder missingSkills(List<String> missingSkills) { this.missingSkills = missingSkills != null ? missingSkills : new ArrayList<>(); return this; }

        public MlMatchResponseDto build() {
            return new MlMatchResponseDto(itemId, shortlistProbability, semanticScore, fitCategory, explanationFactors, modelSource, matchedSkills, missingSkills);
        }
    }
}

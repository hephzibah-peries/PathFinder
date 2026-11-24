package com.pathfinder.backend.dto;

import java.util.List;

public class RoadmapStepDto {
    private int stepNumber;
    private String title;
    private String estimatedTime;
    private String description;
    private List<String> recommendedResources;

    public RoadmapStepDto() {
    }

    public RoadmapStepDto(int stepNumber, String title, String estimatedTime, String description, List<String> recommendedResources) {
        this.stepNumber = stepNumber;
        this.title = title;
        this.estimatedTime = estimatedTime;
        this.description = description;
        this.recommendedResources = recommendedResources;
    }

    public int getStepNumber() { return stepNumber; }
    public void setStepNumber(int stepNumber) { this.stepNumber = stepNumber; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getEstimatedTime() { return estimatedTime; }
    public void setEstimatedTime(String estimatedTime) { this.estimatedTime = estimatedTime; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getRecommendedResources() { return recommendedResources; }
    public void setRecommendedResources(List<String> recommendedResources) { this.recommendedResources = recommendedResources; }
}

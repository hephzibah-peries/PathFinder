package com.pathfinder.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class MlMatchRequestDto {
    private String cvText;
    private String jobTitle;
    private String jobDescription;
    private List<String> requiredSkills = new ArrayList<>();

    public MlMatchRequestDto() {
    }

    public MlMatchRequestDto(String cvText, String jobTitle, String jobDescription, List<String> requiredSkills) {
        this.cvText = cvText;
        this.jobTitle = jobTitle;
        this.jobDescription = jobDescription;
        this.requiredSkills = requiredSkills != null ? requiredSkills : new ArrayList<>();
    }

    public String getCvText() { return cvText; }
    public void setCvText(String cvText) { this.cvText = cvText; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }
    public List<String> getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(List<String> requiredSkills) { this.requiredSkills = requiredSkills != null ? requiredSkills : new ArrayList<>(); }
}

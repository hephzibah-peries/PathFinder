package com.pathfinder.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class MlBatchRankRequestDto {
    private String cvText;
    private Long internshipId;
    private String jobTitle;
    private String jobDescription;
    private List<String> requiredSkills = new ArrayList<>();
    private List<MlBatchItemDto> items = new ArrayList<>();

    public MlBatchRankRequestDto() {
    }

    public String getCvText() { return cvText; }
    public void setCvText(String cvText) { this.cvText = cvText; }
    public Long getInternshipId() { return internshipId; }
    public void setInternshipId(Long internshipId) { this.internshipId = internshipId; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getJobDescription() { return jobDescription; }
    public void setJobDescription(String jobDescription) { this.jobDescription = jobDescription; }
    public List<String> getRequiredSkills() { return requiredSkills; }
    public void setRequiredSkills(List<String> requiredSkills) { this.requiredSkills = requiredSkills != null ? requiredSkills : new ArrayList<>(); }
    public List<MlBatchItemDto> getItems() { return items; }
    public void setItems(List<MlBatchItemDto> items) { this.items = items != null ? items : new ArrayList<>(); }
}

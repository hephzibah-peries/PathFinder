package com.pathfinder.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class MlBatchItemDto {
    private Long id;
    private String title;
    private String description;
    private List<String> skills = new ArrayList<>();
    private String candidateName;
    private String candidateCvText;

    public MlBatchItemDto() {
    }

    public MlBatchItemDto(Long id, String title, String description, List<String> skills, String candidateName, String candidateCvText) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.skills = skills != null ? skills : new ArrayList<>();
        this.candidateName = candidateName;
        this.candidateCvText = candidateCvText;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public List<String> getSkills() { return skills; }
    public void setSkills(List<String> skills) { this.skills = skills != null ? skills : new ArrayList<>(); }
    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }
    public String getCandidateCvText() { return candidateCvText; }
    public void setCandidateCvText(String candidateCvText) { this.candidateCvText = candidateCvText; }
}

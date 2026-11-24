package com.pathfinder.backend.dto;

public class GenerateInterviewRequest {
    private Long internshipId;
    private String targetRole;
    private String questionCategory;

    public GenerateInterviewRequest() {}

    public GenerateInterviewRequest(Long internshipId, String targetRole) {
        this.internshipId = internshipId;
        this.targetRole = targetRole;
    }

    public GenerateInterviewRequest(Long internshipId, String targetRole, String questionCategory) {
        this.internshipId = internshipId;
        this.targetRole = targetRole;
        this.questionCategory = questionCategory;
    }

    public Long getInternshipId() { return internshipId; }
    public void setInternshipId(Long internshipId) { this.internshipId = internshipId; }
    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    public String getQuestionCategory() { return questionCategory; }
    public void setQuestionCategory(String questionCategory) { this.questionCategory = questionCategory; }
}

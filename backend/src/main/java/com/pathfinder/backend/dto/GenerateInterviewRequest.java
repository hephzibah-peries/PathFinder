package com.pathfinder.backend.dto;

public class GenerateInterviewRequest {
    private Long internshipId;
    private String targetRole;

    public GenerateInterviewRequest() {}

    public GenerateInterviewRequest(Long internshipId, String targetRole) {
        this.internshipId = internshipId;
        this.targetRole = targetRole;
    }

    public Long getInternshipId() { return internshipId; }
    public void setInternshipId(Long internshipId) { this.internshipId = internshipId; }
    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
}

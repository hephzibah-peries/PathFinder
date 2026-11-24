package com.pathfinder.backend.dto;

public class SkillDiagnosisRequest {
    private Long resumeId;
    private String targetRole;
    private Long internshipId;

    public SkillDiagnosisRequest() {
    }

    public SkillDiagnosisRequest(Long resumeId, String targetRole, Long internshipId) {
        this.resumeId = resumeId;
        this.targetRole = targetRole;
        this.internshipId = internshipId;
    }

    public Long getResumeId() { return resumeId; }
    public void setResumeId(Long resumeId) { this.resumeId = resumeId; }
    public String getTargetRole() { return targetRole; }
    public void setTargetRole(String targetRole) { this.targetRole = targetRole; }
    public Long getInternshipId() { return internshipId; }
    public void setInternshipId(Long internshipId) { this.internshipId = internshipId; }
}

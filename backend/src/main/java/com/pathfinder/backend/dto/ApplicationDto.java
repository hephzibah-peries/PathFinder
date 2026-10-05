package com.pathfinder.backend.dto;

public class ApplicationDto {
    private Long id;
    private Long internshipId;
    private String internshipTitle;
    private String companyName;
    private Long studentId;
    private String studentName;
    private String status;
    private String appliedAt;

    public ApplicationDto() {
    }

    public ApplicationDto(Long id, Long internshipId, String internshipTitle, String companyName, Long studentId,
                          String studentName, String status, String appliedAt) {
        this.id = id;
        this.internshipId = internshipId;
        this.internshipTitle = internshipTitle;
        this.companyName = companyName;
        this.studentId = studentId;
        this.studentName = studentName;
        this.status = status;
        this.appliedAt = appliedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getInternshipId() { return internshipId; }
    public void setInternshipId(Long internshipId) { this.internshipId = internshipId; }
    public String getInternshipTitle() { return internshipTitle; }
    public void setInternshipTitle(String internshipTitle) { this.internshipTitle = internshipTitle; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAppliedAt() { return appliedAt; }
    public void setAppliedAt(String appliedAt) { this.appliedAt = appliedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long internshipId;
        private String internshipTitle;
        private String companyName;
        private Long studentId;
        private String studentName;
        private String status;
        private String appliedAt;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder internshipId(Long internshipId) { this.internshipId = internshipId; return this; }
        public Builder internshipTitle(String internshipTitle) { this.internshipTitle = internshipTitle; return this; }
        public Builder companyName(String companyName) { this.companyName = companyName; return this; }
        public Builder studentId(Long studentId) { this.studentId = studentId; return this; }
        public Builder studentName(String studentName) { this.studentName = studentName; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder appliedAt(String appliedAt) { this.appliedAt = appliedAt; return this; }
        public ApplicationDto build() {
            return new ApplicationDto(id, internshipId, internshipTitle, companyName, studentId, studentName, status, appliedAt);
        }
    }
}
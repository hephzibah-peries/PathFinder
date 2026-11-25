package com.pathfinder.backend.dto;

public class ApplicationDto {
    private Long id;
    private Long internshipId;
    private String internshipTitle;
    private String companyName;
    private String location;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String university;
    private String degree;
    private Double gpa;
    private String status;
    private String appliedAt;
    private Long resumeId;
    private String resumeFileName;
    private String coverLetter;

    public ApplicationDto() {
    }

    public ApplicationDto(Long id, Long internshipId, String internshipTitle, String companyName, String location, Long studentId,
                          String studentName, String status, String appliedAt, Long resumeId, String resumeFileName) {
        this(id, internshipId, internshipTitle, companyName, location, studentId, studentName, null, null, null, null, status, appliedAt, resumeId, resumeFileName, null);
    }

    public ApplicationDto(Long id, Long internshipId, String internshipTitle, String companyName, String location, Long studentId,
                          String studentName, String status, String appliedAt, Long resumeId, String resumeFileName, String coverLetter) {
        this(id, internshipId, internshipTitle, companyName, location, studentId, studentName, null, null, null, null, status, appliedAt, resumeId, resumeFileName, coverLetter);
    }

    public ApplicationDto(Long id, Long internshipId, String internshipTitle, String companyName, String location, Long studentId,
                          String studentName, String studentEmail, String university, String degree, Double gpa,
                          String status, String appliedAt, Long resumeId, String resumeFileName, String coverLetter) {
        this.id = id;
        this.internshipId = internshipId;
        this.internshipTitle = internshipTitle;
        this.companyName = companyName;
        this.location = location;
        this.studentId = studentId;
        this.studentName = studentName;
        this.studentEmail = studentEmail;
        this.university = university;
        this.degree = degree;
        this.gpa = gpa;
        this.status = status;
        this.appliedAt = appliedAt;
        this.resumeId = resumeId;
        this.resumeFileName = resumeFileName;
        this.coverLetter = coverLetter;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getInternshipId() { return internshipId; }
    public void setInternshipId(Long internshipId) { this.internshipId = internshipId; }
    public String getInternshipTitle() { return internshipTitle; }
    public void setInternshipTitle(String internshipTitle) { this.internshipTitle = internshipTitle; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public String getStudentEmail() { return studentEmail; }
    public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
    public String getUniversity() { return university; }
    public void setUniversity(String university) { this.university = university; }
    public String getDegree() { return degree; }
    public void setDegree(String degree) { this.degree = degree; }
    public Double getGpa() { return gpa; }
    public void setGpa(Double gpa) { this.gpa = gpa; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAppliedAt() { return appliedAt; }
    public void setAppliedAt(String appliedAt) { this.appliedAt = appliedAt; }
    public Long getResumeId() { return resumeId; }
    public void setResumeId(Long resumeId) { this.resumeId = resumeId; }
    public String getResumeFileName() { return resumeFileName; }
    public void setResumeFileName(String resumeFileName) { this.resumeFileName = resumeFileName; }
    public String getCoverLetter() { return coverLetter; }
    public void setCoverLetter(String coverLetter) { this.coverLetter = coverLetter; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long internshipId;
        private String internshipTitle;
        private String companyName;
        private String location;
        private Long studentId;
        private String studentName;
        private String studentEmail;
        private String university;
        private String degree;
        private Double gpa;
        private String status;
        private String appliedAt;
        private Long resumeId;
        private String resumeFileName;
        private String coverLetter;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder internshipId(Long internshipId) { this.internshipId = internshipId; return this; }
        public Builder internshipTitle(String internshipTitle) { this.internshipTitle = internshipTitle; return this; }
        public Builder companyName(String companyName) { this.companyName = companyName; return this; }
        public Builder location(String location) { this.location = location; return this; }
        public Builder studentId(Long studentId) { this.studentId = studentId; return this; }
        public Builder studentName(String studentName) { this.studentName = studentName; return this; }
        public Builder studentEmail(String studentEmail) { this.studentEmail = studentEmail; return this; }
        public Builder university(String university) { this.university = university; return this; }
        public Builder degree(String degree) { this.degree = degree; return this; }
        public Builder gpa(Double gpa) { this.gpa = gpa; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder appliedAt(String appliedAt) { this.appliedAt = appliedAt; return this; }
        public Builder resumeId(Long resumeId) { this.resumeId = resumeId; return this; }
        public Builder resumeFileName(String resumeFileName) { this.resumeFileName = resumeFileName; return this; }
        public Builder coverLetter(String coverLetter) { this.coverLetter = coverLetter; return this; }
        public ApplicationDto build() {
            return new ApplicationDto(id, internshipId, internshipTitle, companyName, location, studentId, studentName, studentEmail, university, degree, gpa, status, appliedAt, resumeId, resumeFileName, coverLetter);
        }
    }
}

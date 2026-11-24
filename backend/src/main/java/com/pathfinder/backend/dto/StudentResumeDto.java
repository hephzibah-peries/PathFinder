package com.pathfinder.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class StudentResumeDto {
    private Long id;
    private Long studentId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private LocalDateTime uploadedAt;
    private List<String> extractedSkills;

    public StudentResumeDto() {
    }

    public StudentResumeDto(Long id, Long studentId, String fileName, String fileType, Long fileSize,
                            LocalDateTime uploadedAt, List<String> extractedSkills) {
        this.id = id;
        this.studentId = studentId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.uploadedAt = uploadedAt;
        this.extractedSkills = extractedSkills;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
    public List<String> getExtractedSkills() { return extractedSkills; }
    public void setExtractedSkills(List<String> extractedSkills) { this.extractedSkills = extractedSkills; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long studentId;
        private String fileName;
        private String fileType;
        private Long fileSize;
        private LocalDateTime uploadedAt;
        private List<String> extractedSkills;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder studentId(Long studentId) { this.studentId = studentId; return this; }
        public Builder fileName(String fileName) { this.fileName = fileName; return this; }
        public Builder fileType(String fileType) { this.fileType = fileType; return this; }
        public Builder fileSize(Long fileSize) { this.fileSize = fileSize; return this; }
        public Builder uploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; return this; }
        public Builder extractedSkills(List<String> extractedSkills) { this.extractedSkills = extractedSkills; return this; }
        public StudentResumeDto build() {
            return new StudentResumeDto(id, studentId, fileName, fileType, fileSize, uploadedAt, extractedSkills);
        }
    }
}

package com.pathfinder.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_resumes")
public class StudentResume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private StudentProfile student;

    @Column(nullable = false)
    private String fileName;

    private String fileType;

    private Long fileSize;

    private LocalDateTime uploadedAt = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String extractedText;

    @Column(columnDefinition = "TEXT")
    private String extractedSkills;

    @Column(name = "file_data", columnDefinition = "bytea", nullable = true)
    private byte[] fileData;

    @Column(name = "archived", nullable = false)
    private Boolean archived = false;

    public StudentResume() {
    }

    public StudentResume(Long id, StudentProfile student, String fileName, String fileType, Long fileSize,
                         LocalDateTime uploadedAt, String extractedText, String extractedSkills, byte[] fileData) {
        this(id, student, fileName, fileType, fileSize, uploadedAt, extractedText, extractedSkills, fileData, false);
    }

    public StudentResume(Long id, StudentProfile student, String fileName, String fileType, Long fileSize,
                         LocalDateTime uploadedAt, String extractedText, String extractedSkills, byte[] fileData,
                         Boolean archived) {
        this.id = id;
        this.student = student;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.uploadedAt = uploadedAt;
        this.extractedText = extractedText;
        this.extractedSkills = extractedSkills;
        this.fileData = fileData;
        this.archived = archived != null ? archived : false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public StudentProfile getStudent() { return student; }
    public void setStudent(StudentProfile student) { this.student = student; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }

    public String getExtractedText() { return extractedText; }
    public void setExtractedText(String extractedText) { this.extractedText = extractedText; }

    public String getExtractedSkills() { return extractedSkills; }
    public void setExtractedSkills(String extractedSkills) { this.extractedSkills = extractedSkills; }

    public byte[] getFileData() { return fileData; }
    public void setFileData(byte[] fileData) { this.fileData = fileData; }

    public Boolean getArchived() { return archived != null ? archived : false; }
    public void setArchived(Boolean archived) { this.archived = archived != null ? archived : false; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private StudentProfile student;
        private String fileName;
        private String fileType;
        private Long fileSize;
        private LocalDateTime uploadedAt = LocalDateTime.now();
        private String extractedText;
        private String extractedSkills;
        private byte[] fileData;
        private Boolean archived = false;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder student(StudentProfile student) { this.student = student; return this; }
        public Builder fileName(String fileName) { this.fileName = fileName; return this; }
        public Builder fileType(String fileType) { this.fileType = fileType; return this; }
        public Builder fileSize(Long fileSize) { this.fileSize = fileSize; return this; }
        public Builder uploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; return this; }
        public Builder extractedText(String extractedText) { this.extractedText = extractedText; return this; }
        public Builder extractedSkills(String extractedSkills) { this.extractedSkills = extractedSkills; return this; }
        public Builder fileData(byte[] fileData) { this.fileData = fileData; return this; }
        public Builder archived(Boolean archived) { this.archived = archived; return this; }

        public StudentResume build() {
            return new StudentResume(id, student, fileName, fileType, fileSize, uploadedAt, extractedText, extractedSkills, fileData, archived);
        }
    }
}

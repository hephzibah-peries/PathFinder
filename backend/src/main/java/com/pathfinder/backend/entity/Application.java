package com.pathfinder.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
public class Application {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "internship_id", nullable = false)
    private Internship internship;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private StudentProfile student;

    private String status = "PENDING";

    private LocalDateTime appliedAt = LocalDateTime.now();

    public Application() {
    }

    public Application(Long id, Internship internship, StudentProfile student, String status, LocalDateTime appliedAt) {
        this.id = id;
        this.internship = internship;
        this.student = student;
        this.status = status;
        this.appliedAt = appliedAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Internship getInternship() { return internship; }
    public void setInternship(Internship internship) { this.internship = internship; }
    public StudentProfile getStudent() { return student; }
    public void setStudent(StudentProfile student) { this.student = student; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Internship internship;
        private StudentProfile student;
        private String status = "PENDING";
        private LocalDateTime appliedAt = LocalDateTime.now();

        public Builder id(Long id) { this.id = id; return this; }
        public Builder internship(Internship internship) { this.internship = internship; return this; }
        public Builder student(StudentProfile student) { this.student = student; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder appliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; return this; }
        public Application build() { return new Application(id, internship, student, status, appliedAt); }
    }
}
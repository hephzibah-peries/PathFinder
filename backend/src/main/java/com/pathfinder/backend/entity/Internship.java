package com.pathfinder.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "internships")
public class Internship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private CompanyProfile company;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    private String location;
    private String workMode;
    
    @Column(columnDefinition = "TEXT")
    private String requirements;

    @Column(columnDefinition = "TEXT")
    private String skills;

    private String stipend;
    private String deadline;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Internship() {
    }

    public Internship(Long id, CompanyProfile company, String title, String description, String location,
                      String workMode, String requirements, String skills, String stipend, String deadline,
                      LocalDateTime createdAt) {
        this.id = id;
        this.company = company;
        this.title = title;
        this.description = description;
        this.location = location;
        this.workMode = workMode;
        this.requirements = requirements;
        this.skills = skills;
        this.stipend = stipend;
        this.deadline = deadline;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public CompanyProfile getCompany() { return company; }
    public void setCompany(CompanyProfile company) { this.company = company; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getWorkMode() { return workMode; }
    public void setWorkMode(String workMode) { this.workMode = workMode; }
    public String getRequirements() { return requirements; }
    public void setRequirements(String requirements) { this.requirements = requirements; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public String getStipend() { return stipend; }
    public void setStipend(String stipend) { this.stipend = stipend; }
    public String getDeadline() { return deadline; }
    public void setDeadline(String deadline) { this.deadline = deadline; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private CompanyProfile company;
        private String title;
        private String description;
        private String location;
        private String workMode;
        private String requirements;
        private String skills;
        private String stipend;
        private String deadline;
        private LocalDateTime createdAt = LocalDateTime.now();

        public Builder id(Long id) { this.id = id; return this; }
        public Builder company(CompanyProfile company) { this.company = company; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder location(String location) { this.location = location; return this; }
        public Builder workMode(String workMode) { this.workMode = workMode; return this; }
        public Builder requirements(String requirements) { this.requirements = requirements; return this; }
        public Builder skills(String skills) { this.skills = skills; return this; }
        public Builder stipend(String stipend) { this.stipend = stipend; return this; }
        public Builder deadline(String deadline) { this.deadline = deadline; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Internship build() {
            return new Internship(id, company, title, description, location, workMode, requirements, skills, stipend, deadline, createdAt);
        }
    }
}
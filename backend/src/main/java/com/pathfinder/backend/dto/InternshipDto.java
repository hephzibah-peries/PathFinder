package com.pathfinder.backend.dto;

public class InternshipDto {
    private Long id;
    private Long companyId;
    private String companyName;
    private String title;
    private String description;
    private String location;
    private String workMode;
    private String requirements;
    private String skills;
    private String stipend;
    private String deadline;

    public InternshipDto() {
    }

    public InternshipDto(Long id, Long companyId, String companyName, String title, String description,
                         String location, String workMode, String requirements, String skills, String stipend,
                         String deadline) {
        this.id = id;
        this.companyId = companyId;
        this.companyName = companyName;
        this.title = title;
        this.description = description;
        this.location = location;
        this.workMode = workMode;
        this.requirements = requirements;
        this.skills = skills;
        this.stipend = stipend;
        this.deadline = deadline;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
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

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long companyId;
        private String companyName;
        private String title;
        private String description;
        private String location;
        private String workMode;
        private String requirements;
        private String skills;
        private String stipend;
        private String deadline;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder companyId(Long companyId) { this.companyId = companyId; return this; }
        public Builder companyName(String companyName) { this.companyName = companyName; return this; }
        public Builder title(String title) { this.title = title; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder location(String location) { this.location = location; return this; }
        public Builder workMode(String workMode) { this.workMode = workMode; return this; }
        public Builder requirements(String requirements) { this.requirements = requirements; return this; }
        public Builder skills(String skills) { this.skills = skills; return this; }
        public Builder stipend(String stipend) { this.stipend = stipend; return this; }
        public Builder deadline(String deadline) { this.deadline = deadline; return this; }
        public InternshipDto build() {
            return new InternshipDto(id, companyId, companyName, title, description, location, workMode,
                    requirements, skills, stipend, deadline);
        }
    }
}
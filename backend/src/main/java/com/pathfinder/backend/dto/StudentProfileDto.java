package com.pathfinder.backend.dto;

public class StudentProfileDto {
    private Long id;
    private Long userId;
    private String email;
    private String fullName;
    private String university;
    private Double gpa;
    private String bio;
    private String skills;
    private String preferredLocation;
    private String preferredWorkMode;

    public StudentProfileDto() {
    }

    public StudentProfileDto(Long id, Long userId, String email, String fullName, String university, Double gpa,
                             String bio, String skills, String preferredLocation, String preferredWorkMode) {
        this.id = id;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.university = university;
        this.gpa = gpa;
        this.bio = bio;
        this.skills = skills;
        this.preferredLocation = preferredLocation;
        this.preferredWorkMode = preferredWorkMode;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getUniversity() { return university; }
    public void setUniversity(String university) { this.university = university; }
    public Double getGpa() { return gpa; }
    public void setGpa(Double gpa) { this.gpa = gpa; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getSkills() { return skills; }
    public void setSkills(String skills) { this.skills = skills; }
    public String getPreferredLocation() { return preferredLocation; }
    public void setPreferredLocation(String preferredLocation) { this.preferredLocation = preferredLocation; }
    public String getPreferredWorkMode() { return preferredWorkMode; }
    public void setPreferredWorkMode(String preferredWorkMode) { this.preferredWorkMode = preferredWorkMode; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private Long userId;
        private String email;
        private String fullName;
        private String university;
        private Double gpa;
        private String bio;
        private String skills;
        private String preferredLocation;
        private String preferredWorkMode;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder userId(Long userId) { this.userId = userId; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder university(String university) { this.university = university; return this; }
        public Builder gpa(Double gpa) { this.gpa = gpa; return this; }
        public Builder bio(String bio) { this.bio = bio; return this; }
        public Builder skills(String skills) { this.skills = skills; return this; }
        public Builder preferredLocation(String preferredLocation) { this.preferredLocation = preferredLocation; return this; }
        public Builder preferredWorkMode(String preferredWorkMode) { this.preferredWorkMode = preferredWorkMode; return this; }
        public StudentProfileDto build() {
            return new StudentProfileDto(id, userId, email, fullName, university, gpa, bio, skills, preferredLocation, preferredWorkMode);
        }
    }
}
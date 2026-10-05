package com.pathfinder.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "student_profiles")
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String fullName;
    private String university;
    private Double gpa;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(columnDefinition = "TEXT")
    private String skills;

    private String preferredLocation;
    private String preferredWorkMode;

    public StudentProfile() {
    }

    public StudentProfile(Long id, User user, String fullName, String university, Double gpa, String bio,
                          String skills, String preferredLocation, String preferredWorkMode) {
        this.id = id;
        this.user = user;
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
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
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
        private User user;
        private String fullName;
        private String university;
        private Double gpa;
        private String bio;
        private String skills;
        private String preferredLocation;
        private String preferredWorkMode;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder fullName(String fullName) { this.fullName = fullName; return this; }
        public Builder university(String university) { this.university = university; return this; }
        public Builder gpa(Double gpa) { this.gpa = gpa; return this; }
        public Builder bio(String bio) { this.bio = bio; return this; }
        public Builder skills(String skills) { this.skills = skills; return this; }
        public Builder preferredLocation(String preferredLocation) { this.preferredLocation = preferredLocation; return this; }
        public Builder preferredWorkMode(String preferredWorkMode) { this.preferredWorkMode = preferredWorkMode; return this; }
        public StudentProfile build() {
            return new StudentProfile(id, user, fullName, university, gpa, bio, skills, preferredLocation, preferredWorkMode);
        }
    }
}
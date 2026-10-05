package com.pathfinder.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "company_profiles")
public class CompanyProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String companyName;
    private String industry;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String website;

    private Boolean verified = false;

    public CompanyProfile() {
    }

    public CompanyProfile(Long id, User user, String companyName, String industry, String description,
                          String website, Boolean verified) {
        this.id = id;
        this.user = user;
        this.companyName = companyName;
        this.industry = industry;
        this.description = description;
        this.website = website;
        this.verified = verified;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public Boolean getVerified() { return verified; }
    public void setVerified(Boolean verified) { this.verified = verified; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private Long id;
        private User user;
        private String companyName;
        private String industry;
        private String description;
        private String website;
        private Boolean verified = false;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder user(User user) { this.user = user; return this; }
        public Builder companyName(String companyName) { this.companyName = companyName; return this; }
        public Builder industry(String industry) { this.industry = industry; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder website(String website) { this.website = website; return this; }
        public Builder verified(Boolean verified) { this.verified = verified; return this; }
        public CompanyProfile build() {
            return new CompanyProfile(id, user, companyName, industry, description, website, verified);
        }
    }
}
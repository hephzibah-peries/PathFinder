package com.pathfinder.backend.dto;

public class CompanyProfileDto {
    private Long id;
    private Long userId;
    private String email;
    private String companyName;
    private String industry;
    private String description;
    private String website;
    private Boolean verified;

    public CompanyProfileDto() {
    }

    public CompanyProfileDto(Long id, Long userId, String email, String companyName, String industry,
                             String description, String website, Boolean verified) {
        this.id = id;
        this.userId = userId;
        this.email = email;
        this.companyName = companyName;
        this.industry = industry;
        this.description = description;
        this.website = website;
        this.verified = verified;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
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
        private Long userId;
        private String email;
        private String companyName;
        private String industry;
        private String description;
        private String website;
        private Boolean verified;

        public Builder id(Long id) { this.id = id; return this; }
        public Builder userId(Long userId) { this.userId = userId; return this; }
        public Builder email(String email) { this.email = email; return this; }
        public Builder companyName(String companyName) { this.companyName = companyName; return this; }
        public Builder industry(String industry) { this.industry = industry; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder website(String website) { this.website = website; return this; }
        public Builder verified(Boolean verified) { this.verified = verified; return this; }
        public CompanyProfileDto build() {
            return new CompanyProfileDto(id, userId, email, companyName, industry, description, website, verified);
        }
    }
}

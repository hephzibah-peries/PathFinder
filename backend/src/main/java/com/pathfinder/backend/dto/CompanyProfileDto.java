package com.pathfinder.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompanyProfileDto {
    private Long id;
    private Long userId;
    private String email;
    private String companyName;
    private String industry;
    private String description;
    private String website;
    private Boolean verified;
}

package com.pathfinder.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplicationDto {
    private Long id;
    private Long internshipId;
    private String internshipTitle;
    private String companyName;
    private Long studentId;
    private String studentName;
    private String status;
    private String appliedAt;
}
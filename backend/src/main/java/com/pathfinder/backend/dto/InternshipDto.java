package com.pathfinder.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InternshipDto {
    private Long id;
    private Long companyId;
    private String companyName;
    private String title;
    private String description;
    private String location;
    private String workMode;
    private String requirements;
    private String stipend;
    private String deadline;
}
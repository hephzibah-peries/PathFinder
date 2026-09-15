package com.pathfinder.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfileDto {
    private Long id;
    private Long userId;
    private String email;
    private String fullName;
    private String university;
    private Double gpa;
    private String bio;
    private String preferredLocation;
    private String preferredWorkMode;
}
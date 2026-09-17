package com.pathfinder.backend.dto;

import lombok.Data;

@Data
public class ApplicationStatusUpdateRequest {
    private String status; // ACCEPTED, REJECTED, PENDING
}
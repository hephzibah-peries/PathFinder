package com.pathfinder.backend.dto;

public class ApplicationStatusUpdateRequest {
    private String status; // ACCEPTED, REJECTED, PENDING

    public ApplicationStatusUpdateRequest() {
    }

    public ApplicationStatusUpdateRequest(String status) {
        this.status = status;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String status;

        public Builder status(String status) { this.status = status; return this; }
        public ApplicationStatusUpdateRequest build() { return new ApplicationStatusUpdateRequest(status); }
    }
}
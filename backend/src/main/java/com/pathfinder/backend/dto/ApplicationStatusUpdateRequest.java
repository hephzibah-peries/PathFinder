package com.pathfinder.backend.dto;

public class ApplicationStatusUpdateRequest {
    private String status; // SHORTLISTED, INTERVIEW, REJECTED, etc.
    private String note;

    public ApplicationStatusUpdateRequest() {
    }

    public ApplicationStatusUpdateRequest(String status) {
        this(status, null);
    }

    public ApplicationStatusUpdateRequest(String status, String note) {
        this.status = status;
        this.note = note;
    }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private String status;
        private String note;

        public Builder status(String status) { this.status = status; return this; }
        public Builder note(String note) { this.note = note; return this; }
        public ApplicationStatusUpdateRequest build() { return new ApplicationStatusUpdateRequest(status, note); }
    }
}
package com.pathfinder.backend.dto;

public class InterviewQuestionDto {
    private int id;
    private String question;
    private String type; // TECHNICAL, SYSTEM_SCENARIO, BEHAVIORAL
    private String focusArea;
    private String context;

    public InterviewQuestionDto() {}

    public InterviewQuestionDto(int id, String question, String type, String focusArea, String context) {
        this.id = id;
        this.question = question;
        this.type = type;
        this.focusArea = focusArea;
        this.context = context;
    }

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getFocusArea() { return focusArea; }
    public void setFocusArea(String focusArea) { this.focusArea = focusArea; }
    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }
}

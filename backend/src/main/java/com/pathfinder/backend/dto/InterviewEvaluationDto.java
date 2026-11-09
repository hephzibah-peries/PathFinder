package com.pathfinder.backend.dto;

import java.util.ArrayList;
import java.util.List;

public class InterviewEvaluationDto {
    private int technicalScore;
    private int communicationClarity;
    private String modelAnswer;
    private String constructiveFeedback;
    private List<String> keyStrengths = new ArrayList<>();

    public InterviewEvaluationDto() {}

    public InterviewEvaluationDto(int technicalScore, int communicationClarity, String modelAnswer,
                                  String constructiveFeedback, List<String> keyStrengths) {
        this.technicalScore = technicalScore;
        this.communicationClarity = communicationClarity;
        this.modelAnswer = modelAnswer;
        this.constructiveFeedback = constructiveFeedback;
        this.keyStrengths = keyStrengths != null ? keyStrengths : new ArrayList<>();
    }

    public int getTechnicalScore() { return technicalScore; }
    public void setTechnicalScore(int technicalScore) { this.technicalScore = technicalScore; }
    public int getCommunicationClarity() { return communicationClarity; }
    public void setCommunicationClarity(int communicationClarity) { this.communicationClarity = communicationClarity; }
    public String getModelAnswer() { return modelAnswer; }
    public void setModelAnswer(String modelAnswer) { this.modelAnswer = modelAnswer; }
    public String getConstructiveFeedback() { return constructiveFeedback; }
    public void setConstructiveFeedback(String constructiveFeedback) { this.constructiveFeedback = constructiveFeedback; }
    public List<String> getKeyStrengths() { return keyStrengths; }
    public void setKeyStrengths(List<String> keyStrengths) { this.keyStrengths = keyStrengths; }
}

package com.pathfinder.backend.dto;

public class EvaluateInterviewRequest {
    private int questionId;
    private String question;
    private String candidateAnswer;
    private String questionType;
    private String focusArea;

    public EvaluateInterviewRequest() {}

    public EvaluateInterviewRequest(int questionId, String question, String candidateAnswer, String questionType, String focusArea) {
        this.questionId = questionId;
        this.question = question;
        this.candidateAnswer = candidateAnswer;
        this.questionType = questionType;
        this.focusArea = focusArea;
    }

    public int getQuestionId() { return questionId; }
    public void setQuestionId(int questionId) { this.questionId = questionId; }
    public String getQuestion() { return question; }
    public void setQuestion(String question) { this.question = question; }
    public String getCandidateAnswer() { return candidateAnswer; }
    public void setCandidateAnswer(String candidateAnswer) { this.candidateAnswer = candidateAnswer; }
    public String getQuestionType() { return questionType; }
    public void setQuestionType(String questionType) { this.questionType = questionType; }
    public String getFocusArea() { return focusArea; }
    public void setFocusArea(String focusArea) { this.focusArea = focusArea; }
}

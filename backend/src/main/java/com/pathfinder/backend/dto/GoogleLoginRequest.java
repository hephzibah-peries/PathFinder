package com.pathfinder.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {

    @NotBlank(message = "Google ID token must not be blank")
    @JsonAlias({"credential", "token"})
    private String idToken;

    public GoogleLoginRequest() {
    }

    public GoogleLoginRequest(String idToken) {
        this.idToken = idToken;
    }

    public String getIdToken() {
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }

    public void setCredential(String credential) {
        if (this.idToken == null || this.idToken.isBlank()) {
            this.idToken = credential;
        }
    }

    public void setToken(String token) {
        if (this.idToken == null || this.idToken.isBlank()) {
            this.idToken = token;
        }
    }
}

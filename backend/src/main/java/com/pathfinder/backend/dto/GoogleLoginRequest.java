package com.pathfinder.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {

    @NotBlank(message = "Google token must not be blank")
    @JsonAlias({"credential", "token", "accessToken", "access_token"})
    private String idToken;

    private String token;
    private String credential;

    public GoogleLoginRequest() {
    }

    public GoogleLoginRequest(String idToken) {
        this.idToken = idToken;
    }

    public String getIdToken() {
        if (idToken != null && !idToken.isBlank()) {
            return idToken.trim();
        }
        if (token != null && !token.isBlank()) {
            return token.trim();
        }
        if (credential != null && !credential.isBlank()) {
            return credential.trim();
        }
        return idToken;
    }

    public void setIdToken(String idToken) {
        this.idToken = idToken;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
        if (this.idToken == null || this.idToken.isBlank()) {
            this.idToken = token;
        }
    }

    public String getCredential() {
        return credential;
    }

    public void setCredential(String credential) {
        this.credential = credential;
        if (this.idToken == null || this.idToken.isBlank()) {
            this.idToken = credential;
        }
    }
}

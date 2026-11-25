package com.pathfinder.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {

    @NotBlank(message = "Google token must not be blank")
    @JsonProperty("idToken")
    @JsonAlias({"credential", "token", "accessToken", "access_token"})
    private String idToken;

    @JsonProperty("token")
    @JsonAlias({"idToken", "credential", "accessToken", "access_token"})
    private String token;

    @JsonProperty("credential")
    @JsonAlias({"idToken", "token", "accessToken", "access_token"})
    private String credential;

    public GoogleLoginRequest() {
    }

    public GoogleLoginRequest(String token) {
        setAll(token);
    }

    private void setAll(String val) {
        this.idToken = val;
        this.token = val;
        this.credential = val;
    }

    public String getIdToken() {
        if (idToken != null && !idToken.isBlank()) return idToken.trim();
        if (token != null && !token.isBlank()) return token.trim();
        if (credential != null && !credential.isBlank()) return credential.trim();
        return idToken;
    }

    public void setIdToken(String idToken) {
        if (idToken != null && !idToken.isBlank()) {
            setAll(idToken);
        } else {
            this.idToken = idToken;
        }
    }

    public String getToken() {
        return getIdToken();
    }

    public void setToken(String token) {
        if (token != null && !token.isBlank()) {
            setAll(token);
        } else {
            this.token = token;
        }
    }

    public String getCredential() {
        return getIdToken();
    }

    public void setCredential(String credential) {
        if (credential != null && !credential.isBlank()) {
            setAll(credential);
        } else {
            this.credential = credential;
        }
    }
}

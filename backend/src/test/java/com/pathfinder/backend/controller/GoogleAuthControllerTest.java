package com.pathfinder.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pathfinder.backend.dto.AuthResponse;
import com.pathfinder.backend.dto.GoogleLoginRequest;
import com.pathfinder.backend.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class GoogleAuthControllerTest {

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;
    private TestAuthService testAuthService;

    static class TestAuthService extends AuthService {
        public boolean shouldThrowInvalidToken = false;

        public TestAuthService() {
            super(null, null, null, null, null);
        }

        @Override
        public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
            if (shouldThrowInvalidToken || "invalid.token.here".equals(request.getIdToken())) {
                throw new IllegalArgumentException("Invalid Google ID token");
            }
            return new AuthResponse("mock.pathfinder.jwt", "student.tester@example.com", "STUDENT");
        }
    }

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        testAuthService = new TestAuthService();
        AuthController authController = new AuthController(testAuthService);
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    @Test
    @DisplayName("CORS Origin Header - http://localhost:5173 is allowed for /api/auth/google")
    void testCorsOriginAllowedForGoogleAuth() throws Exception {
        GoogleLoginRequest request = new GoogleLoginRequest("valid.token");

        mockMvc.perform(post("/api/auth/google")
                        .header("Origin", "http://localhost:5173")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test
    @DisplayName("Google Login - Invalid Token returns 401 Unauthorized with error message")
    void testGoogleLoginWithInvalidToken() throws Exception {
        testAuthService.shouldThrowInvalidToken = true;

        GoogleLoginRequest request = new GoogleLoginRequest("invalid.token.here");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.error").value("Invalid Google ID token"));
    }

    @Test
    @DisplayName("Google Login - Blank Token returns 400 Bad Request")
    void testGoogleLoginWithBlankToken() throws Exception {
        GoogleLoginRequest request = new GoogleLoginRequest("");

        mockMvc.perform(post("/api/auth/google")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Google Login - Successful verification auto-provisions user and returns 200 OK")
    void testGoogleLoginSuccess() throws Exception {
        String mockToken = "valid.google.jwt";
        GoogleLoginRequest request = new GoogleLoginRequest(mockToken);

        mockMvc.perform(post("/api/auth/google")
                        .header("Origin", "http://localhost:5173")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock.pathfinder.jwt"))
                .andExpect(jsonPath("$.email").value("student.tester@example.com"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
    }
}

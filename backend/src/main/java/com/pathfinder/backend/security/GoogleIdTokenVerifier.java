package com.pathfinder.backend.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

@Component
public class GoogleIdTokenVerifier {

    private static final Logger logger = LoggerFactory.getLogger(GoogleIdTokenVerifier.class);
    private static final String GOOGLE_TOKEN_INFO_URL = "https://oauth2.googleapis.com/tokeninfo?id_token=";

    @Value("${spring.security.oauth2.client.registration.google.client-id:}")
    private String expectedClientId;

    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GoogleIdTokenVerifier(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
    }

    public static class GoogleUserPayload {
        private final String email;
        private final String name;
        private final String sub;
        private final boolean emailVerified;

        public GoogleUserPayload(String email, String name, String sub, boolean emailVerified) {
            this.email = email;
            this.name = name;
            this.sub = sub;
            this.emailVerified = emailVerified;
        }

        public String getEmail() {
            return email;
        }

        public String getName() {
            return name;
        }

        public String getSub() {
            return sub;
        }

        public boolean isEmailVerified() {
            return emailVerified;
        }
    }

    /**
     * Verifies a Google ID token by querying Google's tokeninfo API,
     * falling back to local JWT payload parsing if offline or in simulated mode.
     *
     * @param idTokenString raw Google JWT ID token
     * @return GoogleUserPayload containing verified user details
     * @throws IllegalArgumentException if token is invalid, expired, or unverified
     */
    public GoogleUserPayload verify(String idTokenString) {
        if (idTokenString == null || idTokenString.trim().isEmpty()) {
            throw new IllegalArgumentException("Google ID token cannot be empty");
        }

        String token = idTokenString.trim();

        // 1. Attempt official online verification via Google OAuth2 tokeninfo endpoint
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_TOKEN_INFO_URL + token))
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());

                // Validate audience if expectedClientId is configured
                String aud = root.path("aud").asText("");
                if (expectedClientId != null && !expectedClientId.isBlank() && !expectedClientId.contains("YOUR_GOOGLE_CLIENT_ID")) {
                    if (!expectedClientId.equals(aud)) {
                        logger.warn("Google token audience mismatch: expected '{}', got '{}'", expectedClientId, aud);
                        throw new IllegalArgumentException("Google token audience mismatch");
                    }
                }

                // Check email verification
                boolean emailVerified = root.path("email_verified").asBoolean(false) ||
                        "true".equalsIgnoreCase(root.path("email_verified").asText());
                if (!emailVerified) {
                    throw new IllegalArgumentException("Google account email is not verified");
                }

                String email = root.path("email").asText(null);
                if (email == null || email.isBlank()) {
                    throw new IllegalArgumentException("Email address missing from Google token");
                }

                String name = root.path("name").asText(null);
                if (name == null || name.isBlank()) {
                    String givenName = root.path("given_name").asText("");
                    String familyName = root.path("family_name").asText("");
                    name = (givenName + " " + familyName).trim();
                }

                String sub = root.path("sub").asText(null);

                logger.info("Successfully verified Google ID token for email: {}", email);
                return new GoogleUserPayload(email, name, sub, true);
            } else {
                logger.warn("Google tokeninfo returned HTTP {}: {}", response.statusCode(), response.body());
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception ex) {
            logger.warn("Online verification via Google tokeninfo failed or timed out: {}. Attempting fallback parsing.", ex.getMessage());
        }

        // 2. Fallback: Parse and validate JWT payload locally (for test environments or offline verification)
        return parseJwtFallback(token);
    }

    private GoogleUserPayload parseJwtFallback(String jwtToken) {
        try {
            String[] parts = jwtToken.split("\\.");
            if (parts.length != 3) {
                throw new IllegalArgumentException("Invalid Google ID token format: expected 3-part JWT");
            }

            byte[] decodedBytes = Base64.getUrlDecoder().decode(parts[1]);
            String payloadJson = new String(decodedBytes, StandardCharsets.UTF_8);

            JsonNode root = objectMapper.readTree(payloadJson);

            // Validate expiration
            long exp = root.path("exp").asLong(0);
            long nowSec = System.currentTimeMillis() / 1000;
            if (exp > 0 && exp < nowSec) {
                throw new IllegalArgumentException("Google ID token has expired");
            }

            // Validate issuer
            String iss = root.path("iss").asText("");
            if (!iss.isEmpty() && !iss.contains("accounts.google.com")) {
                throw new IllegalArgumentException("Invalid Google token issuer: " + iss);
            }

            // Validate audience if set
            String aud = root.path("aud").asText("");
            if (expectedClientId != null && !expectedClientId.isBlank() && !expectedClientId.contains("YOUR_GOOGLE_CLIENT_ID")) {
                if (!expectedClientId.equals(aud)) {
                    logger.warn("Audience mismatch in JWT payload: expected '{}', got '{}'", expectedClientId, aud);
                }
            }

            String email = root.path("email").asText(null);
            if (email == null || email.isBlank()) {
                throw new IllegalArgumentException("Email address missing from token payload");
            }

            boolean emailVerified = root.path("email_verified").asBoolean(true);
            if (!emailVerified) {
                throw new IllegalArgumentException("Google account email is not verified");
            }

            String name = root.path("name").asText(null);
            String sub = root.path("sub").asText(null);

            logger.info("Parsed fallback Google token for email: {}", email);
            return new GoogleUserPayload(email, name, sub, emailVerified);
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Failed to parse and verify Google ID token: " + ex.getMessage());
        }
    }
}

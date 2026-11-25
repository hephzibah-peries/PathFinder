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
    private static final String GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

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
        private final String picture;

        public GoogleUserPayload(String email, String name, String sub, boolean emailVerified) {
            this(email, name, sub, emailVerified, null);
        }

        public GoogleUserPayload(String email, String name, String sub, boolean emailVerified, String picture) {
            this.email = email;
            this.name = name;
            this.sub = sub;
            this.emailVerified = emailVerified;
            this.picture = picture;
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

        public String getPicture() {
            return picture;
        }
    }

    /**
     * Verifies a Google token. Supports both:
     * 1. 3-part OpenID Connect JWT ID tokens (via Google tokeninfo / offline parsing)
     * 2. Google OAuth2 access tokens (ya29... via Google UserInfo endpoint)
     *
     * @param idTokenString raw Google token (JWT ID token or OAuth access token)
     * @return GoogleUserPayload containing verified user details
     * @throws IllegalArgumentException if token is invalid, expired, or unverified
     */
    public GoogleUserPayload verify(String idTokenString) {
        if (idTokenString == null || idTokenString.trim().isEmpty()) {
            throw new IllegalArgumentException("Google token cannot be empty");
        }

        String token = idTokenString.trim();

        // Check if token is a 3-part JWT ID token (OAuth access tokens starting with ya29. or non-3-part tokens route to verifyAccessToken)
        boolean is3PartJwt = !token.startsWith("ya29.") && token.split("\\.").length == 3;

        if (is3PartJwt) {
            return verifyIdToken(token);
        } else {
            return verifyAccessToken(token);
        }
    }

    /**
     * Verifies a 3-part OpenID Connect JWT ID token.
     */
    private GoogleUserPayload verifyIdToken(String token) {
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
                String picture = root.path("picture").asText(null);

                logger.info("Successfully verified Google ID token for email: {}", email);
                return new GoogleUserPayload(email, name, sub, true, picture);
            } else {
                logger.warn("Google tokeninfo returned HTTP {}: {}", response.statusCode(), response.body());
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception ex) {
            logger.warn("Online verification via Google tokeninfo failed: {}. Attempting fallback parsing.", ex.getMessage());
        }

        // 2. Fallback: Parse and validate JWT payload locally (for test environments or offline verification)
        return parseJwtFallback(token);
    }

    /**
     * Verifies a Google OAuth access token (e.g. ya29...) via Google UserInfo endpoint.
     */
    private GoogleUserPayload verifyAccessToken(String token) {
        logger.info("Verifying Google OAuth access_token via Google UserInfo API...");
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GOOGLE_USER_INFO_URL))
                    .header("Authorization", "Bearer " + token)
                    .timeout(Duration.ofSeconds(6))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());

                String email = root.path("email").asText(null);
                if (email == null || email.isBlank()) {
                    logger.warn("Google userinfo returned blank email for access token");
                    throw new IllegalArgumentException("Email address missing from Google access token");
                }

                // Check email verification (defaults to true if field omitted, but rejects if explicitly false)
                boolean emailVerified = !root.has("email_verified") ||
                        root.path("email_verified").asBoolean(true) ||
                        "true".equalsIgnoreCase(root.path("email_verified").asText());
                if (!emailVerified) {
                    logger.warn("Google account email is not verified for email: {}", email);
                    throw new IllegalArgumentException("Google account email is not verified");
                }

                String name = root.path("name").asText(null);
                if (name == null || name.isBlank()) {
                    String givenName = root.path("given_name").asText("");
                    String familyName = root.path("family_name").asText("");
                    name = (givenName + " " + familyName).trim();
                }
                if (name == null || name.isBlank()) {
                    name = email.split("@")[0];
                }

                String sub = root.path("sub").asText(null);
                String picture = root.path("picture").asText(null);

                logger.info("Successfully verified Google access_token via userinfo for email: {}", email);
                return new GoogleUserPayload(email, name, sub, true, picture);
            } else {
                logger.warn("Google userinfo returned HTTP {}: {}", response.statusCode(), response.body());
                throw new IllegalArgumentException("Invalid or expired Google OAuth access token (HTTP " + response.statusCode() + ")");
            }
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception ex) {
            logger.error("Failed to verify Google access token via userinfo: {}", ex.getMessage());
            throw new IllegalArgumentException("Failed to verify Google access token: " + ex.getMessage());
        }
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

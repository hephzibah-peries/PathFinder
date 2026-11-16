package com.pathfinder.backend.config;

import com.pathfinder.backend.service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.*;

public class JwtAuthenticationFilterTest {

    private JwtAuthenticationFilter filter;
    private StubJwtService jwtService;

    static class StubJwtService extends JwtService {
        boolean throwExpired = false;
        boolean throwMalformed = false;
        boolean validToken = true;
        String usernameToReturn = "student@university.edu";

        @Override
        public String extractUsername(String token) {
            if (throwExpired) {
                throw new ExpiredJwtException(null, null, "Token has expired");
            }
            if (throwMalformed) {
                throw new MalformedJwtException("Token format is invalid");
            }
            return usernameToReturn;
        }

        @Override
        public boolean isTokenValid(String token, String username) {
            return validToken;
        }

        @Override
        public <T> T extractClaim(String token, java.util.function.Function<io.jsonwebtoken.Claims, T> claimsResolver) {
            return (T) "ROLE_STUDENT";
        }
    }

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        jwtService = new StubJwtService();
        filter = new JwtAuthenticationFilter(jwtService);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testExpiredJwtExceptionHandledGracefully() throws Exception {
        jwtService.throwExpired = true;

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/public/db-status");
        request.addHeader("Authorization", "Bearer expired.jwt.token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        assertDoesNotThrow(() -> filter.doFilter(request, response, filterChain));
        assertNull(SecurityContextHolder.getContext().getAuthentication(), "Authentication must not be set on expired token");
    }

    @Test
    void testMalformedJwtExceptionHandledGracefully() throws Exception {
        jwtService.throwMalformed = true;

        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.addHeader("Authorization", "Bearer corrupted-jwt-string");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        assertDoesNotThrow(() -> filter.doFilter(request, response, filterChain));
        assertNull(SecurityContextHolder.getContext().getAuthentication(), "Authentication must not be set on malformed token");
    }

    @Test
    void testValidTokenSetsAuthentication() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/students/me");
        request.addHeader("Authorization", "Bearer valid.jwt.token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        filter.doFilter(request, response, filterChain);

        assertNotNull(SecurityContextHolder.getContext().getAuthentication());
        assertEquals("student@university.edu", SecurityContextHolder.getContext().getAuthentication().getName());
    }

    @Test
    void testNoAuthorizationHeaderPassesThrough() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/public/db-status");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain filterChain = new MockFilterChain();

        filter.doFilter(request, response, filterChain);

        assertNull(SecurityContextHolder.getContext().getAuthentication());
    }
}

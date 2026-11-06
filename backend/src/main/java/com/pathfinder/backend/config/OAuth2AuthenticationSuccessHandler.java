package com.pathfinder.backend.config;

import com.pathfinder.backend.entity.StudentProfile;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.enums.UserRole;
import com.pathfinder.backend.repository.StudentProfileRepository;
import com.pathfinder.backend.repository.UserRepository;
import com.pathfinder.backend.service.JwtService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public OAuth2AuthenticationSuccessHandler(JwtService jwtService,
                                              UserRepository userRepository,
                                              StudentProfileRepository studentProfileRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        try {
            if (authentication == null || !(authentication.getPrincipal() instanceof OAuth2User)) {
                logger.error("Authentication or principal is not of type OAuth2User");
                redirectWithError(request, response, "Invalid authentication credentials");
                return;
            }

            OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
            
            // 1. Safe extraction of email
            String email = oAuth2User.getAttribute("email");
            if (email == null || email.isBlank()) {
                String sub = oAuth2User.getAttribute("sub");
                if (sub != null && !sub.isBlank()) {
                    email = sub + "@oauth2.google.com";
                }
            }

            if (email == null || email.isBlank()) {
                logger.error("Could not extract email from Google OAuth2 attributes: {}", oAuth2User.getAttributes());
                redirectWithError(request, response, "Email attribute missing from Google account");
                return;
            }

            // 2. Safe extraction of user name
            String name = oAuth2User.getAttribute("name");
            if (name == null || name.isBlank()) {
                String givenName = oAuth2User.getAttribute("given_name");
                String familyName = oAuth2User.getAttribute("family_name");
                if (givenName != null || familyName != null) {
                    name = ((givenName != null ? givenName : "") + " " + (familyName != null ? familyName : "")).trim();
                }
            }
            if (name == null || name.isBlank()) {
                name = email.contains("@") ? email.split("@")[0] : "Student User";
            }

            // 3. Check if user exists before saving
            Optional<User> existingUserOpt = userRepository.findByEmail(email);
            User user;
            if (existingUserOpt.isPresent()) {
                user = existingUserOpt.get();
                logger.info("Existing OAuth2 user logged in: {}", email);
            } else {
                logger.info("Auto-provisioning new OAuth2 student user: {}", email);
                User newUser = new User(
                        email,
                        passwordEncoder.encode(UUID.randomUUID().toString()),
                        UserRole.STUDENT
                );
                user = userRepository.save(newUser);
                logger.info("Saved new OAuth2 student user with ID: {}", user.getId());
            }

            // 4. Ensure StudentProfile exists (non-blocking)
            if (user.getRole() == UserRole.STUDENT) {
                try {
                    Optional<StudentProfile> profileOpt = studentProfileRepository.findByUserId(user.getId());
                    if (profileOpt.isEmpty()) {
                        StudentProfile profile = StudentProfile.builder()
                                .user(user)
                                .fullName(name)
                                .build();
                        studentProfileRepository.save(profile);
                        logger.info("Created StudentProfile for user ID {}: {}", user.getId(), name);
                    }
                } catch (Exception profileEx) {
                    logger.warn("Could not auto-create StudentProfile for {}: {}", email, profileEx.getMessage());
                }
            }

            // 5. Generate application JWT token
            String roleStr = user.getRole() != null ? user.getRole().name() : UserRole.STUDENT.name();
            String token = jwtService.generateToken(user.getEmail(), roleStr);

            // 6. Clean redirect to React frontend
            String targetUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/oauth2/redirect")
                    .queryParam("token", token)
                    .queryParam("email", user.getEmail())
                    .queryParam("role", roleStr)
                    .build().toUriString();

            logger.info("OAuth2 login completed successfully for {}. Redirecting to: {}", user.getEmail(), targetUrl);

            clearAuthenticationAttributes(request);
            if (response.isCommitted()) {
                logger.debug("Response already committed. Unable to redirect to: {}", targetUrl);
                return;
            }
            getRedirectStrategy().sendRedirect(request, response, targetUrl);

        } catch (Exception ex) {
            logger.error("Unhandled exception during OAuth2 authentication callback: {}", ex.getMessage(), ex);
            redirectWithError(request, response, "OAuth2 login error: " + ex.getMessage());
        }
    }

    private void redirectWithError(HttpServletRequest request, HttpServletResponse response, String errorMessage) throws IOException {
        if (!response.isCommitted()) {
            String errorUrl = UriComponentsBuilder.fromUriString("http://localhost:5173/login")
                    .queryParam("error", errorMessage)
                    .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
        }
    }
}

package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.AuthResponse;
import com.pathfinder.backend.dto.ForgotPasswordRequest;
import com.pathfinder.backend.dto.GoogleLoginRequest;
import com.pathfinder.backend.dto.LoginRequest;
import com.pathfinder.backend.dto.RegisterRequest;
import com.pathfinder.backend.dto.ResetPasswordRequest;
import com.pathfinder.backend.entity.StudentProfile;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.enums.UserRole;
import com.pathfinder.backend.repository.StudentProfileRepository;
import com.pathfinder.backend.repository.UserRepository;
import com.pathfinder.backend.security.GoogleIdTokenVerifier;
import com.pathfinder.backend.security.GoogleIdTokenVerifier.GoogleUserPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final GoogleIdTokenVerifier googleIdTokenVerifier;
    private final NotificationService notificationService;

    public AuthService(UserRepository userRepository,
                       StudentProfileRepository studentProfileRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       GoogleIdTokenVerifier googleIdTokenVerifier,
                       NotificationService notificationService) {
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.googleIdTokenVerifier = googleIdTokenVerifier;
        this.notificationService = notificationService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already taken!");
        }

        User user = new User(
            request.getEmail(),
            passwordEncoder.encode(request.getPassword()),
            request.getRole()
        );

        userRepository.save(user);

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(), user.getRole().name());
    }

    public AuthResponse loginWithGoogle(GoogleLoginRequest request) {
        GoogleUserPayload payload = googleIdTokenVerifier.verify(request.getIdToken());
        if (payload == null || payload.getEmail() == null || payload.getEmail().isBlank()) {
            throw new IllegalArgumentException("Unable to extract verified user from Google token");
        }

        String email = payload.getEmail().trim().toLowerCase();
        String name = payload.getName();
        if (name == null || name.isBlank()) {
            name = email.split("@")[0];
        }

        // Find existing user or auto-provision new STUDENT user
        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        User user;
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (user.getRole() == null) {
                user.setRole(UserRole.STUDENT);
                user = userRepository.save(user);
            }
            logger.info("Existing user logged in via Google: {}", email);
        } else {
            logger.info("Auto-provisioning new student user from Google login: {}", email);
            User newUser = new User(
                    email,
                    passwordEncoder.encode(UUID.randomUUID().toString()),
                    UserRole.STUDENT
            );
            user = userRepository.save(newUser);
        }

        // Ensure StudentProfile exists for student users
        if (user.getRole() == UserRole.STUDENT) {
            try {
                if (studentProfileRepository.findByUserId(user.getId()).isEmpty()) {
                    StudentProfile.Builder profileBuilder = StudentProfile.builder()
                            .user(user)
                            .fullName(name);
                    if (payload.getPicture() != null && !payload.getPicture().isBlank()) {
                        profileBuilder.profilePicture(payload.getPicture());
                    }
                    StudentProfile profile = profileBuilder.build();
                    studentProfileRepository.save(profile);
                    logger.info("Auto-created StudentProfile for user: {}", email);
                }
            } catch (Exception ex) {
                logger.warn("Could not auto-create StudentProfile for {}: {}", email, ex.getMessage());
            }
        }

        String roleStr = user.getRole() != null ? user.getRole().name() : UserRole.STUDENT.name();
        String token = jwtService.generateToken(user.getEmail(), roleStr);
        return new AuthResponse(token, user.getEmail(), roleStr);
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return;
        }

        String email = request.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent()) {
            String token = jwtService.generatePasswordResetToken(email);
            String resetLink = notificationService.getFrontendBaseUrl() + "/reset-password?token=" +
                    java.net.URLEncoder.encode(token, java.nio.charset.StandardCharsets.UTF_8);
            notificationService.sendPasswordResetEmail(email, resetLink);
            logger.info("Sent password reset link to: {}", email);
        } else {
            logger.info("Password reset requested for non-existent email: {}", email);
        }
    }

    public void resetPassword(ResetPasswordRequest request) {
        if (request == null || request.getToken() == null || request.getToken().isBlank()) {
            throw new IllegalArgumentException("Reset token is required");
        }
        if (request.getNewPassword() == null || request.getNewPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }

        String email = jwtService.validatePasswordResetToken(request.getToken());
        if (email == null) {
            throw new IllegalArgumentException("Invalid or expired password reset token. Please request a new link.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        logger.info("Password successfully reset for user: {}", email);
    }

    public User getUserByEmail(String email) {
        if (email == null || email.isBlank()) {
            return null;
        }
        return userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
    }
}

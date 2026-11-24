package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.StudentProfileDto;
import com.pathfinder.backend.entity.StudentProfile;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.repository.StudentProfileRepository;
import com.pathfinder.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.Base64;

@Service
public class StudentProfileService {

    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;

    public StudentProfileService(StudentProfileRepository studentProfileRepository, UserRepository userRepository) {
        this.studentProfileRepository = studentProfileRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public StudentProfileDto getProfileByEmail(String email) {
        if (email == null || email.isBlank()) {
            return StudentProfileDto.builder().build();
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return StudentProfileDto.builder().email(email).build();
        }

        StudentProfile profile = studentProfileRepository.findByUserId(user.getId())
                .orElse(null);

        if (profile == null) {
            return StudentProfileDto.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .build();
        }

        return mapToDto(profile);
    }

    @Transactional
    public StudentProfileDto updateProfile(String email, StudentProfileDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        StudentProfile profile = studentProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> StudentProfile.builder().user(user).build());

        if (dto.getFullName() != null) profile.setFullName(dto.getFullName());
        if (dto.getUniversity() != null) profile.setUniversity(dto.getUniversity());
        if (dto.getGpa() != null) profile.setGpa(dto.getGpa());
        if (dto.getBio() != null) profile.setBio(dto.getBio());
        if (dto.getSkills() != null) profile.setSkills(dto.getSkills());
        if (dto.getPreferredLocation() != null) profile.setPreferredLocation(dto.getPreferredLocation());
        if (dto.getPreferredWorkMode() != null) profile.setPreferredWorkMode(dto.getPreferredWorkMode());
        if (dto.getProfilePicture() != null) {
            profile.setProfilePicture(dto.getProfilePicture());
        }

        return mapToDto(studentProfileRepository.save(profile));
    }

    @Transactional
    public StudentProfileDto uploadProfilePicture(String email, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File must not be empty");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Uploaded file must be an image");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        StudentProfile profile = studentProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> StudentProfile.builder().user(user).build());

        try {
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            String dataUrl = "data:" + contentType + ";base64," + base64;
            profile.setProfilePicture(dataUrl);
            return mapToDto(studentProfileRepository.save(profile));
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to read image bytes", e);
        }
    }

    private StudentProfileDto mapToDto(StudentProfile profile) {
        Long userId = profile.getUser() != null ? profile.getUser().getId() : null;
        String email = profile.getUser() != null ? profile.getUser().getEmail() : null;
        return StudentProfileDto.builder()
                .id(profile.getId())
                .userId(userId)
                .email(email)
                .fullName(profile.getFullName())
                .university(profile.getUniversity())
                .gpa(profile.getGpa())
                .bio(profile.getBio())
                .skills(profile.getSkills())
                .preferredLocation(profile.getPreferredLocation())
                .preferredWorkMode(profile.getPreferredWorkMode())
                .profilePicture(profile.getProfilePicture())
                .build();
    }
}
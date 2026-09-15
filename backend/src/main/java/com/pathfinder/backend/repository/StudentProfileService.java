package com.pathfinder.backend.service;

import com.pathfinder.backend.dto.StudentProfileDto;
import com.pathfinder.backend.entity.StudentProfile;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.repository.StudentProfileRepository;
import com.pathfinder.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StudentProfileService {

    private final StudentProfileRepository studentProfileRepository;
    private final UserRepository userRepository;

    public StudentProfileDto getProfileByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        StudentProfile profile = studentProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> studentProfileRepository.save(
                        StudentProfile.builder().user(user).build()
                ));

        return mapToDto(profile);
    }

    public StudentProfileDto updateProfile(String email, StudentProfileDto dto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        StudentProfile profile = studentProfileRepository.findByUserId(user.getId())
                .orElse(StudentProfile.builder().user(user).build());

        profile.setFullName(dto.getFullName());
        profile.setUniversity(dto.getUniversity());
        profile.setGpa(dto.getGpa());
        profile.setBio(dto.getBio());
        profile.setPreferredLocation(dto.getPreferredLocation());
        profile.setPreferredWorkMode(dto.getPreferredWorkMode());

        return mapToDto(studentProfileRepository.save(profile));
    }

    private StudentProfileDto mapToDto(StudentProfile profile) {
        return StudentProfileDto.builder()
                .id(profile.getId())
                .userId(profile.getUser().getId())
                .email(profile.getUser().getEmail())
                .fullName(profile.getFullName())
                .university(profile.getUniversity())
                .gpa(profile.getGpa())
                .bio(profile.getBio())
                .preferredLocation(profile.getPreferredLocation())
                .preferredWorkMode(profile.getPreferredWorkMode())
                .build();
    }
}
package com.pathfinder.backend.config;

import com.pathfinder.backend.entity.CompanyProfile;
import com.pathfinder.backend.entity.Internship;
import com.pathfinder.backend.entity.StudentProfile;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.enums.UserRole;
import com.pathfinder.backend.repository.CompanyProfileRepository;
import com.pathfinder.backend.repository.InternshipRepository;
import com.pathfinder.backend.repository.StudentProfileRepository;
import com.pathfinder.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Profile("dev")
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final CompanyProfileRepository companyProfileRepository;
    private final InternshipRepository internshipRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository,
                      StudentProfileRepository studentProfileRepository,
                      CompanyProfileRepository companyProfileRepository,
                      InternshipRepository internshipRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.companyProfileRepository = companyProfileRepository;
        this.internshipRepository = internshipRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        log.info("Checking H2 in-memory seed data for development profile...");

        // 1. Seed Demo Student
        if (userRepository.findByEmail("student@university.edu").isEmpty()) {
            User studentUser = new User(
                    "student@university.edu",
                    passwordEncoder.encode("Password123!"),
                    UserRole.STUDENT
            );
            studentUser = userRepository.save(studentUser);

            StudentProfile studentProfile = StudentProfile.builder()
                    .user(studentUser)
                    .fullName("Alex Perera")
                    .university("University of Colombo")
                    .degree("BSc (Hons) in Computer Science")
                    .gpa(3.85)
                    .skills("Java, Spring Boot, React, TypeScript, PostgreSQL, Docker, REST API")
                    .bio("Final-year Computer Science undergraduate passionate about building resilient full-stack applications and cloud microservices.")
                    .preferredLocation("Colombo, Sri Lanka")
                    .preferredWorkMode("Hybrid")
                    .build();
            studentProfileRepository.save(studentProfile);
            log.info("Seeded demo student user: student@university.edu / Password123!");
        }

        // 2. Seed Demo Company & Internships
        if (userRepository.findByEmail("company@techcorp.com").isEmpty()) {
            User companyUser = new User(
                    "company@techcorp.com",
                    passwordEncoder.encode("Password123!"),
                    UserRole.COMPANY
            );
            companyUser = userRepository.save(companyUser);

            CompanyProfile companyProfile = new CompanyProfile(
                    null,
                    companyUser,
                    "Virtusa Innovations",
                    "Software & Cloud Solutions",
                    "Global enterprise consulting and digital engineering solutions provider.",
                    "https://www.virtusa.com",
                    true
            );
            companyProfile = companyProfileRepository.save(companyProfile);
            log.info("Seeded demo company user: company@techcorp.com / Password123!");

            // Sample Internship 1: Full-Stack Engineer
            Internship intern1 = new Internship(
                    null,
                    companyProfile,
                    "Associate Full-Stack Java Engineer Intern",
                    "Join our digital core team to build high-scale financial technology APIs and interactive React dashboards.",
                    "Colombo, Sri Lanka",
                    "Hybrid",
                    "Proficiency in Java, Spring Boot, React, and REST API architectural patterns.",
                    "Java, Spring Boot, React, REST API",
                    "LKR 75,000 / mo",
                    "2026-12-31",
                    LocalDateTime.now()
            );
            internshipRepository.save(intern1);

            // Sample Internship 2: Cloud DevOps Engineer
            Internship intern2 = new Internship(
                    null,
                    companyProfile,
                    "Cloud Infrastructure & DevOps Intern",
                    "Work with our site reliability team implementing Kubernetes orchestration and automated CI/CD pipelines.",
                    "Colombo, Sri Lanka",
                    "Remote",
                    "Hands-on experience with Docker, CI/CD, Linux, and PostgreSQL databases.",
                    "Docker, CI/CD, PostgreSQL, Linux",
                    "LKR 80,000 / mo",
                    "2026-12-31",
                    LocalDateTime.now()
            );
            internshipRepository.save(intern2);
            log.info("Seeded 2 sample internships under Virtusa Innovations.");
        }

        // 3. Seed Demo Admin
        if (userRepository.findByEmail("admin@pathfinder.com").isEmpty()) {
            User adminUser = new User(
                    "admin@pathfinder.com",
                    passwordEncoder.encode("Password123!"),
                    UserRole.ADMIN
            );
            userRepository.save(adminUser);
            log.info("Seeded demo admin user: admin@pathfinder.com / Password123!");
        }

        log.info("""
            ========================================================================
            [PathFinder DEV] In-Memory Database Seeded Successfully!
              Student: student@university.edu  / Password123!
              Company: company@techcorp.com   / Password123!
              Admin:   admin@pathfinder.com     / Password123!
            ========================================================================
            """);
    }
}

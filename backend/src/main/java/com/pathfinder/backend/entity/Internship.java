package com.pathfinder.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "internships")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Internship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private CompanyProfile company;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    private String location;
    private String workMode;
    
    @Column(columnDefinition = "TEXT")
    private String requirements;

    private String stipend;
    private String deadline;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
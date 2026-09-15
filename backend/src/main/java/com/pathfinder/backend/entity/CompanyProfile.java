package com.pathfinder.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "company_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CompanyProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    private String companyName;
    private String industry;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String website;

    @Builder.Default
    private Boolean verified = false;
}
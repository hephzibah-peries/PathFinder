package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.ResumeAnalysisDto;
import com.pathfinder.backend.dto.SkillDiagnosisRequest;
import com.pathfinder.backend.dto.SkillDiagnosisResponse;
import com.pathfinder.backend.dto.StudentResumeDto;
import com.pathfinder.backend.service.ResumeService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ResumeAnalysisDto> analyzeResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "internshipId", required = false) Long internshipId) {
        return ResponseEntity.ok(resumeService.analyzeResume(file, internshipId));
    }

    @GetMapping("/my-resumes")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<List<StudentResumeDto>> getMyResumes(Authentication authentication) {
        return ResponseEntity.ok(resumeService.getStudentResumes(authentication.getName()));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<StudentResumeDto> uploadResume(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(resumeService.uploadStudentResume(authentication.getName(), file));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<Void> deleteResume(
            Authentication authentication,
            @PathVariable Long id) {
        resumeService.deleteStudentResume(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/file")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<byte[]> getResumeFile(
            Authentication authentication,
            @PathVariable Long id) {
        return resumeService.getStudentResumeFile(authentication.getName(), id);
    }

    @PostMapping("/diagnose")
    @PreAuthorize("hasRole('STUDENT') or hasRole('ADMIN')")
    public ResponseEntity<SkillDiagnosisResponse> diagnoseSkillGap(
            Authentication authentication,
            @RequestBody SkillDiagnosisRequest request) {
        return ResponseEntity.ok(resumeService.diagnoseSkillGap(authentication.getName(), request));
    }
}


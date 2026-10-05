package com.pathfinder.backend.controller;

import com.pathfinder.backend.dto.ResumeAnalysisDto;
import com.pathfinder.backend.service.ResumeService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeAnalysisDto> analyzeResume(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "internshipId", required = false) Long internshipId) {
        return ResponseEntity.ok(resumeService.analyzeResume(file, internshipId));
    }
}

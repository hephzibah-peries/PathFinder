package com.pathfinder.backend.service;

import com.pathfinder.backend.entity.Internship;
import com.pathfinder.backend.repository.InternshipRepository;
import org.junit.jupiter.api.Test;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ResumeServiceTest {

    @Test
    void extractsTextFromPdfResume() throws Exception {
        byte[] pdf;
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);
            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                content.beginText();
                content.setFont(PDType1Font.HELVETICA, 12);
                content.newLineAtOffset(50, 700);
                content.showText("Java developer with Spring Boot experience");
                content.endText();
            }
            document.save(output);
            pdf = output.toByteArray();
        }

        ResumeService resumeService = new ResumeService(mock(InternshipRepository.class));
        MockMultipartFile resume = new MockMultipartFile("file", "resume.pdf", "application/pdf", pdf);

        var result = resumeService.analyzeResume(resume, null);

        assertTrue(result.getExtractedText().contains("Java developer with Spring Boot experience"));
        assertTrue(result.getExtractedSkills().contains("Java"));
        assertTrue(result.getExtractedSkills().contains("Spring Boot"));
    }

    @Test
    void extractsSkillsAndCalculatesTargetInternshipGap() {
        InternshipRepository internshipRepository = mock(InternshipRepository.class);
        when(internshipRepository.findById(42L)).thenReturn(Optional.of(Internship.builder()
                .skills("Java, Docker")
                .requirements("Must know SQL and Java")
                .build()));
        ResumeService resumeService = new ResumeService(internshipRepository);
        MockMultipartFile resume = new MockMultipartFile(
                "file",
                "resume.txt",
                "text/plain",
                "Experienced with Spring Boot, React, and SQL.".getBytes(StandardCharsets.UTF_8));

        var result = resumeService.analyzeResume(resume, 42L);

        assertEquals("Experienced with Spring Boot, React, and SQL.", result.getExtractedText());
        assertEquals(3, result.getExtractedSkills().size());
        assertTrue(result.getExtractedSkills().contains("Spring Boot"));
        assertTrue(result.getExtractedSkills().contains("React"));
        assertTrue(result.getExtractedSkills().contains("SQL"));
        assertEquals(100.0 / 3.0, result.getMatchScore(), 0.0001);
        assertEquals(List.of("Java", "Docker"), result.getMissingSkills());
    }

    @Test
    void returnsExtractionWithoutSkillGapWhenInternshipIsNotProvided() {
        ResumeService resumeService = new ResumeService(mock(InternshipRepository.class));
        MockMultipartFile resume = new MockMultipartFile(
                "file", "resume.txt", "text/plain", "Java and Spring Boot".getBytes(StandardCharsets.UTF_8));

        var result = resumeService.analyzeResume(resume, null);

        assertEquals(0.0, result.getMatchScore());
        assertEquals(List.of(), result.getMissingSkills());
    }

    @Test
    void rejectsEmptyResume() {
        ResumeService resumeService = new ResumeService(mock(InternshipRepository.class));
        MockMultipartFile resume = new MockMultipartFile("file", "resume.pdf", "application/pdf", new byte[0]);

        assertThrows(ResponseStatusException.class, () -> resumeService.analyzeResume(resume, null));
    }
}

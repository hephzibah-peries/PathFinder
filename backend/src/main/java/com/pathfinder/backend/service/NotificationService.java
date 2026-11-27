package com.pathfinder.backend.service;

import com.pathfinder.backend.entity.Application;
import com.pathfinder.backend.entity.Internship;
import com.pathfinder.backend.entity.Notification;
import com.pathfinder.backend.entity.StudentProfile;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.repository.NotificationRepository;
import com.pathfinder.backend.repository.StudentProfileRepository;
import com.pathfinder.backend.repository.UserRepository;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Value("${brevo.api.key:}")
    private String brevoApiKey;

    @Value("${mail.from.email:${spring.mail.username:}}")
    private String mailFromEmail;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               StudentProfileRepository studentProfileRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
    }

    @Transactional
    public Notification createInAppNotification(Long userId, String title, String message, String type, String link) {
        if (userId == null) return null;
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .link(link)
                .isRead(false)
                .build();
        return notificationRepository.save(notification);
    }

    public void notifyApplicationStatusChange(Application application, String newStatus, String note) {
        notifyApplicationStatusChange(application, newStatus, note, null);
    }

    public void notifyApplicationStatusChange(Application application, String newStatus, String note, String recipientEmail) {
        if (application == null || application.getStudent() == null) return;

        StudentProfile student = application.getStudent();
        User studentUser = student.getUser();
        if (studentUser == null) return;

        String studentName = student.getFullName() != null && !student.getFullName().isBlank()
                ? student.getFullName()
                : (studentUser.getEmail() != null ? studentUser.getEmail().split("@")[0] : "Student");

        String internshipTitle = application.getInternship() != null ? application.getInternship().getTitle() : "Internship";
        String companyName = (application.getInternship() != null && application.getInternship().getCompany() != null)
                ? application.getInternship().getCompany().getCompanyName()
                : "Company";

        String normStatus = newStatus != null ? newStatus.toUpperCase() : "PENDING";
        String title;
        String message;
        String emailSubject;
        String emailHtml;

        String noteSection = (note != null && !note.trim().isBlank())
                ? "<div style=\"margin: 16px 0; padding: 14px 18px; background-color: #FAF6F4; border-left: 4px solid #7A4B43; border-radius: 8px;\">" +
                  "<strong style=\"color: #2B1B17; font-size: 13px;\">Note from " + escapeHtml(companyName) + " Hiring Team:</strong>" +
                  "<p style=\"margin: 6px 0 0 0; color: #554440; font-size: 14px;\">\"" + escapeHtml(note.trim()) + "\"</p>" +
                  "</div>"
                : "";

        if ("SHORTLISTED".equals(normStatus) || "APPROVED".equals(normStatus)) {
            title = "🎉 Congratulations! You have been Shortlisted!";
            message = "Great news! " + companyName + " has shortlisted your application for " + internshipTitle + ". Our team will contact you soon regarding the next steps." +
                    (note != null && !note.isBlank() ? " Note: " + note : "");
            emailSubject = "🎉 Application Shortlisted: " + internshipTitle + " at " + companyName;
            emailHtml = buildEmailTemplate(
                    studentName,
                    "Application Shortlisted!",
                    "<p style=\"font-size: 15px; color: #2B1B17; line-height: 1.6;\">Congratulations! <strong>" + escapeHtml(companyName) + "</strong> has reviewed your application for <strong>" + escapeHtml(internshipTitle) + "</strong> and you have been <strong>Shortlisted</strong>.</p>" +
                    "<p style=\"font-size: 14px; color: #2D6A4F; font-weight: 600; line-height: 1.6;\">Our team will contact you soon regarding the next steps.</p>" +
                    noteSection,
                    frontendUrl + "/student/applications",
                    "View My Applications"
            );
        } else if ("INTERVIEW".equals(normStatus)) {
            title = "📅 Interview Invitation from " + companyName;
            message = companyName + " has scheduled an interview stage for " + internshipTitle + ". Our hiring team will contact you shortly to confirm your interview schedule." +
                    (note != null && !note.isBlank() ? " Note: " + note : "");
            emailSubject = "📅 Interview Stage: " + internshipTitle + " at " + companyName;
            emailHtml = buildEmailTemplate(
                    studentName,
                    "You've Moved to the Interview Stage!",
                    "<p style=\"font-size: 15px; color: #2B1B17; line-height: 1.6;\">Exciting progress! <strong>" + escapeHtml(companyName) + "</strong> has selected you for the interview round for <strong>" + escapeHtml(internshipTitle) + "</strong>.</p>" +
                    "<p style=\"font-size: 14px; color: #4A6D88; font-weight: 600; line-height: 1.6;\">Our hiring team will contact you shortly to confirm your interview schedule.</p>" +
                    noteSection,
                    frontendUrl + "/student/applications",
                    "Check Application Status"
            );
        } else if ("REJECTED".equals(normStatus)) {
            title = "Application Update: " + internshipTitle;
            message = "Thank you for applying to " + internshipTitle + " at " + companyName + ". Unfortunately, they will not be proceeding with your application at this time.";
            emailSubject = "Application Status Update: " + internshipTitle + " at " + companyName;
            emailHtml = buildEmailTemplate(
                    studentName,
                    "Application Update",
                    "<p style=\"font-size: 15px; color: #2B1B17; line-height: 1.6;\">Thank you for taking the time to apply for <strong>" + escapeHtml(internshipTitle) + "</strong> at <strong>" + escapeHtml(companyName) + "</strong>.</p>" +
                    "<p style=\"font-size: 14px; color: #7A6A65; line-height: 1.6;\">After careful review, the hiring team has decided not to move forward with your application for this specific position at this time.</p>" +
                    "<p style=\"font-size: 14px; color: #7A6A65; line-height: 1.6;\">We encourage you to explore other internship opportunities on PathFinder that match your profile.</p>" +
                    noteSection,
                    frontendUrl + "/student/internships",
                    "Explore More Internships"
            );
        } else {
            title = "Application Status: " + normStatus;
            message = "Your application status for " + internshipTitle + " at " + companyName + " was updated to " + normStatus + ".";
            emailSubject = "Application Status Update: " + internshipTitle;
            emailHtml = buildEmailTemplate(
                    studentName,
                    "Application Status Updated",
                    "<p style=\"font-size: 15px; color: #2B1B17; line-height: 1.6;\">Your application for <strong>" + escapeHtml(internshipTitle) + "</strong> at <strong>" + escapeHtml(companyName) + "</strong> has been updated to <strong>" + escapeHtml(normStatus) + "</strong>.</p>" +
                    noteSection,
                    frontendUrl + "/student/applications",
                    "View Application"
            );
        }

        // 1. Create in-app notification immediately
        try {
            createInAppNotification(studentUser.getId(), title, message, "APPLICATION_UPDATE", "/student/applications");
        } catch (Exception ex) {
            log.error("Failed to save in-app notification for user {}: {}", studentUser.getId(), ex.getMessage());
        }

        // 2. Send async email alert directly to resolved CV email (fallback to account email)
        String targetEmail = (recipientEmail != null && !recipientEmail.trim().isBlank())
                ? recipientEmail.trim()
                : (studentUser.getEmail() != null ? studentUser.getEmail().trim() : null);

        if (targetEmail != null && !targetEmail.isBlank()) {
            sendEmailAsync(targetEmail, emailSubject, emailHtml);
        }
    }

    public void notifyNewInternship(Internship internship) {
        if (internship == null) return;
        String title = internship.getTitle() != null ? internship.getTitle() : "Internship";
        String companyName = internship.getCompany() != null ? internship.getCompany().getCompanyName() : "Company";

        String notifTitle = "🚀 New Internship: " + title;
        String notifMessage = companyName + " just posted a new opportunity: " + title + ". Check requirements and apply now!";

        // Notify active students
        try {
            List<StudentProfile> students = studentProfileRepository.findAll();
            for (StudentProfile student : students) {
                if (student.getUser() != null) {
                    createInAppNotification(student.getUser().getId(), notifTitle, notifMessage, "NEW_INTERNSHIP", "/student/internships");
                }
            }
        } catch (Exception e) {
            log.error("Failed to notify students of new internship: {}", e.getMessage());
        }
    }

    public String getFrontendBaseUrl() {
        String base = (this.frontendUrl != null && !this.frontendUrl.isBlank())
                ? this.frontendUrl
                : "http://localhost:5173";
        String env = System.getenv("FRONTEND_URL");
        if (env != null && !env.isBlank()) {
            base = env;
        }
        return base.replaceAll("/+$", "");
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        String subject = "Reset Your PathFinder Password";
        String body = "<p style=\"font-size: 15px; color: #2B1B17; line-height: 1.6;\">We received a request to reset your password for your PathFinder account.</p>" +
                "<p style=\"font-size: 14px; color: #7A6A65; line-height: 1.6;\">Click the button below to choose a new password. This link is valid for <strong>30 minutes</strong>.</p>" +
                "<p style=\"font-size: 13px; color: #7A6A65; line-height: 1.6; margin-top: 16px;\">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>";

        String recipientName = (toEmail != null && toEmail.contains("@")) ? toEmail.split("@")[0] : "User";
        String htmlContent = buildEmailTemplate(recipientName, "Password Reset Request", body, resetLink, "Reset Password");
        sendEmailAsync(toEmail, subject, htmlContent);
    }

    @Async
    public void sendEmailAsync(String toEmail, String subject, String htmlContent) {
        String fromEmail = (mailFromEmail != null && !mailFromEmail.trim().isBlank())
                ? mailFromEmail.trim()
                : ((mailUsername != null && !mailUsername.trim().isBlank()) ? mailUsername.trim() : "noreply@pathfinder.com");

        // Priority 1: HTTPS API (Brevo / Sendinblue) - works on Render free tier where outbound SMTP (587/465) is blocked
        if (brevoApiKey != null && !brevoApiKey.trim().isBlank()) {
            try {
                RestTemplate restTemplate = new RestTemplate();
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("api-key", brevoApiKey.trim());

                Map<String, Object> payload = new HashMap<>();
                Map<String, String> sender = new HashMap<>();
                sender.put("name", "PathFinder");
                sender.put("email", fromEmail);
                payload.put("sender", sender);

                Map<String, String> recipient = new HashMap<>();
                recipient.put("email", toEmail);
                payload.put("to", List.of(recipient));

                payload.put("subject", subject);
                payload.put("htmlContent", htmlContent);

                HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);
                ResponseEntity<String> response = restTemplate.postForEntity(
                        "https://api.brevo.com/v3/smtp/email",
                        requestEntity,
                        String.class
                );

                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("Email sent via Brevo to: " + toEmail);
                } else {
                    log.error("Brevo HTTPS API returned non-2xx response for '{}': status={}, body={}",
                            toEmail, response.getStatusCode(), response.getBody());
                }
                return;
            } catch (HttpStatusCodeException httpEx) {
                log.error("HTTP error sending email via Brevo HTTPS API to '{}'. Status: {}, Body: {}",
                        toEmail, httpEx.getStatusCode(), httpEx.getResponseBodyAsString(), httpEx);
                return;
            } catch (Exception ex) {
                log.error("Unexpected exception sending email via Brevo HTTPS API to '{}': {}",
                        toEmail, ex.getMessage(), ex);
                return;
            }
        }

        // Priority 2: SMTP Fallback (works locally via JavaMailSender)
        if (mailUsername != null && !mailUsername.trim().isBlank() && mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                helper.setFrom(fromEmail, "PathFinder Alerts");
                helper.setTo(toEmail);
                helper.setSubject(subject);
                helper.setText(htmlContent, true);

                mailSender.send(message);
                log.info("Sent notification email via SMTP to '{}' [Subject: '{}']", toEmail, subject);
            } catch (Exception ex) {
                log.error("Failed to dispatch async email via SMTP to '{}': {}", toEmail, ex.getMessage(), ex);
            }
            return;
        }

        log.info("Neither BREVO_API_KEY nor SMTP mail username configured. Skipping email dispatch to '{}' for subject '{}'.", toEmail, subject);
    }

    private String buildEmailTemplate(String recipientName, String heading, String bodyContent, String buttonUrl, String buttonText) {
        return "<!DOCTYPE html>" +
                "<html><head><meta charset=\"UTF-8\"></head>" +
                "<body style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF6F4; margin: 0; padding: 24px;\">" +
                "<div style=\"max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E5D5CE; overflow: hidden; box-shadow: 0 4px 12px rgba(43, 27, 23, 0.05);\">" +
                "  <div style=\"background: linear-gradient(135deg, #7A4B43 0%, #5E342D 100%); padding: 24px 28px; text-align: left;\">" +
                "    <span style=\"color: #FFFFFF; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;\">Path<span style=\"color: #E6A694;\">Finder</span></span>" +
                "    <p style=\"color: #FAF6F4; font-size: 13px; margin: 4px 0 0 0; opacity: 0.9;\">Intelligent Internship & Career Readiness Platform</p>" +
                "  </div>" +
                "  <div style=\"padding: 28px;\">" +
                "    <h2 style=\"color: #2B1B17; font-size: 20px; font-weight: 700; margin-top: 0;\">" + escapeHtml(heading) + "</h2>" +
                "    <p style=\"font-size: 14px; color: #7A6A65;\">Hello <strong>" + escapeHtml(recipientName) + "</strong>,</p>" +
                bodyContent +
                "    <div style=\"margin: 28px 0; text-align: center;\">" +
                "      <a href=\"" + buttonUrl + "\" style=\"display: inline-block; background-color: #7A4B43; color: #FFFFFF; padding: 12px 28px; border-radius: 10px; font-size: 14px; font-weight: bold; text-decoration: none; box-shadow: 0 2px 4px rgba(122, 75, 67, 0.2);\">" +
                escapeHtml(buttonText) + " &rarr;</a>" +
                "    </div>" +
                "  </div>" +
                "  <div style=\"background-color: #FAF6F4; border-top: 1px solid #E5D5CE; padding: 16px 24px; text-align: center;\">" +
                "    <p style=\"font-size: 11px; color: #7A6A65; line-height: 1.5; margin: 0;\">" +
                "      This is an automated system-generated notification from PathFinder. Please do not reply directly to this email." +
                "    </p>" +
                "  </div>" +
                "</div>" +
                "</body></html>";
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}

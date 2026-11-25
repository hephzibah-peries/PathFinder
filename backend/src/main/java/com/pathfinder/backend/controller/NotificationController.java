package com.pathfinder.backend.controller;

import com.pathfinder.backend.entity.Notification;
import com.pathfinder.backend.entity.User;
import com.pathfinder.backend.repository.NotificationRepository;
import com.pathfinder.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationController(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyNotifications(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(user.getId());

        Map<String, Object> response = new HashMap<>();
        response.put("notifications", notifications);
        response.put("unreadCount", unreadCount);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}/read")
    @Transactional
    public ResponseEntity<Void> markAsRead(Authentication authentication, @PathVariable Long id) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));

        if (!user.getId().equals(notification.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied to notification");
        }

        notification.setIsRead(true);
        notificationRepository.save(notification);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    @Transactional
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        notificationRepository.markAllAsRead(user.getId());
        return ResponseEntity.ok().build();
    }
}

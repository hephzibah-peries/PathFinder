package com.pathfinder.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class OAuth2RedirectController {

    private String getFrontendBaseUrl() {
        String frontendUrl = System.getenv("FRONTEND_URL");
        if (frontendUrl == null || frontendUrl.isBlank()) {
            frontendUrl = "http://localhost:5173";
        }
        return frontendUrl.replaceAll("/+$", "");
    }

    @GetMapping("/oauth2/redirect")
    public String handleOAuth2Redirect(HttpServletRequest request) {
        String queryString = request.getQueryString();
        String target = "redirect:" + getFrontendBaseUrl() + "/oauth2/redirect";
        if (queryString != null && !queryString.isBlank()) {
            target += "?" + queryString;
        }
        return target;
    }

    @GetMapping("/login")
    public String handleLoginRedirect(HttpServletRequest request) {
        String queryString = request.getQueryString();
        String target = "redirect:" + getFrontendBaseUrl() + "/login";
        if (queryString != null && !queryString.isBlank()) {
            target += "?" + queryString;
        }
        return target;
    }
}



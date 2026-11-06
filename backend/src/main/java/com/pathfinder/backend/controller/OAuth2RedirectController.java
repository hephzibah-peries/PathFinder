package com.pathfinder.backend.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class OAuth2RedirectController {

    @GetMapping("/oauth2/redirect")
    public String handleOAuth2Redirect(HttpServletRequest request) {
        String queryString = request.getQueryString();
        String target = "redirect:http://localhost:5173/oauth2/redirect";
        if (queryString != null && !queryString.isBlank()) {
            target += "?" + queryString;
        }
        return target;
    }

    @GetMapping("/login")
    public String handleLoginRedirect(HttpServletRequest request) {
        String queryString = request.getQueryString();
        String target = "redirect:http://localhost:5173/login";
        if (queryString != null && !queryString.isBlank()) {
            target += "?" + queryString;
        }
        return target;
    }
}


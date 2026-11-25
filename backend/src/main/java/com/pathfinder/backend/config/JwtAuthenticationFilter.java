package com.pathfinder.backend.config;

import com.pathfinder.backend.repository.UserRepository;
import com.pathfinder.backend.service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this(jwtService, null);
    }

    @Autowired
    public JwtAuthenticationFilter(JwtService jwtService,
                                   @Autowired(required = false) UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        final String rawHeader = request.getHeader("Authorization");
        String authHeader = rawHeader != null && !rawHeader.isBlank() ? rawHeader : request.getHeader("authorization");

        if (authHeader == null || !authHeader.trim().toLowerCase().startsWith("bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.trim().substring(7).trim();
        // Strip enclosing quotes if token was JSON stringified in client storage
        if (jwt.startsWith("\"") && jwt.endsWith("\"") && jwt.length() > 2) {
            jwt = jwt.substring(1, jwt.length() - 1).trim();
        }

        try {
            final String userEmail = jwtService.extractUsername(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                if (jwtService.isTokenValid(jwt, userEmail)) {
                    String role = null;
                    try {
                        role = jwtService.extractClaim(jwt, claims -> {
                            Object val = claims.get("role");
                            if (val == null) val = claims.get("roles");
                            if (val == null) val = claims.get("authorities");
                            if (val == null) val = claims.get("auth");
                            return val != null ? val.toString() : null;
                        });
                    } catch (Exception ex) {
                        log.debug("Could not extract role claim from JWT: {}", ex.getMessage());
                    }

                    // Fallback to database user role if token claim was omitted or empty
                    if ((role == null || role.isBlank()) && userRepository != null) {
                        try {
                            role = userRepository.findByEmail(userEmail)
                                    .map(u -> u.getRole() != null ? u.getRole().name() : null)
                                    .orElse(null);
                        } catch (Exception ex) {
                            log.debug("Could not query UserRepository for role: {}", ex.getMessage());
                        }
                    }

                    String cleanRole = (role != null && !role.isBlank())
                            ? role.toUpperCase().replace("ROLE_", "").trim()
                            : "STUDENT";

                    // Provide both "ROLE_<ROLE>" and bare "<ROLE>" so hasRole and hasAuthority both match
                    List<GrantedAuthority> authorities = new ArrayList<>();
                    authorities.add(new SimpleGrantedAuthority("ROLE_" + cleanRole));
                    authorities.add(new SimpleGrantedAuthority(cleanRole));

                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userEmail,
                            null,
                            authorities
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
            }
        } catch (ExpiredJwtException e) {
            log.debug("Expired JWT token encountered on request [{} {}]: {}", request.getMethod(), request.getRequestURI(), e.getMessage());
        } catch (JwtException | IllegalArgumentException e) {
            log.debug("Invalid JWT token encountered on request [{} {}]: {}", request.getMethod(), request.getRequestURI(), e.getMessage());
        } catch (Exception e) {
            log.warn("Unexpected error validating JWT token on request [{} {}]: {}", request.getMethod(), request.getRequestURI(), e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}

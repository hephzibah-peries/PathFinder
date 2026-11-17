package com.pathfinder.backend.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(
    origins = {
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://pathfinder123-rose.vercel.app"
    },
    originPatterns = {"https://*.vercel.app"}
)
public class HealthController {

    private static final Logger log = LoggerFactory.getLogger(HealthController.class);

    private final DataSource dataSource;
    private final Environment environment;

    public HealthController(DataSource dataSource, Environment environment) {
        this.dataSource = dataSource;
        this.environment = environment;
    }

    @GetMapping("/db-status")
    public ResponseEntity<Map<String, String>> getDatabaseStatus() {
        Map<String, String> response = new HashMap<>();
        String[] activeProfiles = environment.getActiveProfiles();
        boolean isSupabaseProfile = Arrays.asList(activeProfiles).contains("supabase");

        try (Connection connection = dataSource.getConnection()) {
            DatabaseMetaData metaData = connection.getMetaData();
            String dbProductName = metaData.getDatabaseProductName();
            String url = metaData.getURL();

            response.put("status", "CONNECTED");

            if ((url != null && url.toLowerCase().contains("supabase")) || isSupabaseProfile) {
                response.put("database", "Supabase (Original PostgreSQL)");
                response.put("type", "SUPABASE");
            } else if (dbProductName != null && dbProductName.equalsIgnoreCase("H2")) {
                response.put("database", "Local H2 (Temporary)");
                response.put("type", "H2");
            } else {
                response.put("database", dbProductName != null ? dbProductName : "Local Database");
                response.put("type", "LOCAL");
            }

            log.debug("Database status queried: {}", response);
            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            log.error("Failed to query database status: {}", ex.getMessage());
            response.put("status", "DISCONNECTED");
            response.put("database", "Unavailable");
            response.put("type", "OFFLINE");
            return ResponseEntity.ok(response);
        }
    }
}

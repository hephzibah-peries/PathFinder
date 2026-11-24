package com.pathfinder.backend.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DatabaseMigrationConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseMigrationConfig.class);
    private final JdbcTemplate jdbcTemplate;

    public DatabaseMigrationConfig(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void migrateResumeSchema() {
        log.info("Running database schema migration check for student_resumes...");

        // 1. Ensure table exists if not created yet
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS student_resumes (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "student_id BIGINT NOT NULL, " +
                "file_name VARCHAR(255) NOT NULL, " +
                "file_type VARCHAR(255), " +
                "file_size BIGINT, " +
                "uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                "extracted_text TEXT, " +
                "extracted_skills TEXT, " +
                "file_data BYTEA)"
            );
        } catch (Exception e) {
            log.warn("Table create check notice: {}", e.getMessage());
        }

        // 2. Ensure file_data column exists
        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS student_resumes ADD COLUMN IF NOT EXISTS file_data BYTEA");
        } catch (Exception e) {
            log.warn("Column add check notice: {}", e.getMessage());
        }

        // 3. Fix potential oid type mismatch if created from previous @Lob mapping
        try {
            List<String> types = jdbcTemplate.query(
                "SELECT data_type FROM information_schema.columns " +
                "WHERE table_name = 'student_resumes' AND column_name = 'file_data'",
                (rs, rowNum) -> rs.getString("data_type")
            );
            if (!types.isEmpty() && "oid".equalsIgnoreCase(types.get(0))) {
                log.warn("Detected 'file_data' column with type OID in student_resumes! Converting to BYTEA...");
                try {
                    jdbcTemplate.execute("ALTER TABLE student_resumes DROP COLUMN file_data");
                    jdbcTemplate.execute("ALTER TABLE student_resumes ADD COLUMN file_data BYTEA");
                    log.info("Successfully recreated 'file_data' as BYTEA in student_resumes.");
                } catch (Exception dropEx) {
                    log.warn("Could not drop and recreate file_data: {}", dropEx.getMessage());
                }
            }
        } catch (Exception e) {
            log.debug("Information schema column check notice: {}", e.getMessage());
        }

        // 4. Ensure index on student_id for fast queries
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_student_resumes_student_id ON student_resumes(student_id)");
        } catch (Exception e) {
            log.debug("Index check notice: {}", e.getMessage());
        }
    }
}

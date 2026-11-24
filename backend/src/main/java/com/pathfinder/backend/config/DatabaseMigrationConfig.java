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
        log.info("Running database schema migration check for student_profiles and student_resumes...");

        // 1. Ensure student_profiles table exists
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS student_profiles (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "user_id BIGINT NOT NULL UNIQUE, " +
                "full_name VARCHAR(255), " +
                "university VARCHAR(255), " +
                "gpa DOUBLE PRECISION, " +
                "bio TEXT, " +
                "skills TEXT, " +
                "preferred_location VARCHAR(255), " +
                "preferred_work_mode VARCHAR(255), " +
                "profile_picture TEXT)"
            );
        } catch (Exception e) {
            log.warn("student_profiles create check notice: {}", e.getMessage());
        }

        // 2. Ensure student_resumes table exists
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
            log.warn("student_resumes create check notice: {}", e.getMessage());
        }

        // 3. Ensure columns exist
        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS student_profiles ADD COLUMN IF NOT EXISTS profile_picture TEXT");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS student_profiles ADD COLUMN IF NOT EXISTS bio TEXT");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS student_profiles ADD COLUMN IF NOT EXISTS skills TEXT");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS student_resumes ADD COLUMN IF NOT EXISTS file_data BYTEA");
        } catch (Exception e) {
            log.warn("Column addition check notice: {}", e.getMessage());
        }

        // 4. Fix potential oid type mismatch in student_profiles
        try {
            List<String> profileOidCols = jdbcTemplate.query(
                "SELECT column_name FROM information_schema.columns " +
                "WHERE table_name = 'student_profiles' AND LOWER(data_type) = 'oid'",
                (rs, rowNum) -> rs.getString("column_name")
            );
            for (String colName : profileOidCols) {
                log.warn("Detected OID column '{}' in student_profiles! Converting to TEXT...", colName);
                try {
                    jdbcTemplate.execute("ALTER TABLE student_profiles ALTER COLUMN " + colName + " TYPE TEXT USING " + colName + "::text");
                } catch (Exception alterEx) {
                    log.warn("Could not alter column '{}' in student_profiles: {}", colName, alterEx.getMessage());
                }
            }
        } catch (Exception e) {
            log.debug("student_profiles OID check notice: {}", e.getMessage());
        }

        // 5. Fix potential oid type mismatch in student_resumes
        try {
            List<String> resumeOidCols = jdbcTemplate.query(
                "SELECT column_name FROM information_schema.columns " +
                "WHERE table_name = 'student_resumes' AND LOWER(data_type) = 'oid'",
                (rs, rowNum) -> rs.getString("column_name")
            );
            for (String colName : resumeOidCols) {
                log.warn("Detected OID column '{}' in student_resumes! Fixing...", colName);
                try {
                    if ("file_data".equalsIgnoreCase(colName)) {
                        jdbcTemplate.execute("ALTER TABLE student_resumes DROP COLUMN file_data");
                        jdbcTemplate.execute("ALTER TABLE student_resumes ADD COLUMN file_data BYTEA");
                    } else {
                        jdbcTemplate.execute("ALTER TABLE student_resumes ALTER COLUMN " + colName + " TYPE TEXT USING " + colName + "::text");
                    }
                } catch (Exception alterEx) {
                    log.warn("Could not fix column '{}' in student_resumes: {}", colName, alterEx.getMessage());
                }
            }
        } catch (Exception e) {
            log.debug("student_resumes OID check notice: {}", e.getMessage());
        }

        // 6. Ensure indexes for performance
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_student_resumes_student_id ON student_resumes(student_id)");
        } catch (Exception e) {
            log.debug("Index check notice: {}", e.getMessage());
        }
    }
}

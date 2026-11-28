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
                "degree VARCHAR(255), " +
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
            jdbcTemplate.execute("ALTER TABLE IF EXISTS student_profiles ADD COLUMN IF NOT EXISTS degree VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS student_resumes ADD COLUMN IF NOT EXISTS file_data BYTEA");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS student_resumes ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("UPDATE student_resumes SET archived = FALSE WHERE archived IS NULL");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS internships ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'ACTIVE'");
            jdbcTemplate.execute("UPDATE internships SET status = 'ACTIVE' WHERE status IS NULL");
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

        // 7. Ensure applications table exists
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS applications (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "internship_id BIGINT NOT NULL, " +
                "student_id BIGINT NOT NULL, " +
                "status VARCHAR(50) DEFAULT 'PENDING', " +
                "applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, " +
                "resume_id BIGINT, " +
                "resume_file_name VARCHAR(255), " +
                "cover_letter TEXT)"
            );
        } catch (Exception e) {
            log.warn("applications table create check notice: {}", e.getMessage());
        }

        // 8. Ensure columns in applications table
        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS applications ADD COLUMN IF NOT EXISTS student_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS applications ADD COLUMN IF NOT EXISTS internship_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS applications ADD COLUMN IF NOT EXISTS resume_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS applications ADD COLUMN IF NOT EXISTS resume_file_name VARCHAR(255)");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS applications ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'PENDING'");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS applications ADD COLUMN IF NOT EXISTS applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
            jdbcTemplate.execute("ALTER TABLE IF EXISTS applications ADD COLUMN IF NOT EXISTS cover_letter TEXT");
        } catch (Exception e) {
            log.warn("applications column check notice: {}", e.getMessage());
        }

        // 9. Fix potential OID columns in applications
        try {
            List<String> appOidCols = jdbcTemplate.query(
                "SELECT column_name FROM information_schema.columns " +
                "WHERE table_name = 'applications' AND LOWER(data_type) = 'oid'",
                (rs, rowNum) -> rs.getString("column_name")
            );
            for (String colName : appOidCols) {
                log.warn("Detected OID column '{}' in applications! Converting to TEXT...", colName);
                try {
                    jdbcTemplate.execute("ALTER TABLE applications ALTER COLUMN " + colName + " TYPE TEXT USING " + colName + "::text");
                } catch (Exception alterEx) {
                    log.warn("Could not alter column '{}' in applications: {}", colName, alterEx.getMessage());
                }
            }
        } catch (Exception e) {
            log.debug("applications OID check notice: {}", e.getMessage());
        }

        // 10. Ensure indexes on applications
        try {
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_applications_student_id ON applications(student_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_applications_internship_id ON applications(internship_id)");
        } catch (Exception e) {
            log.debug("applications index check notice: {}", e.getMessage());
        }

        // 11. Ensure student_profiles has phone column
        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS student_profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50)");
        } catch (Exception e) {
            log.debug("student_profiles phone column check notice: {}", e.getMessage());
        }

        // 12. Ensure notifications table exists
        try {
            jdbcTemplate.execute(
                "CREATE TABLE IF NOT EXISTS notifications (" +
                "id BIGSERIAL PRIMARY KEY, " +
                "user_id BIGINT NOT NULL, " +
                "title VARCHAR(255) NOT NULL, " +
                "message TEXT NOT NULL, " +
                "type VARCHAR(50) NOT NULL, " +
                "link VARCHAR(255), " +
                "is_read BOOLEAN DEFAULT FALSE, " +
                "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)"
            );
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read)");
        } catch (Exception e) {
            log.warn("notifications table create check notice: {}", e.getMessage());
        }

        // 13. Ensure student_profiles degree column exists
        try {
            jdbcTemplate.execute("ALTER TABLE IF EXISTS student_profiles ADD COLUMN IF NOT EXISTS degree VARCHAR(255)");
        } catch (Exception e) {
            log.debug("student_profiles degree column check notice: {}", e.getMessage());
        }

        // 14. Ensure strict role assignments and cleanup accidental company profiles
        try {
            // Explicitly set nilkanhepzi@gmail.com as COMPANY
            jdbcTemplate.execute("UPDATE users SET role = 'COMPANY' WHERE email = 'nilkanhepzi@gmail.com'");

            // Explicitly set periesprouser@gmail.com as STUDENT and remove any accidental company profile
            jdbcTemplate.execute("UPDATE users SET role = 'STUDENT' WHERE email = 'periesprouser@gmail.com'");
            jdbcTemplate.execute("DELETE FROM company_profiles WHERE user_id IN (SELECT id FROM users WHERE email = 'periesprouser@gmail.com')");
        } catch (Exception e) {
            log.warn("Role migration and company profile cleanup notice: {}", e.getMessage());
        }
    }
}

package com.pathfinder.backend.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import javax.sql.DataSource;
import java.io.PrintWriter;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.SQLException;
import java.sql.SQLFeatureNotSupportedException;
import java.util.logging.Logger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class HealthControllerTest {

    private static DataSource createMockDataSource(String url, String productName) {
        return (DataSource) Proxy.newProxyInstance(
                HealthControllerTest.class.getClassLoader(),
                new Class<?>[]{DataSource.class},
                (proxy, method, args) -> {
                    if ("getConnection".equals(method.getName())) {
                        return (Connection) Proxy.newProxyInstance(
                                HealthControllerTest.class.getClassLoader(),
                                new Class<?>[]{Connection.class},
                                (connProxy, connMethod, connArgs) -> {
                                    if ("getMetaData".equals(connMethod.getName())) {
                                        return (DatabaseMetaData) Proxy.newProxyInstance(
                                                HealthControllerTest.class.getClassLoader(),
                                                new Class<?>[]{DatabaseMetaData.class},
                                                (metaProxy, metaMethod, metaArgs) -> {
                                                    if ("getDatabaseProductName".equals(metaMethod.getName())) return productName;
                                                    if ("getURL".equals(metaMethod.getName())) return url;
                                                    return null;
                                                }
                                        );
                                    }
                                    return null;
                                }
                        );
                    }
                    return null;
                }
        );
    }

    @Test
    @DisplayName("DB Status - H2 Database returns connected with H2 type")
    void testGetDbStatusH2() throws Exception {
        DataSource ds = createMockDataSource("jdbc:h2:mem:pathfinderdb", "H2");
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("dev");

        HealthController healthController = new HealthController(ds, env);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(healthController).build();

        mockMvc.perform(get("/api/public/db-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONNECTED"))
                .andExpect(jsonPath("$.database").value("Local H2 (Temporary)"))
                .andExpect(jsonPath("$.type").value("H2"));
    }

    @Test
    @DisplayName("DB Status - Supabase Database returns connected with Supabase type")
    void testGetDbStatusSupabase() throws Exception {
        DataSource ds = createMockDataSource("jdbc:postgresql://db.qqfzznkcvctinkvkmeac.supabase.co:5432/postgres", "PostgreSQL");
        MockEnvironment env = new MockEnvironment();
        env.setActiveProfiles("supabase");

        HealthController healthController = new HealthController(ds, env);
        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(healthController).build();

        mockMvc.perform(get("/api/public/db-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONNECTED"))
                .andExpect(jsonPath("$.database").value("Supabase (Original PostgreSQL)"))
                .andExpect(jsonPath("$.type").value("SUPABASE"));
    }
}

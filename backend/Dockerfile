# ==========================================
# Stage 1: Build with Maven and Temurin JDK 21
# ==========================================
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy dependency definition and download offline dependencies for caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build production artifact
COPY src ./src
RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Production Runtime with Temurin JRE 21
# ==========================================
FROM eclipse-temurin:21-jre
WORKDIR /app

# Create unprivileged system user for secure container execution
RUN addgroup --system spring && adduser --system spring --ingroup spring
USER spring:spring

# Copy compiled JAR from build stage
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.jar"]


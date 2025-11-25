# JsonVersionManager Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-24

## Active Technologies

- Java 21 LTS + Spring Boot 3.3+, Spring Data JPA, Spring Web, Jackson, Hibernate Validator (001-metadata-version-api)

## Project Structure

```text
src/
tests/
```

## Commands

# Java 21 LTS commands
mvn clean compile  # Compile project with Java 21
mvn test          # Run tests
mvn spring-boot:run  # Run application

## Code Style

Java 21 LTS: Follow standard conventions, leverage modern Java features (Records, Sealed Classes, Pattern Matching)

## Recent Changes

- 001-metadata-version-api: Upgraded from Java 17 to Java 21 LTS
- Removed preview features flags (using stable Java 21 LTS)
- Updated Maven compiler configuration for Java 21

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

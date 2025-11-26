# JsonVersionManager Development Guidelines

Auto-generated from all feature plans. Last updated: 2025-11-24

## Active Technologies
- TypeScript 5.4 (strict) + React 18, Node 20 toolchain + Vite 5, React Router 6, TanStack Query 5, Zustand (session credentials), Axios + OpenAPI Generator client, jsondiffpatch (diff rendering), Tailwind CSS + custom tokens (001-coffeehouse-frontend)
- No persistent storage; in-memory stores for credentials and UI state only (001-coffeehouse-frontend)

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
- 001-coffeehouse-frontend: Added TypeScript 5.4 (strict) + React 18, Node 20 toolchain + Vite 5, React Router 6, TanStack Query 5, Zustand (session credentials), Axios + OpenAPI Generator client, jsondiffpatch (diff rendering), Tailwind CSS + custom tokens

- 001-metadata-version-api: Upgraded from Java 17 to Java 21 LTS
- Removed preview features flags (using stable Java 21 LTS)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

package com.metadata.versioning.adapter.out.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI/Swagger configuration for API documentation.
 * Accessible at: /swagger-ui.html and /v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI metadataVersioningOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("Metadata Versioning API")
                .description("""
                    RESTful API for comprehensive metadata management with version control capabilities.
                    
                    ## Features
                    - Create and manage versioned JSON metadata documents
                    - Activate specific versions for consumption
                    - Compare versions to understand changes
                    - Schema validation with flexible extensions
                    - Publishing workflow (draft → approved → published → archived)
                    - Complete audit trail
                    
                    ## Authentication
                    - **Read operations** (GET): No authentication required (public access)
                    - **Write operations** (POST, PUT, PATCH, DELETE): HTTP Basic Authentication required
                    """)
                .version("1.0.0")
                .contact(new Contact()
                    .name("API Support")
                    .email("api-support@metadata-versioning.com"))
                .license(new License()
                    .name("Apache 2.0")
                    .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
            .addServersItem(new Server()
                .url("http://localhost:8080")
                .description("Local development server"))
            .addSecurityItem(new SecurityRequirement().addList("BasicAuth"))
            .components(new io.swagger.v3.oas.models.Components()
                .addSecuritySchemes("BasicAuth", new SecurityScheme()
                    .type(SecurityScheme.Type.HTTP)
                    .scheme("basic")
                    .description("HTTP Basic Authentication for write operations")));
    }
}

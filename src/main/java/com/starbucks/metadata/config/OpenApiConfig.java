package com.starbucks.metadata.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI metadataOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Metadata Versioning REST API")
                        .description("RESTful API for managing metadata with version control capabilities")
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Metadata Team")
                                .email("metadata-team@starbucks.com"))
                        .license(new License()
                                .name("Apache 2.0")
                                .url("http://springdoc.org")))
                .externalDocs(new ExternalDocumentation()
                        .description("Metadata Versioning API Documentation")
                        .url("https://github.com/starbucks/metadata-versioning"));
    }
}
package com.metadata.versioning.architecture;

import com.tngtech.archunit.base.DescribedPredicate;
import com.tngtech.archunit.core.domain.JavaClass;
import com.tngtech.archunit.core.domain.JavaClasses;
import com.tngtech.archunit.core.importer.ClassFileImporter;
import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.lang.ArchRule;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

/**
 * Architecture tests to enforce hexagonal architecture boundaries.
 * Ensures domain layer has no dependencies on adapters or application layer.
 */
class HexagonalArchitectureTest {

    private static JavaClasses importedClasses;

    @BeforeAll
    static void setup() {
        importedClasses = new ClassFileImporter()
                .withImportOption(ImportOption.Predefined.DO_NOT_INCLUDE_TESTS)
                .importPackages("com.metadata.versioning");
    }

    @Test
    void domainLayerShouldNotDependOnApplicationLayer() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAPackage("..application..");

        rule.check(importedClasses);
    }

    @Test
    void domainLayerShouldNotDependOnAdapterLayer() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..domain..")
                .should().dependOnClassesThat().resideInAPackage("..adapter..");

        rule.check(importedClasses);
    }

    @Test
    void applicationLayerShouldNotDependOnAdapterLayer() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..application..")
                .should().dependOnClassesThat().resideInAPackage("..adapter..");

        rule.check(importedClasses);
    }

    @Test
    void adaptersShouldOnlyAccessApplicationLayerThroughPorts() {
        DescribedPredicate<JavaClass> allowedDependencies = DescribedPredicate.describe(
                "depend only on domain, application ports, adapter or framework packages",
                javaClass -> javaClass.getPackageName().contains("domain")
                        || javaClass.getPackageName().contains("application.port")
                        || javaClass.getPackageName().contains("adapter")
                        || javaClass.getPackageName().startsWith("java")
                        || javaClass.getPackageName().startsWith("org.springframework")
                        || javaClass.getPackageName().startsWith("jakarta")
                        || javaClass.getPackageName().startsWith("com.fasterxml")
                        || javaClass.getPackageName().startsWith("io.swagger")
        );

        ArchRule rule = classes()
                .that().resideInAPackage("..adapter..")
                .and().areNotAnnotatedWith(org.springframework.context.annotation.Configuration.class)
                .should().onlyAccessClassesThat(allowedDependencies);

        rule.check(importedClasses);
    }

    @Test
    void layeredArchitectureShouldBeRespected() {
        layeredArchitecture()
                .consideringAllDependencies()
                .layer("Domain").definedBy("..domain..")
                .layer("Application").definedBy("..application..")
                .layer("Adapter").definedBy("..adapter..")
                
                .whereLayer("Domain").mayNotAccessAnyLayer()
                .whereLayer("Application").mayOnlyAccessLayers("Domain")
                .whereLayer("Adapter").mayOnlyAccessLayers("Application", "Domain")
                
                .check(importedClasses);
    }

    @Test
    void portsShouldBeInterfaces() {
        ArchRule rule = classes()
                .that().resideInAPackage("..application.port..")
                .should().beInterfaces();

        rule.check(importedClasses);
    }

    @Test
    void domainModelsShouldNotHaveSpringAnnotations() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..domain.model..")
                .should().dependOnClassesThat().resideInAPackage("org.springframework..");

        rule.check(importedClasses);
    }

    @Test
    void domainServicesShouldNotHaveSpringAnnotations() {
        ArchRule rule = noClasses()
                .that().resideInAPackage("..domain.service..")
                .should().dependOnClassesThat().resideInAPackage("org.springframework..");

        rule.check(importedClasses);
    }

    @Test
    void controllersShouldOnlyCallUseCases() {
        DescribedPredicate<JavaClass> allowedControllerAccess = DescribedPredicate.describe(
                "depend only on use cases, controller layer or domain API",
                javaClass -> javaClass.getPackageName().contains("application.port.in")
                        || javaClass.getPackageName().contains("adapter.in.rest")
                        || javaClass.getPackageName().contains("domain.model")
                        || javaClass.getPackageName().contains("domain.exception")
                        || javaClass.getPackageName().startsWith("java")
                        || javaClass.getPackageName().startsWith("org.springframework")
                        || javaClass.getPackageName().startsWith("io.swagger")
        );

        ArchRule rule = classes()
                .that().resideInAPackage("..adapter.in.rest..")
                .and().haveSimpleNameEndingWith("Controller")
                .should().onlyAccessClassesThat(allowedControllerAccess);

        rule.check(importedClasses);
    }
}

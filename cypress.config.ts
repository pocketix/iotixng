import { defineConfig } from "cypress";

export default defineConfig({
  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
    // Scoped away from cypress/e2e so the e2e spec below isn't also picked
    // up as a component test.
    specPattern: "cypress/component/**/*.cy.ts",
    // Desktop-sized viewport: both editors have separate mobile-responsive
    // show/hide CSS for the visual/text panes (and default to OPPOSITE
    // initial states there — see main bug report), which is out of scope
    // for these shared behavioral scenarios.
    viewportWidth: 1280,
    viewportHeight: 800,
  },
  e2e: {
    // Against the real running demo app (ng serve demo), not cy.mount -
    // proves the visual/text editors round-trip correct JSON end-to-end.
    baseUrl: "http://localhost:4200",
    specPattern: "cypress/e2e/**/*.cy.ts",
    viewportWidth: 1280,
    viewportHeight: 800,
  },
});

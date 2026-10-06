// Angular's analytics.ts documents posthog.init() as only ever running once
// consent is granted (never an import-time side effect), unlike React's -
// so no network stubbing is needed here for a default (analytics-disabled) run.
export {};

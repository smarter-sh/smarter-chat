/** Render every story in this package as a test. See test/stories.ts. */
import { testStories } from "@test/stories";

testStories(import.meta.glob("./**/*.stories.tsx", { eager: true }));

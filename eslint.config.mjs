import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  // Keep the starter on the flat config export that actually runs under the pinned ESLint/Next toolchain.
  ...nextCoreWebVitals,
  // React Three Fiber owns these mutable Three.js objects outside React's render model.
  { files: ["src/components/experience/ExperienceCanvas.tsx"], rules: { "react-hooks/immutability": "off" } },
  globalIgnores([".design-backup/**",".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

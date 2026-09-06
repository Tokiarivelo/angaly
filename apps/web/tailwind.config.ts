import type { Config } from 'tailwindcss';

/**
 * Tailwind v4: theme tokens (the ANGALY brand palette) are declared in
 * globals.css via @theme {} — see docs/specifications/ANGALY_Palette_Stitch.md.
 * This file only configures content paths and the dark mode strategy.
 */
const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
};

export default config;

# National Level Sinhgad Hackathon 2K27

Phase 1 frontend foundation for SKN Sinhgad College of Engineering.

## Run locally

```bash
npm install
npm run dev
```

Use `npm run build` for a production build, `npm run preview` to serve it locally, and `npm run lint` for static checks.

## Structure

- `src/app`: application composition and providers
- `src/components`: reusable UI and layout components
- `src/features`: page sections and feature-specific components
- `src/lib`: shared utilities and integrations
- `src/styles`: global styles and design tokens
- `src/assets`: project-owned static assets

Tailwind CSS v4 is integrated through `@tailwindcss/vite`. Design tokens live in `src/styles/globals.css` using CSS variables and Tailwind's `@theme` directive. Three.js, React Three Fiber, Drei, and Framer Motion are installed for later phases; no 3D scene or motion-heavy UI is mounted in Phase 1.

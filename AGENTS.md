# National Level Sinhgad Hackathon 2K27

Project for SKN Sinhgad College of Engineering. Apply these instructions to work in this repository.

## Design identity

- Create a premium futuristic dark aesthetic with deep navy and near-black backgrounds, electric blue and violet accents, professional typography, and clear visual hierarchy.
- Use immersive 3D elements and distinctive visual storytelling. Draw inspiration from premium technology festivals and creative websites without copying another site's design.
- Avoid generic AI-generated layouts. Keep art direction, spacing, lighting, and design tokens consistent across sections.

## Animation architecture

- Use Three.js and React Three Fiber for 3D experiences.
- Use GSAP with ScrollTrigger for cinematic scrolling and complex timelines; use `@gsap/react` for React lifecycle management.
- Use Lenis for smooth scrolling and synchronize it with ScrollTrigger when both are active.
- Use Framer Motion for smaller interface interactions. Give each animation one owner rather than implementing competing versions across libraries.

## Motion principles

- Make movement cinematic and intentional: layered depth, purposeful parallax, scroll control, selective pinned sections, meaningful entrances and exits, and natural timing.
- Avoid excessive movement and competing animation loops. Keep controls responsive while scrolling.
- Respect `prefers-reduced-motion`; reduce complexity on mobile and less capable devices.

## Performance and accessibility

- Avoid unnecessary React renders and large initial bundles. Lazy-load expensive 3D scenes and optimize assets and geometry.
- Prefer transform and opacity for suitable UI animations. Clean up GSAP timelines, ScrollTriggers, and event listeners.
- Maintain responsive, accessible layouts and fallbacks for unsupported graphics features. Balance visual quality with smooth mobile loading and interaction.

## Development rules

- Use React, Vite, TypeScript, and Tailwind CSS v4. Keep components reusable and maintain the existing folder structure unless a change is justified.
- Write clean, modular, maintainable code and preserve working features.
- Never invent event details, dates, prizes, sponsors, or contact information.
- Never modify the external registration website, registration backend, or database without explicit instruction.
- After meaningful implementation changes, run `npm run build` and `npm run lint`. Report test results and errors honestly.

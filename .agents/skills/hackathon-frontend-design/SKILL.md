---
name: hackathon-frontend-design
description: Design, implement, or refine the National Level Sinhgad Hackathon 2K27 frontend when visual direction, hero composition, responsive layout, 3D integration, or motion quality is central to the task. Use for this website's creative frontend work, not unrelated applications or backend tasks.
---

# Hackathon frontend design

Create a distinctive, premium technology event experience for SKN Sinhgad College of Engineering. Treat each section as part of one visual story, not as an interchangeable template. Before designing, identify the section's purpose, the information it must communicate, and its place in the page rhythm. Work from composition and hierarchy toward details.

## Creative direction

- Think like a creative director and an experienced frontend designer: choose a clear focal point, intentional negative space, and a visual idea that serves the content.
- Use the project's deep navy, near-black, electric blue, and violet palette with restraint. Let typography, contrast, scale, and imagery establish hierarchy before adding effects.
- Draw inspiration from leading technology event experiences without directly copying any site. Avoid generic AI-generated layouts and repetitive grids of cards.
- Keep the visual language consistent across sections while allowing each section a distinct role in the story.

## Hero composition

- Make the opening view memorable and immediately legible. Balance the headline, supporting copy, event identity, registration action when available, and 3D focal object.
- Give the globe or other 3D object enough visual space without obscuring text or controls. Check depth, lighting, silhouette, and contrast against the background.
- Keep any confirmed event information and registration path clear. Do not invent dates, prizes, sponsors, contact details, or links to fill space.
- Make interaction discoverable but unobtrusive. A 3D visual should support the first impression and remain usable with mouse and touch.

## Visual system

- Use deliberate type scale, line lengths, spacing, and alignment across desktop, tablet, and mobile.
- Build from existing design tokens and reusable components. Add tokens when a recurring visual decision needs one.
- Use glass surfaces only where translucency adds depth or grouping. Control blur, border opacity, and contrast so text stays readable.
- Apply gradients, glows, and lighting selectively. Avoid glowing every border or adding decoration that competes with primary content.
- Use high-quality visual assets when they improve the design; optimize them and respect their usage rights.

## Motion and interaction

- Use Three.js and React Three Fiber for 3D, GSAP and ScrollTrigger for complex or scroll-driven sequences, and Framer Motion for small interface transitions. Use `@gsap/react` to scope and clean up React animations.
- Use parallax, entrances, exits, and pinned moments only when they clarify progression or heighten a deliberate focal moment.
- Avoid overlapping animation systems on the same property, excessive movement, and interactions that become sluggish during scroll.
- Respect `prefers-reduced-motion` with a coherent still experience. Adapt animation and rendering cost to device capability.

## Responsive and quality checks

- Design the composition at desktop, tablet, and mobile widths. Rebalance type, spacing, and 3D scale rather than merely shrinking the desktop layout.
- Keep touch targets and touch rotation usable. Ensure the 3D scene does not trap scrolling or cover important content.
- Inspect the rendered page in a browser at relevant widths and interaction states. Fix clipping, overlap, contrast, and visual inconsistencies before declaring a section complete.
- Preserve working features and stay within the requested phase. Run the repository's build and lint checks after meaningful implementation changes and report any remaining limits honestly.

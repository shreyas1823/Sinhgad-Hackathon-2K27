# Local sound comparison

Run `npm run dev` and open the local URL with `?sound-preview=1` appended (for example, `http://localhost:5173/?sound-preview=1`). The panel is gated by Vite's development flag and is excluded from production builds. Without the query parameter it stays hidden in development too.

1. Sound starts off. Explicitly enable it with the navbar sound toggle.
2. Use each preset's **Preview** button to audition it without changing the selected hover sound. Previews have a 260 ms cooldown.
3. Click a preset's name to select it for navbar hover testing. The selected button and status text identify the current preset. Selection itself is silent.
4. Compare the original and A–E at a comfortable device volume. The application cannot calibrate headphone or speaker output.
5. Turn sound off in the navbar to disable previews and production sounds. Use **Restore production hover sound** to return to Option D. Reload resets sound to off and restores Option D. No preference is persisted.

All sound synthesis parameters live in `src/audio/navigationSounds.ts`:

| Parameter | Meaning |
| --- | --- |
| `pitchHz`, `endPitchHz` | Starting and ending pitch in hertz |
| `glideSeconds` | Optional pitch sweep length; defaults to the voice duration |
| `durationSeconds` | Voice length, including its fade |
| `attackSeconds` | Time to reach peak volume |
| `volume` | Peak linear gain per voice; layered voices add together |
| `delaySeconds` | Optional layer offset for shimmer or resonance |

A uses three quiet sine layers; B uses a rising fundamental and soft harmonic; C uses a falling tone and delayed lower resonance. Option D retains its exact two-voice synthesis as the production navbar hover sound. Hover playback keeps its 160 ms cooldown and never resumes audio automatically. Four locally stored MP3 files provide the button, section, Register Now, and toggle effects. No external audio URLs or dependencies are used at runtime.

Manual checks: navigate with Tab/Enter/Space, compare all previews, rapidly sweep navbar links to check cooldown, disable sound and confirm normal effects are silent, reload to confirm reset, and check that production preview has no sound lab even with the query parameter.

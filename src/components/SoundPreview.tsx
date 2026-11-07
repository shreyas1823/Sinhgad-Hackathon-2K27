import { navigationSounds } from '../audio/navigationSounds'
import type { SoundPreset } from '../audio/navigationSounds'
import './sound-preview.css'

type Props = {
  enabled: boolean
  preset: SoundPreset
  onSelect: (preset: SoundPreset) => void
  onPreview: (preset: SoundPreset) => Promise<void>
}

export default function SoundPreview({ enabled, preset, onSelect, onPreview }: Props) {
  return <aside className="sound-preview" aria-label="Developer sound preview">
    <details open>
      <summary>Developer sound lab</summary>
      <p>Enable sound in the navbar, then preview a sound or select it for hover testing. Reload restores production Option D.</p>
      <p role="status">Sound {enabled ? 'on' : 'off'} · Selected: {navigationSounds[preset].label}</p>
      {(['glassy', 'pulse', 'liquid', 'hybridGlass', 'hybridAtmosphere'] as const).map((id) => <div className="sound-preview-row" key={id}>
        <button type="button" aria-pressed={preset === id} onClick={() => onSelect(id)}>{navigationSounds[id].label}<small>{navigationSounds[id].description}</small></button>
        <button type="button" disabled={!enabled} aria-label={`Preview ${navigationSounds[id].label}`} onClick={() => { void onPreview(id) }}>Preview</button>
      </div>)}
      <button type="button" onClick={() => onSelect('hybridGlass')}>Restore production hover sound</button>
    </details>
  </aside>
}

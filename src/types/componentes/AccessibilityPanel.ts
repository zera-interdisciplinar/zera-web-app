import type { VoiceCommand } from '../accessibility'


export interface AccessibilityPanelProps {
  /** Routes the person can ask for by voice, taken from the same list the sidebar shows. */
  routes: VoiceCommand[]
}

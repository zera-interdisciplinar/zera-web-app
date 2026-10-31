/** What is written to `localStorage`: the data plus the schema version it was written with (`_versao`). */
interface Envelope<T> {
  _versao: number
  data: T
}

/** Turns data written by an older schema version into the current shape, or `null` when it cannot. */
export type Migration<T> = (oldData: unknown) => T | null

export interface LoadOptions<T> {
  /** The version the code reads today. */
  version: number
  /** One entry per old version that can still be upgraded. */
  migrations?: Record<number, Migration<T>>
  /** Rejects values that have the right version but the wrong shape (a tampered or foreign value). */
  validate?: (data: unknown) => T | null
}

/** `localStorage` throws in private mode or with blocked site data: every call is guarded. */
export function saveStored<T>(key: string, data: T, version: number): void {
  try {
    const envelope: Envelope<T> = { _versao: version, data }
    window.localStorage.setItem(key, JSON.stringify(envelope))
  } catch {
    // The choice just will not outlive the tab.
  }
}

/**
 * Reads a versioned value. A missing, corrupted, unversioned or incompatible value is discarded (and removed)
 * instead of breaking the page; an older version goes through its migration first.
 */
export function loadStored<T>(key: string, { version, migrations = {}, validate }: LoadOptions<T>): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const envelope = JSON.parse(raw) as Partial<Envelope<unknown>> | null
    if (typeof envelope !== 'object' || envelope === null || typeof envelope._versao !== 'number') {
      removeStored(key)
      return null
    }
    const accepted = (value: unknown): T | null => (validate ? validate(value) : (value as T))
    if (envelope._versao === version) {
      const current = accepted(envelope.data)
      if (current !== null) return current
    } else {
      const migrate = migrations[envelope._versao]
      const migrated = migrate ? migrate(envelope.data) : null
      const upgraded = migrated === null ? null : accepted(migrated)
      if (upgraded !== null) {
        saveStored(key, upgraded, version)
        return upgraded
      }
    }
    removeStored(key)
    return null
  } catch {
    // Corrupted JSON, or storage that throws: either way there is nothing usable.
    removeStored(key)
    return null
  }
}

export function removeStored(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Nothing to clear.
  }
}

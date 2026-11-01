export interface FilterOption { value: string; label: string }
export interface FilterGroup { id: string; label: string; options: FilterOption[]; selected: string[]; multiple?: boolean; required?: boolean }
export interface FilterSheetProps { title: string; groups: FilterGroup[]; onApply: (selection: Record<string, string[]>) => void; onClear: () => void }

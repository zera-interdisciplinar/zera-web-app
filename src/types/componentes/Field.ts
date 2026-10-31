import type { ComponentPropsWithRef, ReactNode } from 'react'

export interface FieldCommonProps {
  label: string
  error?: string
  hint?: ReactNode
  /** Visual tone of the surrounding container: error colors must stay readable on navy. */
  tone?: 'light' | 'navy'
}

export type FieldProps = FieldCommonProps & { id: string; children: ReactNode; required?: boolean }
export type TextFieldProps = FieldCommonProps & ComponentPropsWithRef<'input'>
export type TextAreaFieldProps = FieldCommonProps & ComponentPropsWithRef<'textarea'>
export type SelectFieldProps = FieldCommonProps & ComponentPropsWithRef<'select'>

export interface ChoiceGroupProps {
  legend: string
  error?: string
  tone?: 'light' | 'navy'
  children: ReactNode
  required?: boolean
}

export type ChoiceOptionProps = ComponentPropsWithRef<'input'> & { label: string }

export type FilterSelectProps = ComponentPropsWithRef<'select'> & { label: string }

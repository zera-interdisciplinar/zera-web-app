import type { ComponentPropsWithRef, ReactNode } from 'react'

export interface FieldCommonProps {
  label: string
  error?: string
  hint?: ReactNode
  /** Visual tone of the surrounding container: error colors must stay readable on navy. */
  tone?: 'light' | 'navy'
}

export interface FieldProps extends FieldCommonProps { id: string; children: ReactNode; required?: boolean }
export interface TextFieldProps extends FieldCommonProps, ComponentPropsWithRef<'input'> {}
export interface TextAreaFieldProps extends FieldCommonProps, ComponentPropsWithRef<'textarea'> {}
export interface SelectFieldProps extends FieldCommonProps, ComponentPropsWithRef<'select'> {}

export interface ChoiceGroupProps {
  legend: string
  error?: string
  tone?: 'light' | 'navy'
  children: ReactNode
  required?: boolean
}

export interface ChoiceOptionProps extends ComponentPropsWithRef<'input'> { label: string }

export interface FilterSelectProps extends ComponentPropsWithRef<'select'> { label: string }

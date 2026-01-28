/**
 * Internal Project Field Configuration
 * Controls which fields are hidden when a project is internal.
 * Stored in AdminDefaults as system-wide config.
 */

/** Field keys that can be hidden on internal projects */
export type InternalFieldKey =
  | 'revenue'
  | 'potentialRevenue'
  | 'pipelineSource'
  | 'companyContact'
  | 'initiativeLink'

/** All configurable internal field keys */
export const INTERNAL_FIELD_KEYS: { key: InternalFieldKey; label: string; description: string }[] = [
  { key: 'revenue', label: 'Revenue (Actual)', description: 'Actual revenue from invoices' },
  { key: 'potentialRevenue', label: 'Revenue (Potential)', description: 'Potential revenue from deal/estimate' },
  { key: 'pipelineSource', label: 'Pipeline Source', description: 'Source deal or potential project' },
  { key: 'companyContact', label: 'Company & Contact', description: 'Company and contact association' },
  { key: 'initiativeLink', label: 'Initiative Link', description: 'Link to KRI / Initiative' },
]

/** Config stored in AdminDefaults.internalFieldConfig */
export interface InternalFieldConfig {
  hiddenFields: InternalFieldKey[]
}

/**
 * Default config when no admin config exists (INTL-06)
 * Hides revenue and pipeline source for internal projects
 */
export const DEFAULT_INTERNAL_FIELD_CONFIG: InternalFieldConfig = {
  hiddenFields: ['revenue', 'potentialRevenue', 'pipelineSource', 'companyContact'],
}

/** Check if a field should be hidden for internal projects */
export function isFieldHidden(
  config: InternalFieldConfig | null,
  fieldKey: InternalFieldKey,
  isInternal: boolean
): boolean {
  if (!isInternal) return false
  const effectiveConfig = config ?? DEFAULT_INTERNAL_FIELD_CONFIG
  return effectiveConfig.hiddenFields.includes(fieldKey)
}

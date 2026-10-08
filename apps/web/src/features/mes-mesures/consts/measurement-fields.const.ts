import { MEASUREMENT_CATALOG, MEASUREMENT_GROUP_LABELS, type MeasurementGroup } from '@angaly/types';

/** Fields of the "Mes mesures" form — derived from the shared catalogue (single source of truth). */
export const MEASUREMENT_FIELDS = MEASUREMENT_CATALOG.map((m) => ({
  key: m.key,
  label: m.label,
  help: m.help,
  group: m.group,
}));

export const MEASUREMENT_FIELD_GROUPS: Array<{
  group: MeasurementGroup;
  label: string;
  fields: typeof MEASUREMENT_FIELDS;
}> = (Object.keys(MEASUREMENT_GROUP_LABELS) as MeasurementGroup[]).map((group) => ({
  group,
  label: MEASUREMENT_GROUP_LABELS[group],
  fields: MEASUREMENT_FIELDS.filter((f) => f.group === group),
}));

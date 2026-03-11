import { z } from "./validators";

export const edgeSchema = z.object({
  id: z.string(),
  parent_id: z.string().nullable().default(null),
  name: z.string().nullable().optional().default(null),
});

export const edgeListSchema = z.array(edgeSchema);

export const scopedTagSchema = z.object({
  edge: z.string(),
  tag: z.string(),
  value: z.union([z.number(), z.string(), z.boolean(), z.null()]).default(null),
  name: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  comment: z.string().optional(),
  unit_of_measurement: z.string().optional(),
  precision: z.number().nullable().optional(),
});

export const scopedTagMetaSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  comment: z.string().optional(),
  unit_of_measurement: z.string().optional(),
});

export const scopedCurrentSchema = z.object({
  edgeIds: z.array(z.string()).default([]),
  tags: z.array(scopedTagSchema).default([]),
  tagMeta: z.array(scopedTagMetaSchema).optional(),
});

export const edgeCustomizationSchema = z.object({
  edge_id: z.string(),
  key: z.string(),
  value: z.string(),
});

export const edgeCustomizationListSchema = z.array(edgeCustomizationSchema);

export const currentDetailsItemSchema = z.object({
  tag: z.string(),
  value: z.union([z.number(), z.string(), z.boolean(), z.null()]).default(null),
  name: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  comment: z.string().optional(),
  unit_of_measurement: z.string().optional(),
  customization: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
});

export const currentDetailsSchema = z.array(currentDetailsItemSchema);

export const historyPointSchema = z.object({
  timestamp: z.string(),
  value: z.number(),
});

export const tagHistoryItemSchema = z.object({
  tag: z.string(),
  name: z.string(),
  min: z.number(),
  max: z.number(),
  comment: z.string().default(""),
  unit_of_measurement: z.string().default(""),
  customization: z.array(z.object({ key: z.string(), value: z.string() })).default([]),
  history: z.array(historyPointSchema).default([]),
});

export const tagHistoryListSchema = z.array(tagHistoryItemSchema);

export const mediaConfigSchema = z.object({
  key: z.string(),
  data: z.unknown().nullable(),
});

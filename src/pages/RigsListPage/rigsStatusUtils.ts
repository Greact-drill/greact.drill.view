import { parseNumericValue } from "../../utils/widgetValue";
import type { EdgeAttribute, RawEdgeAttributes } from "../../types/edge";
import { transformRawAttributes } from "../../utils/edgeUtils";
import type { EdgeTreeNode, ScopedTagRangeRecord, ScopedTagRecord, SectionStatus } from "./rigsStatusTypes";

export const STATIC_STATUS_DATA: Omit<EdgeAttribute, "id" | "edge_key"> = {
  bypass_state: "closed",
  drive_state: "normal",
  daily_maintenance: true,
  weekly_maintenance: true,
  monthly_maintenance: true,
  semiannual_maintenance: true,
  annual_maintenance: true,
};

export const hasErrorsInAttributes = (
  rawAttributes: RawEdgeAttributes | null | undefined,
  edgeId: string
): boolean => {
  const transformed = rawAttributes
    ? transformRawAttributes(rawAttributes, edgeId)
    : { id: 0, edge_key: edgeId, ...STATIC_STATUS_DATA };

  return (
    transformed.bypass_state !== "closed" ||
    transformed.drive_state !== "normal" ||
    transformed.daily_maintenance === false ||
    transformed.weekly_maintenance === false ||
    transformed.monthly_maintenance === false ||
    transformed.semiannual_maintenance === false ||
    transformed.annual_maintenance === false
  );
};

export const hasOutOfRangeTags = (tags: ScopedTagRangeRecord[]) =>
  tags.some((tag) => {
    const numericValue = parseNumericValue(tag.value);
    if (numericValue === null) return false;
    const hasMin = typeof tag.min === "number" && !Number.isNaN(tag.min);
    const hasMax = typeof tag.max === "number" && !Number.isNaN(tag.max);
    if (!hasMin || !hasMax || tag.max! <= tag.min!) return false;
    return numericValue < tag.min! || numericValue > tag.max!;
  });

export const getOutOfRangeTagIds = (tags: ScopedTagRecord[], tagIds: string[]): string[] => {
  const tagIdSet = new Set(tagIds);
  const outOfRange = new Set<string>();
  tags.forEach((tag) => {
    if (!tagIdSet.has(tag.tag)) return;
    const numericValue = parseNumericValue(tag.value);
    if (numericValue === null) return;
    const hasMin = typeof tag.min === "number" && !Number.isNaN(tag.min);
    const hasMax = typeof tag.max === "number" && !Number.isNaN(tag.max);
    if (!hasMin || !hasMax || tag.max! <= tag.min!) return;
    if (numericValue < tag.min! || numericValue > tag.max!) outOfRange.add(tag.tag);
  });
  return Array.from(outOfRange);
};

export const evaluateTagStatus = (tags: ScopedTagRecord[], tagIds: string[]): SectionStatus => {
  if (!tagIds.length) return "empty";
  const relevant = tags.filter((tag) => tagIds.includes(tag.tag));
  if (!relevant.length) return "empty";
  return getOutOfRangeTagIds(tags, tagIds).length ? "bad" : "ok";
};

export const flattenChildEdges = (edges: EdgeTreeNode[]): string[] => {
  const result: string[] = [];
  edges.forEach((edge) => {
    if (edge?.id) result.push(edge.id);
    if (Array.isArray(edge?.children) && edge.children.length) {
      result.push(...flattenChildEdges(edge.children));
    }
  });
  return result;
};

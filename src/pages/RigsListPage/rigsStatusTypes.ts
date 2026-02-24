import type { EdgeAttribute } from "../../types/edge";
import type { WidgetValue } from "../../utils/widgetValue";

export type SectionStatus = "ok" | "bad" | "empty";
export type RigTagStatus = "ok" | "bad" | "empty";
export type MaintenanceType =
  | "daily_maintenance"
  | "weekly_maintenance"
  | "monthly_maintenance"
  | "semiannual_maintenance"
  | "annual_maintenance";

export type ScopedTagRecord = { tag: string; value: WidgetValue; min?: number; max?: number };
export type ScopedTagRangeRecord = { value: WidgetValue; min?: number; max?: number };

export type EdgeTreeNode = { id?: string; children?: EdgeTreeNode[] };

export interface ExtendedEdgeAttribute extends EdgeAttribute {
  _lastUpdated?: string;
  _isStaticData?: boolean;
  _hasRealData?: boolean;
}

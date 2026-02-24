import { useMemo } from "react";
import { getCurrentByTags, getScopedCurrent } from "../../api/edges";
import type { EdgeWithAttributes } from "../../types/edge";
import type { WidgetConfigData } from "../../api/widgetConfigs";
import { usePollingQuery } from "../../hooks/usePollingQuery";
import {
  evaluateTagStatus,
  getOutOfRangeTagIds,
  hasOutOfRangeTags,
} from "./rigsStatusUtils";
import type { MaintenanceType, RigTagStatus, SectionStatus } from "./rigsStatusTypes";

const EMPTY_MAINTENANCE_STATUSES: Record<MaintenanceType, SectionStatus> = {
  daily_maintenance: "empty",
  weekly_maintenance: "empty",
  monthly_maintenance: "empty",
  semiannual_maintenance: "empty",
  annual_maintenance: "empty",
};

const EMPTY_MAINTENANCE_OUT_OF_RANGE: Record<MaintenanceType, string[]> = {
  daily_maintenance: [],
  weekly_maintenance: [],
  monthly_maintenance: [],
  semiannual_maintenance: [],
  annual_maintenance: [],
};

export function useRigsStatusComputation(params: {
  rootEdges: EdgeWithAttributes[];
  maintenanceConfigMap: Record<string, Record<MaintenanceType, string[]>>;
  edgeDescendantsMap: Record<string, string[]>;
  widgetConfigMap: Record<string, WidgetConfigData[]>;
}) {
  const { rootEdges, maintenanceConfigMap, edgeDescendantsMap, widgetConfigMap } = params;
  const rootEdgeIds = useMemo(() => rootEdges.map((edge) => edge.id), [rootEdges]);
  const rootEdgeKey = rootEdgeIds.join("|");

  const rigTagStatusQuery = usePollingQuery<Record<string, RigTagStatus>>({
    queryKey: ["rigs", "tagStatus", rootEdgeKey],
    enabled: rootEdges.length > 0,
    baseRefetchIntervalMs: 3000,
    queryFn: async () => {
      const results = await Promise.all(
        rootEdges.map(async (edge) => {
          try {
            const scoped = await getScopedCurrent(edge.id, true);
            if (!scoped.tags.length) {
              return { id: edge.id, status: "empty" as const };
            }
            return {
              id: edge.id,
              status: hasOutOfRangeTags(scoped.tags) ? ("bad" as const) : ("ok" as const),
            };
          } catch {
            return { id: edge.id, status: "empty" as const };
          }
        })
      );

      const map: Record<string, RigTagStatus> = {};
      results.forEach((result) => {
        map[result.id] = result.status;
      });
      return map;
    },
  });

  const maintenanceStatusQuery = usePollingQuery<{
    statusMap: Record<string, Record<MaintenanceType, SectionStatus>>;
    outOfRangeMap: Record<string, Record<MaintenanceType, string[]>>;
  }>({
    queryKey: ["rigs", "maintenanceStatus", rootEdgeKey, JSON.stringify(maintenanceConfigMap)],
    enabled: rootEdges.length > 0,
    baseRefetchIntervalMs: 3000,
    queryFn: async () => {
      const results = await Promise.all(
        rootEdges.map(async (edge) => {
          try {
            const configMap = maintenanceConfigMap[edge.id] ?? EMPTY_MAINTENANCE_OUT_OF_RANGE;
            const allTagIds = Array.from(new Set(Object.values(configMap).flat()));
            if (!allTagIds.length) {
              return { id: edge.id, statuses: EMPTY_MAINTENANCE_STATUSES, outOfRangeMap: EMPTY_MAINTENANCE_OUT_OF_RANGE };
            }

            const current = await getCurrentByTags(edge.id, allTagIds, true);
            const outOfRangeMap: Record<MaintenanceType, string[]> = {
              daily_maintenance: getOutOfRangeTagIds(current.tags, configMap.daily_maintenance),
              weekly_maintenance: getOutOfRangeTagIds(current.tags, configMap.weekly_maintenance),
              monthly_maintenance: getOutOfRangeTagIds(current.tags, configMap.monthly_maintenance),
              semiannual_maintenance: getOutOfRangeTagIds(current.tags, configMap.semiannual_maintenance),
              annual_maintenance: getOutOfRangeTagIds(current.tags, configMap.annual_maintenance),
            };

            const statuses: Record<MaintenanceType, SectionStatus> = {
              daily_maintenance: outOfRangeMap.daily_maintenance.length
                ? "bad"
                : evaluateTagStatus(current.tags, configMap.daily_maintenance),
              weekly_maintenance: outOfRangeMap.weekly_maintenance.length
                ? "bad"
                : evaluateTagStatus(current.tags, configMap.weekly_maintenance),
              monthly_maintenance: outOfRangeMap.monthly_maintenance.length
                ? "bad"
                : evaluateTagStatus(current.tags, configMap.monthly_maintenance),
              semiannual_maintenance: outOfRangeMap.semiannual_maintenance.length
                ? "bad"
                : evaluateTagStatus(current.tags, configMap.semiannual_maintenance),
              annual_maintenance: outOfRangeMap.annual_maintenance.length
                ? "bad"
                : evaluateTagStatus(current.tags, configMap.annual_maintenance),
            };
            return { id: edge.id, statuses, outOfRangeMap };
          } catch {
            return { id: edge.id, statuses: EMPTY_MAINTENANCE_STATUSES, outOfRangeMap: EMPTY_MAINTENANCE_OUT_OF_RANGE };
          }
        })
      );

      const statusMap: Record<string, Record<MaintenanceType, SectionStatus>> = {};
      const outOfRangeMap: Record<string, Record<MaintenanceType, string[]>> = {};
      results.forEach((result) => {
        statusMap[result.id] = result.statuses;
        outOfRangeMap[result.id] = result.outOfRangeMap;
      });

      return { statusMap, outOfRangeMap };
    },
  });

  const sectionStatusQuery = usePollingQuery<{
    sectionStatusMap: Record<string, { BYPASS: SectionStatus; ACCIDENT: SectionStatus }>;
    sectionOutOfRangeMap: Record<string, { BYPASS: string[]; ACCIDENT: string[] }>;
  }>({
    queryKey: ["rigs", "sectionStatus", rootEdgeKey, JSON.stringify(edgeDescendantsMap), JSON.stringify(widgetConfigMap)],
    enabled: rootEdges.length > 0,
    baseRefetchIntervalMs: 3000,
    queryFn: async () => {
      const results = await Promise.all(
        rootEdges.map(async (edge) => {
          try {
            const allEdgeIds = edgeDescendantsMap[edge.id] ?? [edge.id];
            const flatConfigs = allEdgeIds.flatMap((edgeId) => widgetConfigMap[edgeId] ?? []);

            const bypassTagIds = new Set<string>();
            const accidentTagIds = new Set<string>();
            flatConfigs.forEach((config) => {
              const page = config.config?.page;
              if (!page) return;
              if (page === "BYPASS" || page === `BYPASS_${config.edge_id}` || page === "Состояние байпасов") {
                bypassTagIds.add(config.tag_id);
              }
              if (page === "ACCIDENT" || page === `ACCIDENT_${config.edge_id}` || page === "Аварии приводов") {
                accidentTagIds.add(config.tag_id);
              }
            });

            const allTagIds = Array.from(new Set([...bypassTagIds, ...accidentTagIds]));
            if (!allTagIds.length) {
              return {
                id: edge.id,
                statuses: { BYPASS: "empty" as const, ACCIDENT: "empty" as const },
                outOfRangeMap: { BYPASS: [], ACCIDENT: [] },
              };
            }

            const current = await getCurrentByTags(edge.id, allTagIds, true);
            const outOfRangeMap = {
              BYPASS: getOutOfRangeTagIds(current.tags, Array.from(bypassTagIds)),
              ACCIDENT: getOutOfRangeTagIds(current.tags, Array.from(accidentTagIds)),
            };
            const statuses = {
              BYPASS: outOfRangeMap.BYPASS.length
                ? "bad"
                : evaluateTagStatus(current.tags, Array.from(bypassTagIds)),
              ACCIDENT: outOfRangeMap.ACCIDENT.length
                ? "bad"
                : evaluateTagStatus(current.tags, Array.from(accidentTagIds)),
            };
            return { id: edge.id, statuses, outOfRangeMap };
          } catch {
            return {
              id: edge.id,
              statuses: { BYPASS: "empty" as const, ACCIDENT: "empty" as const },
              outOfRangeMap: { BYPASS: [], ACCIDENT: [] },
            };
          }
        })
      );

      const sectionStatusMap: Record<string, { BYPASS: SectionStatus; ACCIDENT: SectionStatus }> = {};
      const sectionOutOfRangeMap: Record<string, { BYPASS: string[]; ACCIDENT: string[] }> = {};
      results.forEach((result) => {
        sectionStatusMap[result.id] = result.statuses;
        sectionOutOfRangeMap[result.id] = result.outOfRangeMap;
      });
      return { sectionStatusMap, sectionOutOfRangeMap };
    },
  });

  return {
    rigTagStatusMap: rigTagStatusQuery.data ?? {},
    maintenanceStatusMap: maintenanceStatusQuery.data?.statusMap ?? {},
    maintenanceOutOfRangeMap: maintenanceStatusQuery.data?.outOfRangeMap ?? {},
    rigSectionStatusMap: sectionStatusQuery.data?.sectionStatusMap ?? {},
    rigSectionOutOfRangeMap: sectionStatusQuery.data?.sectionOutOfRangeMap ?? {},
    loading:
      rigTagStatusQuery.isPending || maintenanceStatusQuery.isPending || sectionStatusQuery.isPending,
  };
}

import { useMemo } from "react";
import type { EdgeWithAttributes } from "../../types/edge";
import { getEdgeChildren } from "../../hooks/useEdges";
import { getWidgetConfigsByEdge, type WidgetConfigData } from "../../api/widgetConfigs";
import { getEdgeCustomizations } from "../../api/edges";
import { usePollingQuery } from "../../hooks/usePollingQuery";
import { flattenChildEdges } from "./rigsStatusUtils";
import type { EdgeTreeNode, MaintenanceType } from "./rigsStatusTypes";

const EMPTY_MAINTENANCE_CONFIG: Record<MaintenanceType, string[]> = {
  daily_maintenance: [],
  weekly_maintenance: [],
  monthly_maintenance: [],
  semiannual_maintenance: [],
  annual_maintenance: [],
};

export function useRigsConfigs(rootEdges: EdgeWithAttributes[]) {
  const rootEdgeIds = useMemo(() => rootEdges.map((edge) => edge.id), [rootEdges]);
  const rootEdgeKey = rootEdgeIds.join("|");

  const hierarchyQuery = usePollingQuery<{
    edgeDescendantsMap: Record<string, string[]>;
    widgetConfigMap: Record<string, WidgetConfigData[]>;
  }>({
    queryKey: ["rigs", "hierarchy", rootEdgeKey],
    enabled: rootEdgeIds.length > 0,
    baseRefetchIntervalMs: 30_000,
    queryFn: async () => {
      const edgeDescendants = await Promise.all(
        rootEdges.map(async (edge) => {
          try {
            const children = await getEdgeChildren(edge.id);
            const descendantIds = [edge.id, ...flattenChildEdges(children as EdgeTreeNode[])];
            return { id: edge.id, descendantIds };
          } catch {
            return { id: edge.id, descendantIds: [edge.id] };
          }
        })
      );

      const edgeDescendantsMap: Record<string, string[]> = {};
      const allEdgeIds = new Set<string>();
      edgeDescendants.forEach((entry) => {
        edgeDescendantsMap[entry.id] = entry.descendantIds;
        entry.descendantIds.forEach((id) => allEdgeIds.add(id));
      });

      const edgeIds = Array.from(allEdgeIds);
      const widgetConfigs = await Promise.all(
        edgeIds.map((edgeId) => getWidgetConfigsByEdge(edgeId).catch(() => []))
      );

      const widgetConfigMap: Record<string, WidgetConfigData[]> = {};
      edgeIds.forEach((edgeId, index) => {
        widgetConfigMap[edgeId] = widgetConfigs[index] || [];
      });

      return { edgeDescendantsMap, widgetConfigMap };
    },
  });

  const maintenanceConfigQuery = usePollingQuery<Record<string, Record<MaintenanceType, string[]>>>({
    queryKey: ["rigs", "maintenanceConfig", rootEdgeKey],
    enabled: rootEdgeIds.length > 0,
    baseRefetchIntervalMs: 10_000,
    queryFn: async () => {
      const results = await Promise.all(
        rootEdges.map(async (edge) => {
          try {
            const customizations = await getEdgeCustomizations(edge.id);
            const maintenanceConfig = customizations.find((item) => item.key === "maintenanceConfig");
            const parsedConfig = maintenanceConfig ? JSON.parse(maintenanceConfig.value) : {};
            const configMap: Record<MaintenanceType, string[]> = {
              daily_maintenance: Array.isArray(parsedConfig.daily_maintenance)
                ? parsedConfig.daily_maintenance
                : [],
              weekly_maintenance: Array.isArray(parsedConfig.weekly_maintenance)
                ? parsedConfig.weekly_maintenance
                : [],
              monthly_maintenance: Array.isArray(parsedConfig.monthly_maintenance)
                ? parsedConfig.monthly_maintenance
                : [],
              semiannual_maintenance: Array.isArray(parsedConfig.semiannual_maintenance)
                ? parsedConfig.semiannual_maintenance
                : [],
              annual_maintenance: Array.isArray(parsedConfig.annual_maintenance)
                ? parsedConfig.annual_maintenance
                : [],
            };
            return { id: edge.id, configMap };
          } catch {
            return { id: edge.id, configMap: EMPTY_MAINTENANCE_CONFIG };
          }
        })
      );

      const nextMap: Record<string, Record<MaintenanceType, string[]>> = {};
      results.forEach((result) => {
        nextMap[result.id] = result.configMap;
      });
      return nextMap;
    },
  });

  return {
    edgeDescendantsMap: hierarchyQuery.data?.edgeDescendantsMap ?? {},
    widgetConfigMap: hierarchyQuery.data?.widgetConfigMap ?? {},
    maintenanceConfigMap: maintenanceConfigQuery.data ?? {},
    loading: hierarchyQuery.isPending || maintenanceConfigQuery.isPending,
  };
}

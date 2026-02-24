import { useMemo } from "react";
import type { EdgeWithAttributes } from "../../types/edge";
import { useRigsConfigs } from "./useRigsConfigs";
import { useRigsStatusComputation } from "./useRigsStatusComputation";

export function useRigsPollingOrchestration(rootEdges: EdgeWithAttributes[]) {
  const configs = useRigsConfigs(rootEdges);
  const statuses = useRigsStatusComputation({
    rootEdges,
    maintenanceConfigMap: configs.maintenanceConfigMap,
    edgeDescendantsMap: configs.edgeDescendantsMap,
    widgetConfigMap: configs.widgetConfigMap,
  });

  const loading = useMemo(
    () => configs.loading || statuses.loading,
    [configs.loading, statuses.loading]
  );

  return {
    ...configs,
    ...statuses,
    loading,
  };
}

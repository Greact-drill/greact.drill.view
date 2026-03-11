import { useEffect, useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { getScopedCurrentByEdgeBlock } from "../api/edges";
import { getRigById } from "../api/rigs";
import { useEdgeChildren, useEdgeWithAttributes } from "../hooks/useEdges";
import { useCurrentDetails } from "../hooks/useCurrentDetails";
import { useWidgetConfigsByEdge } from "../hooks/useWidgetConfigs";
import { queryKeys } from "../api/queryKeys";
import type { EdgeAttribute, RawEdgeAttributes } from "../types/edge";
import type { Rig } from "../types/rig";
import type { WidgetType } from "../types/widget";
import { transformRawAttributes } from "../utils/edgeUtils";
import { polygonPercentToSvgPoints } from "../utils/polygonUtils";
import {
  getDefaultWidgetValue,
  isWidgetValueOK,
  parseNumericValue,
  type WidgetValue,
} from "../utils/widgetValue";

export interface DynamicWidgetConfig {
  edgeId?: string;
  key: string;
  type: WidgetType;
  label: string;
  value: number | string | boolean | null;
  defaultValue?: number | string | boolean;
  max: number;
  unit: string;
  precision?: number | null;
  isOK?: boolean;
  position: { x: number; y: number };
  displayType: "widget" | "compact" | "card";
  isLoading?: boolean;
  hasData?: boolean;
}

const SEGMENTS = [
  {
    id: "1",
    name: "КТУ/КРУ",
    href: "/ktu/:rigId",
    polygon: "14.2% 73.1%, 25% 70.67%, 32.7% 73.99%, 32.9% 80.2%, 21.5% 83.2%, 14.5% 79.5%",
  },
  {
    id: "2",
    name: "Насосный блок",
    href: "/pumpblock/:rigId",
    polygon: "26.55% 70.4%, 35.999% 68.4%, 43.7% 71.1%, 43.8% 77%, 34.5% 79.6%, 34.2% 73.7%",
  },
  {
    id: "3",
    name: "Циркуляционная система",
    href: "/",
    polygon: "37.2% 68.1%, 45% 66.4%, 53.3% 68.7%, 53.3% 74.3%, 45.1% 76.8%, 44.9% 70.8%",
  },
  {
    id: "4",
    name: "Лебедочный блок",
    href: "/",
    polygon: "41.5% 64.99%, 60.5% 60.9%, 73.5% 63.7%, 79.2% 64.8%, 84.5% 66%, 66.5% 71.5%",
  },
];

export function useMainPageViewModel(rigId: string) {
  const [rig, setRig] = useState<Rig | null>(null);
  const edgeKey = `${rigId}`;

  const { edgeData } = useEdgeWithAttributes(edgeKey);
  const { children: childEdges, loading: childrenLoading, error: childrenError } = useEdgeChildren(edgeKey);
  const { widgetConfigs, loading: widgetsLoading, error: widgetsError } = useWidgetConfigsByEdge(edgeKey);
  const { data: currentDetailsData } = useCurrentDetails(rigId || null);
  const scopedByBlockQueries = useQueries({
    queries: childEdges.map((child) => ({
      queryKey: queryKeys.current.scopedByEdgeBlock(edgeKey, child.id),
      queryFn: () => getScopedCurrentByEdgeBlock(edgeKey, child.id),
      enabled: Boolean(edgeKey && child.id),
      refetchInterval: 1000,
    })),
  });

  const edgeAttributes: EdgeAttribute | null = useMemo(() => {
    if (!edgeData?.attributes) return null;
    return transformRawAttributes(edgeData.attributes as RawEdgeAttributes, edgeKey);
  }, [edgeData, edgeKey]);

  const allWidgetConfigs: DynamicWidgetConfig[] = useMemo(() => {
    const edgeWidgets = (widgetConfigs || []).map((config) => {
      const rawWidgetType = config.config.widgetType;
      const widgetType: WidgetType =
        rawWidgetType === "compact" || rawWidgetType === "card" ? "number" : rawWidgetType;
      const displayType = config.config.displayType || "widget";
      const currentValue = currentDetailsData?.find((td) => td.tag === config.tag_id)?.value;
      const hasData = currentValue !== undefined && currentValue !== null;
      const value = hasData ? currentValue : getDefaultWidgetValue(widgetType, config.tag.unit_of_measurement);
      const isOK = isWidgetValueOK({
        value,
        min: config.tag.min || 0,
        max: config.tag.max || 100,
        unit: config.tag.unit_of_measurement,
        widgetType,
      });

      return {
        key: `${config.tag_id}-${config.config.page}`,
        type: widgetType,
        label: config.config.customLabel || config.tag.name || config.tag.comment,
        value,
        defaultValue: getDefaultWidgetValue(widgetType, config.tag.unit_of_measurement),
        max: config.tag.max || 100,
        unit: config.tag.unit_of_measurement || "",
        precision: config.tag.precision ?? null,
        isOK,
        position: config.config.position || { x: 0, y: 0 },
        displayType,
        isLoading: false,
        hasData,
      } as DynamicWidgetConfig;
    });

    const blockWidgets = childEdges.flatMap((block, blockIndex) =>
        (scopedByBlockQueries[blockIndex]?.data?.tags || []).map((tag, index) => {
          const hasData = tag.value !== null && tag.value !== undefined;
          return {
            key: `block-${block.id}-${tag.tag}-${index}`,
            type: "number" as WidgetType,
            label: tag.name || `Тег ${tag.tag}`,
            value: tag.value,
            defaultValue: 0,
            max: tag.max || 100,
            unit: tag.unit_of_measurement || "",
            precision: tag.precision ?? null,
            isOK:
              hasData &&
              (() => {
                const numericValue = parseNumericValue(tag.value);
                if (numericValue === null || tag.min === undefined || tag.max === undefined) return true;
                return numericValue >= tag.min && numericValue <= tag.max;
              })(),
            position: { x: 0, y: 0 },
            displayType: "compact" as const,
            isLoading: false,
            hasData,
            source: "block" as const,
            edgeId: block.id,
          } as DynamicWidgetConfig;
        })
    );

    return [...edgeWidgets, ...blockWidgets];
  }, [widgetConfigs, scopedByBlockQueries, currentDetailsData, edgeKey, childEdges]);

  const dynamicWidgetConfigs: DynamicWidgetConfig[] = useMemo(() => {
    if (!widgetConfigs || widgetConfigs.length === 0) return [];

    const currentDetailsMap = new Map<string, WidgetValue>();
    if (currentDetailsData) {
      currentDetailsData.forEach((tagData) => currentDetailsMap.set(tagData.tag, tagData.value));
    }

    return widgetConfigs.map((config) => {
      const rawWidgetType = config.config.widgetType;
      const widgetType: WidgetType =
        rawWidgetType === "compact" || rawWidgetType === "card" ? "number" : rawWidgetType;
      const displayType = config.config.displayType || "widget";
      const currentValueFromDetails = currentDetailsMap.get(config.tag_id);
      const currentValue = currentValueFromDetails !== undefined ? currentValueFromDetails : config.current?.value;
      const hasData = currentValue !== null && currentValue !== undefined;
      const value = hasData ? currentValue : getDefaultWidgetValue(widgetType, config.tag.unit_of_measurement);
      const defaultValue = config.tag.unit_of_measurement === "bool" ? false : 0;
      const isOK = isWidgetValueOK({
        value,
        min: config.tag.min || 0,
        max: config.tag.max || 100,
        unit: config.tag.unit_of_measurement,
        widgetType,
      });

      return {
        key: `${config.tag_id}-${config.config.page}`,
        type: widgetType,
        label: config.config.customLabel || config.tag.name || config.tag.comment,
        value,
        defaultValue,
        max: config.tag.max || 100,
        unit: config.tag.unit_of_measurement || "",
        precision: config.tag.precision ?? null,
        isOK,
        position: config.config.position || { x: 0, y: 0 },
        displayType,
        isLoading: false,
        hasData,
      };
    });
  }, [widgetConfigs, currentDetailsData]);

  const tagsStats = useMemo(() => {
    const edgeTags = allWidgetConfigs.filter((w) => !w.key.startsWith("block-"));
    const blockTags = allWidgetConfigs.filter((w) => w.key.startsWith("block-"));
    const rootOrRigTagsCount = edgeTags.length;
    const errorTags = allWidgetConfigs
      .filter((w) => w.hasData && !w.isOK)
      .map((w) => {
        const source = w.key.startsWith("block-") ? "block" : "edge";
        const edgeName =
          source === "block" && w.edgeId
            ? childEdges.find((child) => child.id === w.edgeId)?.name || `Блок ${w.edgeId}`
            : "Буровая установка";
        return { label: w.label, value: w.value, unit: w.unit, max: w.max, type: w.type, source, edgeName };
      });

    return {
      totalTags: allWidgetConfigs.length,
      edgeTagsCount: rootOrRigTagsCount,
      blockTagsCount: blockTags.length,
      tagsWithData: allWidgetConfigs.filter((w) => w.hasData).length,
      tagsWithErrors: allWidgetConfigs.filter((w) => w.hasData && !w.isOK).length,
      tagsOk: allWidgetConfigs.filter((w) => w.hasData && w.isOK).length,
      errorTags,
      uniqueBlockEdges: [...new Set(blockTags.map((t) => t.edgeId))].length,
      hasBlockData: blockTags.length > 0,
      lastUpdated: new Date().toLocaleTimeString(),
    };
  }, [allWidgetConfigs, childEdges]);

  const staticSegmentsWithStatus = useMemo(
    () =>
      SEGMENTS.map((segment) => ({
        ...segment,
        status: segment.id === "2" ? "error" : segment.id === "3" ? "warning" : "ok",
        svgPoints: polygonPercentToSvgPoints(segment.polygon, 1010, 1024),
      })).filter((segment) => segment.polygon),
    []
  );

  useEffect(() => {
    getRigById(rigId).then((r) => setRig(r ?? null));
  }, [rigId]);

  return {
    rig,
    edgeData,
    childEdges,
    childrenLoading,
    childrenError,
    edgeAttributes,
    widgetsLoading,
    widgetsError,
    dynamicWidgetConfigs,
    tagsStats,
    staticSegmentsWithStatus,
  };
}

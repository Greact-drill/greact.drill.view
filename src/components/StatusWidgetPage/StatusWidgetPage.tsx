import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import VerticalBar from "../VerticalBar/VerticalBar";
import GaugeWidget from "../Gauge/GaugeWidget";
import NumberDisplay from "../NumberDisplay/NumberDisplay";
import BypassStatusBlock from "../BypassStatusBlock/BypassStatusBlock";
import { useTagsData } from "../../hooks/useTagsData";
import type { TagData } from "../../types/tag";
import { formatNumberWithUnit } from "../../utils/formatters";
import { isWidgetValueOK, parseNumericValue } from "../../utils/widgetValue";
import PageHeader from "../PageHeader/PageHeader";
import ErrorView from "../ErrorView/ErrorView";
import EmptyState from "../EmptyState/EmptyState";

type SupportedStatusPage = "KTU" | "BYPASS" | "ACCIDENT";
type BaseWidgetType = "gauge" | "bar" | "number" | "status";

interface WidgetConfig {
  page: "KTU" | "PUMPBLOCK" | "ACCIDENT" | "BYPASS";
  widgetType: BaseWidgetType;
  position: { x: number; y: number };
  customLabel?: string;
}

interface StatusWidgetConfig {
  key: string;
  type: BaseWidgetType;
  label: string;
  value: number | string | boolean;
  max: number;
  unit: string;
  isOK?: boolean;
  position: { x: number; y: number };
}

interface StatusWidgetPageProps {
  page: SupportedStatusPage;
  title: string;
  emptyMessage: string;
  containerClassName: string;
  innerClassName: string;
  controlsClassName: string;
  contentClassName: string;
  titleClassName: string;
  gridClassName: string;
}

const findWidgetConfig = (tag: TagData, page: WidgetConfig["page"]): WidgetConfig | null => {
  const configCustom = tag.customization?.find((item) => item.key === "widgetConfig");

  if (!configCustom) {
    return null;
  }

  try {
    const config: WidgetConfig = JSON.parse(configCustom.value);
    return config.page === page ? config : null;
  } catch (error) {
    console.error("Ошибка парсинга конфига виджета:", error, "Строка:", configCustom.value);
    return null;
  }
};

const transformTagToWidgetConfig = (
  tag: TagData,
  page: WidgetConfig["page"]
): StatusWidgetConfig | null => {
  const config = findWidgetConfig(tag, page);
  if (!config) {
    return null;
  }

  const isStatusTag =
    tag.unit_of_measurement === "bool" || tag.customization?.some((c) => c.key === "isStatus");

  return {
    key: `${tag.tag}-${page}`,
    type: config.widgetType,
    label: config.customLabel || tag.name || tag.comment,
    value: tag.value ?? (tag.unit_of_measurement === "bool" ? false : 0),
    max: tag.max,
    unit: tag.unit_of_measurement || "",
    isOK: isWidgetValueOK({
      value: tag.value,
      min: tag.min,
      max: tag.max,
      unit: tag.unit_of_measurement,
      widgetType: config.widgetType,
      isStatusTag,
    }),
    position: config.position,
  };
};

export default function StatusWidgetPage({
  page,
  title,
  emptyMessage,
  containerClassName,
  innerClassName,
  controlsClassName,
  contentClassName,
  titleClassName,
  gridClassName,
}: StatusWidgetPageProps) {
  const navigate = useNavigate();
  const params = useParams();
  const edgeKey = `${params.rigId}`;
  const { tagData, error } = useTagsData(edgeKey);

  const widgetConfigs: StatusWidgetConfig[] = useMemo(() => {
    if (!tagData) {
      return [];
    }

    return tagData
      .map((tag) => transformTagToWidgetConfig(tag, page))
      .filter((config): config is StatusWidgetConfig => config !== null)
      .sort((a, b) => {
        const typeA = a.type === "gauge" || a.type === "bar" ? 0 : 1;
        const typeB = b.type === "gauge" || b.type === "bar" ? 0 : 1;
        if (typeA !== typeB) {
          return typeA - typeB;
        }
        return a.label.localeCompare(b.label);
      });
  }, [tagData, page]);

  const renderWidget = (config: StatusWidgetConfig) => {
    const dimensions =
      config.type === "bar" ? { width: 250, height: 500 } : { width: 250, height: 250 };

    const positionStyle = {
      position: "absolute" as const,
      left: `${config.position.x}px`,
      top: `${config.position.y}px`,
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      zIndex: 10,
    };

    const widgetContent = (() => {
      switch (config.type) {
        case "gauge":
          return (
            <GaugeWidget
              key={config.key}
              label={config.label}
              value={config.value as number}
              max={config.max}
              unit={config.unit}
            />
          );
        case "bar":
          return (
            <VerticalBar
              key={config.key}
              label={config.label}
              value={config.value as number}
              max={config.max}
            />
          );
        case "number": {
          const displayValue = formatNumberWithUnit(parseNumericValue(config.value), config.unit);
          return <NumberDisplay key={config.key} label={config.label} value={displayValue} />;
        }
        case "status":
          return (
            <BypassStatusBlock
              key={config.key}
              label={config.label}
              value={config.value as string}
              isOK={config.isOK ?? false}
            />
          );
        default:
          return null;
      }
    })();

    return (
      <div
        className={`positioned-widget widget-${config.type}`}
        key={config.key}
        style={positionStyle}
        data-widget-type={config.type}
        data-position-x={config.position.x}
        data-position-y={config.position.y}
      >
        {widgetContent}
      </div>
    );
  };

  if (error) {
    return <ErrorView message={`Ошибка загрузки: ${error}`} onRetry={() => window.location.reload()} />;
  }

  return (
    <div className={containerClassName}>
      <div className={innerClassName}>
        <div className={contentClassName}>
          <PageHeader
            title={title}
            titleClassName={titleClassName}
            className={controlsClassName}
            onBack={() => navigate(-1)}
          />
          <div className={`${gridClassName} positioned-grid`}>
            {widgetConfigs.map(renderWidget)}
            {widgetConfigs.length === 0 && (
              <div className="empty-grid-message">
                <EmptyState message={`${emptyMessage} Настройте виджеты в админ-панели.`} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import drillSvg from "../../assets/drill.svg";
import { getEdgeChildren, useEdgeWithAttributes, useRootEdgesWithAttributes } from "../../hooks/useEdges";
import { useWidgetConfigsByEdge } from "../../hooks/useWidgetConfigs";
import { useCurrentDetails } from "../../hooks/useCurrentDetails";
import AnimatedCounter from "../../components/AnimatedCounter/AnimatedCounter";
import type { EdgeWithAttributes, EdgeAttribute, RawEdgeAttributes } from "../../types/edge";
import { transformRawAttributes } from "../../utils/edgeUtils";
import { Button } from 'primereact/button';
import { getCurrentByTags, getEdgeCustomizations, getScopedCurrent } from "../../api/edges";
import { getWidgetConfigsByEdge, type WidgetConfigData } from "../../api/widgetConfigs";
import './RigsListPage.css';
import '../../App.css';

interface RigCompatible extends EdgeWithAttributes {
  id: string;
  ok: boolean;
}

interface ExtendedEdgeAttribute extends EdgeAttribute {
  _lastUpdated?: string;
  _isStaticData?: boolean;
  _hasRealData?: boolean;
}

const STATIC_STATUS_DATA: Omit<EdgeAttribute, 'id' | 'edge_key'> = {
  bypass_state: 'closed',
  drive_state: 'normal',
  daily_maintenance: true,
  weekly_maintenance: true,
  monthly_maintenance: true,
  semiannual_maintenance: true,
  annual_maintenance: true,
};

// Компонент для кнопок статусов
type SectionStatus = 'ok' | 'bad' | 'empty';

const RigStatusButtons = ({
  attributes,
  rigId,
  sectionStatus,
  maintenanceStatus,
  maintenanceOutOfRange
}: {
  attributes: ExtendedEdgeAttribute,
  rigId: string,
  sectionStatus: Record<string, SectionStatus>,
  maintenanceStatus: Record<MaintenanceType, SectionStatus>,
  maintenanceOutOfRange: Record<MaintenanceType, string[]>
}) => {
  const getStatusClass = (value: any, type: 'boolean' | 'state') => {
    if (type === 'boolean') {
      return value ? 'ok' : 'error';
    }
    
    if (type === 'state') {
      if (typeof value === 'string') {
        return value.toLowerCase() === 'normal' || value.toLowerCase() === 'closed' ? 'ok' : 'error';
      }
    }
    
    return 'warning';
  };

  const getStatusIcon = (key: string, value: any) => {
    switch (key) {
      case 'bypass_state':
        return value === 'closed' ? 'pi pi-lock' : 'pi pi-unlock';
      case 'drive_state':
        return value === 'normal' ? 'pi pi-cog' : 'pi pi-exclamation-triangle';
      case 'daily_maintenance':
        return 'pi pi-calendar';
      case 'weekly_maintenance':
        return 'pi pi-calendar-clock';
      case 'monthly_maintenance':
        return 'pi pi-moon';
      case 'semiannual_maintenance':
        return 'pi pi-sync';
      case 'annual_maintenance':
        return 'pi pi-star';
      default:
        return 'pi pi-info-circle';
    }
  };

  const formatValue = (_key: string, value: any) => {
    if (typeof value === 'boolean') {
      return value ? 'Выполнено' : 'Требуется';
    }
    
    if (typeof value === 'string') {
      switch (value.toLowerCase()) {
        case 'closed':
          return 'Закрыт';
        case 'open':
          return 'Открыт';
        case 'normal':
          return 'Норма';
        case 'error':
          return 'Авария';
        default:
          return value;
      }
    }
    
    return String(value);
  };

  // Основные статусы
  const mainStatuses = [
    {
      pageType: 'BYPASS',
      title: 'Состояние байпасов',
      value: attributes.bypass_state,
      type: 'state' as const,
      icon: attributes.bypass_state === 'closed' ? 'pi pi-lock' : 'pi pi-unlock'
    },
    {
      pageType: 'ACCIDENT',
      title: 'Аварии приводов',
      value: attributes.drive_state,
      type: 'state' as const,
      icon: attributes.drive_state === 'normal' ? 'pi pi-cog' : 'pi pi-exclamation-triangle'
    },
  ];

  // Статусы ТО
  const maintenanceStatuses = [
    { key: 'daily_maintenance' as const, title: 'Ежедневное' },
    { key: 'weekly_maintenance' as const, title: 'Еженедельное' },
    { key: 'monthly_maintenance' as const, title: 'Ежемесячное' },
    { key: 'semiannual_maintenance' as const, title: 'Полугодовое' },
    { key: 'annual_maintenance' as const, title: 'Годовое' }
  ];

  

  return (
    <div className="rig-status-buttons-container">
      {/* Основные статусы */}
      <div className="status-section-title">
        <i className="pi pi-shield" />
        <span>Статусы оборудования</span>
      </div>
      <div className="rig-status-buttons">
        {mainStatuses.map(({ pageType, title, value, type, icon }) => {
          const override = sectionStatus[pageType];
          const statusClass = override === 'empty'
            ? 'neutral'
            : override === 'bad'
              ? 'error'
              : override === 'ok'
                ? 'ok'
                : getStatusClass(value, type);

          return (
          <Link
            key={pageType}
            to={`/rigs/${rigId}/widgets/${pageType}`}
            state={{ pageTitle: title }}
            className="status-button-link"
          >
            <div className={`status-button ${statusClass}`}>
              <div className={`status-icon ${statusClass}`}>
                <i className={icon} />
              </div>
              <div className="status-title">{title}</div>
              <div className="status-value">{formatValue(pageType, value)}</div>
            </div>
          </Link>
        );
        })}
      </div>

      {/* Статусы ТО */}
      <div className="status-section-title">
        <i className="pi pi-wrench" />
        <span>Техническое обслуживание</span>
      </div>
      <div className="rig-status-buttons maintenance-buttons">
        {maintenanceStatuses.map(({ key, title }) => {
          const value = maintenanceStatus?.[key];
          const isEmptyArray = Array.isArray(value) && value.length === 0;
          const status = (value == null || isEmptyArray) ? 'empty' : value;
          const statusClass = status === 'empty' ? 'neutral' : status === 'bad' ? 'error' : 'ok';
          const statusLabel = status === 'empty'
            ? 'Отсутствуют данные'
            : status === 'bad'
              ? 'Требует внимания'
              : 'В норме';
          const outOfRangeCount = maintenanceOutOfRange[key]?.length ?? 0;

          return (
          <Link
            key={key}
            to={`/rigs/${rigId}/maintenance-status/${key}`}
            className="status-button-link"
          >
            <div className={`status-button maintenance-button ${statusClass}`}>
              <div className={`maintenance-status-indicator ${statusClass}`} />
              <div className={`status-icon ${statusClass}`}>
                <i className={getStatusIcon(key, attributes[key])} />
              </div>
              <div className="status-title">{title}</div>
              <div className="status-value">
                {statusLabel}
                {status === 'bad' && outOfRangeCount > 0 && (
                  <span className="maintenance-badge">+{outOfRangeCount}</span>
                )}
              </div>
            </div>
          </Link>
        );
        })}
      </div>
    </div>
  );
};


type RigTagStatus = 'ok' | 'bad' | 'empty';
type MaintenanceType = 'daily_maintenance' | 'weekly_maintenance' | 'monthly_maintenance' | 'semiannual_maintenance' | 'annual_maintenance';

export default function RigsListPage() {
  const [selectedRigId, setSelectedRigId] = useState<string | null>(null);
  const [rigTagStatusMap, setRigTagStatusMap] = useState<Record<string, RigTagStatus>>({});
  const [maintenanceStatusMap, setMaintenanceStatusMap] = useState<Record<string, Record<MaintenanceType, SectionStatus>>>({});
  const [maintenanceOutOfRangeMap, setMaintenanceOutOfRangeMap] = useState<Record<string, Record<MaintenanceType, string[]>>>({});
  const [rigSectionStatusMap, setRigSectionStatusMap] = useState<Record<string, { BYPASS: SectionStatus; ACCIDENT: SectionStatus }>>({});
  const [rigSectionOutOfRangeMap, setRigSectionOutOfRangeMap] = useState<Record<string, { BYPASS: string[]; ACCIDENT: string[] }>>({});
  const [edgeDescendantsMap, setEdgeDescendantsMap] = useState<Record<string, string[]>>({});
  const [widgetConfigMap, setWidgetConfigMap] = useState<Record<string, WidgetConfigData[]>>({});
  const [maintenanceConfigMap, setMaintenanceConfigMap] = useState<Record<string, Record<MaintenanceType, string[]>>>({});
  
  const { edgesWithAttributes: rootEdges, loading: rootEdgesLoading, error: rootEdgesError } = useRootEdgesWithAttributes();

  const selectedEdgeKey = selectedRigId ? `${selectedRigId}` : null;
  const { edgeData: selectedEdgeData } = useEdgeWithAttributes(selectedEdgeKey);
  const { widgetConfigs: selectedWidgetConfigs } = useWidgetConfigsByEdge(selectedEdgeKey);
  const { data: selectedRigDetails } = useCurrentDetails(selectedEdgeKey);

  // Статистика по всем буровым
  const hasErrorsInAttributes = (rawAttributes: RawEdgeAttributes | null | undefined, edgeId: string) => {
    let transformed: EdgeAttribute;
    
    if (!rawAttributes) {
      transformed = {
        id: 0,
        edge_key: edgeId,
        ...STATIC_STATUS_DATA
      };
    } else {
      transformed = transformRawAttributes(rawAttributes as Record<string, any>, edgeId);
    }

    const equipmentErrors = [
      transformed.bypass_state !== 'closed',
      transformed.drive_state !== 'normal'
    ];
    
    const maintenanceErrors = [
      transformed.daily_maintenance === false,
      transformed.weekly_maintenance === false,
      transformed.monthly_maintenance === false,
      transformed.semiannual_maintenance === false,
      transformed.annual_maintenance === false
    ];
    
    return equipmentErrors.some(error => error) || maintenanceErrors.some(error => error);
  };

  const rigs: RigCompatible[] = useMemo(() => {
    return rootEdges.map((edge: EdgeWithAttributes): RigCompatible => ({
      ...edge,
      id: edge.id,
      ok: !hasErrorsInAttributes(edge.attributes, edge.id)
    }));
  }, [rootEdges]);

  const parseNumericValue = (value: unknown): number | null => {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    if (typeof value === 'string') {
      const normalized = value.replace(',', '.').trim();
      if (!normalized) {
        return null;
      }
      const parsed = Number(normalized);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  };

  const hasOutOfRangeTags = (tags: Array<{ value: any; min?: number; max?: number }>) => {
    return tags.some(tag => {
      const numericValue = parseNumericValue(tag.value);
      if (numericValue === null) {
        return false;
      }
      const hasMin = typeof tag.min === 'number' && !Number.isNaN(tag.min);
      const hasMax = typeof tag.max === 'number' && !Number.isNaN(tag.max);
      const minValue = hasMin ? (tag.min as number) : null;
      const maxValue = hasMax ? (tag.max as number) : null;
      if (!hasMin || !hasMax) {
        return false;
      }
      if (maxValue! <= minValue!) {
        return false;
      }
      if (numericValue < minValue!) {
        return true;
      }
      if (numericValue > maxValue!) {
        return true;
      }
      return false;
    });
  };

  const getOutOfRangeTagIds = (tags: Array<{ tag: string; value: any; min?: number; max?: number }>, tagIds: string[]): string[] => {
    const tagIdSet = new Set(tagIds);
    const outOfRange = new Set<string>();
    tags.forEach(tag => {
      if (!tagIdSet.has(tag.tag)) {
        return;
      }
      const numericValue = parseNumericValue(tag.value);
      if (numericValue === null) {
        return;
      }
      const hasMin = typeof tag.min === 'number' && !Number.isNaN(tag.min);
      const hasMax = typeof tag.max === 'number' && !Number.isNaN(tag.max);
      const minValue = hasMin ? (tag.min as number) : null;
      const maxValue = hasMax ? (tag.max as number) : null;
      if (!hasMin || !hasMax || maxValue! <= minValue!) {
        return;
      }
      if (numericValue < minValue! || numericValue > maxValue!) {
        outOfRange.add(tag.tag);
      }
    });
    return Array.from(outOfRange);
  };

  const evaluateTagStatus = (tags: Array<{ tag: string; value: any; min?: number; max?: number }>, tagIds: string[]): SectionStatus => {
    if (!tagIds.length) {
      return 'empty';
    }
    const relevant = tags.filter(tag => tagIds.includes(tag.tag));
    if (!relevant.length) {
      return 'empty';
    }
    const outOfRange = getOutOfRangeTagIds(tags, tagIds);
    return outOfRange.length ? 'bad' : 'ok';
  };

  const flattenChildEdges = (edges: any[]): string[] => {
    const result: string[] = [];
    edges.forEach(edge => {
      if (edge?.id) {
        result.push(edge.id);
      }
      const children = edge?.children;
      if (Array.isArray(children) && children.length) {
        result.push(...flattenChildEdges(children));
      }
    });
    return result;
  };

  useEffect(() => {
    if (!rootEdges.length) {
      setEdgeDescendantsMap({});
      setWidgetConfigMap({});
      return;
    }

    let isCancelled = false;

    const fetchEdgeHierarchy = async () => {
      try {
        const edgeDescendants = await Promise.all(
          rootEdges.map(async edge => {
            try {
              const children = await getEdgeChildren(edge.id);
              const descendantIds = [edge.id, ...flattenChildEdges(children as any[])];
              return { id: edge.id, descendantIds };
            } catch {
              return { id: edge.id, descendantIds: [edge.id] };
            }
          })
        );

        if (isCancelled) return;

        const nextDescendants: Record<string, string[]> = {};
        const allEdgeIds = new Set<string>();
        edgeDescendants.forEach(entry => {
          nextDescendants[entry.id] = entry.descendantIds;
          entry.descendantIds.forEach(id => allEdgeIds.add(id));
        });
        setEdgeDescendantsMap(nextDescendants);

        const widgetConfigs = await Promise.all(
          Array.from(allEdgeIds).map(edgeId => getWidgetConfigsByEdge(edgeId).catch(() => []))
        );

        if (isCancelled) return;

        const nextWidgetMap: Record<string, WidgetConfigData[]> = {};
        Array.from(allEdgeIds).forEach((edgeId, index) => {
          nextWidgetMap[edgeId] = widgetConfigs[index] || [];
        });
        setWidgetConfigMap(nextWidgetMap);
      } catch {
        if (!isCancelled) {
          setEdgeDescendantsMap({});
          setWidgetConfigMap({});
        }
      }
    };

    fetchEdgeHierarchy();

    return () => {
      isCancelled = true;
    };
  }, [rootEdges]);

  useEffect(() => {
    if (!rootEdges.length) {
      setMaintenanceConfigMap({});
      return;
    }

    let isCancelled = false;

    const fetchMaintenanceConfigs = async () => {
      try {
        const results = await Promise.all(
          rootEdges.map(async edge => {
            try {
              const customizations = await getEdgeCustomizations(edge.id);
              const maintenanceConfig = customizations.find(item => item.key === 'maintenanceConfig');
              const parsedConfig = maintenanceConfig ? JSON.parse(maintenanceConfig.value) : {};
              const configMap: Record<MaintenanceType, string[]> = {
                daily_maintenance: Array.isArray(parsedConfig.daily_maintenance) ? parsedConfig.daily_maintenance : [],
                weekly_maintenance: Array.isArray(parsedConfig.weekly_maintenance) ? parsedConfig.weekly_maintenance : [],
                monthly_maintenance: Array.isArray(parsedConfig.monthly_maintenance) ? parsedConfig.monthly_maintenance : [],
                semiannual_maintenance: Array.isArray(parsedConfig.semiannual_maintenance) ? parsedConfig.semiannual_maintenance : [],
                annual_maintenance: Array.isArray(parsedConfig.annual_maintenance) ? parsedConfig.annual_maintenance : []
              };
              return { id: edge.id, configMap };
            } catch {
              return { id: edge.id, configMap: {
                daily_maintenance: [],
                weekly_maintenance: [],
                monthly_maintenance: [],
                semiannual_maintenance: [],
                annual_maintenance: []
              }};
            }
          })
        );

        if (!isCancelled) {
          const nextMap: Record<string, Record<MaintenanceType, string[]>> = {};
          results.forEach(result => {
            nextMap[result.id] = result.configMap as Record<MaintenanceType, string[]>;
          });
          setMaintenanceConfigMap(nextMap);
        }
      } catch {
        if (!isCancelled) {
          setMaintenanceConfigMap({});
        }
      }
    };

    fetchMaintenanceConfigs();
    const intervalId = setInterval(fetchMaintenanceConfigs, 10000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [rootEdges]);

  useEffect(() => {
    if (!rootEdges.length) {
      setRigTagStatusMap({});
      return;
    }

    let isCancelled = false;

    const fetchTagStatuses = async () => {
      try {
        const results = await Promise.all(
          rootEdges.map(async edge => {
            try {
              const scoped = await getScopedCurrent(edge.id, true);
              if (!scoped.tags.length) {
                return { id: edge.id, status: 'empty' as const };
              }
              const hasOutOfRange = hasOutOfRangeTags(scoped.tags);
              return { id: edge.id, status: hasOutOfRange ? 'bad' as const : 'ok' as const };
            } catch {
              return { id: edge.id, status: 'empty' as const };
            }
          })
        );

        if (!isCancelled) {
          const nextMap: Record<string, RigTagStatus> = {};
          results.forEach(result => {
            nextMap[result.id] = result.status;
          });
          setRigTagStatusMap(nextMap);
        }
      } catch {
        if (!isCancelled) {
          setRigTagStatusMap({});
        }
      }
    };

    fetchTagStatuses();
    const intervalId = setInterval(fetchTagStatuses, 3000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [rootEdges]);

  useEffect(() => {
    if (!rootEdges.length) {
      setMaintenanceStatusMap({});
      return;
    }

    let isCancelled = false;

    const fetchMaintenanceStatuses = async () => {
      try {
        const results = await Promise.all(
          rootEdges.map(async edge => {
            try {
              const configMap = maintenanceConfigMap[edge.id] ?? {
                daily_maintenance: [],
                weekly_maintenance: [],
                monthly_maintenance: [],
                semiannual_maintenance: [],
                annual_maintenance: []
              };

              const allTagIds = Array.from(new Set(Object.values(configMap).flat()));
              if (!allTagIds.length) {
                return { id: edge.id, statuses: configMap };
              }

              const current = await getCurrentByTags(edge.id, allTagIds, true);
              const outOfRangeMap: Record<MaintenanceType, string[]> = {
                daily_maintenance: getOutOfRangeTagIds(current.tags, configMap.daily_maintenance),
                weekly_maintenance: getOutOfRangeTagIds(current.tags, configMap.weekly_maintenance),
                monthly_maintenance: getOutOfRangeTagIds(current.tags, configMap.monthly_maintenance),
                semiannual_maintenance: getOutOfRangeTagIds(current.tags, configMap.semiannual_maintenance),
                annual_maintenance: getOutOfRangeTagIds(current.tags, configMap.annual_maintenance)
              };

              const statuses: Record<MaintenanceType, SectionStatus> = {
                daily_maintenance: outOfRangeMap.daily_maintenance.length ? 'bad' : evaluateTagStatus(current.tags, configMap.daily_maintenance),
                weekly_maintenance: outOfRangeMap.weekly_maintenance.length ? 'bad' : evaluateTagStatus(current.tags, configMap.weekly_maintenance),
                monthly_maintenance: outOfRangeMap.monthly_maintenance.length ? 'bad' : evaluateTagStatus(current.tags, configMap.monthly_maintenance),
                semiannual_maintenance: outOfRangeMap.semiannual_maintenance.length ? 'bad' : evaluateTagStatus(current.tags, configMap.semiannual_maintenance),
                annual_maintenance: outOfRangeMap.annual_maintenance.length ? 'bad' : evaluateTagStatus(current.tags, configMap.annual_maintenance)
              };

              return { id: edge.id, statuses, outOfRangeMap };
            } catch {
              return { id: edge.id, statuses: {
                daily_maintenance: 'empty',
                weekly_maintenance: 'empty',
                monthly_maintenance: 'empty',
                semiannual_maintenance: 'empty',
                annual_maintenance: 'empty'
              }, outOfRangeMap: {
                daily_maintenance: [],
                weekly_maintenance: [],
                monthly_maintenance: [],
                semiannual_maintenance: [],
                annual_maintenance: []
              } };
            }
          })
        );

        if (!isCancelled) {
          const nextMap: Record<string, Record<MaintenanceType, SectionStatus>> = {};
          const nextOutOfRangeMap: Record<string, Record<MaintenanceType, string[]>> = {};
          results.forEach(result => {
            nextMap[result.id] = result.statuses as Record<MaintenanceType, SectionStatus>;
            nextOutOfRangeMap[result.id] = result.outOfRangeMap as Record<MaintenanceType, string[]>;
          });
          setMaintenanceStatusMap(nextMap);
          setMaintenanceOutOfRangeMap(nextOutOfRangeMap);
        }
      } catch {
        if (!isCancelled) {
          setMaintenanceStatusMap({});
          setMaintenanceOutOfRangeMap({});
        }
      }
    };

    fetchMaintenanceStatuses();
    const intervalId = setInterval(fetchMaintenanceStatuses, 3000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [rootEdges, maintenanceConfigMap]);

  useEffect(() => {
    if (!rootEdges.length) {
      setRigSectionStatusMap({});
      return;
    }

    let isCancelled = false;

    const fetchSectionStatuses = async () => {
      try {
        const results = await Promise.all(
          rootEdges.map(async edge => {
            try {
              const allEdgeIds = edgeDescendantsMap[edge.id] ?? [edge.id];
              const flatConfigs = allEdgeIds.flatMap(edgeId => widgetConfigMap[edgeId] ?? []);

              const bypassTagIds = new Set<string>();
              const accidentTagIds = new Set<string>();

              flatConfigs.forEach(config => {
                const page = config.config?.page;
                if (!page) return;
                if (
                  page === 'BYPASS' ||
                  page === `BYPASS_${config.edge_id}` ||
                  page === 'Состояние байпасов'
                ) {
                  bypassTagIds.add(config.tag_id);
                }
                if (
                  page === 'ACCIDENT' ||
                  page === `ACCIDENT_${config.edge_id}` ||
                  page === 'Аварии приводов'
                ) {
                  accidentTagIds.add(config.tag_id);
                }
              });

              const allTagIds = Array.from(new Set([...bypassTagIds, ...accidentTagIds]));
              if (!allTagIds.length) {
                return { id: edge.id, statuses: { BYPASS: 'empty' as const, ACCIDENT: 'empty' as const } };
              }

              const current = await getCurrentByTags(edge.id, allTagIds, true);

              const outOfRangeMap = {
                BYPASS: getOutOfRangeTagIds(current.tags, Array.from(bypassTagIds)),
                ACCIDENT: getOutOfRangeTagIds(current.tags, Array.from(accidentTagIds))
              };

              const statuses = {
                BYPASS: outOfRangeMap.BYPASS.length ? 'bad' : evaluateTagStatus(current.tags, Array.from(bypassTagIds)),
                ACCIDENT: outOfRangeMap.ACCIDENT.length ? 'bad' : evaluateTagStatus(current.tags, Array.from(accidentTagIds))
              };

              return { id: edge.id, statuses, outOfRangeMap };
            } catch {
              return { id: edge.id, statuses: { BYPASS: 'empty' as const, ACCIDENT: 'empty' as const }, outOfRangeMap: { BYPASS: [], ACCIDENT: [] } };
            }
          })
        );

        if (!isCancelled) {
          const nextMap: Record<string, { BYPASS: SectionStatus; ACCIDENT: SectionStatus }> = {};
          const nextOutOfRangeMap: Record<string, { BYPASS: string[]; ACCIDENT: string[] }> = {};
          results.forEach(result => {
            nextMap[result.id] = result.statuses;
            nextOutOfRangeMap[result.id] = result.outOfRangeMap ?? { BYPASS: [], ACCIDENT: [] };
          });
          setRigSectionStatusMap(nextMap);
          setRigSectionOutOfRangeMap(nextOutOfRangeMap);
        }
      } catch {
        if (!isCancelled) {
          setRigSectionStatusMap({});
          setRigSectionOutOfRangeMap({});
        }
      }
    };

    fetchSectionStatuses();
    const intervalId = setInterval(fetchSectionStatuses, 3000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [rootEdges, edgeDescendantsMap, widgetConfigMap]);

  const selectedRigTagMap = useMemo(() => {
    const map = new Map<string, number>();
    if (selectedRigDetails) {
      selectedRigDetails.forEach(tagData => {
        map.set(tagData.tag, tagData.value);
      });
    }
    return map;
  }, [selectedRigDetails]);

  const sectionStatus = useMemo<Record<string, SectionStatus>>(() => {
    if (!selectedRigId) {
      return { BYPASS: 'empty', ACCIDENT: 'empty' };
    }

    const resolveStatus = (pageAliases: string[]): SectionStatus => {
      const sectionConfigs = selectedWidgetConfigs.filter(cfg =>
        pageAliases.includes(cfg.config.page)
      );

      if (sectionConfigs.length === 0) {
        return 'empty';
      }

      const hasBad = sectionConfigs.some(cfg => {
        const rawValue = selectedRigTagMap.get(cfg.tag_id);
        if (rawValue === undefined) {
          return false;
        }
        const numericValue = parseNumericValue(rawValue);
        if (numericValue === null) {
          return false;
        }
        if (typeof cfg.tag.min === 'number' && numericValue < cfg.tag.min) {
          return true;
        }
        if (typeof cfg.tag.max === 'number' && numericValue > cfg.tag.max) {
          return true;
        }
        return false;
      });

      return hasBad ? 'bad' : 'ok';
    };

    return {
      BYPASS: resolveStatus([`BYPASS_${selectedRigId}`, 'BYPASS', 'Состояние байпасов']),
      ACCIDENT: resolveStatus([`ACCIDENT_${selectedRigId}`, 'ACCIDENT', 'Аварии приводов'])
    };
  }, [selectedRigId, selectedWidgetConfigs, selectedRigTagMap]);

  // Статистика по всем буровым
  const stats = useMemo(() => {
    const total = rigs.length;
    const ok = rigs.filter(r => (rigTagStatusMap[r.id] ?? 'empty') === 'ok').length;
    const errors = rigs.filter(r => (rigTagStatusMap[r.id] ?? 'empty') === 'bad').length;
    const equipmentIssues = rigs.filter(r => (rigTagStatusMap[r.id] ?? 'empty') === 'bad').length;
    const maintenanceIssues = rigs.filter(r => {
      const statuses = maintenanceStatusMap[r.id];
      if (!statuses) return false;
      return Object.values(statuses).some(status => status === 'bad');
    }).length;
    
    return { total, ok, errors, equipmentIssues, maintenanceIssues };
  }, [rigs, rigTagStatusMap, maintenanceStatusMap]);

  const maintenanceSummary = useMemo(() => {
    const types: MaintenanceType[] = ['daily_maintenance', 'weekly_maintenance', 'monthly_maintenance', 'semiannual_maintenance', 'annual_maintenance'];
    const summary = {
      total: types.length,
      ok: 0,
      bad: 0,
      empty: 0
    };
    const currentStatuses = maintenanceStatusMap[selectedRigId || ''];
    if (!currentStatuses) {
      summary.empty = summary.total;
      return summary;
    }
    types.forEach(type => {
      const status = currentStatuses[type] ?? 'empty';
      if (status === 'ok') summary.ok += 1;
      if (status === 'bad') summary.bad += 1;
      if (status === 'empty') summary.empty += 1;
    });
    return summary;
  }, [maintenanceStatusMap, selectedRigId]);

  const currentRig: RigCompatible | undefined = useMemo(() => {
    return rigs.find(r => r.id === selectedRigId);
  }, [rigs, selectedRigId]);

  const extendedAttributes: ExtendedEdgeAttribute = useMemo(() => {
    if (!selectedEdgeData?.attributes || !selectedRigId) {
      return {
        id: 0,
        edge_key: selectedRigId || 'static',
        ...STATIC_STATUS_DATA,
        _lastUpdated: new Date().toISOString(),
        _isStaticData: true,
        _hasRealData: false
      };
    }
    
    try {
      const realAttributes = transformRawAttributes(selectedEdgeData.attributes as RawEdgeAttributes, selectedRigId);
      
      const merged: ExtendedEdgeAttribute = {
        ...realAttributes,
        _lastUpdated: new Date().toISOString(),
        _isStaticData: false,
        _hasRealData: true
      };
      
      Object.keys(STATIC_STATUS_DATA).forEach(key => {
        const typedKey = key as keyof typeof STATIC_STATUS_DATA;
        if (merged[typedKey] === undefined || merged[typedKey] === null) {
          (merged as any)[typedKey] = STATIC_STATUS_DATA[typedKey];
        }
      });
      
      return merged;
    } catch (error) {
      console.warn('Ошибка преобразования атрибутов, используем статические данные:', error);
      return {
        id: 0,
        edge_key: selectedRigId || 'static',
        ...STATIC_STATUS_DATA,
        _lastUpdated: new Date().toISOString(),
        _isStaticData: true,
        _hasRealData: false
      };
    }
  }, [selectedEdgeData, selectedRigId]);

  const getLastUpdatedTime = () => {
    if (!extendedAttributes._lastUpdated) return 'Неизвестно';
    return new Date(extendedAttributes._lastUpdated).toLocaleTimeString();
  };

  if (rootEdgesError) {
    return <div className="error-message">Ошибка при загрузке буровых установок: {rootEdgesError}</div>;
  }

  return (
    <div className="rigs-list-page">
      <div className="content-wrapper">
        {/* Заголовок страницы со статистикой */}
        <div className="page-header">
          <div className="page-header-content">
            <h1 className="rigs-page-title">Буровые установки</h1>
            <p className="page-subtitle">Мониторинг состояния оборудования</p>
          </div>
          <div className="rigs-stats-grid">
            <div className="rigs-stat-card">
              <div className="rigs-stat-icon total">
                <i className="pi pi-building" />
              </div>
              <div className="rigs-stat-content">
                <div className="rigs-stat-value">
                  <AnimatedCounter value={stats.total} duration={1000} />
                </div>
                <div className="rigs-stat-label">Всего установок</div>
              </div>
            </div>
            <div className="rigs-stat-card">
              <div className="rigs-stat-icon ok">
                <i className="pi pi-check-circle" />
              </div>
              <div className="rigs-stat-content">
                <div className="rigs-stat-value">
                  <AnimatedCounter value={stats.ok} duration={900} />
                </div>
                <div className="rigs-stat-label">В норме</div>
              </div>
            </div>
            <div className="rigs-stat-card">
              <div className="rigs-stat-icon error">
                <i className="pi pi-exclamation-triangle" />
              </div>
              <div className="rigs-stat-content">
                <div className="rigs-stat-value">
                  <AnimatedCounter value={stats.errors} duration={900} />
                </div>
                <div className="rigs-stat-label">Требуют внимания</div>
              </div>
            </div>
            <div className="rigs-stat-card">
              <div className="rigs-stat-icon warning">
                <i className="pi pi-cog" />
              </div>
              <div className="rigs-stat-content">
                <div className="rigs-stat-value">
                  <AnimatedCounter value={stats.equipmentIssues} duration={900} />
                </div>
                <div className="rigs-stat-label">Проблемы оборудования</div>
              </div>
            </div>
            <div className="rigs-stat-card">
              <div className="rigs-stat-icon maintenance">
                <i className="pi pi-wrench" />
              </div>
              <div className="rigs-stat-content">
                <div className="rigs-stat-value">
                  <AnimatedCounter value={stats.maintenanceIssues} duration={900} />
                </div>
                <div className="rigs-stat-label">Требуется ТО</div>
              </div>
            </div>
          </div>
        </div>

        <div className="rigs-list">
          <div className="rigs-grid">
            {rootEdgesLoading ? (
              <div className="loading-state">
                <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
                <p>Загрузка буровых установок...</p>
              </div>
            ) : (
              rigs.map((rig) => {
                const equipmentStatus = rigTagStatusMap[rig.id] ?? 'empty';
                const maintenanceStatuses = maintenanceStatusMap[rig.id];
                const maintenanceStatus: SectionStatus = maintenanceStatuses
                  ? (Object.values(maintenanceStatuses).some(status => status === 'bad')
                      ? 'bad'
                      : Object.values(maintenanceStatuses).some(status => status === 'ok')
                        ? 'ok'
                        : 'empty')
                  : 'empty';
                const rigStatus: RigTagStatus = rigTagStatusMap[rig.id] ?? 'empty';
                const maintenanceStatusForCard = maintenanceStatusMap[rig.id];
                const maintenanceHasBad = maintenanceStatusForCard
                  ? Object.values(maintenanceStatusForCard).some(status => status === 'bad')
                  : false;
                const finalStatus: RigTagStatus = maintenanceHasBad ? 'bad' : rigStatus;
                const statusClass = finalStatus === 'ok' ? 'ok' : finalStatus === 'bad' ? 'bad' : 'empty';
                const statusLabel = finalStatus === 'ok'
                  ? 'В норме'
                  : finalStatus === 'bad'
                    ? 'Требует внимания'
                    : 'Отсутствуют данные';
                const statusIcon = finalStatus === 'ok'
                  ? 'pi-check-circle'
                  : finalStatus === 'bad'
                    ? 'pi-exclamation-triangle'
                    : 'pi-minus-circle';
                
                return (
                  <button
                    key={rig.id}
                    className={`rig-card ${statusClass} ${rig.id === selectedRigId ? 'active' : ''}`}
                    onClick={() => setSelectedRigId(rig.id === selectedRigId ? null : rig.id)}
                  >
                    <div className="rig-card-header">
                      <div className="rig-status-badge">
                        <i className={`pi ${statusIcon}`} />
                        <span>{statusLabel}</span>
                      </div>
                      {/* <div className="rig-id">#{rig.id}</div> */}
                    </div>
                    
                    <div className="rig-card-image">
                      <img src={drillSvg} alt="Буровая вышка" />
                    </div>
                    
                    <div className="rig-card-body">
                      <h3 className="rig-name">{rig.name || `БУ №${rig.id}`}</h3>
                      
                      <div className="rig-quick-stats">
                        <div className="quick-stat">
                          <div className={`quick-stat-indicator ${equipmentStatus === 'ok' ? 'ok' : equipmentStatus === 'bad' ? 'error' : 'warning'}`} />
                          <span className="quick-stat-label">Оборудование</span>
                        </div>
                        <div className="quick-stat">
                          <div className={`quick-stat-indicator ${maintenanceStatus === 'ok' ? 'ok' : maintenanceStatus === 'bad' ? 'error' : 'warning'}`} />
                          <span className="quick-stat-label">Техническое обслуживание</span>
                        </div>
                      </div>
                      
                    <div className="rig-status-details">
                      {(() => {
                        const rigSections = rigSectionStatusMap[rig.id] ?? { BYPASS: 'empty', ACCIDENT: 'empty' };
                        const rigOutOfRange = rigSectionOutOfRangeMap[rig.id] ?? { BYPASS: [], ACCIDENT: [] };
                        const bypassLabel = rigSections.BYPASS === 'ok'
                          ? 'Норма'
                          : rigSections.BYPASS === 'bad'
                            ? 'Требует внимания'
                            : 'Нет данных';
                        const accidentLabel = rigSections.ACCIDENT === 'ok'
                          ? 'Норма'
                          : rigSections.ACCIDENT === 'bad'
                            ? 'Требует внимания'
                            : 'Нет данных';
                        const bypassCount = rigOutOfRange.BYPASS.length;
                        const accidentCount = rigOutOfRange.ACCIDENT.length;
                        return (
                          <>
                        <div className={`status-detail-item ${rigSections.BYPASS === 'ok' ? 'ok' : rigSections.BYPASS === 'bad' ? 'bad' : 'neutral'}`}>
                          <i className="pi pi-lock" />
                          <span>Байпас: {bypassLabel}</span>
                          {bypassCount > 0 && <span className="status-detail-badge">+{bypassCount}</span>}
                        </div>
                        <div className={`status-detail-item ${rigSections.ACCIDENT === 'ok' ? 'ok' : rigSections.ACCIDENT === 'bad' ? 'bad' : 'neutral'}`}>
                          <i className="pi pi-cog" />
                          <span>Привод: {accidentLabel}</span>
                          {accidentCount > 0 && <span className="status-detail-badge">+{accidentCount}</span>}
                        </div>
                          </>
                        );
                      })()}
                      </div>
                    </div>
                    
                    <div className="rig-card-footer">
                      <Link 
                        to={`/rigs/${rig.id}`}
                        className="rig-view-button"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Подробнее</span>
                        <i className="pi pi-arrow-right" />
                      </Link>
                    </div>
                  </button>
                );
              })
            )}
          </div>
          <aside className={`rig-status-panel ${selectedRigId ? 'open' : ''}`} aria-live="polite">
              
              {rootEdgesLoading ? (
                  <div style={{ minHeight: 256, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Загрузка буровых...
                  </div>
              ) : currentRig  ? (
                  <>
                      <div className="rig-status-header">
                          <div className="rig-status-header-content">
                              <Link 
                                  to={`/rigs/${currentRig.id}`} 
                                  className={`rig-status-name-link ${(rigTagStatusMap[currentRig.id] ?? currentRig.ok) ? 'ok' : 'bad'}`}
                              >
                                  <i className="pi pi-building" />
                                  <span>{currentRig.name || `БУ №${currentRig.id}`}</span>
                                  <i className="pi pi-arrow-right rig-status-link-arrow" />
                              </Link>
                              <div className="rig-status-id">#{currentRig.id}</div>
                          </div>
                          <Button 
                              icon="pi pi-times" 
                              rounded 
                              text 
                              onClick={() => setSelectedRigId(null)}
                              className="close-panel-btn"
                              aria-label="Закрыть панель"
                          />
                      </div>
                      
                      <div className="edge-status-container">
                          {/* Индикатор типа данных */}
                          {!extendedAttributes._hasRealData && (
                            <div className="data-status-info">
                              <i className="pi pi-info-circle" />
                              <span>Отображаются базовые данные. Актуальные данные загружаются...</span>
                            </div>
                          )}
                          
                          {/* Кнопки статусов */}
                          <RigStatusButtons 
                            attributes={extendedAttributes} 
                            rigId={currentRig.id}
                            sectionStatus={sectionStatus}
                            maintenanceStatus={maintenanceStatusMap[currentRig.id] ?? {
                              daily_maintenance: 'empty',
                              weekly_maintenance: 'empty',
                              monthly_maintenance: 'empty',
                              semiannual_maintenance: 'empty',
                              annual_maintenance: 'empty'
                            }}
                            maintenanceOutOfRange={maintenanceOutOfRangeMap[currentRig.id] ?? {
                              daily_maintenance: [],
                              weekly_maintenance: [],
                              monthly_maintenance: [],
                              semiannual_maintenance: [],
                              annual_maintenance: []
                            }}
                          />
                          
                          
                          {/* Информация об обновлении данных */}
                          <div className="data-update-info">
                            <span>
                              {!extendedAttributes._hasRealData ? 'Статические данные' : 'Актуальные данные'}
                            </span>
                            <span>
                              Обновлено: {getLastUpdatedTime()}
                            </span>
                          </div>
                          <div className="maintenance-summary">
                            <div className="maintenance-summary-title">ТО‑сводка</div>
                            <div className="maintenance-summary-stats">
                              <span className="maintenance-summary-item ok">В норме: {maintenanceSummary.ok}</span>
                              <span className="maintenance-summary-item bad">Требуют внимания: {maintenanceSummary.bad}</span>
                              <span className="maintenance-summary-item empty">Нет данных: {maintenanceSummary.empty}</span>
                            </div>
                          </div>
                      </div>
                  </>
              ) : (
                  <div className="rig-status-placeholder">
                    <i className="pi pi-info-circle" />
                    <h3>Выберите буровую</h3>
                    <p>
                      Нажмите на любую буровую установку, чтобы увидеть детальную информацию о статусах
                    </p>
                    <div>
                      <p><strong>Информация всегда доступна:</strong></p>
                      <ul>
                        <li>Состояние байпасов</li>
                        <li>Аварийные статусы</li>
                        <li>График ТО</li>
                        <li>Основные параметры</li>
                      </ul>
                    </div>
                  </div>
              )}
          </aside>
        </div>
      </div>
    </div>
  );
}
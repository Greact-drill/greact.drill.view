import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import drillSvg from "../../assets/drill.svg";
import { useEdgeWithAttributes, useRootEdgesWithAttributes } from "../../hooks/useEdges";
import { useWidgetConfigsByEdge } from "../../hooks/useWidgetConfigs";
import { useCurrentDetails } from "../../hooks/useCurrentDetails";
import AnimatedCounter from "../../components/AnimatedCounter/AnimatedCounter";
import type { EdgeWithAttributes, RawEdgeAttributes } from "../../types/edge";
import { transformRawAttributes } from "../../utils/edgeUtils";
import { Button } from 'primereact/button';
import { parseNumericValue, type WidgetValue } from "../../utils/widgetValue";
import { formatStatusValue, getStatusClass, getStatusIcon } from "./statusPresentation";
import { useRigsPollingOrchestration } from "./useRigsPollingOrchestration";
import { hasErrorsInAttributes, STATIC_STATUS_DATA } from "./rigsStatusUtils";
import type { ExtendedEdgeAttribute, MaintenanceType, RigTagStatus, SectionStatus } from "./rigsStatusTypes";
import { useTheme } from "../../theme/useTheme";
import './RigsListPage.css';

interface RigCompatible extends EdgeWithAttributes {
  id: string;
  ok: boolean;
}

const PANEL_CLOSE_ANIMATION_MS = 900;

// Компонент для кнопок статусов
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
              <div className="status-value">{formatStatusValue(value)}</div>
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


export default function RigsListPage() {
  const { isLight, toggleTheme } = useTheme();
  const [selectedRigId, setSelectedRigId] = useState<string | null>(null);
  const [displayedRigId, setDisplayedRigId] = useState<string | null>(null);
  const isRigStatusPanelOpen = Boolean(selectedRigId);
  const { edgesWithAttributes: rootEdges, loading: rootEdgesLoading, error: rootEdgesError } = useRootEdgesWithAttributes();

  useEffect(() => {
    if (selectedRigId) {
      setDisplayedRigId(selectedRigId);
      return;
    }
    if (!displayedRigId) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setDisplayedRigId(null);
    }, PANEL_CLOSE_ANIMATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [selectedRigId, displayedRigId]);

  const selectedEdgeKey = displayedRigId ? `${displayedRigId}` : null;
  const { edgeData: selectedEdgeData } = useEdgeWithAttributes(selectedEdgeKey);
  const { widgetConfigs: selectedWidgetConfigs } = useWidgetConfigsByEdge(selectedEdgeKey);
  const { data: selectedRigDetails } = useCurrentDetails(selectedEdgeKey);
  const {
    rigTagStatusMap,
    maintenanceStatusMap,
    maintenanceOutOfRangeMap,
    rigSectionStatusMap,
    rigSectionOutOfRangeMap,
  } = useRigsPollingOrchestration(rootEdges);

  const rigs: RigCompatible[] = useMemo(() => {
    return rootEdges.map((edge: EdgeWithAttributes): RigCompatible => ({
      ...edge,
      id: edge.id,
      ok: !hasErrorsInAttributes(edge.attributes, edge.id)
    }));
  }, [rootEdges]);

  const selectedRigTagMap = useMemo(() => {
    const map = new Map<string, WidgetValue>();
    if (selectedRigDetails) {
      selectedRigDetails.forEach(tagData => {
        map.set(tagData.tag, tagData.value);
      });
    }
    return map;
  }, [selectedRigDetails]);

  const sectionStatus = useMemo<Record<string, SectionStatus>>(() => {
    if (!displayedRigId) {
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
      BYPASS: resolveStatus([`BYPASS_${displayedRigId}`, 'BYPASS', 'Состояние байпасов']),
      ACCIDENT: resolveStatus([`ACCIDENT_${displayedRigId}`, 'ACCIDENT', 'Аварии приводов'])
    };
  }, [displayedRigId, selectedWidgetConfigs, selectedRigTagMap]);

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
    const currentStatuses = maintenanceStatusMap[displayedRigId || ''];
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
  }, [maintenanceStatusMap, displayedRigId]);

  const currentRig: RigCompatible | undefined = useMemo(() => {
    return rigs.find(r => r.id === displayedRigId);
  }, [rigs, displayedRigId]);

  const extendedAttributes: ExtendedEdgeAttribute = useMemo(() => {
    if (!selectedEdgeData?.attributes || !displayedRigId) {
      return {
        id: 0,
        edge_key: displayedRigId || 'static',
        ...STATIC_STATUS_DATA,
        _lastUpdated: new Date().toISOString(),
        _isStaticData: true,
        _hasRealData: false
      };
    }
    
    try {
      const realAttributes = transformRawAttributes(selectedEdgeData.attributes as RawEdgeAttributes, displayedRigId);
      
      const merged: ExtendedEdgeAttribute = {
        ...realAttributes,
        _lastUpdated: new Date().toISOString(),
        _isStaticData: false,
        _hasRealData: true
      };
      
      if (merged.bypass_state == null) merged.bypass_state = STATIC_STATUS_DATA.bypass_state;
      if (merged.drive_state == null) merged.drive_state = STATIC_STATUS_DATA.drive_state;
      if (merged.daily_maintenance == null) merged.daily_maintenance = STATIC_STATUS_DATA.daily_maintenance;
      if (merged.weekly_maintenance == null) merged.weekly_maintenance = STATIC_STATUS_DATA.weekly_maintenance;
      if (merged.monthly_maintenance == null) merged.monthly_maintenance = STATIC_STATUS_DATA.monthly_maintenance;
      if (merged.semiannual_maintenance == null) merged.semiannual_maintenance = STATIC_STATUS_DATA.semiannual_maintenance;
      if (merged.annual_maintenance == null) merged.annual_maintenance = STATIC_STATUS_DATA.annual_maintenance;
      
      return merged;
    } catch (error) {
      console.warn('Ошибка преобразования атрибутов, используем статические данные:', error);
      return {
        id: 0,
        edge_key: displayedRigId || 'static',
        ...STATIC_STATUS_DATA,
        _lastUpdated: new Date().toISOString(),
        _isStaticData: true,
        _hasRealData: false
      };
    }
  }, [selectedEdgeData, displayedRigId]);

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
        <button
          type="button"
          className="theme-toggle-btn theme-toggle-floating"
          onClick={toggleTheme}
          aria-label={isLight ? "Переключить на темную тему" : "Переключить на светлую тему"}
          title={isLight ? "Темная тема" : "Светлая тема"}
        >
          <i className={`pi ${isLight ? "pi-moon" : "pi-sun"}`} />
        </button>
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
          <aside className={`rig-status-panel ${isRigStatusPanelOpen ? 'open' : ''}`} aria-live="polite">
              
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
              ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
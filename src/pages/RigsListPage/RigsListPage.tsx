import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import drillSvg from "../../assets/drill.svg";
import { useEdgeWithAttributes, useRootEdgesWithAttributes } from "../../hooks/useEdges";
import { useWidgetConfigsByEdge } from "../../hooks/useWidgetConfigs";
import { useCurrentDetails } from "../../hooks/useCurrentDetails";
import AnimatedCounter from "../../components/AnimatedCounter/AnimatedCounter";
import type { EdgeWithAttributes, EdgeAttribute, RawEdgeAttributes } from "../../types/edge";
import { transformRawAttributes } from "../../utils/edgeUtils";
import { Button } from 'primereact/button';
import { getCurrentDetails } from "../../api/current";
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
  overallOk,
  sectionStatus
}: {
  attributes: ExtendedEdgeAttribute,
  rigId: string,
  overallOk: boolean,
  sectionStatus: Record<string, SectionStatus>
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

  const getButtonTitle = (key: string) => {
    const titles: Record<string, string> = {
      bypass_state: 'Байпас',
      drive_state: 'Привод',
      daily_maintenance: 'Ежедневное ТО',
      weekly_maintenance: 'Еженедельное ТО',
      monthly_maintenance: 'Ежемесячное ТО',
      semiannual_maintenance: 'Полугодовое ТО',
      annual_maintenance: 'Годовое ТО',
    };
    return titles[key] || key;
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
    { key: 'daily_maintenance', value: attributes.daily_maintenance, type: 'boolean' as const },
    { key: 'weekly_maintenance', value: attributes.weekly_maintenance, type: 'boolean' as const },
    { key: 'monthly_maintenance', value: attributes.monthly_maintenance, type: 'boolean' as const },
    { key: 'semiannual_maintenance', value: attributes.semiannual_maintenance, type: 'boolean' as const },
    { key: 'annual_maintenance', value: attributes.annual_maintenance, type: 'boolean' as const },
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
        {maintenanceStatuses.map(({ key, value, type }) => (
          <Link
            key={key}
            to={`/rigs/${rigId}/maintenance-status/${key}`}
            className="status-button-link"
          >
            <div className={`status-button maintenance-button ${getStatusClass(value, type)}`}>
              <div className={`maintenance-status-indicator ${overallOk ? 'overall-ok' : 'overall-bad'}`} />
              <div className={`status-icon ${overallOk ? 'overall-ok' : 'overall-bad'}`}>
                <i className={getStatusIcon(key, value)} />
              </div>
              <div className="status-title">
                {key.includes('daily') ? 'Ежедневное' :
                 key.includes('weekly') ? 'Еженедельное' :
                 key.includes('monthly') ? 'Ежемесячное' :
                 key.includes('semiannual') ? 'Полугодовое' :
                 'Годовое'}
              </div>
              <div className="status-value">{formatValue(key, value)}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};


export default function RigsListPage() {
  const [selectedRigId, setSelectedRigId] = useState<string | null>(null);
  const [rigTagStatusMap, setRigTagStatusMap] = useState<Record<string, boolean>>({});
  
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
      if (typeof tag.min === 'number' && numericValue < tag.min) {
        return true;
      }
      if (typeof tag.max === 'number' && numericValue > tag.max) {
        return true;
      }
      return false;
    });
  };

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
              const tags = await getCurrentDetails(edge.id);
              const hasOutOfRange = hasOutOfRangeTags(tags);
              return { id: edge.id, ok: !hasOutOfRange };
            } catch {
              return { id: edge.id, ok: true };
            }
          })
        );

        if (!isCancelled) {
          const nextMap: Record<string, boolean> = {};
          results.forEach(result => {
            nextMap[result.id] = result.ok;
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
    const intervalId = setInterval(fetchTagStatuses, 1000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [rootEdges]);

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
      return {};
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

  // Получаем атрибуты для каждой буровой для отображения на карточках
  const getRigAttributes = (rig: RigCompatible): EdgeAttribute => {
    if (!rig.attributes) {
      return {
        id: 0,
        edge_key: rig.id,
        ...STATIC_STATUS_DATA
      };
    }
    return transformRawAttributes(rig.attributes as RawEdgeAttributes, rig.id);
  };

  // Статистика по всем буровым
  const stats = useMemo(() => {
    const total = rigs.length;
    const ok = rigs.filter(r => r.ok).length;
    const errors = rigs.filter(r => !r.ok).length;
    const equipmentIssues = rigs.filter(r => {
      const attrs = getRigAttributes(r);
      return attrs.bypass_state !== 'closed' || attrs.drive_state !== 'normal';
    }).length;
    const maintenanceIssues = rigs.filter(r => {
      const attrs = getRigAttributes(r);
      return !attrs.daily_maintenance || !attrs.weekly_maintenance || 
             !attrs.monthly_maintenance || !attrs.semiannual_maintenance || 
             !attrs.annual_maintenance;
    }).length;
    
    return { total, ok, errors, equipmentIssues, maintenanceIssues };
  }, [rigs]);

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
                const attrs = getRigAttributes(rig);
                const equipmentOk = attrs.bypass_state === 'closed' && attrs.drive_state === 'normal';
                const maintenanceOk = attrs.daily_maintenance && attrs.weekly_maintenance && 
                                     attrs.monthly_maintenance && attrs.semiannual_maintenance && 
                                     attrs.annual_maintenance;
                const rigTagsOk = rigTagStatusMap[rig.id] ?? rig.ok;
                
                return (
                  <button
                    key={rig.id}
                    className={`rig-card ${rigTagsOk ? "ok" : "bad"} ${rig.id === selectedRigId ? 'active' : ''}`}
                    onClick={() => setSelectedRigId(rig.id === selectedRigId ? null : rig.id)}
                  >
                    <div className="rig-card-header">
                      <div className="rig-status-badge">
                        <i className={`pi ${rigTagsOk ? 'pi-check-circle' : 'pi-exclamation-triangle'}`} />
                        <span>{rigTagsOk ? 'В норме' : 'Требует внимания'}</span>
                      </div>
                      <div className="rig-id">#{rig.id}</div>
                    </div>
                    
                    <div className="rig-card-image">
                      <img src={drillSvg} alt="Буровая вышка" />
                    </div>
                    
                    <div className="rig-card-body">
                      <h3 className="rig-name">{rig.name || `БУ №${rig.id}`}</h3>
                      
                      <div className="rig-quick-stats">
                        <div className="quick-stat">
                          <div className={`quick-stat-indicator ${equipmentOk ? 'ok' : 'error'}`} />
                          <span className="quick-stat-label">Оборудование</span>
                          <span className="quick-stat-value">{equipmentOk ? 'Норма' : 'Ошибка'}</span>
                        </div>
                        <div className="quick-stat">
                          <div className={`quick-stat-indicator ${maintenanceOk ? 'ok' : 'warning'}`} />
                          <span className="quick-stat-label">ТО</span>
                          <span className="quick-stat-value">{maintenanceOk ? 'Выполнено' : 'Требуется'}</span>
                        </div>
                      </div>
                      
                      <div className="rig-status-details">
                        <div className="status-detail-item">
                          <i className="pi pi-lock" />
                          <span>Байпас: {attrs.bypass_state === 'closed' ? 'Закрыт' : 'Открыт'}</span>
                        </div>
                        <div className="status-detail-item">
                          <i className="pi pi-cog" />
                          <span>Привод: {attrs.drive_state === 'normal' ? 'Норма' : 'Авария'}</span>
                        </div>
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
                            overallOk={rigTagStatusMap[currentRig.id] ?? currentRig.ok}
                            sectionStatus={sectionStatus}
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
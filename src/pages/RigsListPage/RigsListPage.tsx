import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import drillSvg from "../../assets/drill.svg";
import { useEdgeWithAttributes, useRootEdgesWithAttributes } from "../../hooks/useEdges";
import EdgeStatusPanel from "../../components/EdgeStatusPanel/EdgeStatusPanel";
import AnimatedCounter from "../../components/AnimatedCounter/AnimatedCounter";
import type { Edge, EdgeWithAttributes, EdgeAttribute, RawEdgeAttributes } from "../../types/edge";
import { transformRawAttributes } from "../../utils/edgeUtils";
import { Button } from 'primereact/button';
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
const RigStatusButtons = ({ attributes, rigId }: { attributes: ExtendedEdgeAttribute, rigId: string }) => {
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

  const formatValue = (key: string, value: any) => {
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
    { key: 'bypass-status', value: attributes.bypass_state, type: 'state' as const },
    { key: 'accident-status', value: attributes.drive_state, type: 'state' as const },
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
        {mainStatuses.map(({ key, value, type }) => (
          <Link
            key={key}
            to={`/rigs/${rigId}/widgets/${key}`}
            className="status-button-link"
          >
            <div className={`status-button ${getStatusClass(value, type)}`}>
              <div className="status-icon">
                <i className={getStatusIcon(key, value)} />
              </div>
              <div className="status-title">{getButtonTitle(key)}</div>
              <div className="status-value">{formatValue(key, value)}</div>
            </div>
          </Link>
        ))}
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
              <div className="maintenance-status-indicator" />
              <div className="status-icon">
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

// Модифицированный EdgeStatusPanel для скрытия заголовков
const ModifiedEdgeStatusPanel = ({ attributes, loading, rigId }: { 
  attributes: ExtendedEdgeAttribute, 
  loading: boolean, 
  rigId: string | null 
}) => {
  if (loading) {
    return <div>Загрузка статусов...</div>;
  }

  return (
    <div className="edge-status-panel">
      <div className="status-section-title" style={{ marginTop: '25px' }}>
        <i className="pi pi-chart-line" />
        <span>Дополнительные параметры</span>
      </div>
      
      {/* Здесь будет контент EdgeStatusPanel без заголовков */}
      <EdgeStatusPanel 
        attributes={attributes}
        loading={loading}
        rigId={rigId}
      />
      
      {/* Кнопка для перехода к дополнительным параметрам */}
      <Link 
        to={`/rigs/${rigId}#parameters`}
        className="details-more-button"
      >
        <span>Все параметры</span>
        <i className="pi pi-arrow-right button-icon" />
      </Link>
    </div>
  );
};

export default function RigsListPage() {
  const [selectedRigId, setSelectedRigId] = useState<string | null>(null);
  
  const { edgesWithAttributes: rootEdges, loading: rootEdgesLoading, error: rootEdgesError } = useRootEdgesWithAttributes();

  const selectedEdgeKey = selectedRigId ? `${selectedRigId}` : null;
  const { edgeData: selectedEdgeData, loading: selectedLoading } = useEdgeWithAttributes(selectedEdgeKey);

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
            <h1 className="page-title">Буровые установки</h1>
            <p className="page-subtitle">Мониторинг состояния оборудования</p>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <i className="pi pi-building" />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  <AnimatedCounter value={stats.total} duration={1000} />
                </div>
                <div className="stat-label">Всего установок</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon ok">
                <i className="pi pi-check-circle" />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  <AnimatedCounter value={stats.ok} duration={900} />
                </div>
                <div className="stat-label">В норме</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon error">
                <i className="pi pi-exclamation-triangle" />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  <AnimatedCounter value={stats.errors} duration={900} />
                </div>
                <div className="stat-label">Требуют внимания</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning">
                <i className="pi pi-cog" />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  <AnimatedCounter value={stats.equipmentIssues} duration={900} />
                </div>
                <div className="stat-label">Проблемы оборудования</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon maintenance">
                <i className="pi pi-wrench" />
              </div>
              <div className="stat-content">
                <div className="stat-value">
                  <AnimatedCounter value={stats.maintenanceIssues} duration={900} />
                </div>
                <div className="stat-label">Требуется ТО</div>
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
                
                return (
                  <button
                    key={rig.id}
                    className={`rig-card ${rig.ok ? "ok" : "bad"} ${rig.id === selectedRigId ? 'active' : ''}`}
                    onClick={() => setSelectedRigId(rig.id === selectedRigId ? null : rig.id)}
                  >
                    <div className="rig-card-header">
                      <div className="rig-status-badge">
                        <i className={`pi ${rig.ok ? 'pi-check-circle' : 'pi-exclamation-triangle'}`} />
                        <span>{rig.ok ? 'В норме' : 'Требует внимания'}</span>
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
                                  className="rig-status-name-link"
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
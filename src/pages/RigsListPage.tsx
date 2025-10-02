import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import drillSvg from "../assets/drill.svg";
import { useAllEdgesWithAttributes, useEdgeWithAttributes } from "../hooks/useEdges";
import EdgeStatusPanel from "../components/EdgeStatusPanel";
import type { Edge, EdgeWithAttributes, EdgeAttribute, RawEdgeAttributes } from "../types/edge";
import { transformRawAttributes } from "../utils/edgeUtils";

interface RigCompatible extends Edge {
  id: string; // 14820 -> 14820
  ok: boolean;
}

export default function RigsListPage() {
  const [hoveredRigId, setHoveredRigId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Получаем данные edges с атрибутами
  const { edgesWithAttributes, loading: edgesLoading } = useAllEdgesWithAttributes();
  
  // Получаем данные для наведенной буровой
  const hoveredEdgeKey = hoveredRigId ? `${hoveredRigId}` : null;
  const { edgeData: hoveredEdgeData, loading: hoveredLoading } = useEdgeWithAttributes(hoveredEdgeKey);

  // Функция для проверки ошибок в атрибутах
  const hasErrorsInAttributes = (rawAttributes: RawEdgeAttributes  | null | undefined, edgeId: string) => {
    if (!rawAttributes) return false;
    
    // 1. Трансформируем сырые теги в структурированный объект
    const transformed: EdgeAttribute = transformRawAttributes(rawAttributes as Record<string, any>, edgeId);

    // 2. Проверяем состояние оборудования (используя старые поля)
    const equipmentErrors = [
      transformed.bypass_state !== 'closed',
      transformed.drive_state !== 'normal'
    ];
    
    // 3. Проверяем техническое обслуживание (используя старые поля)
    const maintenanceErrors = [
      transformed.daily_maintenance === false,
      transformed.weekly_maintenance === false,
      transformed.monthly_maintenance === false,
      transformed.semiannual_maintenance === false,
      transformed.annual_maintenance === false
    ];
    // Возвращаем true, если хотя бы одно условие ошибки истинно
    return equipmentErrors.some(error => error) || maintenanceErrors.some(error => error);
  };

  // Преобразуем edges в формат, совместимый со старой структурой
  const rigs: RigCompatible[] = useMemo(() => {
    return edgesWithAttributes.map((edge: EdgeWithAttributes): RigCompatible => ({
      ...edge,
      id: edge.id,
      ok: !hasErrorsInAttributes(edge.attributes, edge.id) // Красный если есть ошибки
    }));
  }, [edgesWithAttributes]);

  const hoveredRig = useMemo(
    () => rigs.find((r) => r.id === hoveredRigId) || null,
    [rigs, hoveredRigId]
  );

  const transformedHoveredAttributes = useMemo(() => {
      if (!hoveredEdgeData?.attributes || !hoveredRigId) return null;
      return transformRawAttributes(hoveredEdgeData.attributes as RawEdgeAttributes, hoveredRigId); 
  }, [hoveredEdgeData, hoveredRigId]);

  return (
    <div className="rigs-list">
      <div className="rigs-grid">
        {rigs.map((rig) => (
          <button
            key={rig.id}
            className={`rig-card${rig.ok ? " ok" : " bad"}`}
            onMouseEnter={() => setHoveredRigId(rig.id)}
            onMouseLeave={() => setHoveredRigId((prev) => (prev === rig.id ? null : prev))}
            onFocus={() => setHoveredRigId(rig.id)}
            onBlur={() => setHoveredRigId((prev) => (prev === rig.id ? null : prev))}
            onClick={() => navigate(`/rigs/${rig.id}`)}
          >
            <img src={drillSvg} alt="Буровая вышка" />
            <div className="rig-name" aria-label={rig.name || undefined} title={rig.name || undefined}>
              {rig.name}
            </div>
          </button>
        ))}
      </div>

      <aside className="rig-status-panel" aria-live="polite">
        
        {edgesLoading ? (
          <div style={{ minHeight: 256, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            Загрузка буровых...
          </div>
        ) : hoveredRig ? (
          <>
            <div className="rig-status-header">
              <img src={drillSvg} alt="Схема буровой" className="rig-status-image" />
            </div>
            <div className="rig-status-title">
              <Link to={`/rigs/${hoveredRig.id}`} className={`rig-title-link${hoveredRig.ok ? " ok" : " bad"}`}>
                {hoveredRig.name || `БУ №${hoveredRig.id}`}
              </Link>
            </div>
            
            <div className="edge-status-container">
              <EdgeStatusPanel 
                attributes={transformedHoveredAttributes} 
                loading={hoveredLoading}
              />
            </div>
          </>
        ) : (
          <div style={{ minHeight: 256 }} />
        )}
      </aside>
    </div>
  );
}



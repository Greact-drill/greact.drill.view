import { useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import drillSvg from "../../assets/drill.svg";
import { useAllEdgesWithAttributes, useEdgeWithAttributes } from "../../hooks/useEdges";
import EdgeStatusPanel from "../../components/EdgeStatusPanel/EdgeStatusPanel";
import type { Edge, EdgeWithAttributes, EdgeAttribute, RawEdgeAttributes } from "../../types/edge";
import { transformRawAttributes } from "../../utils/edgeUtils";
import { Button } from 'primereact/button'; // Добавляем импорт, если не был добавлен
import './RigsListPage.css'; // <--- НОВЫЙ ИМПОРТ СТИЛЕЙ
import videoMp4 from '../../assets/background.mp4'; // Обновите имя файла


interface RigCompatible extends Edge {
  id: string; // 14820 -> 14820
  ok: boolean;
}

export default function RigsListPage() {
  const [selectedRigId, setSelectedRigId] = useState<string | null>(null);
  // const navigate = useNavigate();
  
  // Получаем данные edges с атрибутами
  const { edgesWithAttributes, loading: edgesLoading } = useAllEdgesWithAttributes();
  
  // Получаем данные для наведенной буровой
  const selectedEdgeKey = selectedRigId ? `${selectedRigId}` : null;
  const { edgeData: selectedEdgeData, loading: selectedLoading } = useEdgeWithAttributes(selectedEdgeKey);

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

  const currentRig: RigCompatible | undefined = useMemo(() => {
    return rigs.find(r => r.id === selectedRigId);
  }, [rigs, selectedRigId]);

  const transformedSelectedAttributes = useMemo(() => {
    if (!selectedEdgeData?.attributes || !selectedRigId) return null;
    return transformRawAttributes(selectedEdgeData.attributes as RawEdgeAttributes, selectedRigId); 
  }, [selectedEdgeData, selectedRigId]);


  
  return (
    <div className="rigs-list-page">
            <video 
                id="bg-video" 
                className="background-video" // Добавляем класс для стилизации
                autoPlay 
                loop 
                muted 
                playsInline 
                // poster="path/to/placeholder-image.jpg"
            >
                <source src={videoMp4} type="video/mp4" />
                {/* <source src="path/to/optimized-video.mp4" type="video/mp4" /> */}
            </video>
    
      <div className="content-wrapper">
        <div className="rigs-list">
          <div className="rigs-grid">
            {rigs.map((rig) => (
              <button
                key={rig.id}
                // FIX 7: Добавляем класс 'active' при выборе
                className={`rig-card${rig.ok ? " ok" : " bad"}${rig.id === selectedRigId ? ' active' : ''}`}
                onClick={() => setSelectedRigId(rig.id === selectedRigId ? null : rig.id)}
              >
                <img src={drillSvg} alt="Буровая вышка" />
                <div className="rig-name" aria-label={rig.name || undefined} title={rig.name || undefined}>
                  {rig.name}
                </div>
              </button>
            ))}
          </div>

          {/* 4. ОБНОВЛЕНИЕ БОКОВОЙ ПАНЕЛИ: Условный рендеринг и новый класс */}
          <aside className={`rig-status-panel ${selectedRigId ? 'open' : ''}`} aria-live="polite">
              
              {edgesLoading ? (
                  <div style={{ minHeight: 256, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      Загрузка буровых...
                  </div>
              ) : currentRig  ? (
                  <>
                      <div className="rig-status-header">
                          <img src={drillSvg} alt="Схема буровой" className="rig-status-image" />
                          {/* 5. ДОБАВЛЯЕМ КНОПКУ ЗАКРЫТИЯ (КРЕСТИК) */}
                          <Button 
                          icon="pi pi-times" 
                          rounded 
                          text 
                          onClick={() => setSelectedRigId(null)}
                          className="close-panel-btn"
                          aria-label="Закрыть панель"
                          />
                      </div>
                      <div className="rig-status-title">
                          {/* ЭТО КНОПКА ПЕРЕХОДА НА СЛЕДУЮЩУЮ СТРАНИЦУ */}
                          <Link to={`/rigs/${currentRig.id}`} className={`rig-title-link${currentRig.ok ? " ok" : " bad"}`}>
                              {currentRig.name || `БУ №${currentRig.id}`}
                              <i className="pi pi-arrow-right ml-2" />
                          </Link>
                      </div>
                      
                      <div className="edge-status-container">
                          <EdgeStatusPanel 
                              attributes={transformedSelectedAttributes} // FIX 8: Используем правильное имя
                              loading={selectedLoading} // FIX 9: Используем правильное имя
                              rigId={selectedRigId}
                          />
                      </div>
                  </>
              ) : (
                  // Состояние, когда буровая не выбрана
                  <div className="rig-status-placeholder">
                      Выберите буровую для просмотра атрибутов
                  </div>
              )}
          </aside>
        </div>
      </div>
    </div>
  );
}



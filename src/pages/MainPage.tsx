import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import drillSvg from "../assets/drillOld.png";
import { getRigById } from "../api/rigs";
import { useEdgeWithAttributes } from "../hooks/useEdges";
import { useEdgeBlocks } from "../hooks/useBlocks";
import type { Rig } from "../types/rig";
import { polygonPercentToSvgPoints } from "../utils/polygonUtils";

import './MainPage.css';

import { useTagsData } from "../hooks/useTagsData";
import type { TagData } from "../types/tag";


type SegmentStatus = 'ok' | 'error' | 'warning';

// Сегменты заданы в процентах относительно размера изображения (viewBox 1010x1024)
// Координаты подобраны под видимые контуры на картинке
const SEGMENTS: { id: string; name: string; href: string; polygon: string }[] = [
	// Блок 1 — самый левый контейнер
	{ 
        id: "1", 
        name: "КТУ/КРУ", 
        href: "/ktu/:rigId", 
        polygon: "14.2% 73.1%, 25% 70.67%, 32.7% 73.99%, 32.9% 80.2%, 21.5% 83.2%, 14.5% 79.5%" 
    },
	// Блок 2 — средний контейнер
	{ 
		id: "2",
		name: "Насосный блок",
		href: "/pumpblock/:rigId",
		polygon: "26.55% 70.4%, 35.999% 68.4%, 43.7% 71.1%, 43.8% 77%, 34.5% 79.6%, 34.2% 73.7%"
	},
	// Блок 3 — правый малый контейнер
	{ 
		id: "3",
		name: "Циркуляционная система",
		href: "/charts/separate",
		polygon: "37.2% 68.1%, 45% 66.4%, 53.3% 68.7%, 53.3% 74.3%, 45.1% 76.8%, 44.9% 70.8%"
	},
	// Блок 4 — площадка у основания вышки
	{ 
		id: "4",
		name: "Лебедочный блок",
		href: "/charts/separate",
		polygon: "41.5% 64.99%, 60.5% 60.9%, 73.5% 63.7%, 79.2% 64.8%, 84.5% 66%, 66.5% 71.5%"
	},
];

const isTagValueOK = (tag: TagData): boolean => {
    const { value, min, max, unit_of_measurement } = tag;

    // Для числовых значений: проверяем диапазон (min/max должны приходить из API)
    if (unit_of_measurement !== 'bool' && typeof value === 'number' && min !== undefined && max !== undefined) {
        return value >= min && value <= max;
    }

    // Для статусных тегов (bool или явно помеченных как status): 1/true = OK
    const isStatusTag = unit_of_measurement === 'bool' || tag.customization?.some(c => c.key === 'isStatus');
    if (isStatusTag) {
        // Считаем 1 или true как OK
        return value === 1 || value === true || String(value).toLowerCase() === 'true'; 
    }
    
    // Если нет min/max или это не статус, считаем OK
    return true;
};

export default function MainPage() {
	const params = useParams();
	const navigate = useNavigate();
	const rigId = params.rigId || "14820";
	const [rig, setRig] = useState<Rig | null>(null);
	const [hovered, setHovered] = useState<string | null>(null);

	const { tagData, error: tagsError } = useTagsData(); 

	// Используем rigId как edge_key для получения данных
	const edgeKey = `${rigId}`;
	const { error: edgeError } = useEdgeWithAttributes(edgeKey);
	const { blocks } = useEdgeBlocks(edgeKey);

	const sortedTagData = useMemo(() => {
        if (!tagData) return null;
        // Создаем копию массива, чтобы не мутировать исходный (если useTagsData еще не сортирует)
        // Если useTagsData уже сортирует, эта строка просто копирует отсортированный массив
        return [...tagData].sort((a: TagData, b: TagData) => a.name.localeCompare(b.name));
    }, [tagData]);

    // Используем useMemo для определения статуса каждого сегмента
    const segmentsWithStatus = useMemo(() => {
        // Здесь можно применить реальную логику на основе данных Edge/Blocks
        // Для демонстрации используем имитацию
        return SEGMENTS.map(segment => {
            let status: SegmentStatus = 'ok';
            if (segment.id === '2') {
                status = 'error'; // Например, насосный блок в аварии
            } else if (segment.id === '3') {
                status = 'warning'; // Например, подъемный механизм в режиме обслуживания
            } else if (segment.id === '1') {
                status = 'ok'; // КТУ в норме
            }
            return {
                ...segment,
                status,
                svgPoints: polygonPercentToSvgPoints(segment.polygon, 1010, 1024) 
            };
        });
    }, [rigId]); // Зависимость от rigId


	// // Функция для определения класса статуса тега (по умолчанию "unknown")
    // const getTagStatusClass = (value: any): string => {
    //     // Здесь вы можете добавить более сложную логику определения статуса
    //     // Например, на основе пороговых значений или специфических имен тегов
    //     if (typeof value === 'number') {
    //         if (value > 100) return 'error'; // Пример: если значение очень высокое
    //         if (value > 50) return 'warning'; // Пример: если значение среднее
    //         if (value > 0) return 'ok'; // Пример: если значение положительное
    //     }
    //     // По умолчанию или для нечисловых значений
    //     return 'unknown';
    // };

	useEffect(() => {
		getRigById(rigId).then((r) => setRig(r ?? null));
	}, [rigId]);

    return (
        <div className="main-page-container">
            <h1 className="page-title">{rig?.name || 'Буровая установка'}</h1>

            <div className="main-content-grid">
                
                {/* --- 1. ЛЕВЫЙ БЛОК (Список сегментов/Кнопки) --- */}
                {/* 💡 ПЕРЕМЕЩЕННЫЙ БЛОК КНОПОК */}
                <div className="segments-list-wrapper">
                    <div className="segments-list">
                        {/* Если есть данные из API (блоки), используем их */}
                        {blocks.length > 0 ? (
                            blocks.map((block, index) => (
                                <button
                                    key={block.block_name}
                                    className={`seg-item ${hovered === block.block_name ? 'hovered' : ''}`}
                                    onMouseEnter={() => setHovered(block.block_name)}
                                    onMouseLeave={() => setHovered(null)}
                                    onClick={() => navigate(`/charts?mode=separate&rig=${rigId}&block=${block.block_name}`)}
                                >
                                    <span className="seg-dot">{index + 1}</span>
                                    {block.description || block.block_name}
                                </button>
                            ))
                        ) : (
                            // Fallback на статические сегменты
                            segmentsWithStatus.map((s) => (
                                <button
                                    key={s.id}
                                    className={`seg-item status-${s.status} ${hovered === s.id ? 'hovered' : ''}`}
                                    onMouseEnter={() => setHovered(s.id)}
                                    onMouseLeave={() => setHovered(null)}
                                    onClick={() => {
                                        if (s.href.includes(':rigId')) {
                                            navigate(s.href.replace(':rigId', rigId || ''));
                                        } else if (s.href.startsWith('/charts')) {
                                            navigate(`/charts?mode=separate&rig=${rigId}&block=${s.id}`);
                                        } else {
                                            navigate(s.href);
                                        }
                                    }}
                                >
                                    <span className="seg-dot">{s.id}</span>
                                    {s.name}
                                </button>
                            ))
                        )}
						<button
                            key="archive-data" 
                            className="seg-item archive-button" 
                            onClick={() => {
                                // Переходим на новый маршрут /rigs/:rigId/archive
                                navigate(`/rigs/${rigId}/archive`); 
                            }} 
                            // Добавим стили для выделения
                            style={{ 
                                marginTop: '15px', 
                                marginBottom: '15px', /* Добавляем отступы */
                                color: 'var(--color-accent-blue)', 
                                fontWeight: 600,
                                border: '1px solid var(--color-accent-blue)', /* Подчеркиваем акцентом */
                                background: 'rgba(167, 139, 250, 0.1)'
                            }}
                        >
                            <i className="pi pi-chart-line" style={{ marginRight: '10px' }} />
                            Архив графиков
                        </button>
						<button
							key="back-to-rigs" // Уникальный ключ
							className="seg-item back-button" // Используем класс сегмента
							onClick={() => {
								navigate('/'); 
							}} 
						>
							<i className="pi pi-arrow-left" style={{ marginRight: '10px' }} />
							Назад к списку буровых
						</button>
                    </div>
                </div>


                {/* --- 2. ЦЕНТРАЛЬНЫЙ БЛОК (Карта) --- */}
                <div className="map-container">
                    
                    {/* SVG-карта */}
                    <svg
                        className="map-svg"
                        viewBox="0 0 1010 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlnsXlink="http://www.w3.org/1999/xlink"
                    >
                        {/* Основное изображение установки */}
                        <image 
                            xlinkHref={drillSvg} 
                            x="0" 
                            y="0" 
                            width="1010" 
                            height="1024" 
                        />

                        {/* Динамические полигоны для интерактивности */}
                        {segmentsWithStatus.map((segment) => (
                            <polygon
                                key={segment.id}
                                points={segment.svgPoints} 
                                className={`seg-polygon status-${segment.status} ${
                                    hovered === segment.id ? 'hovered' : ''
                                }`}
                                onMouseEnter={() => setHovered(segment.id)}
                                onMouseLeave={() => setHovered(null)}
                                onClick={() => {
                                    if (segment.href.includes(':rigId')) {
                                        navigate(segment.href.replace(':rigId', rigId || ''));
                                    } else if (segment.href.startsWith('/charts')) {
                                        navigate(`/charts?mode=separate&rig=${rigId}&block=${segment.id}`);
                                    } else {
                                        navigate(segment.href);
                                    }
                                }}
                            />
                        ))}
                    </svg>
                </div>

                <div className="edge-status-section">
                    {edgeError && (
                        <div className="edge-error">
                            Ошибка загрузки данных Edge: {edgeError}
                        </div>
                    )}
                    
                    <h2 style={{ color: 'var(--color-accent-blue)', fontSize: '1.2em', marginBottom: '10px' }}>
                        Текущие параметры
                    </h2>
                    {tagsError && (
                        <div className="edge-error">
                            Ошибка загрузки тегов: {tagsError}
                        </div>
                    )}
                    
                    {/* 💡 ОТОБРАЖЕНИЕ ДАННЫХ ТЕГОВ В ВИДЕ БЛОКОВ */}
                    {sortedTagData && (
                        <div className="tag-data-grid-container">
                            <div className="tag-card-grid-small">
                                {sortedTagData.map(tag => {
                                    const isOK = isTagValueOK(tag);
                                    const statusClass = isOK ? 'status-ok' : 'status-error';
                                    
                                    // 💡 НОВАЯ ПРОВЕРКА: Определяем, является ли тег булевым
                                    const isBooleanTag = tag.unit_of_measurement === 'bool';

                                    return (
                                        <div 
                                            key={tag.name} 
                                            // Добавляем класс-модификатор для булевых тегов
                                            className={`tag-card-small ${statusClass} ${isBooleanTag ? 'tag-card-bool' : ''}`}
                                        >
                                            <div className="tag-card-title-small">{tag.name}</div>
                                            
                                            {/* 💡 УСЛОВНОЕ ОТОБРАЖЕНИЕ: Рендерим значение только для не-булевых тегов */}
                                            {!isBooleanTag && (
                                                <div className="tag-card-value-small">
                                                    {String(tag.value)}
                                                    {tag.unit_of_measurement && (
                                                        <span className="tag-card-unit-small">
                                                            {tag.unit_of_measurement}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

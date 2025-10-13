// src/components/BypassStatusBlock.tsx

import React, { useRef, useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import './BypassStatusBlock.css'; 

interface BypassStatusBlockProps {
    label: string;
    value: string | React.ReactNode;
    isOK: boolean; // True для зеленого (успех), False для красного (ошибка)
}

/**
 * Вспомогательный хук для получения предыдущего значения.
 * Использует useRef с начальным значением undefined.
 */
function usePrevious<T>(value: T): T | undefined {
    // Явно указываем начальное значение undefined
    const ref = useRef<T | undefined>(undefined); 
    
    useEffect(() => {
        ref.current = value;
    }, [value]); // Зависит от текущего значения

    return ref.current;
}

export default function BypassStatusBlock({ label, value, isOK }: BypassStatusBlockProps) {
    const statusClass = isOK ? 'status-ok' : 'status-error';
    const [isUpdated, setIsUpdated] = useState(false);

    // Получаем предыдущее значение props для сравнения
    const prevValue = usePrevious(value);
    const prevIsOK = usePrevious(isOK);

    useEffect(() => {
        // Сравниваем только после первого рендера
        if (prevValue !== undefined) {
            // Проверяем, изменилось ли значение или статус
            if (prevValue !== value || prevIsOK !== isOK) {
                setIsUpdated(true);
                
                // Удаляем класс анимации через 1.5 секунды
                const timer = setTimeout(() => {
                    setIsUpdated(false);
                }, 1500); 

                return () => clearTimeout(timer); // Очистка таймера при размонтировании
            }
        }
    }, [value, isOK, prevValue, prevIsOK]); // Добавляем все зависимости

    return (
        // Добавляем временный класс 'shimmer-effect'
        <Card className={`bypass-status-block ${statusClass} ${isUpdated ? 'shimmer-effect' : ''}`}> 
            {/* Боковой индикатор */}
            <div className={`status-indicator-side ${statusClass}`} /> 
            
            <div className="status-content">
                <p className="p-text-bold block-label">{label}</p>
                <div className="block-value">{value}</div>
            </div>
        </Card>
    );
}
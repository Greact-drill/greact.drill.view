import { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // Длительность анимации в миллисекундах
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ 
  value, 
  duration = 800,
  className = '' 
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Сбрасываем значение при изменении целевого значения
    setDisplayValue(0);
    
    // Вычисляем шаг и интервал для плавной анимации
    const steps = Math.min(value, 40); // Максимум 40 шагов для более быстрой анимации
    const stepValue = value / steps;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const newValue = Math.min(Math.round(stepValue * currentStep), value);
      setDisplayValue(newValue);
      
      if (currentStep >= steps || newValue >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
};

export default AnimatedCounter;


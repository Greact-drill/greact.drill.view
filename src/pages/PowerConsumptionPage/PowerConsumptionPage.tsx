import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import './PowerConsumptionPage.css';

interface PowerSection {
  id: string;
  title: string;
  consumption: number; // кВт·ч
  voltages: {
    Uab: number;
    Ubc: number;
    Uca: number;
  };
  currents: {
    Iab: number;
    Ibc: number;
    Ica: number;
  };
  power: {
    P: number; // кВт
    Q: number; // кВАр
    S: number; // кВА
  };
  powerFactor: number; // cos f
  transformer: {
    voltage: string;
    power: number; // кВА
    unit: string; // КТУ1, КТУ2 и т.д.
  };
}

const POWER_SECTIONS: PowerSection[] = [
  {
    id: "1",
    title: "СИЛОВОЕ ПИТАНИЕ КТУ 0,4 кВ",
    consumption: 6188,
    voltages: { Uab: 6237, Ubc: 6245, Uca: 6172 },
    currents: { Iab: 17.44, Ibc: 16.13, Ica: 13.82 },
    power: { P: 157.82, Q: 61.53, S: 169.39 },
    powerFactor: 0.932,
    transformer: { voltage: "6/0.4 кВ", power: 1000, unit: "КТУ1" }
  },
  {
    id: "2",
    title: "СИЛОВОЕ ПИТАНИЕ ЭЛЕКТРОПРИВОДОВ БУРОВЫХ НАСОСОВ",
    consumption: 3593,
    voltages: { Uab: 6232, Ubc: 6239, Uca: 6149 },
    currents: { Iab: 1.03, Ibc: 1.02, Ica: 1.14 },
    power: { P: 7.99, Q: 8.14, S: 11.41 },
    powerFactor: 1.000,
    transformer: { voltage: "6/0.69/0.69 кВ", power: 2500, unit: "КТУ1" }
  },
  {
    id: "3",
    title: "СИЛОВОЕ ПИТАНИЕ ЭЛЕКТРОПРИВОДОВ БУРОВОЙ ЛЕБЕДКИ И РОТОРА",
    consumption: 634,
    voltages: { Uab: 6236, Ubc: 6232, Uca: 6207 },
    currents: { Iab: 0.80, Ibc: 1.00, Ica: 1.04 },
    power: { P: 8.40, Q: 5.65, S: 10.12 },
    powerFactor: 1.000,
    transformer: { voltage: "6/0.69/0.69 кВ", power: 2500, unit: "КТУ2" }
  },
  {
    id: "4",
    title: "СИЛОВОЕ ПИТАНИЕ СВП",
    consumption: 540,
    voltages: { Uab: 6234, Ubc: 6239, Uca: 6170 },
    currents: { Iab: 0.81, Ibc: 0.96, Ica: 0.91 },
    power: { P: 4.83, Q: -8.32, S: 9.62 },
    powerFactor: 1.000,
    transformer: { voltage: "6/0.4 кВ", power: 1000, unit: "КТУ1" }
  }
];

export default function PowerConsumptionPage() {
  const params = useParams();
  const rigId = params.rigId || "14820";

  // Состояние для анимированных значений
  const [animatedSections, setAnimatedSections] = useState<PowerSection[]>(POWER_SECTIONS);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedSections((prev) =>
        prev.map((section, index) => {
          const baseSection = POWER_SECTIONS[index];
          // Генерируем небольшие случайные изменения (±2% от базового значения)
          const variation = (baseValue: number, percent: number = 0.02) => {
            const change = (Math.random() - 0.5) * 2 * percent;
            return baseValue * (1 + change);
          };

          return {
            ...section,
            consumption: variation(baseSection.consumption, 0.01),
            voltages: {
              Uab: variation(baseSection.voltages.Uab, 0.01),
              Ubc: variation(baseSection.voltages.Ubc, 0.01),
              Uca: variation(baseSection.voltages.Uca, 0.01),
            },
            currents: {
              Iab: variation(baseSection.currents.Iab, 0.02),
              Ibc: variation(baseSection.currents.Ibc, 0.02),
              Ica: variation(baseSection.currents.Ica, 0.02),
            },
            power: {
              P: variation(baseSection.power.P, 0.02),
              Q: variation(baseSection.power.Q, 0.02),
              S: variation(baseSection.power.S, 0.02),
            },
            powerFactor: Math.max(0.9, Math.min(1.0, variation(baseSection.powerFactor, 0.005))),
          };
        })
      );
    }, 2000); // Обновление каждые 2 секунды

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="power-consumption-page-container">
      {/* Заголовок страницы */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="power-page-title">Расход электроэнергии</h1>
          <p className="power-page-subtitle">Мониторинг энергопотребления</p>
        </div>
      </div>

      {/* Навигация */}
      <div className="power-page-nav">
        <Link to={`/rigs/${rigId}`} className="power-nav-link">
          <i className="pi pi-arrow-left" />
          <span>Назад</span>
        </Link>
      </div>

      {/* Основной контент - Схема КРУ 1 */}
      <div className="power-content-wrapper">
        <div className="kru-scheme-container">
          <div className="kru-header">
            <h2 className="kru-title">КРУ 1</h2>
          </div>
          
          <div className="power-sections-grid">
            {animatedSections.map((section) => (
              <div key={section.id} className="power-section-card">
                <div className="power-section-header">
                  <div className="power-section-icon">
                    <i className="pi pi-bolt" />
                  </div>
                  <h3 className="power-section-title">{section.title}</h3>
                </div>

                <div className="power-section-content">
                  {/* Потребление */}
                  <div className="power-parameter-row">
                    <span className="power-parameter-label">Потребление</span>
                    <span className="power-parameter-value">{section.consumption.toLocaleString('ru-RU')} кВт·ч</span>
                  </div>

                  {/* Напряжения */}
                  <div className="power-parameter-group">
                    <div className="power-parameter-label-group">Напряжения (U)</div>
                    <div className="power-parameter-values">
                      <div className="power-parameter-item">
                        <span className="power-param-name">Uab:</span>
                        <span className="power-param-value">{section.voltages.Uab.toLocaleString('ru-RU')} В</span>
                      </div>
                      <div className="power-parameter-item">
                        <span className="power-param-name">Ubc:</span>
                        <span className="power-param-value">{section.voltages.Ubc.toLocaleString('ru-RU')} В</span>
                      </div>
                      <div className="power-parameter-item">
                        <span className="power-param-name">Uca:</span>
                        <span className="power-param-value">{section.voltages.Uca.toLocaleString('ru-RU')} В</span>
                      </div>
                    </div>
                  </div>

                  {/* Токи */}
                  <div className="power-parameter-group">
                    <div className="power-parameter-label-group">Токи (I)</div>
                    <div className="power-parameter-values">
                      <div className="power-parameter-item">
                        <span className="power-param-name">Iab:</span>
                        <span className="power-param-value">{section.currents.Iab.toLocaleString('ru-RU')} А</span>
                      </div>
                      <div className="power-parameter-item">
                        <span className="power-param-name">Ibc:</span>
                        <span className="power-param-value">{section.currents.Ibc.toLocaleString('ru-RU')} А</span>
                      </div>
                      <div className="power-parameter-item">
                        <span className="power-param-name">Ica:</span>
                        <span className="power-param-value">{section.currents.Ica.toLocaleString('ru-RU')} А</span>
                      </div>
                    </div>
                  </div>

                  {/* Мощность */}
                  <div className="power-parameter-group">
                    <div className="power-parameter-label-group">Мощность</div>
                    <div className="power-parameter-values">
                      <div className="power-parameter-item">
                        <span className="power-param-name">P:</span>
                        <span className="power-param-value">{section.power.P.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} кВт</span>
                      </div>
                      <div className="power-parameter-item">
                        <span className="power-param-name">Q:</span>
                        <span className="power-param-value">{section.power.Q.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} кВАр</span>
                      </div>
                      <div className="power-parameter-item">
                        <span className="power-param-name">S:</span>
                        <span className="power-param-value">{section.power.S.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} кВА</span>
                      </div>
                    </div>
                  </div>

                  {/* Коэффициент мощности */}
                  <div className="power-parameter-row">
                    <span className="power-parameter-label">cos φ:</span>
                    <span className="power-parameter-value">{section.powerFactor.toLocaleString('ru-RU', { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</span>
                  </div>

                  {/* Трансформатор */}
                  <div className="power-transformer-info">
                    <div className="transformer-icon-wrapper">
                      <svg className="transformer-icon" viewBox="0 0 100 100" width="40" height="40">
                        <circle cx="30" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="3" />
                        <circle cx="70" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="3" />
                        <line x1="50" y1="30" x2="50" y2="70" stroke="currentColor" strokeWidth="3" />
                      </svg>
                    </div>
                    <div className="transformer-text">
                      <div className="transformer-label">Питание трансформатора</div>
                      <div className="transformer-value">{section.transformer.voltage}, {section.transformer.power.toLocaleString('ru-RU')} кВА, {section.transformer.unit}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
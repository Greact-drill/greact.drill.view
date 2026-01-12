import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import './ElectricalDiagramPage.css';

export default function ElectricalDiagramPage() {
  const navigate = useNavigate();

  return (
    <div className="electrical-diagram-page">
      <div className="electrical-diagram-container">
        <div className="diagram-header">
          <Button 
            icon="pi pi-arrow-left"
            label="Назад"
            severity="secondary"
            onClick={() => navigate(-1)} 
            className="diagram-back-button"
          />
          <h1 className="diagram-title">Схема электроснабжения</h1>
        </div>

        <div className="diagram-content">
          <svg 
            viewBox="0 0 6000 4000" 
            className="electrical-diagram-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="20"
                markerHeight="20"
                refX="18"
                refY="6"
                orient="auto"
              >
                <polygon points="0 0, 20 6, 0 12" fill="#c97a3d" />
              </marker>
              {/* Gradient for current animation */}
              <linearGradient id="currentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                <stop offset="50%" stopColor="rgba(201, 122, 61, 0.8)" />
                <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
              </linearGradient>
              <linearGradient id="diagramBackground" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(10, 13, 18, 0.3)" />
                <stop offset="25%" stopColor="rgba(15, 20, 28, 0.25)" />
                <stop offset="50%" stopColor="rgba(20, 25, 32, 0.2)" />
                <stop offset="75%" stopColor="rgba(15, 20, 28, 0.25)" />
                <stop offset="100%" stopColor="rgba(10, 13, 18, 0.3)" />
              </linearGradient>
              
              {/* Filter for transformer glow effect */}
              <filter id="transformerGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
                <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1.5 0" result="glow" />
                <feGaussianBlur in="glow" stdDeviation="4" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background - прозрачный, чтобы использовался фон страницы */}
            <rect width="6000" height="4000" fill="url(#diagramBackground)" />

            {/* ДЭС 315 кВт - слева от новой области */}
            <g className="diesel-generator">
              <rect x="100" y="100" width="320" height="220" className="generator" />
              <text x="260" y="190" className="generator-label-xlarge">ДЭС</text>
              <text x="260" y="230" className="generator-spec-xlarge">315 кВт</text>
              <line x1="260" y1="330" x2="260" y2="600" className="power-line current-line" />
              <circle cx="260" cy="330" r="10" className="current-particle">
                <animate attributeName="cy" from="330" to="600" dur="1.2s" begin="0s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.2s" begin="0s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Новая область над КТУ 1 и КТУ 2 для КРУ1-ЯЧ 2-5 */}
            <g className="kru-cells-area">
              <rect x="500" y="100" width="4050" height="320" className="section-box" fill="rgba(201, 122, 61, 0.08)" stroke="rgba(201, 122, 61, 0.4)" strokeWidth="5" strokeDasharray="20,10" rx="10" />
              <text x="540" y="370" className="ktu-label-xlarge">КРУ 1</text>

              {/* КРУ 1 - 6000V Busbar - над блоками КРУ1-ЯЧ */}
              <line x1="700" y1="140" x2="4500" y2="140" className="busbar-6kv busbar-active busbar-bus1" stroke="#22c55e">
                <animate attributeName="stroke" values="#22c55e;#22c55e;#ef4444;#ef4444;#22c55e" dur="15s" repeatCount="indefinite" keyTimes="0;0.88;0.90;0.95;1" calcMode="linear" />
              </line>
              <text x="2977" y="165" className="voltage-label-xlarge">6000 V</text>

              {/* Switchgear Cells - размещены согласно требованиям */}
              {/* КРУ1-ЯЧ 2 - на место КРУ1-ЯЧ 3 */}
              <rect x="1100" y="180" width="320" height="180" className="switchgear-cell" />
              <text x="1260" y="250" className="cell-label-xlarge">КРУ1-ЯЧ 2</text>
              <text x="1260" y="300" className="breaker-label-xlarge">Q1</text>
              <line x1="1260" y1="140" x2="1260" y2="180" className="power-line current-line" />
              <circle cx="1260" cy="140" r="10" className="current-particle">
                <animate attributeName="cy" from="140" to="180" dur="0.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="0.8s" repeatCount="indefinite" />
              </circle>
              <line x1="1260" y1="360" x2="1240" y2="870" className="power-line current-line" />
              <circle cx="1260" cy="360" r="10" className="current-particle">
                <animate attributeName="cy" from="360" to="870" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
                <animate attributeName="cx" from="1260" to="1240" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
              </circle>

              {/* КРУ1-ЯЧ 3 - на одном уровне с остальными КРУ1-ЯЧ */}
              <rect x="2135" y="180" width="320" height="180" className="switchgear-cell" />
              <text x="2295" y="250" className="cell-label-xlarge">КРУ1-ЯЧ 3</text>
              <text x="2295" y="300" className="breaker-label-xlarge">Q2</text>
              <line x1="2295" y1="140" x2="2295" y2="180" className="power-line current-line" />
              <circle cx="2295" cy="140" r="10" className="current-particle">
                <animate attributeName="cy" from="140" to="180" dur="0.8s" begin="0.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="0.8s" begin="0.4s" repeatCount="indefinite" />
              </circle>
              <line x1="2295" y1="360" x2="2275" y2="750" className="power-line current-line" />
              <circle cx="2295" cy="360" r="10" className="current-particle">
                <animate attributeName="cy" from="360" to="750" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
                <animate attributeName="cx" from="2295" to="2275" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
              </circle>

              {/* КРУ1-ЯЧ 4 - над элементом T3 */}
              <rect x="3500" y="180" width="320" height="180" className="switchgear-cell" />
              <text x="3660" y="250" className="cell-label-xlarge">КРУ1-ЯЧ 4</text>
              <text x="3660" y="300" className="breaker-label-xlarge">Q3</text>
              <line x1="3660" y1="140" x2="3660" y2="180" className="power-line current-line" />
              <circle cx="3660" cy="140" r="10" className="current-particle">
                <animate attributeName="cy" from="140" to="180" dur="0.8s" begin="0.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="0.8s" begin="0.8s" repeatCount="indefinite" />
              </circle>
              <line x1="3660" y1="360" x2="3660" y2="870" className="power-line current-line" />
              <circle cx="3660" cy="360" r="10" className="current-particle">
                <animate attributeName="cy" from="360" to="870" dur="1.2s" begin="1s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.2s" begin="1s" repeatCount="indefinite" />
              </circle>

              {/* КРУ1-ЯЧ 5 - справа от КРУ1-ЯЧ 4, но не близко к концу */}
              <rect x="4100" y="180" width="320" height="180" className="switchgear-cell" />
              <text x="4260" y="250" className="cell-label-xlarge">КРУ1-ЯЧ 5</text>
              <text x="4260" y="300" className="breaker-label-xlarge">Q4</text>
              <line x1="4260" y1="140" x2="4260" y2="180" className="power-line current-line" />
              <circle cx="4260" cy="140" r="10" className="current-particle">
                <animate attributeName="cy" from="140" to="180" dur="0.8s" begin="1.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="0.8s" begin="1.2s" repeatCount="indefinite" />
              </circle>
              <line x1="4260" y1="360" x2="4260" y2="450" className="power-line current-line" />
              <circle cx="4260" cy="360" r="10" className="current-particle">
                <animate attributeName="cy" from="360" to="450" dur="0.6s" begin="1.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="0.6s" begin="1.4s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* T4 - вынесен между областями КРУ и КТУ, подключен к КРУ1-ЯЧ 5, расположен под КРУ1-ЯЧ 5 */}
            <g className="transformer-group">
              <rect x="4120" y="450" width="280" height="220" className="transformer" filter="url(#transformerGlow)" />
              <text x="4260" y="530" className="transformer-label-xlarge">T4</text>
              <text x="4260" y="570" className="transformer-spec-xlarge">1000 kVA</text>
              <text x="4260" y="610" className="transformer-spec-xlarge">6/0.4 kV</text>
            </g>

            {/* КТУ 1 Group */}
            <g className="ktu-group" data-ktu="1">
              <rect x="100" y="720" width="2700" height="1600" className="ktu-box" fill="rgba(201, 122, 61, 0.08)" />
              <text x="140" y="790" className="ktu-label-xlarge">КТУ 1</text>

              {/* Transformers */}
              <g className="transformer-group">
                {/* T1 - 1000 kVA, 6/0.4 kV - подключен от КРУ1-ЯЧ 2 (Q1), размещен под КРУ1-ЯЧ 2 */}
                <rect x="1100" y="870" width="280" height="220" className="transformer" filter="url(#transformerGlow)" />
                <text x="1240" y="950" className="transformer-label-xlarge">T1</text>
                <text x="1240" y="990" className="transformer-spec-xlarge">1000 kVA</text>
                <text x="1240" y="1030" className="transformer-spec-xlarge">6/0.4 kV</text>
                <line x1="1240" y1="1090" x2="1240" y2="1470" className="power-line current-line" />
                <circle cx="1240" cy="1090" r="10" className="current-particle">
                  <animate attributeName="cy" from="1090" to="1470" dur="1s" begin="0s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1s" begin="0s" repeatCount="indefinite" />
                </circle>

                {/* T2 - 2500 kVA, 6/0.69 kV - подключен от КРУ1-ЯЧ 3 (Q2) к БП 1, на одном уровне с Т1 */}
                <rect x="2135" y="870" width="280" height="220" className="transformer" filter="url(#transformerGlow)" />
                <text x="2275" y="950" className="transformer-label-xlarge">T2</text>
                <text x="2275" y="990" className="transformer-spec-xlarge">2500 kVA</text>
                <text x="2275" y="1030" className="transformer-spec-xlarge">6/0.69 kV</text>
                <line x1="2295" y1="360" x2="2275" y2="870" className="power-line current-line" />
                <circle cx="2295" cy="360" r="10" className="current-particle">
                  <animate attributeName="cy" from="360" to="870" dur="1.2s" begin="0.7s" repeatCount="indefinite" />
                  <animate attributeName="cx" from="2295" to="2275" dur="1.2s" begin="0.7s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.2s" begin="0.7s" repeatCount="indefinite" />
                </circle>
                {/* T2 подключен к БП 1 */}
                <line x1="2275" y1="1090" x2="2275" y2="1320" className="power-line current-line" />
                <circle cx="2275" cy="1090" r="10" className="current-particle">
                  <animate attributeName="cy" from="1090" to="1320" dur="0.8s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="0.8s" begin="0.5s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* 400V Busbar */}
              <line x1="250" y1="1470" x2="1800" y2="1470" className="busbar-400v busbar-active busbar-bus2" stroke="#22c55e">
                <animate attributeName="stroke" values="#22c55e;#22c55e;#ef4444;#ef4444;#22c55e" dur="18s" repeatCount="indefinite" keyTimes="0;0.85;0.87;0.92;1" calcMode="linear" />
              </line>
              <text x="150" y="1495" className="voltage-label-xlarge">400 V</text>

              {/* T1 to 400V Busbar connection */}
              <circle cx="1240" cy="1320" r="12" className="connection-point" />
              <text x="1270" y="1360" className="breaker-label-xlarge">QF1 1600 A</text>

              {/* ДЭС подключена к 400V Busbar */}
              <line x1="260" y1="600" x2="260" y2="1470" className="power-line current-line" />
              <circle cx="260" cy="600" r="10" className="current-particle">
                <animate attributeName="cy" from="600" to="1470" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx="260" cy="1320" r="12" className="connection-point" />
              <text x="280" y="1360" className="breaker-label-xlarge">QF2 630 A</text>

              {/* Loads from 400V Busbar */}
              <g className="loads-400v">
                <line x1="500" y1="1470" x2="500" y2="2320" className="power-line current-line" />
                <circle cx="500" cy="1470" r="10" className="current-particle">
                  <animate attributeName="cy" from="1470" to="2320" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.5s" repeatCount="indefinite" />
                </circle>
                <circle cx="500" cy="1570" r="12" className="connection-point" />
                <text x="480" y="1570" textAnchor="end" className="breaker-label-xlarge">67QF1 250 A</text>
                <rect x="340" y="2320" width="320" height="130" className="load-box" />
                <text x="500" y="2380" className="load-label-xlarge">Компрессорный</text>
                <text x="500" y="2420" className="load-label-xlarge">блок</text>

                <line x1="900" y1="1470" x2="900" y2="2320" className="power-line current-line" />
                <circle cx="900" cy="1470" r="10" className="current-particle">
                  <animate attributeName="cy" from="1470" to="2320" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.5s" begin="0.3s" repeatCount="indefinite" />
                </circle>
                <circle cx="900" cy="1570" r="12" className="connection-point" />
                <text x="880" y="1570" textAnchor="end" className="breaker-label-xlarge">65QF1 125 A</text>
                <rect x="800" y="2320" width="200" height="130" className="load-box" />
                <text x="900" y="2380" className="load-label-xlarge">Насосный</text>
                <text x="900" y="2420" className="load-label-xlarge">блок</text>

                <line x1="1050" y1="1470" x2="1050" y2="1670" className="power-line current-line" />
                <circle cx="1050" cy="1470" r="10" className="current-particle">
                  <animate attributeName="cy" from="1470" to="1670" dur="0.6s" begin="0.7s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="0.6s" begin="0.7s" repeatCount="indefinite" />
                </circle>
                <circle cx="1050" cy="1570" r="12" className="connection-point" />
                <text x="1070" y="1570" className="breaker-label-xlarge">QFL3 25 A</text>
                <rect x="950" y="1670" width="200" height="100" className="load-box-small" />
                <text x="1050" y="1730" className="load-label-xlarge">МПК 1</text>

                <line x1="1300" y1="1470" x2="1300" y2="2320" className="power-line current-line" />
                <circle cx="1300" cy="1470" r="10" className="current-particle">
                  <animate attributeName="cy" from="1470" to="2320" dur="1.5s" begin="0.9s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1.5s" begin="0.9s" repeatCount="indefinite" />
                </circle>
                <circle cx="1300" cy="1570" r="12" className="connection-point" />
                <text x="1320" y="1570" className="breaker-label-xlarge">42 QF1 630 A</text>
                <rect x="1200" y="2320" width="200" height="130" className="load-box" />
                <text x="1300" y="2380" className="load-label-xlarge">Питание</text>
                <text x="1300" y="2420" className="load-label-xlarge">220/440</text>

                <line x1="1550" y1="1470" x2="1550" y2="1670" className="power-line current-line" />
                <circle cx="1550" cy="1470" r="10" className="current-particle">
                  <animate attributeName="cy" from="1470" to="1670" dur="0.6s" begin="1.1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="0.6s" begin="1.1s" repeatCount="indefinite" />
                </circle>
                <circle cx="1550" cy="1570" r="12" className="connection-point" />
                <text x="1570" y="1570" className="breaker-label-xlarge">34QF1 400 A</text>
                <rect x="1380" y="1670" width="340" height="100" className="load-box-small" />
                <text x="1550" y="1730" className="load-label-xlarge">ФКУ 200 кВа</text>
              </g>

              {/* БП 1 - Power Supply 1 - размещен над ШУН 1 и ШУН 2, выше короткой зеленой шины */}
              <g className="power-supply">
                <rect x="1850" y="1320" width="850" height="200" className="rectifier-box" />
                <text x="2275" y="1420" className="rectifier-label-xlarge">БП 1</text>
                {/* Вход от T2 (690V AC) */}
                <line x1="2275" y1="1320" x2="2275" y2="1290" className="power-line current-line" />
                <circle cx="2275" cy="1320" r="10" className="current-particle">
                  <animate attributeName="cy" from="1320" to="1290" dur="0.5s" begin="1.3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur="0.5s" begin="1.3s" repeatCount="indefinite" />
                </circle>
                <circle cx="2275" cy="1290" r="12" className="breaker-point" />
                <text x="2295" y="1270" className="breaker-label-xlarge">690 V AC</text>
                <text x="2295" y="1240" className="breaker-label-xlarge">от T2</text>
                
                {/* DC Output - связь с шиной снизу */}
                <line x1="1910" y1="1420" x2="2180" y2="1420" className="dc-bus current-line" />
                <circle cx="1910" cy="1420" r="10" className="current-particle">
                  <animate attributeName="cx" from="1910" to="2180" dur="1s" begin="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1s" begin="1.5s" repeatCount="indefinite" />
                </circle>
                <line x1="1910" y1="1470" x2="2180" y2="1470" className="dc-bus current-line" />
                <circle cx="2180" cy="1470" r="10" className="current-particle">
                  <animate attributeName="cx" from="2180" to="1910" dur="1s" begin="1.7s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1s" begin="1.7s" repeatCount="indefinite" />
                </circle>
                <line x1="2275" y1="1520" x2="2275" y2="1620" className="power-line current-line" />
                <circle cx="2275" cy="1520" r="10" className="current-particle">
                  <animate attributeName="cy" from="1520" to="1620" dur="0.8s" begin="1.9s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="0.8s" begin="1.9s" repeatCount="indefinite" />
                </circle>
                <text x="1920" y="1405" className="dc-label-xlarge">DC+</text>
                <text x="1920" y="1495" className="dc-label-xlarge">DC-</text>
                <text x="2200" y="1445" className="voltage-label-xlarge">1000 V DC</text>

                <circle cx="1930" cy="1420" r="8" className="dc-point" />
                <text x="1850" y="1415" className="breaker-label-xlarge">QF1 A</text>
                <circle cx="1930" cy="1470" r="8" className="dc-point" />
                <text x="1850" y="1465" className="breaker-label-xlarge">QF2 25 A</text>
              </g>

              {/* Short Green Busbar for ШУН 1 and ШУН 2 */}
              <line x1="1850" y1="1620" x2="2700" y2="1620" className="busbar-400v busbar-active busbar-bus3" strokeWidth="8" stroke="#22c55e">
                <animate attributeName="stroke" values="#22c55e;#22c55e;#ef4444;#ef4444;#22c55e" dur="12s" repeatCount="indefinite" keyTimes="0;0.80;0.82;0.88;1" calcMode="linear" />
              </line>

              {/* Control Cabinets ШУН 1, ШУН 2 */}
              <g className="control-cabinets">
                <rect x="1850" y="1720" width="280" height="450" className="cabinet-box" />
                <text x="1990" y="1790" className="cabinet-label-xlarge">ШУН 1</text>
                <rect x="1900" y="1870" width="180" height="80" className="switch-box" />
                <text x="1990" y="1915" className="switch-label-xlarge">Q5</text>
                <rect x="1900" y="2000" width="180" height="80" className="frequency-converter-box" />
                <text x="1990" y="2045" className="fc-label-xlarge">ПЧ 1</text>
                <text x="1990" y="2085" className="fc-symbol-xlarge">f</text>
                {/* Connection from ШУН 1 to busbar */}
                <line x1="1990" y1="1720" x2="1990" y2="1620" className="power-line current-line" />
                <circle cx="1990" cy="1720" r="10" className="current-particle">
                  <animate attributeName="cy" from="1720" to="1620" dur="0.6s" begin="2.1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="0.6s" begin="2.1s" repeatCount="indefinite" />
                </circle>

                <rect x="2420" y="1720" width="280" height="450" className="cabinet-box" />
                <text x="2560" y="1790" className="cabinet-label-xlarge">ШУН 2</text>
                <rect x="2470" y="1870" width="180" height="80" className="switch-box" />
                <text x="2560" y="1915" className="switch-label-xlarge">Q5</text>
                <rect x="2470" y="2000" width="180" height="80" className="frequency-converter-box" />
                <text x="2560" y="2045" className="fc-label-xlarge">ПЧ 2</text>
                <text x="2560" y="2085" className="fc-symbol-xlarge">f</text>
                {/* Connection from ШУН 2 to busbar */}
                <line x1="2560" y1="1720" x2="2560" y2="1620" className="power-line current-line" />
                <circle cx="2560" cy="1720" r="10" className="current-particle">
                  <animate attributeName="cy" from="1720" to="1620" dur="0.6s" begin="2.3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="0.6s" begin="2.3s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Power Lines from Cabinets to Motors */}
              <line x1="1990" y1="2170" x2="1990" y2="2380" className="power-line current-line" />
              <circle cx="1990" cy="2170" r="10" className="current-particle">
                <animate attributeName="cy" from="2170" to="2380" dur="0.7s" begin="2.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="0.7s" begin="2.5s" repeatCount="indefinite" />
              </circle>
              <line x1="2560" y1="2170" x2="2560" y2="2380" className="power-line current-line" />
              <circle cx="2560" cy="2170" r="10" className="current-particle">
                <animate attributeName="cy" from="2170" to="2380" dur="0.7s" begin="2.7s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="0.7s" begin="2.7s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Motors МН 1, МН 2 - вынесены за пределы области КТУ 1 */}
            <g className="motors">
              <circle cx="1990" cy="2470" r="90" className="motor-circle motor-mn1" />
              <text x="1990" y="2490" className="motor-label-xlarge motor-label-mn1">МН 1</text>

              <circle cx="2560" cy="2470" r="90" className="motor-circle motor-mn2" />
              <text x="2560" y="2490" className="motor-label-xlarge motor-label-mn2">МН 2</text>
            </g>

            {/* КТУ 2 Group */}
            <g className="ktu-group" data-ktu="2">
              <rect x="3000" y="720" width="1550" height="1600" className="ktu-box" fill="rgba(201, 122, 61, 0.08)" />
              <text x="3040" y="790" className="ktu-label-xlarge">КТУ 2</text>

              {/* T3 - 2500 kVA, 6/0.69 kV - подключен от КРУ1-ЯЧ 4 (Q3) к БП 2, расположен под КРУ1-ЯЧ 4, на одном уровне с Т2 */}
              <rect x="3520" y="870" width="280" height="220" className="transformer" filter="url(#transformerGlow)" />
              <text x="3660" y="950" className="transformer-label-xlarge">T3</text>
              <text x="3660" y="990" className="transformer-spec-xlarge">2500 kVA</text>
              <text x="3660" y="1030" className="transformer-spec-xlarge">6/0.69 kV</text>
              {/* T3 подключен к БП 2 */}
              <line x1="3660" y1="1090" x2="3660" y2="1320" className="power-line current-line" />
              <circle cx="3660" cy="1090" r="10" className="current-particle">
                <animate attributeName="cy" from="1090" to="1320" dur="0.8s" begin="3s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="0.8s" begin="3s" repeatCount="indefinite" />
              </circle>

              {/* Short Green Busbar for ШУЛ 1, ШУЛ 2 and ШУР */}
              <line x1="3170" y1="1620" x2="4150" y2="1620" className="busbar-400v busbar-active busbar-bus4" strokeWidth="8" stroke="#22c55e">
                <animate attributeName="stroke" values="#22c55e;#22c55e;#ef4444;#ef4444;#22c55e" dur="14s" repeatCount="indefinite" keyTimes="0;0.84;0.86;0.91;1" calcMode="linear" />
              </line>
              <text x="3100" y="1645" className="voltage-label-xlarge">400 V</text>

              {/* Additional Loads */}
              <circle cx="4000" cy="1570" r="12" className="connection-point" />
              <text x="4020" y="1570" className="breaker-label-xlarge">42 QF1 630 A</text>


              {/* БП 2 - Power Supply 2 - размещен над ШУЛ 1, ШУЛ 2 и ШУР, выше короткой зеленой шины, на одном уровне с БП 1, подключен к T3 */}
              <g className="power-supply">
                <rect x="3170" y="1320" width="980" height="200" className="rectifier-box" />
                <text x="3660" y="1420" className="rectifier-label-xlarge">БП 2</text>
                {/* Вход от T3 (690V AC) */}
                <line x1="3660" y1="1320" x2="3660" y2="1290" className="power-line current-line" />
                <circle cx="3660" cy="1320" r="10" className="current-particle">
                  <animate attributeName="cy" from="1320" to="1290" dur="0.5s" begin="3.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur="0.5s" begin="3.2s" repeatCount="indefinite" />
                </circle>
                <circle cx="3660" cy="1290" r="12" className="breaker-point" />
                <text x="3680" y="1270" className="breaker-label-xlarge">690 V AC</text>
                <text x="3680" y="1240" className="breaker-label-xlarge">от T3</text>
                
                {/* DC Output - связь с шиной снизу */}
                <line x1="3230" y1="1420" x2="3500" y2="1420" className="dc-bus current-line" />
                <circle cx="3230" cy="1420" r="10" className="current-particle">
                  <animate attributeName="cx" from="3230" to="3500" dur="1s" begin="3.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1s" begin="3.4s" repeatCount="indefinite" />
                </circle>
                <line x1="3230" y1="1470" x2="3500" y2="1470" className="dc-bus current-line" />
                <circle cx="3500" cy="1470" r="10" className="current-particle">
                  <animate attributeName="cx" from="3500" to="3230" dur="1s" begin="3.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="1s" begin="3.6s" repeatCount="indefinite" />
                </circle>
                <line x1="3660" y1="1520" x2="3660" y2="1620" className="power-line current-line" />
                <circle cx="3660" cy="1520" r="10" className="current-particle">
                  <animate attributeName="cy" from="1520" to="1620" dur="0.8s" begin="3.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="0.8s" begin="3.8s" repeatCount="indefinite" />
                </circle>
                <text x="3240" y="1405" className="dc-label-xlarge">DC+</text>
                <text x="3240" y="1495" className="dc-label-xlarge">DC-</text>
                <text x="3520" y="1445" className="voltage-label-xlarge">1000 V DC</text>

                <circle cx="3250" cy="1420" r="8" className="dc-point" />
                <text x="3170" y="1415" className="breaker-label-xlarge">QF1 A</text>
                <circle cx="3250" cy="1470" r="8" className="dc-point" />
                <text x="3170" y="1465" className="breaker-label-xlarge">QF2 25 A</text>
              </g>

              {/* Control Cabinets ШУЛ 1, ШУЛ 2, ШУР */}
              <g className="control-cabinets">
                <rect x="3170" y="1720" width="280" height="450" className="cabinet-box" />
                <text x="3310" y="1790" className="cabinet-label-xlarge">ШУЛ 1</text>
                <rect x="3220" y="1870" width="180" height="80" className="switch-box" />
                <text x="3310" y="1915" className="switch-label-xlarge">Q5</text>
                <rect x="3220" y="2000" width="180" height="80" className="frequency-converter-box" />
                <text x="3310" y="2045" className="fc-label-xlarge">ПЧ 3</text>
                <text x="3310" y="2085" className="fc-symbol-xlarge">f</text>
                {/* Connection from ШУЛ 1 to busbar */}
                <line x1="3310" y1="1720" x2="3310" y2="1620" className="power-line current-line" />
                <circle cx="3310" cy="1720" r="10" className="current-particle">
                  <animate attributeName="cy" from="1720" to="1620" dur="0.6s" begin="4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="0.6s" begin="4s" repeatCount="indefinite" />
                </circle>

                <rect x="3520" y="1720" width="280" height="450" className="cabinet-box" />
                <text x="3660" y="1790" className="cabinet-label-xlarge">ШУЛ 2</text>
                <rect x="3570" y="1870" width="180" height="80" className="switch-box" />
                <text x="3660" y="1915" className="switch-label-xlarge">Q5</text>
                <rect x="3570" y="2000" width="180" height="80" className="frequency-converter-box" />
                <text x="3660" y="2045" className="fc-label-xlarge">ПЧ 4</text>
                <text x="3660" y="2085" className="fc-symbol-xlarge">f</text>
                {/* Connection from ШУЛ 2 to busbar */}
                <line x1="3660" y1="1720" x2="3660" y2="1620" className="power-line current-line" />
                <circle cx="3660" cy="1720" r="10" className="current-particle">
                  <animate attributeName="cy" from="1720" to="1620" dur="0.6s" begin="4.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="0.6s" begin="4.2s" repeatCount="indefinite" />
                </circle>

                <rect x="3870" y="1720" width="280" height="450" className="cabinet-box" />
                <text x="4010" y="1790" className="cabinet-label-xlarge">ШУР</text>
                <rect x="3920" y="1870" width="180" height="80" className="switch-box" />
                <text x="4010" y="1915" className="switch-label-xlarge">Q5</text>
                <rect x="3920" y="2000" width="180" height="80" className="frequency-converter-box" />
                <text x="4010" y="2045" className="fc-label-xlarge">ПЧ 4</text>
                <text x="4010" y="2085" className="fc-symbol-xlarge">f</text>
                {/* Connection from ШУР to busbar */}
                <line x1="4010" y1="1720" x2="4010" y2="1620" className="power-line current-line" />
                <circle cx="4010" cy="1720" r="10" className="current-particle">
                  <animate attributeName="cy" from="1720" to="1620" dur="0.6s" begin="4.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.15;0.85;1" dur="0.6s" begin="4.4s" repeatCount="indefinite" />
                </circle>
              </g>

              {/* Power Lines from Cabinets to Motors */}
              <line x1="3310" y1="2170" x2="3310" y2="2380" className="power-line current-line" />
              <circle cx="3310" cy="2170" r="10" className="current-particle">
                <animate attributeName="cy" from="2170" to="2380" dur="0.7s" begin="4.6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="0.7s" begin="4.6s" repeatCount="indefinite" />
              </circle>
              <line x1="3660" y1="2170" x2="3660" y2="2380" className="power-line current-line" />
              <circle cx="3660" cy="2170" r="10" className="current-particle">
                <animate attributeName="cy" from="2170" to="2380" dur="0.7s" begin="4.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="0.7s" begin="4.8s" repeatCount="indefinite" />
              </circle>
              <line x1="4010" y1="2170" x2="4010" y2="2380" className="power-line current-line" />
              <circle cx="4010" cy="2170" r="10" className="current-particle">
                <animate attributeName="cy" from="2170" to="2380" dur="0.7s" begin="5s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.1;0.9;1" dur="0.7s" begin="5s" repeatCount="indefinite" />
              </circle>
            </g>

            {/* Motors МЛ 1, МЛ 2, МР - вынесены за пределы области КТУ 2 */}
            <g className="motors">
              <circle cx="3310" cy="2470" r="90" className="motor-circle motor-ml1" />
              <text x="3310" y="2490" className="motor-label-xlarge motor-label-ml1">МЛ 1</text>

              <circle cx="3660" cy="2470" r="90" className="motor-circle motor-ml2" />
              <text x="3660" y="2490" className="motor-label-xlarge motor-label-ml2">МЛ 2</text>

              <circle cx="4010" cy="2470" r="90" className="motor-circle motor-mr" />
              <text x="4010" y="2490" className="motor-label-xlarge motor-label-mr">МР</text>
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

import { ArrowUpRight } from 'lucide-react';
import { useCalc } from '../context/CalcContext';

function uColor(u: number) {
  if (u < 0.2) return '#3B82F6';   // blue = well insulated
  if (u <= 0.35) return '#F59E0B'; // amber = average
  return '#EF4444';                 // red = poor
}

function uFill(u: number) {
  if (u < 0.2) return '#EFF6FF';
  if (u <= 0.35) return '#FEF3C7';
  return '#FEE2E2';
}

export function HouseCrossSection() {
  const { params } = useCalc();

  const wallU = params?.wallU ?? 0.28;
  const roofU = params?.roofU ?? 0.20;
  const floorU = params?.floorU ?? 0.18;

  return (
    <div className="relative w-full aspect-square max-w-lg mx-auto">
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Roof */}
        <path
          d="M250 80 L400 160 L400 180 L350 210 L200 130 L50 210 L50 180 L200 100 Z"
          fill={uFill(roofU)}
          stroke="#0A4D5C"
          strokeWidth="2"
        />

        {/* Roof Ridge */}
        <line x1="250" y1="80" x2="250" y2="100" stroke="#0A4D5C" strokeWidth="2"/>

        {/* Front Wall */}
        <path
          d="M200 130 L350 210 L350 380 L200 300 Z"
          fill={uFill(wallU)}
          stroke="#0A4D5C"
          strokeWidth="2"
        />

        {/* Side Wall */}
        <path
          d="M50 210 L200 130 L200 300 L50 380 Z"
          fill={uFill(wallU)}
          stroke="#0A4D5C"
          strokeWidth="2"
        />

        {/* Floor */}
        <path
          d="M50 380 L200 300 L350 380 L200 460 Z"
          fill={uFill(floorU)}
          stroke="#0A4D5C"
          strokeWidth="2"
        />

        {/* Windows on Front Wall */}
        <rect x="230" y="220" width="40" height="35" fill="#FFFFFF" stroke="#0A4D5C" strokeWidth="1.5"/>
        <rect x="290" y="245" width="40" height="35" fill="#FFFFFF" stroke="#0A4D5C" strokeWidth="1.5"/>

        {/* Window on Side Wall */}
        <rect x="90" y="260" width="35" height="30" fill="#FFFFFF" stroke="#0A4D5C" strokeWidth="1.5"/>

        {/* Door on Front Wall */}
        <rect x="230" y="290" width="35" height="60" fill="#0A4D5C" rx="1"/>
        <circle cx="258" cy="320" r="2" fill="#4ECDC4"/>

        {/* U-value Labels */}
        <text x="270" y="150" fill={uColor(roofU)} fontSize="13" fontWeight="600">
          Roof · U={roofU.toFixed(2)}
        </text>
        <text x="235" y="265" fill={uColor(wallU)} fontSize="13" fontWeight="600">
          Walls · U={wallU.toFixed(2)}
        </text>
        <text x="170" y="425" fill={uColor(floorU)} fontSize="13" fontWeight="600">
          Floor · U={floorU.toFixed(2)}
        </text>
      </svg>

      {/* Animated Heat Loss Arrows */}
      <div className="absolute top-[15%] left-[35%] animate-pulse">
        <ArrowUpRight size={24} style={{ color: uColor(roofU) }} className="opacity-70" />
      </div>
      <div className="absolute top-[18%] right-[28%] animate-pulse" style={{ animationDelay: '0.5s' }}>
        <ArrowUpRight size={24} style={{ color: uColor(roofU) }} className="opacity-70" />
      </div>

      <div className="absolute top-[38%] left-[18%] animate-pulse" style={{ animationDelay: '0.3s' }}>
        <ArrowUpRight size={24} style={{ color: uColor(wallU) }} className="opacity-70" />
      </div>
      <div className="absolute top-[42%] right-[22%] animate-pulse" style={{ animationDelay: '0.7s' }}>
        <ArrowUpRight size={24} style={{ color: uColor(wallU) }} className="opacity-70" />
      </div>

      <div className="absolute bottom-[18%] left-[28%] animate-pulse" style={{ animationDelay: '0.4s' }}>
        <ArrowUpRight size={20} style={{ color: uColor(floorU) }} className="opacity-70" />
      </div>
      <div className="absolute bottom-[20%] right-[32%] animate-pulse" style={{ animationDelay: '0.8s' }}>
        <ArrowUpRight size={20} style={{ color: uColor(floorU) }} className="opacity-70" />
      </div>
    </div>
  );
}

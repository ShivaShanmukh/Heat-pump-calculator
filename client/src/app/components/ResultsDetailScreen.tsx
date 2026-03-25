import { useNavigate } from 'react-router';
import { HouseCrossSection } from './HouseCrossSection';
import { HeatLossBar } from './HeatLossBar';
import { ArrowRight, AlertCircle } from 'lucide-react';
import { useCalc } from '../context/CalcContext';

function uColor(u: number): 'blue' | 'amber' | 'red' {
  if (u < 0.2) return 'blue';
  if (u <= 0.35) return 'amber';
  return 'red';
}

export function ResultsDetailScreen() {
  const navigate = useNavigate();
  const { params } = useCalc();

  if (!params) {
    return (
      <div className="w-full max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
          <AlertCircle size={48} className="text-[#4ECDC4]" />
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">No results yet</h2>
            <p className="text-[#6B7280]">Complete the assessment first.</p>
          </div>
          <button onClick={() => navigate('/chat')} className="bg-[#4ECDC4] hover:bg-[#3EBDB5] text-[#0A4D5C] font-semibold px-8 py-3 rounded-xl transition-colors">
            Start assessment
          </button>
        </div>
      </div>
    );
  }

  const wallUA = params.wallArea * params.wallU;
  const roofUA = params.roofArea * params.roofU;
  const floorUA = params.floorArea * params.floorU;
  const totalUA = wallUA + roofUA + floorUA;

  const wallPct = parseFloat(((wallUA / totalUA) * 100).toFixed(1));
  const roofPct = parseFloat(((roofUA / totalUA) * 100).toFixed(1));
  const floorPct = parseFloat(((floorUA / totalUA) * 100).toFixed(1));

  const heatLossData = [
    {
      label: 'Walls',
      percentage: wallPct,
      value: `UA = ${wallUA.toFixed(0)} W/K`,
      color: uColor(params.wallU),
    },
    {
      label: 'Roof',
      percentage: roofPct,
      value: `UA = ${roofUA.toFixed(0)} W/K`,
      color: uColor(params.roofU),
    },
    {
      label: 'Floor',
      percentage: floorPct,
      value: `UA = ${floorUA.toFixed(0)} W/K`,
      color: uColor(params.floorU),
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-6">
      {/* Section Title */}
      <div className="mb-12 space-y-2">
        <h1 className="text-[22px] font-bold text-[#1A1A1A]">
          Where is your home losing heat?
        </h1>
        <p className="text-[#6B7280]">
          Based on your building envelope — click any surface to explore
        </p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

        {/* Left Column - Illustration */}
        <div className="flex items-center justify-center">
          <HouseCrossSection />
        </div>

        {/* Right Column - Data Breakdown */}
        <div className="space-y-8">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            Heat loss breakdown
          </h2>

          <div className="space-y-6">
            {heatLossData.map((data, index) => (
              <HeatLossBar key={index} {...data} />
            ))}
          </div>

          {/* Summary Card */}
          <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-6 space-y-3">
            <div className="text-sm text-[#166534] font-medium">
              Total heat loss coefficient
            </div>
            <div className="text-[32px] font-bold text-[#0A4D5C]">
              {totalUA.toFixed(0)} W/K
            </div>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Lower is better — well insulated homes are typically under 200 W/K
            </p>
          </div>

          {/* Color Legend */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <div className="text-sm font-semibold text-[#1A1A1A] mb-3">
              Insulation rating
            </div>
            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
              <span className="w-4 h-4 rounded-full bg-[#3B82F6]"></span>
              <span>Blue = well insulated (U &lt; 0.20)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
              <span className="w-4 h-4 rounded-full bg-[#F59E0B]"></span>
              <span>Amber = average (U 0.20–0.35)</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#6B7280]">
              <span className="w-4 h-4 rounded-full bg-[#EF4444]"></span>
              <span>Red = poor insulation (U &gt; 0.35)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center gap-4 mt-12">
        <button
          onClick={() => navigate('/results')}
          className="bg-white hover:bg-gray-50 text-[#0A4D5C] font-semibold px-8 py-4 rounded-xl transition-colors border-2 border-gray-200"
        >
          ← Back to results
        </button>
        <button
          onClick={() => navigate('/results/climate')}
          className="bg-[#4ECDC4] hover:bg-[#3EBDB5] text-[#0A4D5C] font-semibold px-8 py-4 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          View climate projections
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

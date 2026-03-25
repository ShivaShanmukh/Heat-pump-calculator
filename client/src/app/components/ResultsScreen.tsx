import { useNavigate } from 'react-router';
import { ScenarioCard } from './ScenarioCard';
import { CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react';
import { useCalc } from '../context/CalcContext';

function fmt(n: number) {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 });
}

export function ResultsScreen() {
  const navigate = useNavigate();
  const { scenarios, params, summary } = useCalc();

  // Fallback if user lands here directly without going through chat
  if (!scenarios || !params) {
    return (
      <div className="w-full max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 text-center">
          <AlertCircle size={48} className="text-[#4ECDC4]" />
          <div>
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">No results yet</h2>
            <p className="text-[#6B7280]">Start the assessment to get your heat pump recommendation.</p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="bg-[#4ECDC4] hover:bg-[#3EBDB5] text-[#0A4D5C] font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Start assessment
          </button>
        </div>
      </div>
    );
  }

  const { undersized, optimal, oversized, undersizedSize, oversizedSize } = scenarios;
  const ep = params.electricityPrice || 28.6;

  const scenarioCards = [
    {
      type: 'undersized' as const,
      label: 'UNDERSIZED',
      size: `${undersizedSize.toFixed(1)} kW`,
      coldHours: undersized.hoursExceedingCapacity,
      annualCost: `£${fmt(undersized.annualCostPounds)}/yr`,
      electricalEnergy: `${fmt(undersized.electricalEnergy)} kWh`,
      comfortBadge: undersized.hoursExceedingCapacity > 200 ? 'Uncomfortable' : 'Slightly cool',
      note: `Saves on upfront cost but ${undersized.hoursExceedingCapacity} hrs/yr below setpoint`,
    },
    {
      type: 'recommended' as const,
      label: 'OPTIMAL',
      size: `${optimal.recommendedSize.toFixed(1)} kW`,
      coldHours: optimal.hoursExceedingCapacity,
      annualCost: `£${fmt(optimal.annualCostPounds)}/yr`,
      electricalEnergy: `${fmt(optimal.electricalEnergy)} kWh`,
      comfortBadge: 'Comfortable',
      note: 'Best balance of upfront cost and year-round comfort',
    },
    {
      type: 'oversized' as const,
      label: 'OVERSIZED',
      size: `${oversizedSize.toFixed(1)} kW`,
      coldHours: oversized.hoursExceedingCapacity,
      annualCost: `£${fmt(oversized.annualCostPounds)}/yr`,
      electricalEnergy: `${fmt(oversized.electricalEnergy)} kWh`,
      comfortBadge: 'Maximum Comfort',
      note: 'Higher upfront cost, marginal efficiency gains',
    },
  ];

  const locationStr = `${Math.abs(params.latitude).toFixed(1)}°${params.latitude >= 0 ? 'N' : 'S'}, ${Math.abs(params.longitude).toFixed(1)}°${params.longitude >= 0 ? 'E' : 'W'}`;

  return (
    <div className="w-full max-w-7xl mx-auto px-6">
      {/* Title Area */}
      <div className="mb-12 space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-[28px] font-bold text-[#1A1A1A]">
            Your Heat Pump Recommendation
          </h1>
          <span className="inline-flex items-center gap-1.5 bg-[#E3F5F3] text-[#0A4D5C] px-3 py-1 rounded-full text-xs font-medium">
            <CheckCircle2 size={14} />
            Calculation complete
          </span>
        </div>

        <p className="text-[#6B7280] text-base">
          {summary || `Based on your property · ${locationStr} · ${ep}p/kWh electricity`}
        </p>
      </div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {scenarioCards.map((scenario, index) => (
          <ScenarioCard key={index} {...scenario} />
        ))}
      </div>

      {/* CTA Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate('/results/detail')}
          className="bg-white hover:bg-gray-50 text-[#0A4D5C] font-semibold px-8 py-4 rounded-xl transition-colors border-2 border-[#4ECDC4]"
        >
          View heat loss breakdown
        </button>
        <button
          onClick={() => navigate('/results/climate')}
          className="bg-[#4ECDC4] hover:bg-[#3EBDB5] text-[#0A4D5C] font-semibold px-8 py-4 rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          See climate projections
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

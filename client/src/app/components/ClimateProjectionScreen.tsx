import { useState } from 'react';
import { useNavigate } from 'react-router';
import { YearSelector } from './YearSelector';
import { MetricCard } from './MetricCard';
import { HeatingDemandChart } from './HeatingDemandChart';
import { Leaf, ArrowRight, AlertCircle } from 'lucide-react';
import { useCalc } from '../context/CalcContext';

// IPCC RCP4.5 warming deltas for UK (°C warmer than today)
// Warmer winters → fewer heating degree days → roughly linear reduction in demand
const CLIMATE_DELTAS: Record<string, number> = {
  'Today': 0,
  '2030': 0.6,
  '2040': 1.2,
  '2050': 1.8,
};

// Approximate demand reduction per °C of warming (UK climate sensitivity ~6% per °C)
const DEMAND_REDUCTION_PER_DEGREE = 0.06;

function fmt(n: number) {
  return n.toLocaleString('en-GB', { maximumFractionDigits: 0 });
}

export function ClimateProjectionScreen() {
  const navigate = useNavigate();
  const { scenarios } = useCalc();
  const [selectedYear, setSelectedYear] = useState('Today');

  if (!scenarios) {
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

  const base = scenarios.optimal;
  const delta = CLIMATE_DELTAS[selectedYear];
  const reductionFactor = 1 - delta * DEMAND_REDUCTION_PER_DEGREE;

  const adjustedHeatEnergy = base.totalHeatEnergy * reductionFactor;
  const adjustedCost = base.annualCostPounds * reductionFactor;
  // Peak load and recommended size reduce more slowly than annual totals
  const adjustedSize = Math.max(1.0, Math.round(base.recommendedSize * (1 - delta * 0.03) * 2) / 2);
  const adjustedColdHours = Math.round(base.hoursExceedingCapacity * (1 - delta * DEMAND_REDUCTION_PER_DEGREE * 1.5));

  const currentMetrics = {
    heatEnergy: `${fmt(adjustedHeatEnergy)} kWh`,
    pumpSize: `${adjustedSize.toFixed(1)} kW`,
    runningCost: `£${fmt(adjustedCost)} / yr`,
    coldHours: `${Math.max(0, adjustedColdHours)} hrs`,
  };

  const demandReductionPct = Math.round(delta * DEMAND_REDUCTION_PER_DEGREE * 100);

  return (
    <div className="w-full max-w-7xl mx-auto px-6">
      {/* Section Title */}
      <div className="mb-8 space-y-2">
        <h1 className="text-[22px] font-bold text-[#1A1A1A]">
          Size for your pump's lifetime, not just this winter
        </h1>
        <p className="text-base text-[#6B7280]">
          Your heat pump will run for 15–20 years. See how demand changes as the climate warms.
        </p>
      </div>

      {/* Year Selector */}
      <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

        {/* Left Column - Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <MetricCard
            label="Annual heat energy needed"
            value={currentMetrics.heatEnergy}
          />
          <MetricCard
            label="Recommended pump size"
            value={currentMetrics.pumpSize}
            highlight={true}
          />
          <MetricCard
            label="Annual running cost"
            value={currentMetrics.runningCost}
          />
          <MetricCard
            label="Cold hours / year"
            value={currentMetrics.coldHours}
          />
        </div>

        {/* Right Column - Chart */}
        <div>
          <HeatingDemandChart monthlyHeatToday={base.monthlyHeat} />
        </div>
      </div>

      {/* Insight Banner */}
      <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 mt-1">
            <Leaf className="text-[#166534]" size={24} />
          </div>
          <div className="flex-1">
            {selectedYear === 'Today' ? (
              <p className="text-[#166534] leading-relaxed">
                <strong>Today's baseline:</strong> {fmt(base.totalHeatEnergy)} kWh/year with {base.hoursExceedingCapacity} cold hours. Use the year selector above to see how warming changes your needs.
              </p>
            ) : (
              <p className="text-[#166534] leading-relaxed">
                <strong>By {selectedYear}, your annual heating demand is projected to fall by ~{demandReductionPct}%.</strong> A correctly sized pump today ({base.recommendedSize.toFixed(1)} kW) will still perform well through 2050.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex justify-center gap-4">
        <button
          onClick={() => navigate('/results/detail')}
          className="bg-white hover:bg-gray-50 text-[#0A4D5C] font-semibold px-8 py-4 rounded-xl transition-colors border-2 border-gray-200"
        >
          ← View heat loss details
        </button>
        <button className="bg-[#0A4D5C] hover:bg-[#083A47] text-white font-semibold px-8 py-4 rounded-xl transition-colors flex items-center gap-2 shadow-sm">
          Get a quote based on {selectedYear === 'Today' ? 'today' : selectedYear} sizing
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}

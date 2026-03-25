interface ScenarioCardProps {
  type: 'undersized' | 'recommended' | 'oversized';
  label: string;
  size: string;
  coldHours: number;
  annualCost: string;
  electricalEnergy: string;
  comfortBadge: string;
  note: string;
}

export function ScenarioCard({
  type,
  label,
  size,
  coldHours,
  annualCost,
  electricalEnergy,
  comfortBadge,
  note
}: ScenarioCardProps) {
  const borderColors = {
    undersized: 'border-t-[#EF4444]',
    recommended: 'border-t-[#0A4D5C]',
    oversized: 'border-t-[#3B82F6]'
  };

  const labelColors = {
    undersized: 'text-[#EF4444]',
    recommended: 'text-[#0A4D5C]',
    oversized: 'text-[#3B82F6]'
  };

  const badgeColors = {
    undersized: 'bg-[#EF4444] text-white',
    recommended: 'bg-[#0A4D5C] text-white',
    oversized: 'bg-[#3B82F6] text-white'
  };

  const coldHoursColor = coldHours > 100 ? 'text-[#EF4444]' : 'text-[#10B981]';

  const cardShadow = type === 'recommended' 
    ? 'shadow-lg scale-105' 
    : 'shadow-sm';

  return (
    <div className="relative">
      {/* Floating Badge for Recommended */}
      {type === 'recommended' && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-[#0A4D5C] text-white px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
            Recommended
          </span>
        </div>
      )}

      <div 
        className={`bg-white rounded-xl ${cardShadow} border-t-4 ${borderColors[type]} overflow-hidden transition-all ${
          type === 'recommended' ? 'mt-3' : ''
        }`}
      >
        {/* Card Content */}
        <div className="p-6 space-y-4">
          {/* Label */}
          <div className={`text-xs font-bold tracking-wider uppercase ${labelColors[type]}`}>
            {label}
          </div>

          {/* Size */}
          <div className={`text-[32px] font-bold ${type === 'recommended' ? 'text-[#0A4D5C]' : 'text-[#1A1A1A]'}`}>
            {size}
          </div>

          {/* Data Rows */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-[#6B7280]">Cold hours/year</span>
              <span className={`text-sm font-semibold ${coldHoursColor}`}>
                {coldHours} hrs
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-[#6B7280]">Annual running cost</span>
              <span className="text-sm font-semibold text-[#1A1A1A]">
                {annualCost}
              </span>
            </div>

            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-[#6B7280]">Electrical energy</span>
              <span className="text-sm font-semibold text-[#1A1A1A]">
                {electricalEnergy}
              </span>
            </div>
          </div>

          {/* Comfort Badge */}
          <div className="pt-2">
            <span className={`inline-block ${badgeColors[type]} px-4 py-2 rounded-full text-sm font-medium`}>
              {comfortBadge}
            </span>
          </div>

          {/* Note */}
          <div className="pt-2">
            <p className="text-xs text-[#6B7280] italic">
              {note}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

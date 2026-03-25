interface HeatLossBarProps {
  label: string;
  percentage: number;
  value: string;
  color: 'red' | 'amber' | 'blue';
}

export function HeatLossBar({ label, percentage, value, color }: HeatLossBarProps) {
  const colorClasses = {
    red: 'bg-[#FEE2E2]',
    amber: 'bg-[#FEF3C7]',
    blue: 'bg-[#EFF6FF]'
  };

  const fillClasses = {
    red: 'bg-[#EF4444]',
    amber: 'bg-[#F59E0B]',
    blue: 'bg-[#3B82F6]'
  };

  return (
    <div className="space-y-2">
      {/* Label and Value */}
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-semibold text-[#1A1A1A]">
          {label} · {percentage}%
        </span>
        <span className="text-sm text-[#6B7280]">
          {value}
        </span>
      </div>

      {/* Progress Bar */}
      <div className={`w-full h-8 ${colorClasses[color]} rounded-lg overflow-hidden`}>
        <div 
          className={`h-full ${fillClasses[color]} transition-all duration-1000 ease-out rounded-lg`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

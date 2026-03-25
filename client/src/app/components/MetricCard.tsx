interface MetricCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export function MetricCard({ label, value, highlight = false }: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm space-y-3">
      <div className="text-xs text-[#6B7280] uppercase tracking-wide font-medium">
        {label}
      </div>
      <div className={`text-[32px] font-bold ${highlight ? 'text-[#0A4D5C]' : 'text-[#1A1A1A]'}`}>
        {value}
      </div>
    </div>
  );
}

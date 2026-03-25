import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// IPCC RCP4.5 demand reduction factors per month index (wintermonths reduce more)
const REDUCTION_2040 = 0.12;
const REDUCTION_2050 = 0.18;

interface HeatingDemandChartProps {
  monthlyHeatToday: number[];
}

export function HeatingDemandChart({ monthlyHeatToday }: HeatingDemandChartProps) {
  const data = MONTH_LABELS.map((month, i) => ({
    month,
    today: Math.round(monthlyHeatToday[i]),
    y2040: Math.round(monthlyHeatToday[i] * (1 - REDUCTION_2040)),
    y2050: Math.round(monthlyHeatToday[i] * (1 - REDUCTION_2050)),
  }));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <h3 className="text-base font-semibold text-[#1A1A1A] mb-6">
        Monthly heating demand by climate scenario
      </h3>

      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="month"
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            label={{ value: 'kWh', angle: -90, position: 'insideLeft', style: { fontSize: '12px', fill: '#6B7280' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              fontSize: '12px',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="today"
            stroke="#374151"
            strokeWidth={2.5}
            name="Today"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="y2040"
            stroke="#F59E0B"
            strokeWidth={2.5}
            name="2040"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="y2050"
            stroke="#10B981"
            strokeWidth={2.5}
            name="2050"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

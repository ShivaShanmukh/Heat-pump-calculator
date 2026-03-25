import { createContext, useContext, useState, ReactNode } from 'react';

export interface CalcParams {
  wallArea: number;
  wallU: number;
  roofArea: number;
  roofU: number;
  floorArea: number;
  floorU: number;
  latitude: number;
  longitude: number;
  flowTemp: number;
  maxOutput: number;
  baseTemp: number;
  indoorTemp: number;
  electricityPrice: number;
  thresholdHours: number;
}

export interface CalcResult {
  totalHeatEnergy: number;
  electricalEnergy: number;
  averageCoP: number;
  peakHeatLoad: number;
  hoursExceedingCapacity: number;
  recommendedSize: number;
  monthlyHeat: number[];
  monthlyElectrical: number[];
  monthNames: string[];
  hourlyResults: HourlyEntry[];
  thresholdHours: number;
  annualCostPounds: number;
  electricityPricePennies: number;
}

export interface HourlyEntry {
  month: number;
  day: number;
  hour: number;
  outdoorTemp: number;
  heatLoss: number;
  electricalUse: number;
  cop: number;
  indoorTempActual: number;
  actualHeatDelivered: number;
}

export interface Scenarios {
  undersized: CalcResult;
  optimal: CalcResult;
  oversized: CalcResult;
  undersizedSize: number;
  oversizedSize: number;
}

interface CalcContextValue {
  params: CalcParams | null;
  setParams: (p: CalcParams) => void;
  scenarios: Scenarios | null;
  setScenarios: (s: Scenarios) => void;
  summary: string;
  setSummary: (s: string) => void;
}

const CalcContext = createContext<CalcContextValue | null>(null);

export function CalcProvider({ children }: { children: ReactNode }) {
  const [params, setParams] = useState<CalcParams | null>(null);
  const [scenarios, setScenarios] = useState<Scenarios | null>(null);
  const [summary, setSummary] = useState('');

  return (
    <CalcContext.Provider value={{ params, setParams, scenarios, setScenarios, summary, setSummary }}>
      {children}
    </CalcContext.Provider>
  );
}

export function useCalc() {
  const ctx = useContext(CalcContext);
  if (!ctx) throw new Error('useCalc must be used inside CalcProvider');
  return ctx;
}

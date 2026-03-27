import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ChatBubble } from './ChatBubble';
import { Send } from 'lucide-react';
import { useCalc, CalcParams, CalcResult, Scenarios } from '../context/CalcContext';

interface Message {
  type: 'assistant' | 'user';
  text: string;
}

async function runCalculate(params: CalcParams, maxOutput: number): Promise<CalcResult> {
  const body = { ...params, maxOutput };
  const res = await fetch('/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

function roundHalf(n: number) {
  return Math.round(n * 2) / 2;
}

async function runAllScenarios(params: CalcParams, setStatus: (s: string) => void): Promise<Scenarios> {
  setStatus('calculating');
  const optimal = await runCalculate(params, params.maxOutput);
  const recommendedSize = optimal.recommendedSize;
  const undersizedSize = Math.max(1.0, roundHalf(recommendedSize - 2));
  const oversizedSize = roundHalf(recommendedSize + 3);
  const [undersized, oversized] = await Promise.all([
    runCalculate(params, undersizedSize),
    runCalculate(params, oversizedSize),
  ]);
  return { undersized, optimal, oversized, undersizedSize, oversizedSize };
}

// ─── Expert Mode Form ─────────────────────────────────────────────────────────
function ExpertForm() {
  const navigate = useNavigate();
  const { setParams, setScenarios, setSummary } = useCalc();
  const [status, setStatus] = useState<'idle' | 'calculating'>('idle');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    wallArea: '120', wallU: '0.28',
    roofArea: '80',  roofU: '0.20',
    floorArea: '80', floorU: '0.18',
    latitude: '51.5074', longitude: '-0.1278',
    flowTemp: '45', maxOutput: '8',
    baseTemp: '14', indoorTemp: '20',
    electricityPrice: '28.6', thresholdHours: '24',
  });

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const params: CalcParams = {
      wallArea: +form.wallArea, wallU: +form.wallU,
      roofArea: +form.roofArea, roofU: +form.roofU,
      floorArea: +form.floorArea, floorU: +form.floorU,
      latitude: +form.latitude, longitude: +form.longitude,
      flowTemp: +form.flowTemp, maxOutput: +form.maxOutput,
      baseTemp: +form.baseTemp, indoorTemp: +form.indoorTemp,
      electricityPrice: +form.electricityPrice,
      thresholdHours: +form.thresholdHours,
    };
    try {
      setParams(params);
      setSummary(`${form.latitude}°N, ${form.longitude}°E · ${form.electricityPrice}p/kWh`);
      const scenarios = await runAllScenarios(params, s => setStatus(s as 'idle' | 'calculating'));
      setScenarios(scenarios);
      navigate('/results');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Calculation failed');
      setStatus('idle');
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#4ECDC4] focus:border-transparent';
  const labelCls = 'block text-xs text-[#6B7280] font-medium mb-1';

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">

      {/* Building Envelope */}
      <div>
        <h3 className="text-sm font-semibold text-[#0A4D5C] mb-3 pb-2 border-b border-gray-100">Building Envelope</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Walls</p>
            <label className={labelCls}>Area (m²)</label>
            <input className={inputCls} type="number" value={form.wallArea} onChange={e => set('wallArea', e.target.value)} required />
            <label className={`${labelCls} mt-2`}>U-value (W/m²K)</label>
            <input className={inputCls} type="number" step="0.01" value={form.wallU} onChange={e => set('wallU', e.target.value)} required />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Roof</p>
            <label className={labelCls}>Area (m²)</label>
            <input className={inputCls} type="number" value={form.roofArea} onChange={e => set('roofArea', e.target.value)} required />
            <label className={`${labelCls} mt-2`}>U-value (W/m²K)</label>
            <input className={inputCls} type="number" step="0.01" value={form.roofU} onChange={e => set('roofU', e.target.value)} required />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">Floor</p>
            <label className={labelCls}>Area (m²)</label>
            <input className={inputCls} type="number" value={form.floorArea} onChange={e => set('floorArea', e.target.value)} required />
            <label className={`${labelCls} mt-2`}>U-value (W/m²K)</label>
            <input className={inputCls} type="number" step="0.01" value={form.floorU} onChange={e => set('floorU', e.target.value)} required />
          </div>
        </div>
      </div>

      {/* Location */}
      <div>
        <h3 className="text-sm font-semibold text-[#0A4D5C] mb-3 pb-2 border-b border-gray-100">Location</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Latitude</label>
            <input className={inputCls} type="number" step="0.0001" value={form.latitude} onChange={e => set('latitude', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Longitude</label>
            <input className={inputCls} type="number" step="0.0001" value={form.longitude} onChange={e => set('longitude', e.target.value)} required />
          </div>
        </div>
      </div>

      {/* Heat Pump & Property */}
      <div>
        <h3 className="text-sm font-semibold text-[#0A4D5C] mb-3 pb-2 border-b border-gray-100">Heat Pump & Property</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Flow Temp (°C)</label>
            <input className={inputCls} type="number" value={form.flowTemp} onChange={e => set('flowTemp', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Max Output (kW)</label>
            <input className={inputCls} type="number" step="0.5" value={form.maxOutput} onChange={e => set('maxOutput', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Indoor Temp (°C)</label>
            <input className={inputCls} type="number" value={form.indoorTemp} onChange={e => set('indoorTemp', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Base Temp (°C)</label>
            <input className={inputCls} type="number" value={form.baseTemp} onChange={e => set('baseTemp', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Electricity (p/kWh)</label>
            <input className={inputCls} type="number" step="0.1" value={form.electricityPrice} onChange={e => set('electricityPrice', e.target.value)} required />
          </div>
          <div>
            <label className={labelCls}>Max cold hours/yr</label>
            <input className={inputCls} type="number" value={form.thresholdHours} onChange={e => set('thresholdHours', e.target.value)} required />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</div>
      )}

      <button
        type="submit"
        disabled={status === 'calculating'}
        className="w-full bg-[#4ECDC4] hover:bg-[#3EBDB5] text-[#0A4D5C] font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'calculating' ? 'Calculating 3 scenarios…' : 'Calculate'}
      </button>
    </form>
  );
}

// ─── Chat Mode ────────────────────────────────────────────────────────────────
function ChatMode() {
  const navigate = useNavigate();
  const { setParams, setScenarios, setSummary } = useCalc();

  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'assistant',
      text: "Hi! Tell me about your home — where it is, roughly how old it is, and whether it has insulation. I'll handle the technical details.",
    },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);
  const [status, setStatus] = useState<'idle' | 'thinking' | 'calculating'>('idle');
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || status !== 'idle') return;

    setMessages(prev => [...prev, { type: 'user', text }]);
    setInput('');
    setError('');
    setStatus('thinking');

    const newHistory = [...history, { role: 'user', content: text }];

    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.type === 'ready') {
        const params: CalcParams = data.params;
        setParams(params);
        if (data.summary) setSummary(data.summary);
        setMessages(prev => [...prev, { type: 'assistant', text: "Great — I have everything I need. Fetching weather data and running calculations..." }]);
        setStatus('calculating');

        const optimal = await runCalculate(params, params.maxOutput);
        const recommendedSize = optimal.recommendedSize;
        const undersizedSize = Math.max(1.0, roundHalf(recommendedSize - 2));
        const oversizedSize = roundHalf(recommendedSize + 3);
        const [undersized, oversized] = await Promise.all([
          runCalculate(params, undersizedSize),
          runCalculate(params, oversizedSize),
        ]);
        setScenarios({ undersized, optimal, oversized, undersizedSize, oversizedSize });
        navigate('/results');
      } else {
        setMessages(prev => [...prev, { type: 'assistant', text: data.text }]);
        setHistory([...newHistory, { role: 'assistant', content: data.text }]);
        setStatus('idle');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('idle');
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const isWorking = status !== 'idle';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="space-y-4 mb-6 max-h-[55vh] overflow-y-auto">
        {messages.map((m, i) => <ChatBubble key={i} message={m.text} type={m.type} />)}

        {status === 'thinking' && (
          <div className="flex justify-start">
            <div className="bg-[#E3F5F3] text-[#0A4D5C] rounded-2xl rounded-tl-sm px-4 py-3 text-sm animate-pulse">Thinking…</div>
          </div>
        )}
        {status === 'calculating' && (
          <div className="space-y-2 py-2">
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-[#4ECDC4] rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
            <p className="text-sm text-[#6B7280] text-center">Fetching climate data and running 3 sizing scenarios…</p>
          </div>
        )}
        {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</div>}
        <div ref={bottomRef} />
      </div>

      <div className={`flex gap-3 items-end ${isWorking ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 focus-within:border-[#4ECDC4] focus-within:ring-1 focus-within:ring-[#4ECDC4] transition-all">
          <input
            type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Describe your home..." disabled={isWorking}
            className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <button onClick={sendMessage} disabled={isWorking || !input.trim()}
          className="bg-[#4ECDC4] text-[#0A4D5C] rounded-xl px-5 py-3 hover:bg-[#3EBDB5] transition-colors flex items-center justify-center font-medium disabled:opacity-50 disabled:cursor-not-allowed">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function ChatConversation() {
  const [expertMode, setExpertMode] = useState(false);

  return (
    <div className="w-full max-w-3xl mx-auto px-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0A4D5C]">Estimate your heat pump size in minutes</h1>
        <p className="text-sm text-[#6B7280] mt-1">Based on UK climate data and your home's insulation — no jargon needed.</p>
      </div>

      {/* Expert Mode Toggle */}
      <div className="flex justify-end items-center gap-3 mb-4">
        <span className="text-sm text-[#6B7280]">Expert Mode</span>
        <button
          type="button"
          onClick={() => setExpertMode(v => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors ${expertMode ? 'bg-[#0A4D5C]' : 'bg-gray-200'}`}
          aria-label="Toggle Expert Mode"
        >
          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${expertMode ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </div>

      {expertMode ? <ExpertForm /> : <ChatMode />}
    </div>
  );
}

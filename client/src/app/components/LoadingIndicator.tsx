export function LoadingIndicator() {
  return (
    <div className="space-y-3 mb-6">
      {/* Progress Bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-[#4ECDC4] rounded-full animate-pulse"
          style={{
            width: '60%',
            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
          }}
        />
      </div>
      
      {/* Status Text */}
      <p className="text-sm text-[#6B7280] text-center">
        Fetching weather data for London from PVGIS...
      </p>
    </div>
  );
}

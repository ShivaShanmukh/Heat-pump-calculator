export function HouseIllustration() {
  return (
    <div className="relative">
      {/* House SVG Illustration */}
      <svg 
        viewBox="0 0 400 350" 
        className="w-full h-auto"
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Roof */}
        <path 
          d="M200 50 L350 150 L350 160 L200 80 L50 160 L50 150 Z" 
          fill="#0A4D5C" 
          opacity="0.9"
        />
        
        {/* Main House Structure */}
        <rect x="50" y="150" width="300" height="180" fill="#E3F5F3" stroke="#0A4D5C" strokeWidth="2"/>
        
        {/* Floor divisions */}
        <line x1="50" y1="210" x2="350" y2="210" stroke="#0A4D5C" strokeWidth="1" strokeDasharray="4 4" opacity="0.3"/>
        <line x1="50" y1="270" x2="350" y2="270" stroke="#0A4D5C" strokeWidth="1" strokeDasharray="4 4" opacity="0.3"/>
        
        {/* Windows - Top Floor */}
        <rect x="90" y="170" width="50" height="30" fill="#FFFFFF" stroke="#0A4D5C" strokeWidth="2"/>
        <rect x="175" y="170" width="50" height="30" fill="#FFFFFF" stroke="#0A4D5C" strokeWidth="2"/>
        <rect x="260" y="170" width="50" height="30" fill="#FFFFFF" stroke="#0A4D5C" strokeWidth="2"/>
        
        {/* Windows - Middle Floor */}
        <rect x="90" y="230" width="50" height="30" fill="#FFFFFF" stroke="#0A4D5C" strokeWidth="2"/>
        <rect x="260" y="230" width="50" height="30" fill="#FFFFFF" stroke="#0A4D5C" strokeWidth="2"/>
        
        {/* Door */}
        <rect x="175" y="280" width="50" height="50" fill="#0A4D5C" rx="2"/>
        <circle cx="215" cy="305" r="3" fill="#4ECDC4"/>
        
        {/* Foundation */}
        <rect x="40" y="330" width="320" height="10" fill="#9CA3AF"/>
      </svg>

      {/* Stat Pills */}
      <div className="absolute top-8 -right-4 bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-amber-200">
        Walls · 35% heat loss
      </div>
      
      <div className="absolute top-24 -right-8 bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-orange-200">
        Roof · 28% heat loss
      </div>
      
      <div className="absolute bottom-20 -right-6 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border border-blue-200">
        Floor · 12% heat loss
      </div>
    </div>
  );
}
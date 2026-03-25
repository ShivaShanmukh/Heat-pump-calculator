import { Link, useLocation } from 'react-router';

export function Navigation() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="bg-[#F4D03F] border-b border-[#E8C430]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold text-[#0A4D5C]">
              Midsummer Energy
            </div>
            <span className="text-sm text-[#0A4D5C] opacity-75">— Heat Advisor</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            <Link 
              to="/" 
              className="text-sm font-medium text-[#0A4D5C] hover:text-[#083A47] transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/chat" 
              className="text-sm font-medium text-[#0A4D5C] hover:text-[#083A47] transition-colors"
            >
              Start Assessment
            </Link>
            {!isHome && (
              <>
                <Link 
                  to="/results" 
                  className="text-sm font-medium text-[#0A4D5C] hover:text-[#083A47] transition-colors"
                >
                  Results
                </Link>
                <Link 
                  to="/results/detail" 
                  className="text-sm font-medium text-[#0A4D5C] hover:text-[#083A47] transition-colors"
                >
                  Heat Loss
                </Link>
                <Link 
                  to="/results/climate" 
                  className="text-sm font-medium text-[#0A4D5C] hover:text-[#083A47] transition-colors"
                >
                  Climate
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
import { useNavigate } from 'react-router';
import { ChatInterface } from './ChatInterface';
import { HouseIllustration } from './HouseIllustration';
import { ArrowRight } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();

  const handleStartChat = () => {
    navigate('/chat');
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-200px)]">
        
        {/* Left Column - Chat Interface */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-[#0A4D5C]">
              Find the right heat pump for your home
            </h1>
            <p className="text-lg text-[#6B7280]">
              Just describe your home in plain English. Our AI assistant will calculate the perfect heat pump size for your needs.
            </p>
          </div>
          
          <div onClick={handleStartChat} className="cursor-pointer">
            <ChatInterface />
          </div>

          <button 
            onClick={handleStartChat}
            className="w-full bg-[#4ECDC4] hover:bg-[#3EBDB5] text-[#0A4D5C] font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            Start your assessment
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Right Column - House Illustration */}
        <div className="flex items-center justify-center">
          <HouseIllustration />
        </div>
      </div>
    </div>
  );
}

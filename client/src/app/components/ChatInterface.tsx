import { Send } from 'lucide-react';

export function ChatInterface() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Assistant Message */}
      <div className="mb-6">
        <div className="bg-[#E3F5F3] rounded-2xl rounded-tl-sm p-4 max-w-[85%]">
          <p className="text-[#0A4D5C] text-sm leading-relaxed">
            Hi! Tell me about your home — where it is, roughly how old it is, 
            and whether it has insulation. I'll handle the technical details.
          </p>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex gap-3 items-end">
        <div className="flex-1 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200 focus-within:border-[#4ECDC4] focus-within:ring-1 focus-within:ring-[#4ECDC4] transition-all">
          <input 
            type="text"
            placeholder="Describe your home..."
            className="w-full bg-transparent outline-none text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>
        <button className="bg-[#4ECDC4] text-[#0A4D5C] rounded-xl px-5 py-3 hover:bg-[#3EBDB5] transition-colors flex items-center justify-center font-medium">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
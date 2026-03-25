interface ChatBubbleProps {
  message: string;
  type: 'assistant' | 'user';
}

export function ChatBubble({ message, type }: ChatBubbleProps) {
  const isAssistant = type === 'assistant';
  
  return (
    <div className={`flex ${isAssistant ? 'justify-start' : 'justify-end'} mb-4`}>
      <div 
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isAssistant 
            ? 'bg-[#E3F5F3] text-[#0A4D5C] rounded-tl-sm' 
            : 'bg-[#F3F4F6] text-gray-900 rounded-tr-sm'
        }`}
      >
        <p className="text-sm leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

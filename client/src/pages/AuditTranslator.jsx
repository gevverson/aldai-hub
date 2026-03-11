import { useState, useRef, useEffect } from 'react';

const AuditTranslator = () => {
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef(null);

  const suggestedQuestions = [
    "Pesa ngapi ilitumika kwa shule ya Kimaren?",
    "Which projects were abandoned incomplete?",
    "Hospitali ya Kobujoi ina tatizo gani?"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const handleQuery = async (e, text = query) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    // Add user question
    const newConv = [...conversation, { type: 'user', text }];
    setConversation(newConv);
    setQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/audit/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConversation([...newConv, { type: 'ai', data: data.answer }]);
      } else {
        throw new Error(data.error || "Failed to analyze document");
      }
    } catch (error) {
      setConversation([...newConv, { 
        type: 'error', 
        text: "Samahani (Sorry). Could not connect to the Audit Database right now. Please try again later." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      
      <div className="mb-8 border-l-4 border-amber-500 pl-4">
        <h1 className="text-3xl font-display font-bold text-forest-900 mb-2">AI Audit Translator</h1>
        <p className="text-gray-700">
          The Auditor-General's reports are 400 pages of dense financial jargon. 
          Ask any question in plain English or Swahili, and our AI will translate the official 
          findings into simple truth.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-forest-100 overflow-hidden min-h-[500px] flex flex-col">
        
        {/* Chat Area */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50/50 space-y-6">
          
          {/* Welcome Message */}
          {conversation.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full space-y-8 opacity-90 mt-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16 text-amber-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <div className="text-center max-w-lg">
                <p className="font-semibold text-forest-900 text-lg mb-4">Try asking about a project:</p>
                <div className="flex flex-col gap-3">
                  {suggestedQuestions.map((q, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleQuery(null, q)}
                      className="bg-white border border-forest-200 text-forest-800 hover:border-amber-500 hover:text-amber-600 px-4 py-3 rounded-lg text-sm text-left transition-colors shadow-sm"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conversation Thread */}
          {conversation.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              
              {msg.type === 'user' ? (
                <div className="bg-forest-900 text-white px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm">
                  <p>{msg.text}</p>
                </div>
              ) : msg.type === 'error' ? (
                <div className="bg-red-50 text-alert-red px-5 py-3 rounded-2xl border border-red-200 rounded-tl-sm max-w-[85%]">
                  <p>{msg.text}</p>
                </div>
              ) : (
                /* AI Response Block structured specifically as requested by Prompt Module 3 */
                <div className="bg-white border-2 border-forest-100 px-5 py-5 rounded-xl rounded-tl-sm max-w-[95%] lg:max-w-[85%] shadow-sm w-full">
                  <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-amber-500">
                      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 8.25 3c1.804 0 3.328.67 4.25 1.737C13.422 3.67 14.946 3 16.75 3c3.536 0 6 2.322 6 5.25 0 3.924-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                    </svg>
                    <span className="font-bold text-forest-900 tracking-wide uppercase text-sm">Truth Verified</span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1 flex items-center gap-2">
                        📋 What the Auditor Found
                      </p>
                      <p className="text-gray-800 font-medium leading-relaxed bg-forest-50 p-3 rounded-md border-l-2 border-forest-800">
                        {msg.data.finding}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">💰 Money Involved</p>
                        <p className="font-bold text-red-700">Ksh {msg.data.amount}</p>
                      </div>
                      <div className="bg-gray-50 p-2 rounded border border-gray-100">
                        <p className="text-[10px] text-gray-500 font-bold uppercase mb-0.5">🚨 How Serious</p>
                        <p className="font-bold text-alert-red">{msg.data.severity}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">📍 Where</p>
                      <p className="text-sm font-semibold text-forest-800">{msg.data.location}</p>
                    </div>

                    <div className="pt-3 border-t border-gray-100 mt-2">
                      <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase mb-1">📄 Audit Reference</p>
                      <p className="text-xs text-forest-700 underline decoration-forest-200 underline-offset-2">{msg.data.reference}</p>
                    </div>

                    <div className="bg-amber-50 p-3 rounded border border-amber-200 mt-4">
                      <p className="text-[10px] text-amber-800 font-bold tracking-widest uppercase mb-1">👉 What you can do</p>
                      <p className="text-sm text-gray-800 font-medium">{msg.data.action}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border text-forest-800 px-5 py-4 rounded-2xl rounded-tl-sm max-w-[85%] shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></div>
                <span className="text-sm text-gray-500 italic ml-2">Searching 400-page OAG report...</span>
              </div>
            </div>
          )}
          
          <div ref={scrollRef}></div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-forest-100">
          <form onSubmit={handleQuery} className="flex gap-2">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about a missing project..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all shadow-sm"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !query.trim()}
              className="bg-forest-900 hover:bg-forest-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]"
            >
              Ask AI
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-3">
            Powered by RAG analysis of official Kenya Office of the Auditor-General (OAG) reports.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditTranslator;

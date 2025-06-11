'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, continueConversation } from './actions';
import { readStreamableValue } from 'ai/rsc';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default function Home() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [input, setInput] = useState<string>('');
  const conversationEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  const handleSendMessage = async (messageContent: string) => {
    if (!messageContent.trim()) return;

    const newConversation: Message[] = [
      ...conversation,
      { role: 'user', content: messageContent },
    ];
    setConversation(newConversation);
    setInput('');

    const { newMessage } = await continueConversation(newConversation);

    let textContent = '';
    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`;
      setConversation([
        ...newConversation,
        { role: 'assistant', content: textContent },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="p-4 border-b bg-white shadow-sm">
        <h1 className="text-xl font-bold">Ask Doc</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {conversation.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-lg px-4 py-2 rounded-lg shadow ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white text-gray-800'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>
      </main>
      <footer className="p-4 border-t bg-white shadow-up">
        <div className="flex items-center">
          <input
            type="text"
            className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            value={input}
            onChange={event => setInput(event.target.value)}
            onKeyDown={async event => {
              if (event.key === 'Enter') {
                handleSendMessage(input);
              }
            }}
            placeholder="Type your message..."
          />
          <button
            className="p-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => handleSendMessage(input)}
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}




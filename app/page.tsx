'use client';

import { useState, useEffect, useRef } from 'react';
import { Message, continueConversation } from './actions';
import { readStreamableValue } from 'ai/rsc';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export default function Home() {
  const [conversation, setConversation] = useState<Message[]>([
    {
      role: 'assistant',
      content: "I'm here. What's the problem now?",
    },
  ]);
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
    let assistantMessageExists = false;

    for await (const delta of readStreamableValue(newMessage)) {
      textContent = `${textContent}${delta}`;
      
      setConversation(currentConversation => {
        const updatedConversation = [...currentConversation];
        
        if (!assistantMessageExists) {
          updatedConversation.push({ role: 'assistant', content: textContent });
          assistantMessageExists = true;
        } else {
          const lastMessage = updatedConversation[updatedConversation.length - 1];
          if (lastMessage.role === 'assistant') {
            updatedConversation[updatedConversation.length - 1] = {
              ...lastMessage,
              content: textContent,
            };
          }
        }
        return updatedConversation;
      });
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-dark-gray">
      <div className="flex flex-col w-full max-w-2xl h-[90vh] bg-medium-gray rounded-lg shadow-xl">
        <header className="p-4 border-b border-light-gray">
          <h1 className="text-xl font-bold text-off-white">
            Ask Doc, if you must.
          </h1>
        </header>
        <main className="flex-1 overflow-y-auto p-6 space-y-4">
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
                    ? 'bg-primary-purple text-white'
                    : 'bg-light-gray text-off-white'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          <div ref={conversationEndRef} />
        </main>
        <footer className="p-4 border-t border-light-gray">
          <div className="flex items-center">
            <input
              type="text"
              className="flex-1 p-2 bg-light-gray text-off-white rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-purple"
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={async event => {
                if (event.key === 'Enter') {
                  handleSendMessage(input);
                }
              }}
              placeholder="Spit it out..."
            />
            <button
              className="p-2 bg-primary-purple text-white rounded-r-lg hover:bg-secondary-purple focus:outline-none focus:ring-2 focus:ring-primary-purple"
              onClick={() => handleSendMessage(input)}
            >
              Transmit
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}




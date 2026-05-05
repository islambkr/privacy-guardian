'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '@/types';
import styles from './ChatInterface.module.css';

interface ChatInterfaceProps {
  platformNames: string[];
}

export default function ChatInterface({ platformNames }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hi! I'm your Privacy Guardian AI. Ask me anything about privacy on ${platformNames.join(', ')}.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          platforms: platformNames,
        }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setError('Failed to connect to the assistant. Please try again.');
      setMessages((prev) =>
        prev.slice(0, -1)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {error && <div className={styles.errorBanner}>{error}</div>}
      <div className={styles.messagesContainer}>
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`${styles.messageBubble} ${
              msg.role === 'user' ? styles.userMessage : styles.assistantMessage
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className={`${styles.messageBubble} ${styles.assistantMessage}`}>
            <div className={styles.typingIndicator}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputContainer}>
        <input
          type="text"
          placeholder="Ask about privacy policies..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className={styles.input}
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className={styles.sendButton}
        >
          Send
        </button>
      </div>
    </div>
  );
}


import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import ChatHeader from '../components/ChatHeader';
import ChatSidebar from '../components/ChatSidebar';
import MessageList from '../components/MessageList';
import ChatInput from '../components/ChatInput';
import { fetchWithAuth } from '../utils/api';

const Chat = ({ user, onLogout, theme, toggleTheme }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sessionId] = useState(() => Date.now().toString());
  const messagesEndRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
  if (initializedRef.current) return;

  initializedRef.current = true;

  addBotMessage({
    message: `👋 Hello ${user?.firstName || 'there'}! I'm your ProGO Assistant. I can help you with:

📊 Attendance information
📈 Academic performance and predictions
📚 Exam schedules
💰 Fee status
📢 Notifications
👨‍🏫 Faculty contacts

How can I assist you today?`,
    intent: 'greeting'
  });

}, []); 

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
  if (messagesEndRef.current) {
    messagesEndRef.current.scrollIntoView({
      behavior: "smooth",
      block: "end"
    });
  }
};

  const addBotMessage = (data) => {
    const botMessage = {
      id: Date.now() + Math.random(),
      type: 'bot',
      content: data.message,
      timestamp: new Date(),
      intent: data.intent,
      additionalData: data.additionalData
    };
    setMessages(prev => [...prev, botMessage]);
  };

  const addUserMessage = (text) => {
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
  };

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;

    addUserMessage(text);
    setLoading(true);

    try {
      const response = await fetchWithAuth('/api/chatbot/message', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          sessionId
        })
      });

      const data = await response.json();

      if (data.success) {
        addBotMessage(data.data);

        if (data.data?.action === 'logout' || data.data?.intent === 'logout') {
          // Let the user see the confirmation message briefly before redirecting.
          setTimeout(() => {
            onLogout();
          }, 500);
        }
      } else {
        addBotMessage({
          message: 'Sorry, I encountered an error. Please try again.',
          intent: 'error'
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      addBotMessage({
        message: 'Network error. Please check your connection and try again.',
        intent: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Are you sure you want to clear the chat history?')) {
      setMessages([]);
      addBotMessage({
        message: 'Chat cleared. How can I help you?',
        intent: 'greeting'
      });
    }
  };

  return (
    <div className="h-screen flex overflow-hidden relative">
      <AnimatedBackground />

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25 }}
            className="relative z-20"
          >
            <ChatSidebar
              user={user}
              onLogout={onLogout}
              onQuickAction={sendMessage}
              onClose={() => setSidebarOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        <ChatHeader
          theme={theme}
          toggleTheme={toggleTheme}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onClearChat={clearChat}
          onLogout={onLogout}
        />

        <MessageList
          messages={messages}
          loading={loading}
          messagesEndRef={messagesEndRef}
        />

        <ChatInput
          onSendMessage={sendMessage}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default Chat;

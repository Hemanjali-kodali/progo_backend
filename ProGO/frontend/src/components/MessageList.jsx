import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import { format } from 'date-fns';

const TypingIndicator = () => (
  <div className="flex gap-1.5 p-4">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-blue-500 rounded-full"
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration: 0.6,
          repeat: Infinity,
          delay: i * 0.15,
        }}
      />
    ))}
  </div>
);

const Message = ({ message }) => {
  const isBot = message.type === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15 }}
        className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isBot
            ? 'bg-gradient-to-br from-blue-500 to-purple-600'
            : 'bg-gradient-to-br from-slate-600 to-slate-700'
        }`}
      >
        {isBot ? (
          <Bot className="w-5 h-5 text-white" />
        ) : (
          <User className="w-5 h-5 text-white" />
        )}
      </motion.div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isBot ? '' : 'items-end'}`}>
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className={`rounded-2xl p-4 ${
            isBot
              ? 'bg-white dark:bg-slate-800 shadow-sm'
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {message.content}
          </p>

          {/* Additional Data (for bot messages) */}
          {isBot && message.additionalData && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs space-y-1">
                {Object.entries(message.additionalData).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                    </span>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {typeof value === 'object' ? JSON.stringify(value) : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Badge (for bot intent messages) */}
          {isBot && message.confidence && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${message.confidence * 100}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className={`h-full rounded-full ${
                    message.confidence > 0.8
                      ? 'bg-green-500'
                      : message.confidence > 0.6
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {Math.round(message.confidence * 100)}%
              </span>
            </div>
          )}
        </motion.div>

        {/* Timestamp */}
        <span className="text-xs text-slate-500 dark:text-slate-500 mt-1 px-2">
          {format(message.timestamp, 'HH:mm')}
        </span>
      </div>
    </motion.div>
  );
};

const MessageList = ({ messages, loading, messagesEndRef }) => {
  const suggestedQuestions = [
    'What is my overall attendance?',
    'Show my performance insights',
    'Any upcoming exams?',
  ];

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
      <AnimatePresence mode="popLayout">
        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {/* Typing Indicator */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm">
              <TypingIndicator />
            </div>
          </motion.div>
        )}

        {/* Suggested Questions (show when empty or first message) */}
        {messages.length <= 1 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap gap-2 justify-center py-4"
          >
            {suggestedQuestions.map((question, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm"
              >
                {question}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;

import { motion } from 'framer-motion';
import {
  UserCircle,
  Calendar,
  BarChart3,
  BookOpen,
  CreditCard,
  Bell,
  HelpCircle,
  LogOut,
  X
} from 'lucide-react';

const quickActions = [
  { icon: Calendar, label: 'Check Attendance', message: 'What is my attendance?' },
  { icon: BarChart3, label: 'Performance', message: 'Show my academic performance' },
  { icon: BookOpen, label: 'Exams', message: 'Show upcoming exams' },
  { icon: CreditCard, label: 'Fee Status', message: 'What is my fee status?' },
  { icon: Bell, label: 'Notifications', message: 'Show notifications' },
  { icon: HelpCircle, label: 'Help', message: 'help' },
];

const ChatSidebar = ({ user, onLogout, onQuickAction, onClose }) => {
  const isParent = user?.role === 'parent';
  const linkedStudent = user?.linkedStudent;

  return (
    <aside className="w-72 h-screen glass-effect border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col">
      {/* Mobile Close Button */}
      <div className="lg:hidden flex justify-end p-2">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Profile */}
      <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="flex items-center gap-3"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center ring-4 ring-blue-500/20">
            <UserCircle className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-800 dark:text-white">
              {user?.firstName} {user?.lastName}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 capitalize">
              {isParent ? `${user?.relationship || 'Parent'}` : (user?.role || 'Student')}
            </p>
            {!isParent && user?.registrationNumber && (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {user.registrationNumber}
              </p>
            )}
            {isParent && linkedStudent?.registrationNumber && (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Student: {linkedStudent.registrationNumber}
              </p>
            )}
            {isParent && user?.phone && (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Phone: {user.phone}
              </p>
            )}
            {isParent && user?.occupation && (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {user.occupation}
              </p>
            )}
            {isParent && user?.address?.city && (
              <p className="text-xs text-slate-500 dark:text-slate-500">
                {user.address.city}, {user.address.state}
              </p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
          Quick Actions
        </h4>
        <div className="space-y-2">
          {quickActions.map((action, index) => (
            <motion.button
              type="button"
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => {
                onQuickAction(action.message);
                // Only close sidebar on mobile
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-colors">
                <action.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {action.label}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Recent Conversations */}
        <div className="mt-6">
          <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
            Recent Chats
          </h4>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <p className="text-center py-4">No recent conversations</p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Logout</span>
        </motion.button>
      </div>
    </aside>
  );
};

export default ChatSidebar;

# ProGO Chatbot Frontend

Modern, professional chatbot interface built with React, Vite, and Tailwind CSS.

## 🚀 Features

- **Modern UI/UX**: Glass morphism effects, gradient animations, smooth transitions
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Dark Mode**: Seamless theme switching with system preference detection
- **Framer Motion Animations**: Smooth, professional animations throughout
- **Real-time Chat**: WebSocket-ready architecture for instant messaging
- **Component-Based**: Modular, reusable React components
- **Tailwind CSS**: Utility-first styling with custom animations
- **API Integration**: RESTful API communication with authentication

## 📦 Tech Stack

- **React 18.3** - UI library
- **Vite 5.3** - Build tool and dev server
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Framer Motion 11.3** - Animation library
- **React Router 6.26** - Client-side routing
- **Axios 1.7** - HTTP client
- **Lucide React** - Icon library
- **Date-fns** - Date formatting

## 🎨 Design Features

### Animations
- Fade-in, slide-up, slide-down effects
- Gradient background animations
- Floating particle effects
- Typing indicator with bouncing dots
- Message bounce animations
- Hover glow effects

### UI Components
- **Login Page**: Dual role selection (Student/Parent), animated background
- **Chat Interface**: Real-time messaging with ML insights
- **Sidebar**: Quick actions, user profile, conversation history
- **Message Bubbles**: Confidence indicators, additional data display
- **Input Area**: Auto-resize textarea, emoji/attachment support

## 📁 Project Structure

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/        # Reusable components
│   │   ├── AnimatedBackground.jsx
│   │   ├── ChatHeader.jsx
│   │   ├── ChatInput.jsx
│   │   ├── ChatSidebar.jsx
│   │   └── MessageList.jsx
│   ├── pages/            # Page components
│   │   ├── Login.jsx
│   │   └── Chat.jsx
│   ├── utils/            # Utility functions
│   │   └── api.js
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles + Tailwind
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🛠️ Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Configuration

### Environment Variables

The frontend automatically proxies `/api` requests to the backend server (configured in `vite.config.js`).

**Development**: API proxied to `http://localhost:5000`
**Production**: Update proxy target in `vite.config.js`

### Vite Config

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

### Tailwind Config

Custom theme extensions:
- **Colors**: Primary (blue), Secondary (purple)
- **Animations**: fade-in, slide-up, gradient, float, glow
- **Components**: glass-effect, gradient-text, hover-glow

## 🎯 Usage

### Login Page

1. Select role (Student or Parent)
2. Enter registration number and password
3. Optional: Remember me checkbox
4. Click "Sign In"

**Test Credentials**: (Configure in backend seed data)
- Registration: `REG001`
- Password: `password123`

### Chat Interface

**Quick Actions**:
- 📊 Check Attendance
- 📈 Performance Insights
- 📚 Upcoming Exams
- 💰 Fee Status
- 📢 Notifications
- ❓ Help

**Features**:
- Type messages in the input area
- Press Enter to send, Shift+Enter for new line
- View confidence scores on bot responses
- Access additional data in message cards
- Toggle dark mode
- Clear chat history

## 🎨 Customization

### Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  primary: {
    500: '#0ea5e9', // Main blue
    // ... other shades
  },
  // Add custom colors
}
```

### Animations

Custom animations in `src/index.css`:

```css
@layer components {
  .custom-animation {
    animation: customKeyframe 2s ease-in-out infinite;
  }
}

@keyframes customKeyframe {
  0% { /* start */ }
  100% { /* end */ }
}
```

## 📱 Responsive Breakpoints

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

Sidebar auto-hides on mobile with hamburger menu.

## 🔐 Authentication

Authentication state managed in `App.jsx`:
- Session check on mount
- Auto-redirect unauthorized users to login
- Logout functionality with session cleanup

## 🚀 Performance

- **Code Splitting**: Automatic with Vite
- **Tree Shaking**: Dead code elimination
- **CSS Purging**: Tailwind removes unused styles
- **Fast Refresh**: HMR for instant updates
- **Optimized Build**: Minification and bundling

## 🧪 Development

### Hot Module Replacement

```bash
npm run dev
```

Changes reflect instantly without full page reload.

### Build for Production

```bash
npm run build
```

Outputs to `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

Serves production build locally for testing.

## 🎨 Design System

### Glass Morphism

```jsx
<div className="glass-effect">
  {/* Translucent background with blur */}
</div>
```

### Gradient Text

```jsx
<h1 className="gradient-text">
  Beautiful Gradient
</h1>
```

### Hover Effects

```jsx
<button className="hover-glow">
  Interactive Button
</button>
```

## 🔄 API Integration

### Login

```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ registrationNumber, password, role })
});
```

### Send Message

```javascript
const response = await fetchWithAuth('/api/chatbot/message', {
  method: 'POST',
  body: JSON.stringify({ message, sessionId })
});
```

## 🐛 Troubleshooting

### Port 3000 in use

```bash
# Change port in vite.config.js
server: {
  port: 3001
}
```

### API not connecting

- Ensure backend is running on port 5000
- Check proxy configuration in `vite.config.js`
- Verify CORS settings in backend

### Animations not working

- Ensure Framer Motion is installed: `npm install framer-motion`
- Check browser compatibility

## 📦 Build Output

Production build optimized with:
- Minified JavaScript
- Optimized CSS (only used classes)
- Compressed images
- Tree-shaken dependencies

Average build size: ~200KB (gzipped)

## 🌐 Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📄 License

Part of ProGO Student Chatbot System

---

**Ready to run!** 🚀

```bash
npm run dev
```

Navigate to `http://localhost:3000`

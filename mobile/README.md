# Alfred AI Mobile App

A React Native mobile application that brings the full Alfred AI experience to your phone, featuring conversational AI chat, reminders, notes, and quizzes.

## 🚀 Features

### Core Features
- **Conversational AI Chat**: Chat with Gemini AI using natural language
- **Command System**: Use dot-commands like `.reminder`, `.note`, `.quiz`
- **Reminders**: Create, manage, and receive notifications for tasks
- **Notes Editor**: Markdown notes with AI generation and preview
- **Quiz System**: AI-generated quizzes with timer and scoring
- **User Authentication**: Login/signup with profile management
- **Themes**: Multiple visual themes (light, dark, blue, green, pink, gray)

### Mobile Optimizations
- Native notifications for reminders
- Offline-capable with local storage
- Platform-specific keyboard handling
- Touch-optimized UI components
- Android emulator networking (uses 10.0.2.2:3000)

## 🛠️ Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start the development server:**
   ```bash
   npx expo start -c
   ```

3. **Run on device/emulator:**
   - Press `a` for Android emulator
   - Press `i` for iOS simulator (macOS only)
   - Scan QR code with Expo Go app on physical device

### Backend Setup

The mobile app connects to the same backend as the web version:

1. **Start the server:**
   ```bash
   cd /path/to/web/project
   npm install
   npm start
   # Server runs on http://localhost:3000
   ```

2. **Android Networking:**
   - Android emulator uses `http://10.0.2.2:3000` (automatically configured)
   - iOS simulator uses `http://localhost:3000`

## 📱 Usage Guide

### Getting Started
1. **Launch the app** and you'll see the login screen
2. **Create an account** or **sign in** with existing credentials
3. **Complete your profile** to personalize AI responses
4. **Start chatting!** Use natural language or dot-commands

### Available Commands
- `.reminder [task] [time/date]` - Create a reminder
- `.note` - Open notes editor
- `.quiz [topic]` - Start an AI-generated quiz
- `.theme [name]` - Change theme (light, dark, blue, green, pink, gray)
- `.setApiKey [key]` - Configure Gemini API key
- `.setEndpoint [url]` - Change API endpoint
- `.setProxy [url]` - Set proxy URL

### Example Commands
```
.reminder Study math 3:00PM tomorrow
.note
.quiz biology
.theme dark
```

### Features Overview

#### 🤖 AI Chat
- Natural conversation with Gemini AI
- Context-aware responses using your profile
- Command suggestions with autocomplete
- Message history persistence

#### 📝 Reminders
- Natural language date parsing ("tomorrow 3pm", "in 2 hours")
- Status tracking (pending, soon, overdue, completed)
- Local notifications with sound
- Server synchronization
- One-tap completion

#### 📚 Notes
- Markdown editor with live preview
- AI-powered note generation
- Title-based search and suggestions
- Server storage with sync

#### 🎯 Quizzes
- AI-generated questions on any topic
- 25-second timer per question
- Score tracking and streaks
- Multiple choice with visual feedback

#### 🎨 Themes
- 6 built-in themes
- Automatic system theme detection
- Server-side persistence
- Consistent across all screens

## 🔧 Configuration

### Environment Variables
The app automatically detects the platform and uses appropriate API endpoints:

- **Android Emulator**: `http://10.0.2.2:3000`
- **iOS Simulator**: `http://localhost:3000`
- **Physical Devices**: Configure via `.setEndpoint` command

### API Keys
- Configure Gemini API key via `.setApiKey` command
- Keys are stored securely using Expo SecureStore
- Server-side proxy can also supply API keys

### Security
- **Zero Security Vulnerabilities**: All npm audit issues resolved
- **Zero TypeScript Errors**: All type checking issues fixed
- **Secure Markdown Rendering**: Custom implementation without vulnerable dependencies
- **Safe Dependencies**: Only audited, secure packages used
- **Input Validation**: All user inputs properly sanitized and type-checked

## 🐛 Troubleshooting

### Common Issues

**Network Connection Issues:**
- Ensure backend server is running on port 3000
- Check firewall settings for Android emulator
- Verify API endpoint configuration

**Notifications Not Working:**
- Grant notification permissions in device settings
- Check if notifications are enabled for the app
- Restart the app after granting permissions

**Theme Not Applying:**
- Try restarting the app
- Check server connection for theme persistence
- Clear app data if issues persist

### Debug Commands
- `.debugapi` - Test API connectivity
- Check device logs in Android Studio/Xcode
- Use `console.log` statements for debugging

## 📦 Build & Deployment

### Development Build
```bash
npx expo run:android  # For Android APK
npx expo run:ios      # For iOS (macOS only)
```

### Production Build
```bash
npx expo build:android  # Generate Android build
npx expo build:ios      # Generate iOS build
```

### EAS Build (Recommended)
```bash
npx eas build --platform android
npx eas build --platform ios
```

## 🔄 Sync with Web Version

The mobile app shares the same backend as the web version, ensuring:

- **Data Synchronization**: Reminders, notes, and messages sync across devices
- **User Accounts**: Single account works on both web and mobile
- **API Compatibility**: All web endpoints are supported
- **Feature Parity**: Core features match web functionality

## 📋 Version History

### v1.0.0
- ✅ Complete feature implementation
- ✅ Conversational auth flows
- ✅ AI chat with command system
- ✅ Reminders with notifications
- ✅ Notes editor with AI generation
- ✅ Quiz system with timer
- ✅ Theme system
- ✅ Platform optimizations

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both Android and iOS
5. Submit a pull request

## 📄 License

This project is part of the Alfred AI system. See main project for licensing information.

---

**Enjoy using Alfred AI on mobile! 🚀**

For support or questions, check the main project documentation or create an issue.
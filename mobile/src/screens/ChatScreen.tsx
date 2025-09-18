import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar
} from 'react-native';
import { parseCommand, suggestCommands, CommandDef, parseSmartReminder, SmartReminderParse } from '../lib/commands';
import { postGemini, apiPost, apiGet } from '../lib/core';
import { useTheme } from '../hooks/useTheme';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
};

type Props = {
  navigation: { navigate: (route: string, params?: any) => void };
};

type Reminder = {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
};

export default function ChatScreen({ navigation }: Props) {
  const { theme, setTheme, availableThemes } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CommandDef[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderPanelOpen, setReminderPanelOpen] = useState(false);
  const [currentReminderText, setCurrentReminderText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const peelAnimation = useRef(new Animated.Value(0)).current;
  const [isNearBottom, setIsNearBottom] = useState(true);

  // Quiz state management
  const [currentQuiz, setCurrentQuiz] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStreak, setQuizStreak] = useState(0);
  const [totalQuizQuestions, setTotalQuizQuestions] = useState(0);
  const [quizTimeLeft, setQuizTimeLeft] = useState(25);
  const [quizTimerActive, setQuizTimerActive] = useState(false);

  // Quiz message arrays for engaging responses
  const QUIZ_POSITIVE = [
    "Nice! You're on a roll 🔥",
    "Great job — keep it up!",
    "Wow, you're on fire!",
    "Perfect — that's the one!",
    "Right on — impressive!",
    "Smooth — like butter on toast.",
    "Chef's kiss — that was deliciously correct.",
    "Boom — nailed it.",
    "That was smart. Did you study with a wizard?",
    "Correct — and oddly graceful too.",
    "You solved that like a pro barista pouring latte art.",
    "That was slick. I blinked and it was over.",
    "Legendary move — stats updated.",
    "Academic flex: unlocked.",
    "A+ for that one (in spirit)."
  ];

  const QUIZ_NEGATIVE = [
    "So close — almost had it.",
    "Not quite — good try!",
    "That's okay, you'll get the next one.",
    "Oh no — but good effort!",
    "Hmm — interesting guess.",
    "Plot twist: the quiz had other plans.",
    "It happens. Even geniuses misplace their answers sometimes.",
    "Nice effort — your future self will be proud when you retry.",
    "Close, but the quiz says 'try again with snacks'.",
    "That one went left — we'll guide it back next time.",
    "Not the win we wanted, but a solid rehearsal.",
    "Friendly nudge: maybe check that chapter again.",
    "Friendly fire — the question was tough.",
    "The quiz demands vengeance. Study mode: on.",
    "It wasn't you, it was the question's dramatic arc."
  ];

  const QUIZ_ENCOURAGE = [
    "You got this — ready for the next?",
    "Let's keep going — build that streak!",
    "Nice momentum — more coming up.",
    "Short break? Or straight to the next one?",
    "Feeling confident? Let's try another.",
    "Tiny victory — now let's stack another.",
    "Keep it steady — you're doing great.",
    "One step at a time — you're improving.",
    "Breathe — you're learning with each question.",
    "You're closer than you were five minutes ago."
  ];

  const QUIZ_INTERJECTION = [
    "Pfft — nailed it!",
    "Whoa, look at you go!",
    "I should take lessons from you.",
    "Can't stop, won't stop — great answer.",
    "That one was smooth.",
    "Snap — like a trivia ninja.",
    "Zing! Right in the knowledge groove.",
    "Blink and it's correct.",
    "That answer had commitment.",
    "Quick reflexes — very impressive."
  ];

  const QUIZ_CELEBRATE = [
    "Triple streak! You're unstoppable — confetti time (mentally).",
    "Streakmaster! Keep that energy.",
    "Legendary run — that streak looks good on you.",
    "You are on a hot streak — teach me your ways.",
    "This calls for celebratory music (in your head).",
    "Streak unlocked: confidence +10.",
    "Teach me your secrets, oh streaky one.",
    "That streak earned a motivational gif (imaginary).",
    "Your streak is a work of art."
  ];

  const QUIZ_END_FUNNY = [
    "You finished! Reward yourself with a tiny victory dance.",
    "Quiz complete: brain slightly more impressive now.",
    "Nice work — your future self thanks you.",
    "You passed the mini-exam. Coffee is recommended.",
    "Congrats — now go explain this to a rubber duck.",
    "Well done — that score looks great under fluorescent lights.",
    "You survived the quiz and lived to tell the tale.",
    "Winner winner — mental chicken dinner.",
    "Victory lap recommended (five steps).",
    "Achievement unlocked: 'Completed a quiz, didn't panic.'"
  ];

  const QUIZ_END_NEGATIVE = [
    "Well... we tried. Maybe the duck needs a tutor.",
    "Oof — that went sideways. Hydrate and retry.",
    "Not your day? That's okay — blame the gremlins.",
    "The quiz wins this round. Come back swinging.",
    "Rough run — consider it a sneak peek of what to study next."
  ];

  const randomFrom = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

  // Create themed styles based on current theme
  const themedStyles = createThemedStyles(theme);

  useEffect(() => {
    loadMessages();
    loadReminders();
  }, []);

  // Add welcome message if no messages exist
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'system',
        content: 'Welcome to Alfred AI! Try typing ".help" for available commands or just chat normally.',
        created_at: new Date().toISOString()
      }]);
    }
  }, [messages.length]);

  const loadMessages = async () => {
    try {
      // Load recent messages for better performance (last 50 messages)
      const result = await apiGet('messages?limit=50');

      if (Array.isArray(result) && result.length > 0) {
        const timestamp = Date.now();
        const loadedMessages = result.map((msg: any, index: number) => ({
          id: msg.id?.toString() || `${timestamp}-${index}`,
          role: msg.role || 'user',
          content: msg.content || 'No content available',
          created_at: msg.created_at
        }));

        // Messages are already sorted by backend (chronological order)
        setMessages(loadedMessages);

        // Scroll to bottom after loading messages
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }, 200);
      }
    } catch (e) {
      console.warn('Failed to load messages:', e);
      // Add a system message to indicate loading failure
      setMessages([{
        id: 'load-error',
        role: 'system',
        content: 'Unable to load message history. Please check your connection.',
        created_at: new Date().toISOString()
      }]);
    }
  };

  const loadReminders = async () => {
    try {
      const result = await apiGet('reminders');
      if (Array.isArray(result)) {
        setReminders(result);
        updateCurrentReminderText(result);
      }
    } catch (e) {
      console.warn('Failed to load reminders:', e);
    }
  };

  const updateCurrentReminderText = (reminderList: Reminder[]) => {
    const now = new Date();
    const upcomingReminders = reminderList
      .filter(r => !r.completed && new Date(r.dueDate) > now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    if (upcomingReminders.length > 0) {
      const nextReminder = upcomingReminders[0];
      const timeDiff = new Date(nextReminder.dueDate).getTime() - now.getTime();
      const hoursLeft = Math.ceil(timeDiff / (1000 * 60 * 60));

      if (hoursLeft <= 2) {
        setCurrentReminderText(`${nextReminder.title} due in ${hoursLeft} hour${hoursLeft !== 1 ? 's' : ''}`);
      } else {
        setCurrentReminderText(`${nextReminder.title} due soon`);
      }
    } else {
      setCurrentReminderText('No upcoming reminders');
    }
  };

  const toggleReminderPanel = () => {
    const toValue = reminderPanelOpen ? 0 : 1;
    Animated.timing(peelAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setReminderPanelOpen(!reminderPanelOpen);
  };

  const markReminderComplete = async (reminderId: string) => {
    try {
      await apiPost(`reminders/${reminderId}/complete`, {});
      setReminders(prev => prev.map(r =>
        r.id === reminderId ? { ...r, completed: true } : r
      ));
      updateCurrentReminderText(reminders.filter(r => r.id !== reminderId || !r.completed));
    } catch (e) {
      console.warn('Failed to mark reminder complete:', e);
    }
  };

  const addMessage = (role: 'user' | 'assistant' | 'system', content: string) => {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const newMessage: Message = {
      id: `${timestamp}-${randomId}`,
      role,
      content,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMessage]);

    // Persist to server
    apiPost('messages', { role, content }).catch(() => {
      // Non-fatal if persistence fails
    });

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSend = async () => {
    const text = inputText.trim();
    console.log('📤 handleSend called with text:', text);
    if (!text || isLoading) return;

    setInputText('');
    setShowSuggestions(false);

    // Check if this is a quiz answer (number 1-4)
    console.log('🔍 Checking for quiz answer:', {
      hasQuiz: currentQuiz.length > 0,
      timerActive: quizTimerActive,
      isNumber: /^[1-4]$/.test(text),
      text
    });

    if (currentQuiz.length > 0 && quizTimerActive && /^[1-4]$/.test(text)) {
      console.log('🎯 Detected quiz answer:', text);
      const answerIndex = parseInt(text) - 1;
      addMessage('user', text);
      handleQuizAnswer(answerIndex);
      return;
    }

    const parsed = parseCommand(text);
    console.log('🔍 Parsed command:', parsed);

    if (parsed.name === 'unknown') {
      // Regular chat message - send to Gemini
      addMessage('user', text);
      setIsLoading(true);

      try {
        const response = await postGemini({
          contents: [
            { role: 'user', parts: [{ text }] }
          ]
        });
        addMessage('assistant', response);
      } catch (e: any) {
        addMessage('assistant', `Error: ${e?.message || 'Failed to get response'}`);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Handle command
      handleCommand(parsed);
    }
  };

  const handleCommand = async (parsed: ReturnType<typeof parseCommand>) => {
    console.log('🔧 handleCommand called with parsed:', parsed);
    addMessage('user', parsed.raw);

    switch (parsed.name) {
      case 'help':
        addMessage('assistant', `Available commands:\n• .help - Show this help\n• .reminder [task] [time] - Create reminder\n• .note - Open notes editor\n• .quiz [topic] - Start quiz\n• .theme [name] - Change theme\n• .logout - Logout from account\n• .profile - View profile\n• .settings - Open settings`);
        break;
      case 'reminder':
        if (parsed.args.trim()) {
          // Use smart parsing for natural language reminders
          const smartParse = parseSmartReminder(parsed.args);
          console.log('Smart reminder parse:', smartParse);

          // Create the reminder with parsed information
          const reminderData = {
            title: smartParse.title,
            dueDate: smartParse.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Default to tomorrow
            timestamp: smartParse.dueDate ? new Date(smartParse.dueDate).getTime() : Date.now() + 24 * 60 * 60 * 1000,
            status: 'pending',
            priority: smartParse.priority || 'medium',
            category: smartParse.category,
            recurrence: smartParse.recurrence
          };

          try {
            await apiPost('reminders', reminderData);
            loadReminders(); // Refresh the reminders list

            let response = `✅ Reminder created: "${smartParse.title}"`;
            if (smartParse.dueDate) {
              response += `\n📅 Due: ${new Date(smartParse.dueDate).toLocaleString()}`;
            }
            if (smartParse.priority && smartParse.priority !== 'medium') {
              response += `\n⚡ Priority: ${smartParse.priority}`;
            }
            if (smartParse.category) {
              response += `\n📂 Category: ${smartParse.category}`;
            }
            if (smartParse.recurrence) {
              response += `\n🔄 Recurs: ${smartParse.recurrence}`;
            }
            if (smartParse.confidence < 0.5) {
              response += `\n\n💡 Tip: Try more specific time formats like "tomorrow at 3pm" or "in 2 hours"`;
            }

            addMessage('assistant', response);
          } catch (error) {
            addMessage('assistant', `❌ Failed to create reminder: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        } else {
          // No args provided, show reminders interface
          addMessage('assistant', `Opening reminders...`);
          navigation.navigate('Reminders');
        }
        break;
      case 'note':
        addMessage('assistant', `Opening notes editor...`);
        navigation.navigate('Notes');
        break;
      case 'quiz':
        const topic = parsed.args || 'general';
        console.log('🎯 Quiz command detected with topic:', topic);
        console.log('🧭 Navigation object:', navigation);
        console.log('🧭 Navigating to QuizScreen with topic:', topic);
        try {
          navigation.navigate('Quiz', { topic });
          console.log('✅ Navigation call successful');
        } catch (error) {
          console.error('❌ Navigation error:', error);
          addMessage('assistant', 'Failed to navigate to quiz. Please try again.');
        }
        break;
      case 'theme':
        if (parsed.args) {
          const themeName = parsed.args.toLowerCase();
          const availableThemeNames = availableThemes.map(t => t.toLowerCase());
          if (availableThemeNames.includes(themeName)) {
            setTheme(themeName as any);
            addMessage('assistant', `Theme set to ${parsed.args}.`);
          } else {
            addMessage('assistant', `Theme "${parsed.args}" not found. Available themes: ${availableThemes.join(', ')}`);
          }
        } else {
          addMessage('assistant', `Available themes: ${availableThemes.join(', ')}`);
        }
        break;
      case 'logout':
        // Clear local storage and navigate to login
        try {
          // Clear auth token and user data
          // Note: In React Native, we'd use AsyncStorage instead of localStorage
          addMessage('assistant', 'Logged out successfully.');
          // Navigate to login screen (you might need to implement this navigation)
          // navigation.navigate('Login');
        } catch (e) {
          addMessage('assistant', 'Error logging out.');
        }
        break;
      case 'profile':
        addMessage('assistant', 'Opening profile...');
        navigation.navigate('Profile');
        break;
      case 'settings':
        addMessage('assistant', 'Opening settings...');
        // navigation.navigate('Settings'); // Uncomment when settings screen is implemented
        break;
      case 'setApiKey':
        addMessage('assistant', `API key saved (placeholder)`);
        break;
      case 'setEndpoint':
        addMessage('assistant', `Endpoint set to: ${parsed.args}`);
        break;
      case 'setProxy':
        addMessage('assistant', `Proxy set to: ${parsed.args}`);
        break;
      default:
        addMessage('assistant', `Unknown command: ${parsed.name}. Type .help for available commands.`);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (text.startsWith('.')) {
      const suggestions = suggestCommands(text);
      setSuggestions(suggestions);
      // Only show suggestions if we have matches and text is not too long
      setShowSuggestions(suggestions.length > 0 && text.length <= 15);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: CommandDef) => {
    setInputText(suggestion.name + ' ');
    setShowSuggestions(false);
  };

  // Quiz Functions
  const startQuiz = async (topic: string) => {
    console.log('🎯 Starting quiz with topic:', topic);
    addMessage('assistant', `Generating quiz for topic: ${topic}...`);

    try {
      // For now, use demo quiz data - in production this would call the backend
      const demoQuiz = getDemoQuiz(topic);
      console.log('📚 Demo quiz data:', demoQuiz);

      setCurrentQuiz(demoQuiz);
      setCurrentQuestionIndex(0);
      setQuizScore(0);
      setQuizStreak(0);
      setTotalQuizQuestions(demoQuiz.length);

      console.log('✅ Quiz state set:', {
        currentQuiz: demoQuiz.length,
        currentQuestionIndex: 0,
        totalQuizQuestions: demoQuiz.length
      });

      addMessage('assistant', 'Quiz ready! Answer by typing the option number (1-4).');
      showQuizQuestion();
    } catch (error) {
      console.error('❌ Quiz start error:', error);
      addMessage('assistant', 'Failed to generate quiz. Please try again.');
    }
  };

  const getDemoQuiz = (topic: string) => {
    const quizData: { [key: string]: any[] } = {
      spanish: [
        { question: "What does 'Hola' mean in English?", options: ["Goodbye", "Hello", "Please", "Thank you"], correct: 1 },
        { question: "How do you say 'cat' in Spanish?", options: ["Perro", "Gato", "Pájaro", "Pez"], correct: 1 },
        { question: "What is 'gracias' in English?", options: ["Please", "Sorry", "Thank you", "You're welcome"], correct: 2 }
      ],
      math: [
        { question: "What is 15 × 7?", options: ["95", "105", "115", "125"], correct: 1 },
        { question: "What is the square root of 144?", options: ["11", "12", "13", "14"], correct: 1 },
        { question: "What is 8² + 3²?", options: ["73", "64", "81", "100"], correct: 0 }
      ],
      general: [
        { question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correct: 2 },
        { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1 },
        { question: "What is 2 + 2 × 3?", options: ["8", "12", "6", "10"], correct: 0 }
      ]
    };

    return quizData[topic] || quizData.general;
  };

  const showQuizQuestion = () => {
    console.log('❓ Showing quiz question:', {
      currentQuiz: currentQuiz?.length,
      currentQuestionIndex,
      totalQuizQuestions
    });

    if (!currentQuiz || currentQuestionIndex >= currentQuiz.length) {
      console.log('🏁 Ending quiz - no more questions or no quiz');
      endQuiz();
      return;
    }

    const question = currentQuiz[currentQuestionIndex];
    console.log('📝 Current question:', question);

    const progress = Math.round(((currentQuestionIndex) / Math.max(1, totalQuizQuestions)) * 100);

    const questionText = `
🎯 Question ${currentQuestionIndex + 1}/${totalQuizQuestions}
📊 Score: ${quizScore} • Streak: ${quizStreak}

${question.question}

${question.options.map((opt: string, idx: number) => `${idx + 1}. ${opt}`).join('\n')}

⏱️ Time: ${quizTimeLeft}s
    `.trim();

    console.log('📤 Sending question message');
    addMessage('assistant', questionText);

    // Start timer
    console.log('⏰ Starting quiz timer');
    setQuizTimerActive(true);
    const timer = setInterval(() => {
      setQuizTimeLeft(prev => {
        if (prev <= 1) {
          console.log('⏰ Timer expired');
          clearInterval(timer);
          setQuizTimerActive(false);
          handleQuizTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleQuizAnswer = (answerIndex: number) => {
    console.log('🎯 Handling quiz answer:', {
      answerIndex,
      currentQuiz: currentQuiz?.length,
      quizTimerActive,
      currentQuestionIndex
    });

    if (!currentQuiz || !quizTimerActive) {
      console.log('❌ Quiz not active or timer not running');
      return;
    }

    setQuizTimerActive(false);
    const question = currentQuiz[currentQuestionIndex];
    const isCorrect = answerIndex === question.correct;

    console.log('📊 Answer analysis:', {
      userAnswer: answerIndex,
      correctAnswer: question.correct,
      isCorrect,
      question: question.question
    });

    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      setQuizStreak(prev => prev + 1);
      const positiveMsg = randomFrom(QUIZ_POSITIVE);
      const encourageMsg = randomFrom(QUIZ_ENCOURAGE);
      console.log('✅ Correct answer - sending messages');
      addMessage('assistant', `✅ ${positiveMsg}\n\n${encourageMsg}`);
    } else {
      setQuizStreak(0);
      const correctAnswer = question.options[question.correct];
      const negativeMsg = randomFrom(QUIZ_NEGATIVE);
      const encourageMsg = randomFrom(QUIZ_ENCOURAGE);
      console.log('❌ Wrong answer - sending messages');
      addMessage('assistant', `❌ ${negativeMsg}\n\nCorrect answer: ${correctAnswer}\n\n${encourageMsg}`);
    }

    // Move to next question after a delay
    console.log('⏳ Moving to next question in 2 seconds');
    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuizTimeLeft(25);
      showQuizQuestion();
    }, 2000);
  };

  const handleQuizTimeout = () => {
    if (!currentQuiz) return;

    setQuizStreak(0);
    const question = currentQuiz[currentQuestionIndex];
    const correctAnswer = question.options[question.correct];

    addMessage('assistant', `⏰ Time's up! ${randomFrom(QUIZ_NEGATIVE)}\n\nCorrect answer: ${correctAnswer}\n\n${randomFrom(QUIZ_ENCOURAGE)}`);

    setTimeout(() => {
      setCurrentQuestionIndex(prev => prev + 1);
      setQuizTimeLeft(25);
      showQuizQuestion();
    }, 2000);
  };

  const endQuiz = () => {
    const percentage = totalQuizQuestions > 0 ? (quizScore / totalQuizQuestions) * 100 : 0;

    let endMessage = `🎉 Quiz completed!\n\n`;
    endMessage += `📊 Final Score: ${quizScore}/${totalQuizQuestions} (${percentage.toFixed(1)}%)\n`;
    endMessage += `🔥 Best Streak: ${quizStreak}\n\n`;

    if (percentage >= 70) {
      endMessage += randomFrom(QUIZ_END_FUNNY);
    } else {
      endMessage += randomFrom(QUIZ_END_NEGATIVE);
    }

    addMessage('assistant', endMessage);

    // Reset quiz state
    setCurrentQuiz([]);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setQuizStreak(0);
    setTotalQuizQuestions(0);
    setQuizTimeLeft(25);
    setQuizTimerActive(false);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      themedStyles.messageContainer,
      item.role === 'user' ? themedStyles.userMessage : themedStyles.assistantMessage
    ]}>
      <Text style={[
        themedStyles.messageText,
        item.role === 'user' ? themedStyles.userMessageText : themedStyles.assistantMessageText
      ]}>
        {item.content || 'No content'}
      </Text>
      {item.created_at && (
        <Text style={themedStyles.messageTimestamp}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );

  // Debug: Log messages to console for visibility issues
  useEffect(() => {
    console.log('Current messages:', messages);
    console.log('Current theme:', theme?.name);
    console.log('Theme colors:', {
      bgGradient: theme.bgGradient || theme['--bg-gradient'],
      panelBg: theme.panelBg || theme['--panel-bg'],
      textPrimary: theme.textPrimary || theme['--text-primary']
    });
  }, [messages, theme]);

  return (
    <>
      <StatusBar
        barStyle={theme.name?.includes('dark') || theme.name?.includes('galaxy') || theme.name?.includes('storm') ? 'light-content' : 'dark-content'}
        backgroundColor={theme.bgGradient || theme['--bg-gradient'] || '#f5f7fa'}
      />
      <SafeAreaView style={[themedStyles.container, { backgroundColor: theme.bgGradient || theme['--bg-gradient'] || '#f5f7fa' }]}>
      {/* Reminder Peel Bar */}
      <Animated.View style={[
        themedStyles.peelBar,
        {
          transform: [{
            translateY: peelAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [-60, 0]
            })
          }]
        }
      ]}>
        <Pressable style={themedStyles.peelContent} onPress={toggleReminderPanel}>
          <Text style={themedStyles.peelText}>{currentReminderText}</Text>
          <View style={themedStyles.peelIndicator} />
        </Pressable>
      </Animated.View>

      {/* Reminder Panel */}
      <Animated.View style={[
        themedStyles.reminderPanel,
        {
          maxHeight: peelAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 200]
          })
        }
      ]}>
        <View style={themedStyles.reminderList}>
          {reminders.filter(r => !r.completed).length === 0 ? (
            <Text style={themedStyles.noRemindersText}>No active reminders</Text>
          ) : (
            reminders
              .filter(r => !r.completed)
              .slice(0, 3)
              .map((reminder) => (
                <View key={reminder.id} style={themedStyles.reminderItem}>
                  <View style={themedStyles.reminderInfo}>
                    <Text style={themedStyles.reminderTitle}>{reminder.title}</Text>
                    <Text style={themedStyles.reminderDue}>
                      Due: {new Date(reminder.dueDate).toLocaleDateString()}
                    </Text>
                  </View>
                  <Pressable
                    style={themedStyles.completeButton}
                    onPress={() => markReminderComplete(reminder.id)}
                  >
                    <Text style={themedStyles.completeButtonText}>✓</Text>
                  </Pressable>
                </View>
              ))
          )}
        </View>
      </Animated.View>

      <KeyboardAvoidingView
        style={[themedStyles.container, { backgroundColor: theme.bgGradient || theme['--bg-gradient'] || '#f5f7fa' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={[themedStyles.messagesList, { backgroundColor: theme.bgGradient || theme['--bg-gradient'] || '#f8fafc' }]}
          contentContainerStyle={[
            themedStyles.messagesContainer,
            messages.length === 0 && { flex: 1, justifyContent: 'center' }
          ]}
          onContentSizeChange={() => {
            // Only auto-scroll if user is already near the bottom
            if (isNearBottom) {
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
            }
          }}
          onLayout={() => {
            // Only auto-scroll on initial layout if we have messages
            if (messages.length > 0) {
              setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
            }
          }}
          onScroll={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 100;
            setIsNearBottom(isNearBottom);
          }}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          scrollEventThrottle={16}
          bounces={true}
          alwaysBounceVertical={true}
        />

        {showSuggestions && suggestions.length > 0 && (
          <View style={themedStyles.suggestionsContainerInline}>
            {suggestions.slice(0, 4).map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={themedStyles.suggestionItem}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <Text style={themedStyles.suggestionName}>{suggestion.name}</Text>
                <Text style={themedStyles.suggestionHint}>{suggestion.hint}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={themedStyles.inputContainer}>
           <TextInput
             style={themedStyles.input}
             value={inputText}
             onChangeText={handleInputChange}
             placeholder={
               currentQuiz.length > 0 && quizTimerActive
                 ? "Type 1-4 to answer the quiz question..."
                 : "Type a message or command..."
             }
             placeholderTextColor={theme.muted || theme['--muted'] || '#6c757d'}
             multiline
             maxLength={1000}
             editable={!isLoading}
           />
          <Pressable
            style={[themedStyles.sendButton, (isLoading || !inputText.trim()) && themedStyles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={isLoading || !inputText.trim()}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={themedStyles.sendButtonText}>Send</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc' // More modern, softer background
  },
  messagesList: {
    flex: 1
  },
  messagesContainer: {
    padding: 20, // Matches web padding
    paddingBottom: 20
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '85%',
    borderRadius: 24,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
    borderBottomRightRadius: 8 // Tail effect
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 8, // Tail effect
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'System',
    fontWeight: '400'
  },
  userMessageText: {
    color: '#ffffff',
    fontWeight: '500'
  },
  assistantMessageText: {
    color: '#1e293b',
    fontWeight: '400'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8
  },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginRight: 12,
    maxHeight: 100,
    backgroundColor: '#f8fafc',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  sendButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 24,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4
  },
  sendButtonDisabled: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0.1,
    elevation: 1
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16
  },
  suggestionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    minWidth: 300,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    borderRadius: 8
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4
  },
  suggestionHint: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500'
  }
});

// Create themed styles function - matches web version design
const createThemedStyles = (theme: any) => {
  // Extract theme colors with fallbacks
  const bgColor = theme.bgGradient || theme['--bg-gradient'] || '#f5f7fa';
  const panelBg = theme.panelBg || theme['--panel-bg'] || '#ffffff';
  const textPrimary = theme.textPrimary || theme['--text-primary'] || '#2c3e50';
  const muted = theme.muted || theme['--muted'] || '#6c757d';
  const border = theme.border || theme['--border'] || '#e9ecef';
  const accent1 = theme.accent1 || theme['--accent-1'] || '#667eea';
  const inputBg = theme.inputBg || theme['--input-bg'] || '#f8f9fa';
  const userBubbleBg = theme.userBubbleBg || theme['--user-bubble-bg'] || '#667eea';
  const chatAssistantBg = theme.chatAssistantBg || theme['--chat-assistant-bg'] || '#f8f9fa';
  const userText = theme.userText || theme['--user-text'] || '#ffffff';
  const assistantText = theme.assistantText || theme['--assistant-text'] || '#2c3e50';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bgColor
    },
    // Add gradient background support for themes that have gradients
    gradientBackground: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: bgColor
    },
    messagesList: {
      flex: 1,
      backgroundColor: bgColor
    },
    messagesContainer: {
      padding: 20,
      paddingBottom: 20,
      backgroundColor: bgColor
    },
    messageContainer: {
      marginBottom: 15,
      maxWidth: '80%',
      borderRadius: 20,
      padding: 12,
      shadowColor: textPrimary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: userBubbleBg, // Use theme's user bubble background
      borderWidth: 1,
      borderColor: 'transparent'
    },
    assistantMessage: {
      alignSelf: 'flex-start',
      backgroundColor: chatAssistantBg,
      borderWidth: 1,
      borderColor: border
    },
    messageText: {
      fontSize: 16,
      lineHeight: 20,
      color: textPrimary
    },
    userMessageText: {
      color: '#ffffff', // Keep user message text white
      fontWeight: '500'
    },
    assistantMessageText: {
      color: assistantText,
      fontWeight: '400'
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      paddingBottom: Platform.OS === 'ios' ? 34 : 20,
      backgroundColor: panelBg,
      borderTopWidth: 1,
      borderTopColor: border
    },
    input: {
      flex: 1,
      borderWidth: 2,
      borderColor: border,
      borderRadius: 25,
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginRight: 12,
      maxHeight: 100,
      backgroundColor: inputBg,
      color: textPrimary,
      fontSize: 16
    },
    sendButton: {
      backgroundColor: accent1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 20,
      alignItems: 'center',
      minWidth: 70,
      shadowColor: accent1,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4
    },
    sendButtonDisabled: {
      backgroundColor: muted,
      shadowOpacity: 0.1,
      elevation: 1
    },
    sendButtonText: {
      color: '#fff',
      fontWeight: '600',
      fontSize: 16
    },
    suggestionsOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center'
    },
    suggestionsContainer: {
      backgroundColor: panelBg,
      borderRadius: 12,
      padding: 8,
      minWidth: 280,
      maxWidth: '80%',
      borderWidth: 1,
      borderColor: border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8
    },
    suggestionItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: border
    },
    suggestionName: {
      fontSize: 16,
      fontWeight: '600',
      color: textPrimary
    },
    suggestionHint: {
      fontSize: 14,
      color: muted,
      marginTop: 4
    },
    suggestionsContainerInline: {
      position: 'absolute',
      bottom: 80,
      left: 20,
      right: 20,
      backgroundColor: panelBg,
      borderRadius: 16,
      padding: 8,
      borderWidth: 1,
      borderColor: border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
      maxHeight: 200
    },
    messageTimestamp: {
      fontSize: 10,
      color: muted,
      marginTop: 4,
      textAlign: 'right'
    },
  // Reminder Peel Bar Styles
  peelBar: {
    backgroundColor: theme.peelBg || theme['--peel-bg'] || '#ffffff',
    borderRadius: 25,
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.border || theme['--border'] || '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 5,
    zIndex: 10
  },
  peelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  peelText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary || theme['--text-primary'] || '#2c3e50',
    flex: 1
  },
  peelIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.muted || theme['--muted'] || '#6c757d'
  },
  // Reminder Panel Styles
  reminderPanel: {
    backgroundColor: theme.panelBg || theme['--panel-bg'] || '#ffffff',
    marginHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: theme.border || theme['--border'] || '#e9ecef',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 15,
    elevation: 3,
    overflow: 'hidden'
  },
  reminderList: {
    padding: 20
  },
  noRemindersText: {
    fontSize: 14,
    color: theme.muted || theme['--muted'] || '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic'
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border || theme['--border'] || '#f1f3f4'
  },
  reminderInfo: {
    flex: 1
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.textPrimary || theme['--text-primary'] || '#2c3e50',
    marginBottom: 4
  },
  reminderDue: {
    fontSize: 12,
    color: theme.muted || theme['--muted'] || '#6c757d'
  },
  completeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.accent1 || theme['--accent-1'] || '#667eea',
    alignItems: 'center',
    justifyContent: 'center'
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold'
  }
  });
};
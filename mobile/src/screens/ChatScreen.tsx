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
  Animated
} from 'react-native';
import { parseCommand, suggestCommands, CommandDef } from '../lib/commands';
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
      const result = await apiGet('messages');
      if (Array.isArray(result) && result.length > 0) {
        const timestamp = Date.now();
        const loadedMessages = result.map((msg: any, index: number) => ({
          id: msg.id?.toString() || `${timestamp}-${index}`,
          role: msg.role || 'user',
          content: msg.content || 'No content available',
          created_at: msg.created_at
        }));

        // Sort messages by creation time to ensure proper order
        loadedMessages.sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeA - timeB;
        });

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
    if (!text || isLoading) return;

    setInputText('');
    setShowSuggestions(false);

    const parsed = parseCommand(text);

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

  const handleCommand = (parsed: ReturnType<typeof parseCommand>) => {
    addMessage('user', parsed.raw);

    switch (parsed.name) {
      case 'reminder':
        addMessage('assistant', `Opening reminders...`);
        navigation.navigate('Reminders');
        break;
      case 'note':
        addMessage('assistant', `Opening notes editor...`);
        navigation.navigate('Notes');
        break;
      case 'quiz':
        const topic = parsed.args || 'general';
        addMessage('assistant', `Starting quiz on: ${topic}`);
        navigation.navigate('Quiz', { topic });
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
        addMessage('assistant', `Command not implemented yet: ${parsed.name}`);
    }
  };

  const handleInputChange = (text: string) => {
    setInputText(text);

    if (text.startsWith('.')) {
      const suggestions = suggestCommands(text);
      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionSelect = (suggestion: CommandDef) => {
    setInputText(suggestion.name + ' ');
    setShowSuggestions(false);
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
  }, [messages, theme]);

  return (
    <SafeAreaView style={themedStyles.container}>
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
        style={themedStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={themedStyles.messagesList}
          contentContainerStyle={[
            themedStyles.messagesContainer,
            messages.length === 0 && { flex: 1, justifyContent: 'center' }
          ]}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        />

        {showSuggestions && (
          <Modal transparent animationType="fade">
            <TouchableOpacity
              style={themedStyles.suggestionsOverlay}
              onPress={() => setShowSuggestions(false)}
            >
              <View style={themedStyles.suggestionsContainer}>
                {suggestions.map((suggestion, index) => (
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
            </TouchableOpacity>
          </Modal>
        )}

        <View style={themedStyles.inputContainer}>
          <TextInput
            style={themedStyles.input}
            value={inputText}
            onChangeText={handleInputChange}
            placeholder="Type a message or command..."
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa' // Matches web --bg-gradient
  },
  messagesList: {
    flex: 1
  },
  messagesContainer: {
    padding: 20, // Matches web padding
    paddingBottom: 20
  },
  messageContainer: {
    marginBottom: 15, // Matches web gap
    maxWidth: '80%',
    borderRadius: 20, // Matches web border-radius
    padding: 12
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#667eea' // Matches web --user-bubble-bg gradient start
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa' // Matches web --chat-assistant-bg
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'System' // Will be overridden by Montserrat if available
  },
  userMessageText: {
    color: '#ffffff' // Matches web --user-text
  },
  assistantMessageText: {
    color: '#2c3e50' // Matches web --assistant-text
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Better alignment for mobile
    padding: 20, // Matches web padding
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#ffffff', // Matches web --panel-bg
    borderTopWidth: 1,
    borderTopColor: '#e9ecef' // Matches web --border
  },
  input: {
    flex: 1,
    borderWidth: 2, // Thicker border like web
    borderColor: '#e9ecef', // Matches web --border
    borderRadius: 25, // Matches web border-radius
    paddingHorizontal: 20, // Matches web padding
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    backgroundColor: '#f8f9fa', // Matches web --input-bg
    fontSize: 16 // Prevents zoom on iOS
  },
  sendButton: {
    backgroundColor: '#667eea', // Matches web --accent-1
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 70
  },
  sendButtonDisabled: {
    backgroundColor: '#9aa0ff'
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  suggestionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff', // Matches web --panel-bg
    borderRadius: 12,
    padding: 8,
    minWidth: 280,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: '#e9ecef' // Matches web --border
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef' // Matches web --border
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50' // Matches web --text-primary
  },
  suggestionHint: {
    fontSize: 14,
    color: '#6c757d', // Matches web --muted
    marginTop: 4
  }
});

// Create themed styles function - matches web version design
const createThemedStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bgGradient || theme['--bg-gradient'] || '#f5f7fa'
  },
  messagesList: {
    flex: 1
  },
  messagesContainer: {
    padding: 20, // Matches web padding
    paddingBottom: 20
  },
  messageContainer: {
    marginBottom: 15, // Matches web gap
    maxWidth: '80%',
    borderRadius: 20, // Matches web border-radius
    padding: 12
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.userBubbleBg || theme['--user-bubble-bg'] || '#667eea',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme.chatAssistantBg || theme['--chat-assistant-bg'] || '#f8f9fa',
    borderWidth: 1,
    borderColor: theme.border || theme['--border'] || '#e9ecef'
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    color: theme.messageText || theme['--message-text'] || theme.textPrimary || theme['--text-primary'] || '#2c3e50'
  },
  userMessageText: {
    color: theme.userText || theme['--user-text'] || '#ffffff',
    fontWeight: '500'
  },
  assistantMessageText: {
    color: theme.assistantText || theme['--assistant-text'] || theme.textPrimary || theme['--text-primary'] || '#2c3e50',
    fontWeight: '400'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20, // Matches web padding
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: theme.panelBg || theme['--panel-bg'] || '#ffffff',
    borderTopWidth: 1,
    borderTopColor: theme.border || theme['--border'] || '#e9ecef'
  },
  input: {
    flex: 1,
    borderWidth: 2, // Matches web thickness
    borderColor: theme.border || theme['--border'] || '#e9ecef',
    borderRadius: 25, // Matches web border-radius
    paddingHorizontal: 20, // Matches web padding
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    backgroundColor: theme.inputBg || theme['--input-bg'] || '#f8f9fa',
    fontSize: 16 // Prevents zoom on iOS
  },
  sendButton: {
    backgroundColor: theme.accent1 || theme['--accent-1'] || '#667eea',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    minWidth: 70
  },
  sendButtonDisabled: {
    backgroundColor: '#9aa0ff'
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16
  },
  suggestionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  suggestionsContainer: {
    backgroundColor: theme.panelBg || theme['--panel-bg'] || '#ffffff',
    borderRadius: 12,
    padding: 8,
    minWidth: 280,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: theme.border || theme['--border'] || '#e9ecef'
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border || theme['--border'] || '#e9ecef'
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.textPrimary || theme['--text-primary'] || '#2c3e50'
  },
  suggestionHint: {
    fontSize: 14,
    color: theme.muted || theme['--muted'] || '#6c757d',
    marginTop: 4
  },
  messageTimestamp: {
    fontSize: 10,
    color: theme.muted || theme['--muted'] || '#6c757d',
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
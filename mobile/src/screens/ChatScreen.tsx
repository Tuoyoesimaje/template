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
  ActivityIndicator
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

export default function ChatScreen({ navigation }: Props) {
  const { theme, setTheme, availableThemes } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<CommandDef[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Create themed styles based on current theme
  const themedStyles = createThemedStyles(theme);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const result = await apiGet('messages');
      if (Array.isArray(result)) {
        setMessages(result.map((msg: any) => ({
          id: msg.id?.toString() || Date.now().toString(),
          role: msg.role || 'user',
          content: msg.content || '',
          created_at: msg.created_at
        })));
      }
    } catch (e) {
      // Ignore errors on initial load
    }
  };

  const addMessage = (role: 'user' | 'assistant' | 'system', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
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
        {item.content}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={themedStyles.container}>
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
          contentContainerStyle={themedStyles.messagesContainer}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
    backgroundColor: '#f5f7fa'
  },
  messagesList: {
    flex: 1
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4f46e5'
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f9fa'
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20
  },
  userMessageText: {
    color: '#ffffff'
  },
  assistantMessageText: {
    color: '#0b1220'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    backgroundColor: '#f8f9fa'
  },
  sendButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#9aa0ff'
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  suggestionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  suggestionsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    minWidth: 280,
    maxWidth: '80%'
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0b1220'
  },
  suggestionHint: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 4
  }
});

// Create themed styles function
const createThemedStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme['--bg-gradient'] || '#f5f7fa'
  },
  messagesList: {
    flex: 1
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 20
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
    borderRadius: 16,
    padding: 12
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme['--user-bubble-bg'] || '#4f46e5'
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: theme['--chat-assistant-bg'] || '#f8f9fa'
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20
  },
  userMessageText: {
    color: theme['--user-text'] || '#ffffff'
  },
  assistantMessageText: {
    color: theme['--assistant-text'] || '#0b1220'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: theme['--panel-bg'] || '#ffffff',
    borderTopWidth: 1,
    borderTopColor: theme['--border'] || 'rgba(0,0,0,0.1)'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme['--border'] || 'rgba(0,0,0,0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    maxHeight: 100,
    backgroundColor: theme['--input-bg'] || '#f8f9fa'
  },
  sendButton: {
    backgroundColor: theme['--accent-1'] || '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#9aa0ff'
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600'
  },
  suggestionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  suggestionsContainer: {
    backgroundColor: theme['--panel-bg'] || '#ffffff',
    borderRadius: 12,
    padding: 8,
    minWidth: 280,
    maxWidth: '80%'
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme['--border'] || 'rgba(0,0,0,0.1)'
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme['--text-primary'] || '#0b1220'
  },
  suggestionHint: {
    fontSize: 14,
    color: theme['--muted'] || '#6c757d',
    marginTop: 4
  }
});
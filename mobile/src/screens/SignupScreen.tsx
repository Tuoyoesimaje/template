import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { resolveApiRoot, setToken, fetchWithRetries } from '../lib/core';
import { useTheme } from '../hooks/useTheme';

type Props = {
  navigation: { replace: (route: string) => void; navigate: (route: string) => void };
};

type Step = {
  id: string;
  prompt: string;
  key?: string;
  required?: boolean;
  type?: 'text' | 'password';
};

const STEPS: Step[] = [
  { id: 'welcome', prompt: 'Welcome. Type .signup to create an account, .login to go back, or press Next to begin.' },
  { id: 'email', prompt: "What's your email?", key: 'email', required: true },
  { id: 'password', prompt: "Choose a password.", key: 'password', required: true, type: 'password' },
  { id: 'name', prompt: "What's your name?", key: 'name', required: true },
  { id: 'school', prompt: "Class / School (optional)", key: 'school', required: false }
];

export default function SignupScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{type: 'prompt' | 'user', text: string}>>([]);

  // Create themed styles
  const themedStyles = createThemedStyles(theme);

  const currentStepData = STEPS[currentStep];

  useEffect(() => {
    // Initialize with welcome prompt
    setChatHistory([{ type: 'prompt', text: currentStepData.prompt }]);
  }, []);

  const addToChat = (type: 'prompt' | 'user', text: string) => {
    setChatHistory(prev => [...prev, { type, text }]);
  };

  const handleNext = async () => {
    const value = inputValue.trim();

    // Handle dot commands
    if (value.startsWith('.')) {
      const cmd = value.slice(1).toLowerCase();
      if (cmd === 'login') {
        navigation.navigate('Login');
        return;
      }
      if (cmd === 'home') {
        navigation.replace('Chat');
        return;
      }
    }

    // Validate required fields
    if (currentStepData.required && !value) {
      setMsg('This field is required.');
      return;
    }

    setMsg(null);

    // Store answer if this step has a key
    if (currentStepData.key) {
      setAnswers(prev => ({ ...prev, [currentStepData.key!]: value }));
      addToChat('user', currentStepData.type === 'password' ? '••••••' : value);
    }

    // Move to next step or finish
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setInputValue('');
      addToChat('prompt', STEPS[nextStep].prompt);
    } else {
      // Finish signup
      await finishSignup();
    }
  };

  const finishSignup = async () => {
    setBusy(true);
    setMsg('Creating account...');
    try {
      const root = await resolveApiRoot();
      const payload = {
        email: answers.email?.trim(),
        password: answers.password,
        name: answers.name,
        school: answers.school || ''
      };

      const r = await fetchWithRetries(`${root}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const j = await r.json();
      if (!r.ok) throw new Error((j && j.error) || 'Signup failed');

      if (j && j.token) {
        await setToken(j.token);
        addToChat('prompt', 'Account created — redirecting to preferences...');
        setMsg('Account created. Redirecting...');
        setTimeout(() => navigation.replace('Profile'), 800);
      } else {
        throw new Error('No token in response');
      }
    } catch (e: any) {
      setMsg(`Signup failed: ${e?.message || String(e)}`);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={themedStyles.root}>
      <View style={themedStyles.card}>
        <Text style={themedStyles.title}>Create Account</Text>

        <ScrollView style={themedStyles.chatArea} contentContainerStyle={themedStyles.chatContent}>
          {chatHistory.map((item, index) => (
            <View key={index} style={item.type === 'user' ? themedStyles.userMessage : themedStyles.promptMessage}>
              <Text style={item.type === 'user' ? themedStyles.userText : themedStyles.promptText}>
                {item.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        {currentStepData.id !== 'welcome' && (
          <View style={themedStyles.inputArea}>
            <TextInput
              style={themedStyles.input}
              value={inputValue}
              onChangeText={setInputValue}
              placeholder={currentStepData.prompt}
              secureTextEntry={currentStepData.type === 'password'}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={currentStepData.id === 'email' ? 'email-address' : 'default'}
              onSubmitEditing={handleNext}
              editable={!busy}
            />
            <Pressable
              style={[themedStyles.button, busy && themedStyles.buttonDisabled]}
              onPress={handleNext}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={themedStyles.buttonText}>
                  {currentStep === STEPS.length - 1 ? 'Create' : 'Next'}
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {currentStepData.id === 'welcome' && (
          <Pressable style={themedStyles.button} onPress={handleNext}>
            <Text style={themedStyles.buttonText}>Next</Text>
          </Pressable>
        )}

        {msg && <Text style={themedStyles.msg}>{msg}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    maxHeight: '80%'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0b1220',
    marginBottom: 16
  },
  chatArea: {
    maxHeight: 300,
    marginBottom: 16
  },
  chatContent: {
    paddingVertical: 8
  },
  promptMessage: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '80%'
  },
  userMessage: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    alignSelf: 'flex-end',
    maxWidth: '80%'
  },
  promptText: {
    color: '#0b1220',
    fontSize: 16
  },
  userText: {
    color: '#ffffff',
    fontSize: 16
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff'
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonDisabled: {
    backgroundColor: '#9aa0ff'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  msg: {
    marginTop: 10,
    color: '#6c757d',
    textAlign: 'center'
  }
});

// Create themed styles function
const createThemedStyles = (theme: any) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme['--bg-gradient'] || '#f5f7fa',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: theme['--panel-bg'] || '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
    maxHeight: '80%'
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme['--text-primary'] || '#0b1220',
    marginBottom: 16
  },
  chatArea: {
    maxHeight: 300,
    marginBottom: 16
  },
  chatContent: {
    paddingVertical: 8
  },
  promptMessage: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: theme['--chat-assistant-bg'] || '#f8f9fa',
    borderRadius: 12,
    alignSelf: 'flex-start',
    maxWidth: '80%'
  },
  userMessage: {
    marginBottom: 12,
    padding: 12,
    backgroundColor: theme['--user-bubble-bg'] || '#4f46e5',
    borderRadius: 12,
    alignSelf: 'flex-end',
    maxWidth: '80%'
  },
  promptText: {
    color: theme['--assistant-text'] || '#0b1220',
    fontSize: 16
  },
  userText: {
    color: theme['--user-text'] || '#ffffff',
    fontSize: 16
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme['--border'] || 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: theme['--input-bg'] || '#fff'
  },
  button: {
    backgroundColor: theme['--accent-1'] || '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonDisabled: {
    backgroundColor: '#9aa0ff'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  msg: {
    marginTop: 10,
    color: theme['--muted'] || '#6c757d',
    textAlign: 'center'
  }
});
import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { apiPost, apiGet } from '../lib/core';

type Props = {
  navigation: { replace: (route: string) => void };
};

type Step = {
  id: string;
  prompt: string;
  key?: string;
  required?: boolean;
  type?: 'text' | 'textarea';
};

const STEPS: Step[] = [
  { id: 'intro', prompt: 'Tell us a little about yourself. You can skip any optional fields.' },
  { id: 'name', prompt: "What's your name?", key: 'name', required: true },
  { id: 'school', prompt: "Class / School (optional)", key: 'school', required: false },
  { id: 'fav', prompt: "Favorite things (optional)", key: 'fav', required: false },
  { id: 'hobbies', prompt: "Hobbies (optional)", key: 'hobbies', required: false },
  { id: 'movies', prompt: "Best movies/music (optional)", key: 'movies', required: false },
  { id: 'goals', prompt: "Goals / what you want from the app (optional)", key: 'goals', required: false, type: 'textarea' }
];

export default function ProfileScreen({ navigation }: Props) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [inputValue, setInputValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{type: 'prompt' | 'user', text: string}>>([]);

  const currentStepData = STEPS[currentStep];

  useEffect(() => {
    // Load existing preferences
    loadExistingPreferences();
  }, []);

  useEffect(() => {
    // Update chat history when step changes
    if (currentStep === 0) {
      setChatHistory([{ type: 'prompt', text: currentStepData.prompt }]);
    }
  }, [currentStep]);

  const loadExistingPreferences = async () => {
    try {
      const result = await apiGet('user/preferences');
      if (result && result.meta) {
        setAnswers(result.meta);
        // Pre-populate answers and advance to first unanswered step
        for (let i = 1; i < STEPS.length; i++) {
          const step = STEPS[i];
          const metaValue = step.key && result.meta ? result.meta[step.key] : undefined;
          if (step.key && metaValue) {
            setChatHistory(prev => [
              ...prev,
              { type: 'prompt', text: step.prompt },
              { type: 'user', text: String(metaValue) }
            ]);
          } else {
            setCurrentStep(i);
            setChatHistory(prev => [...prev, { type: 'prompt', text: step.prompt }]);
            break;
          }
        }
      } else {
        setChatHistory([{ type: 'prompt', text: currentStepData.prompt }]);
      }
    } catch (e) {
      // If no existing preferences, start fresh
      setChatHistory([{ type: 'prompt', text: currentStepData.prompt }]);
    }
  };

  const addToChat = (type: 'prompt' | 'user', text: string) => {
    setChatHistory(prev => [...prev, { type, text }]);
  };

  const handleNext = async () => {
    const value = inputValue.trim();

    // Validate required fields
    if (currentStepData.required && !value && !(currentStepData.key && answers[currentStepData.key])) {
      setMsg('This field is required.');
      return;
    }

    setMsg(null);

    // Store answer if this step has a key
    if (currentStepData.key) {
      const finalValue = value || answers[currentStepData.key] || '';
      setAnswers(prev => ({ ...prev, [currentStepData.key!]: finalValue }));
      addToChat('user', finalValue || '(skipped)');
    }

    // Move to next step or finish
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setInputValue('');
      addToChat('prompt', STEPS[nextStep].prompt);
    } else {
      // Finish profile setup
      await saveProfile();
    }
  };

  const handleSkip = () => {
    if (currentStepData.required) {
      setMsg('This field is required and cannot be skipped.');
      return;
    }

    setMsg(null);

    // Store empty answer
    if (currentStepData.key) {
      setAnswers(prev => ({ ...prev, [currentStepData.key!]: '' }));
      addToChat('user', '(skipped)');
    }

    // Move to next step or finish
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setInputValue('');
      addToChat('prompt', STEPS[nextStep].prompt);
    } else {
      // Finish profile setup
      saveProfile();
    }
  };

  const saveProfile = async () => {
    setBusy(true);
    setMsg('Saving preferences...');
    try {
      await apiPost('user/preferences', { meta: answers });
      addToChat('prompt', 'Preferences saved. Your details will be included in future AI prompts.');
      setMsg('Preferences saved. Returning home...');
      setTimeout(() => navigation.replace('Chat'), 800);
    } catch (e: any) {
      setMsg(`Save failed: ${e?.message || String(e)}`);
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.card}>
        <Text style={styles.title}>Your Profile & Preferences</Text>

        <ScrollView style={styles.chatArea} contentContainerStyle={styles.chatContent}>
          {chatHistory.map((item, index) => (
            <View key={index} style={item.type === 'user' ? styles.userMessage : styles.promptMessage}>
              <Text style={item.type === 'user' ? styles.userText : styles.promptText}>
                {item.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        {currentStepData.id !== 'intro' && (
          <View style={styles.inputArea}>
            {currentStepData.type === 'textarea' ? (
              <TextInput
                style={[styles.input, styles.textarea]}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder={currentStepData.prompt}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!busy}
              />
            ) : (
              <TextInput
                style={styles.input}
                value={inputValue}
                onChangeText={setInputValue}
                placeholder={currentStepData.prompt}
                editable={!busy}
              />
            )}
            <View style={styles.buttonArea}>
              <Pressable
                style={[styles.button, styles.skipButton]}
                onPress={handleSkip}
                disabled={busy}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </Pressable>
              <Pressable
                style={[styles.button, busy && styles.buttonDisabled]}
                onPress={handleNext}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    {currentStep === STEPS.length - 1 ? 'Save' : 'Next'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        )}

        {currentStepData.id === 'intro' && (
          <Pressable style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>Next</Text>
          </Pressable>
        )}

        {msg && <Text style={styles.msg}>{msg}</Text>}
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
    gap: 8
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff'
  },
  textarea: {
    height: 80,
    textAlignVertical: 'top'
  },
  buttonArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  button: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1
  },
  buttonDisabled: {
    backgroundColor: '#9aa0ff'
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700'
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#4f46e5'
  },
  skipButtonText: {
    color: '#4f46e5',
    fontWeight: '600'
  },
  msg: {
    marginTop: 10,
    color: '#6c757d',
    textAlign: 'center'
  }
});
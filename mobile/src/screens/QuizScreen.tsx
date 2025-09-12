import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native';
import { postGemini } from '../lib/core';

type Question = {
  question: string;
  options: string[];
  correct: number;
};

type Props = {
  navigation: { goBack: () => void };
  route: { params?: { topic?: string } };
};

const QUIZ_TIME_LIMIT = 25; // seconds per question

export default function QuizScreen({ navigation, route }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_TIME_LIMIT);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const topic = route?.params?.topic || 'general';
  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  useEffect(() => {
    generateQuiz();
  }, []);

  useEffect(() => {
    if (!loading && !showResult && currentQuestion) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [loading, showResult, currentQuestionIndex]);

  const generateQuiz = async () => {
    setGenerating(true);
    try {
      const prompt = `Generate a quiz with 5 multiple-choice questions about "${topic}". Return JSON in this exact format: {"questions": [{"question": "Question text?", "options": ["A", "B", "C", "D"], "correct": 0}]} where correct is the index of the right answer.`;

      const response = await postGemini({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      // Try to parse the response
      let parsed;
      try {
        parsed = JSON.parse(response);
      } catch {
        // Try to extract JSON from the response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        }
      }

      if (parsed && parsed.questions && Array.isArray(parsed.questions)) {
        setQuestions(parsed.questions);
      } else {
        throw new Error('Invalid quiz format');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to generate quiz. Please try again.');
      navigation.goBack();
      return;
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    const isCorrect = answerIndex === currentQuestion.correct;
    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }

    // Auto-advance after 2 seconds
    setTimeout(() => {
      if (isLastQuestion) {
        showFinalResults();
      } else {
        nextQuestion();
      }
    }, 2000);
  };

  const handleTimeout = () => {
    setSelectedAnswer(null);
    setShowResult(true);
    setStreak(0);

    setTimeout(() => {
      if (isLastQuestion) {
        showFinalResults();
      } else {
        nextQuestion();
      }
    }, 2000);
  };

  const nextQuestion = () => {
    setCurrentQuestionIndex(prev => prev + 1);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeLeft(QUIZ_TIME_LIMIT);
  };

  const showFinalResults = () => {
    const percentage = Math.round((score / questions.length) * 100);
    let message = '';

    if (percentage >= 80) {
      message = '🎉 Excellent! You\'re a quiz master!';
    } else if (percentage >= 60) {
      message = '👍 Good job! Keep practicing!';
    } else {
      message = '📚 Keep studying and try again!';

    }

    Alert.alert(
      'Quiz Complete!',
      `Score: ${score}/${questions.length} (${percentage}%)\n${message}`,
      [
        { text: 'Try Again', onPress: () => resetQuiz() },
        { text: 'Done', onPress: () => navigation.goBack() }
      ]
    );
  };

  const resetQuiz = () => {
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setStreak(0);
    setTimeLeft(QUIZ_TIME_LIMIT);
    setSelectedAnswer(null);
    setShowResult(false);
    setLoading(true);
    generateQuiz();
  };

  if (loading || generating) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>
            {generating ? 'Generating quiz...' : 'Loading...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuestion) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load quiz</Text>
          <Pressable style={styles.retryButton} onPress={generateQuiz}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quiz: {topic}</Text>
        <View style={styles.stats}>
          <Text style={styles.statText}>Score: {score}</Text>
          <Text style={styles.statText}>Streak: {streak}</Text>
          <Text style={styles.statText}>
            {currentQuestionIndex + 1}/{questions.length}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }
            ]}
          />
        </View>
      </View>

      <View style={styles.timerContainer}>
        <View style={styles.timerBar}>
          <View
            style={[
              styles.timerFill,
              { width: `${(timeLeft / QUIZ_TIME_LIMIT) * 100}%` }
            ]}
          />
        </View>
        <Text style={styles.timerText}>{timeLeft}s</Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => {
            let buttonStyle = [styles.optionButton];
            let textStyle = [styles.optionText];

            if (showResult) {
              if (index === currentQuestion.correct) {
                buttonStyle.push(styles.correctOption);
                textStyle.push(styles.correctText);
              } else if (index === selectedAnswer) {
                buttonStyle.push(styles.incorrectOption);
                textStyle.push(styles.incorrectText);
              } else {
                buttonStyle.push(styles.disabledOption);
                textStyle.push(styles.disabledText);
              }
            }

            return (
              <Pressable
                key={index}
                style={buttonStyle}
                onPress={() => !showResult && handleAnswer(index)}
                disabled={showResult}
              >
                <Text style={textStyle}>{option}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {showResult && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultText}>
            {selectedAnswer === currentQuestion.correct
              ? '✅ Correct!'
              : selectedAnswer === null
                ? '⏰ Time\'s up!'
                : '❌ Incorrect'
            }
          </Text>
          {selectedAnswer !== currentQuestion.correct && selectedAnswer !== null && (
            <Text style={styles.correctAnswerText}>
              Correct: {currentQuestion.options[currentQuestion.correct]}
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 18,
    color: '#6c757d',
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)'
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b1220',
    flex: 1
  },
  stats: {
    flexDirection: 'row',
    gap: 16
  },
  statText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600'
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4f46e5',
    borderRadius: 3
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8
  },
  timerBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginRight: 12,
    overflow: 'hidden'
  },
  timerFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 2
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28a745',
    minWidth: 40,
    textAlign: 'right'
  },
  questionContainer: {
    flex: 1,
    padding: 20
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0b1220',
    marginBottom: 24,
    lineHeight: 28
  },
  optionsContainer: {
    gap: 12
  },
  optionButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  optionText: {
    fontSize: 16,
    color: '#0b1220',
    fontWeight: '500' as any
  },
  correctOption: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  correctText: {
    fontSize: 16,
    color: '#155724',
    fontWeight: '700'
  },
  incorrectOption: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  incorrectText: {
    fontSize: 16,
    color: '#721c24',
    fontWeight: '700'
  },
  disabledOption: {
    backgroundColor: '#f8f9fa',
    borderColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  disabledText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500'
  },
  resultContainer: {
    padding: 20,
    alignItems: 'center'
  },
  resultText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0b1220',
    marginBottom: 8
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center'
  }
});
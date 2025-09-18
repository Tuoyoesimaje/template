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
const QUIZ_QUESTION_COUNT = 10; // default number of questions

// Rich feedback messages for Duolingo-like experience
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

function randomFrom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

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
  const [currentFeedback, setCurrentFeedback] = useState<string>('');
  const [currentEncouragement, setCurrentEncouragement] = useState<string>('');

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
      const prompt = `Generate a quiz with ${QUIZ_QUESTION_COUNT} multiple-choice questions about "${topic}". Return JSON in this exact format: {"questions": [{"question": "Question text?", "options": ["A", "B", "C", "D"], "correct": 0}]} where correct is the index of the right answer.`;

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
    let feedback = '';
    let encouragement = '';

    if (isCorrect) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);

      // Rich positive feedback
      feedback = randomFrom(QUIZ_POSITIVE);

      // Add interjection for extra flavor
      if (Math.random() > 0.7) {
        feedback = randomFrom(QUIZ_INTERJECTION) + ' ' + feedback;
      }

      // Streak celebration
      if (streak >= 3) {
        encouragement = randomFrom(QUIZ_CELEBRATE);
      } else {
        encouragement = randomFrom(QUIZ_ENCOURAGE);
      }
    } else {
      setStreak(0);
      feedback = randomFrom(QUIZ_NEGATIVE);
      encouragement = randomFrom(QUIZ_ENCOURAGE);
    }

    setCurrentFeedback(feedback);
    setCurrentEncouragement(encouragement);

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

    // Rich feedback for timeout
    const feedback = randomFrom(QUIZ_NEGATIVE);
    const encouragement = randomFrom(QUIZ_ENCOURAGE);

    setCurrentFeedback(feedback);
    setCurrentEncouragement(encouragement);

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
    setCurrentFeedback('');
    setCurrentEncouragement('');
  };

  const showFinalResults = () => {
    const percentage = Math.round((score / questions.length) * 100);
    let message = '';

    if (percentage >= 80) {
      message = randomFrom(QUIZ_END_FUNNY);
    } else if (percentage >= 60) {
      message = randomFrom(QUIZ_END_FUNNY);
    } else {
      message = randomFrom(QUIZ_END_NEGATIVE);
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
    setCurrentFeedback('');
    setCurrentEncouragement('');
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
            {currentFeedback}
          </Text>
          {currentEncouragement && (
            <Text style={styles.encouragementText}>
              {currentEncouragement}
            </Text>
          )}
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
    backgroundColor: '#667eea'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4b5563',
    fontWeight: '600'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    fontSize: 18,
    color: '#4b5563',
    marginBottom: 20,
    fontWeight: '600'
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
    borderBottomColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1f2937',
    flex: 1
  },
  stats: {
    flexDirection: 'row',
    gap: 16
  },
  statText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '700'
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
    backgroundColor: '#58cc02',
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
    backgroundColor: '#ff9600',
    borderRadius: 2
  },
  timerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ff9600',
    minWidth: 40,
    textAlign: 'right'
  },
  questionContainer: {
    flex: 1,
    padding: 20
  },
  questionText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 24,
    lineHeight: 30,
    textAlign: 'center'
  },
  optionsContainer: {
    gap: 12
  },
  optionButton: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginVertical: 4
  },
  optionText: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '600' as any
  },
  correctOption: {
    backgroundColor: '#d4edda',
    borderColor: '#58cc02',
    padding: 16,
    borderRadius: 16,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginVertical: 4
  },
  correctText: {
    fontSize: 16,
    color: '#047857',
    fontWeight: '700'
  },
  incorrectOption: {
    backgroundColor: '#f8d7da',
    borderColor: '#ff4b4b',
    padding: 16,
    borderRadius: 16,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginVertical: 4
  },
  incorrectText: {
    fontSize: 16,
    color: '#dc2626',
    fontWeight: '700'
  },
  disabledOption: {
    backgroundColor: '#f8f9fa',
    borderColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 16,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginVertical: 4
  },
  disabledText: {
    fontSize: 16,
    color: '#9ca3af',
    fontWeight: '500'
  },
  resultContainer: {
    padding: 20,
    alignItems: 'center'
  },
  resultText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center'
  },
  correctAnswerText: {
    fontSize: 16,
    color: '#4b5563',
    textAlign: 'center',
    marginTop: 8
  },
  encouragementText: {
    fontSize: 14,
    color: '#4f46e5',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic'
  }
});
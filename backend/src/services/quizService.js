const quizTemplates = require('../data/quizTemplates');

class QuizService {
  constructor() {
    this.circuitBreaker = {
      failures: 0,
      lastFailureTime: 0,
      state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
      failureThreshold: 5,
      recoveryTimeout: 60000, // 1 minute
      successCount: 0,
      requiredSuccessCount: 3
    };

    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
      backoffMultiplier: 2
    };

    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      fallbackUsed: 0,
      lastApiCall: 0
    };
  }

  async generateQuiz(topic, count = 10) {
    this.stats.totalRequests++;

    // Circuit breaker check
    if (this.circuitBreaker.state === 'OPEN') {
      if (Date.now() - this.circuitBreaker.lastFailureTime > this.circuitBreaker.recoveryTimeout) {
        this.circuitBreaker.state = 'HALF_OPEN';
        this.circuitBreaker.successCount = 0;
      } else {
        console.log('[QuizService] Circuit breaker OPEN, using fallback');
        this.stats.fallbackUsed++;
        return this.getFallbackQuiz(topic, count);
      }
    }

    try {
      const quiz = await this.callGeminiWithRetry(topic, count);
      this.recordSuccess();
      this.stats.successfulRequests++;
      return quiz;
    } catch (error) {
      console.error('[QuizService] API call failed:', error.message);
      this.recordFailure();
      this.stats.failedRequests++;
      this.stats.fallbackUsed++;
      return this.getFallbackQuiz(topic, count);
    }
  }

  async callGeminiWithRetry(topic, count) {
    const GEMINI_API_URL = process.env.GEMINI_API_URL;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_URL || !GEMINI_API_KEY) {
      throw new Error('Gemini API configuration missing');
    }

    let lastError;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        this.stats.lastApiCall = Date.now();

        const prompt = `Generate a quiz with ${count} multiple-choice questions about "${topic}". Return JSON in this exact format: {"questions": [{"question": "Question text?", "options": ["A", "B", "C", "D"], "correct": 0}]} where correct is the index of the right answer (0-3). Make questions educational and appropriate for learning.`;

        const response = await fetch(GEMINI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [{
              role: 'user',
              parts: [{ text: prompt }]
            }]
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = new Error(`API request failed: ${response.status}`);
          error.status = response.status;
          error.details = errorData;
          throw error;
        }

        const data = await response.json();

        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid API response format');
        }

        const text = data.candidates[0].content.parts[0].text;
        const quizData = this.parseQuizResponse(text);

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
          throw new Error('No valid questions generated');
        }

        return quizData;

      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx) except 429
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        // Don't retry on the last attempt
        if (attempt === this.retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt),
          this.retryConfig.maxDelay
        );

        console.log(`[QuizService] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  parseQuizResponse(text) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const quizData = JSON.parse(jsonMatch[0]);

      // Validate the structure
      if (!quizData.questions || !Array.isArray(quizData.questions)) {
        throw new Error('Invalid quiz structure');
      }

      // Validate each question
      for (const question of quizData.questions) {
        if (!question.question || !Array.isArray(question.options) || question.options.length !== 4 || typeof question.correct !== 'number' || question.correct < 0 || question.correct > 3) {
          throw new Error('Invalid question format');
        }
      }

      return quizData;

    } catch (error) {
      console.error('[QuizService] Failed to parse quiz response:', error.message);
      throw new Error('Failed to parse AI response');
    }
  }

  recordFailure() {
    this.circuitBreaker.failures++;
    this.circuitBreaker.lastFailureTime = Date.now();
    this.circuitBreaker.successCount = 0;

    if (this.circuitBreaker.failures >= this.circuitBreaker.failureThreshold) {
      this.circuitBreaker.state = 'OPEN';
      console.log('[QuizService] Circuit breaker opened due to failures');
    }
  }

  recordSuccess() {
    this.circuitBreaker.failures = 0;

    if (this.circuitBreaker.state === 'HALF_OPEN') {
      this.circuitBreaker.successCount++;
      if (this.circuitBreaker.successCount >= this.circuitBreaker.requiredSuccessCount) {
        this.circuitBreaker.state = 'CLOSED';
        console.log('[QuizService] Circuit breaker closed - service recovered');
      }
    }
  }

  getFallbackQuiz(topic, count) {
    // Normalize topic to lowercase for matching
    const normalizedTopic = topic.toLowerCase();

    // Try to find a matching template
    let template = quizTemplates[normalizedTopic];

    // If no exact match, try partial matches
    if (!template) {
      for (const [key, value] of Object.entries(quizTemplates)) {
        if (normalizedTopic.includes(key) || key.includes(normalizedTopic)) {
          template = value;
          break;
        }
      }
    }

    // Fall back to general if no match
    if (!template) {
      template = quizTemplates.general;
    }

    // Return requested number of questions (or all available)
    const questions = template.slice(0, count);

    return {
      questions,
      source: 'fallback',
      topic: normalizedTopic,
      count: questions.length
    };
  }

  getStats() {
    return {
      ...this.stats,
      circuitBreaker: {
        state: this.circuitBreaker.state,
        failures: this.circuitBreaker.failures,
        lastFailureTime: this.circuitBreaker.lastFailureTime,
        successCount: this.circuitBreaker.successCount
      },
      uptime: Date.now() - this.stats.lastApiCall
    };
  }

  resetCircuitBreaker() {
    this.circuitBreaker.failures = 0;
    this.circuitBreaker.successCount = 0;
    this.circuitBreaker.state = 'CLOSED';
    this.circuitBreaker.lastFailureTime = 0;
    console.log('[QuizService] Circuit breaker manually reset');
  }
}

module.exports = QuizService;
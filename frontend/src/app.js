
// =====================
        // App State & Storage
        // =====================
    let reminderPanelOpen = false;
    let currentQuiz = null;
    let currentQuestionIndex = 0;
    // Quiz UI state
    let quizScore = 0;
    let quizStreak = 0;
    let totalQuizQuestions = 0;
    let quizDesiredCount = 10; // default to 10 questions per user request
    // Per-question timer (seconds)
    let quizTimerInterval = null;
    let quizTimeLeft = 0;
    const QUIZ_TIME_LIMIT = 25; // seconds per question
    let quizAdvanceTimeout = null; // auto-advance after answer/timeout
    let currentTimerUid = null; // unique id for current question timer elements

    // Friendly quiz messages and helpers for a Duolingo-like experience
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

    function randomFrom(arr) { return arr[Math.floor(Math.random()*arr.length)]; }

    // Extra flavor messages to make responses feel unique
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

    // Extra negative/funny endings for even more variety
    const EXTRA_QUIZ_END_NEGATIVE = [
        "Well, that was educational... for the quiz.",
        "You and this quiz have unresolved issues. Try mediation.",
        "I believe in you. The quiz... not so much.",
        "Ouch. Time to blame the planetary alignment.",
        "Consider this a gentle reminder: practice beats panic.",
        "Not the performance we practiced for — encore?",
        "Looks like the quiz set the difficulty to 'legendary'.",
        "It's okay. Even legends have off days (and so do brains).",
        "That score has character. Let's improve the plot next time.",
        "Well, now you know what to study — silver lining!"
    ];

    // merge extras into main negative pool for random selection
    for (const t of EXTRA_QUIZ_END_NEGATIVE) QUIZ_END_NEGATIVE.push(t);

    // In-memory structures (will be synced with localStorage)
    let reminders = [];
    // Active reminder timers keyed by reminder id (or index when id missing)
    let reminderTimers = new Map();
    // Periodic background check for reminders and server sync
    let reminderCheckIntervalId = null;
    const REMINDER_CHECK_INTERVAL = 30 * 1000; // 30s
        let notes = [];
    // Track server message ids we've rendered to avoid duplicates on load
    let seenMessageIds = new Set();
        let quizData = {
            spanish: [
                { question: "What does 'Hola' mean in English?", options: ["Goodbye", "Hello", "Please", "Thank you"], correct: 1 },
                { question: "How do you say 'cat' in Spanish?", options: ["Perro", "Gato", "Pájaro", "Pez"], correct: 1 },
                { question: "What is 'gracias' in English?", options: ["Please", "Sorry", "Thank you", "You're welcome"], correct: 2 }
            ],
            math: [
                { question: "What is 15 × 7?", options: ["95", "105", "115", "125"], correct: 1 },
                { question: "What is the square root of 144?", options: ["11", "12", "13", "14"], correct: 1 },
                { question: "What is 8² + 3²?", options: ["73", "64", "81", "100"], correct: 0 }
            ]
        };

        // Theme config
        const THEMES = {
            light: {
                '--bg-gradient': 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                '--panel-bg': '#ffffff',
                '--muted': '#6c757d',
                '--accent-1': '#667eea',
                '--accent-2': '#764ba2',
                '--peel-bg': 'linear-gradient(145deg, #ffffff, #f8f9fa)',
                '--chat-assistant-bg': 'linear-gradient(145deg, #f8f9fa, #e9ecef)',
                '--chat-system-bg': 'linear-gradient(145deg, #e3f2fd, #bbdefb)',
                '--user-bubble-bg': 'linear-gradient(145deg, #667eea, #764ba2)',
                '--input-bg': '#f8f9fa',
            },
            dark: {
                '--bg-gradient': 'linear-gradient(135deg,#071021 0%,#06101a 100%)',
                '--panel-bg': '#071021',
                '--text-primary': '#e6eef6',
                '--muted': '#9fb0c8',
                '--border': '#123047',
                '--accent-1': '#4f46e5',
                '--accent-2': '#06b6d4',
                '--peel-bg': 'linear-gradient(145deg,#081426,#0b2230)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#0b1622,#0f2430)',
                '--chat-system-bg': 'linear-gradient(145deg,#06283d,#064663)',
                '--user-bubble-bg': 'linear-gradient(145deg,#2b6cb0,#235a7a)',
                '--input-bg': '#061526',
                '--system-text': '#a8d1ff',
                '--assistant-text': '#e6eef6',
                '--user-text': '#ffffff',
                '--peel-soon-bg': 'linear-gradient(145deg,#063b66,#05507f)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#3a1111,#5a1b1b)',
                '--peel-soon-border': '#4fb3ff',
                '--peel-overdue-border': '#ff7b7b',
                '--peel-indicator-soon': '#4fb3ff',
                '--peel-indicator-overdue': '#ff7b7b',
                    '--notes-overlay-bg': 'rgba(7,16,33,0.95)',
            },
            blue: {
                '--bg-gradient': 'linear-gradient(135deg,#eef5ff 0%,#e2edff 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#0b2540',
                '--muted': '#4b6b8a',
                '--border': '#d6e6fb',
                '--accent-1': '#2563eb',
                '--accent-2': '#1e40af',
                '--peel-bg': 'linear-gradient(145deg,#f3f9ff,#e6f2ff)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fbfdff,#f2f8ff)',
                '--chat-system-bg': 'linear-gradient(145deg,#dbeafe,#bfdbfe)',
                '--user-bubble-bg': 'linear-gradient(145deg,#1e63d6,#174a9a)',
                '--input-bg': '#f3f9ff',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#cfe6ff,#b6dbff)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffdfe0,#ffd6d6)',
                '--peel-indicator-soon': '#1e63d6',
                '--peel-indicator-overdue': '#d64545',
            },
            green: {
                '--bg-gradient': 'linear-gradient(135deg,#f6fff5 0%,#e6f9ea 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#043023',
                '--muted': '#2f855a',
                '--border': '#dff3ea',
                '--accent-1': '#16a34a',
                '--accent-2': '#059669',
                '--peel-bg': 'linear-gradient(145deg,#f3fff6,#e6fbef)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f7fff9,#eefdf4)',
                '--chat-system-bg': 'linear-gradient(145deg,#dff7e6,#bff0c9)',
                '--user-bubble-bg': 'linear-gradient(145deg,#2f855a,#15703b)',
                '--input-bg': '#f6fff6',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#cfeedd,#b6e7c4)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#2f855a',
                '--peel-indicator-overdue': '#c24141',
            }
            ,
            pink: {
                '--bg-gradient': 'linear-gradient(135deg,#fff0f7 0%,#ffe6f0 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#2b1220',
                '--muted': '#7a5a6a',
                '--border': '#ffdbea',
                '--accent-1': '#f472b6',
                '--accent-2': '#ec4899',
                '--peel-bg': 'linear-gradient(145deg,#fff4fb,#ffe7f5)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fff8fb,#fff0f6)',
                '--chat-system-bg': 'linear-gradient(145deg,#ffe6f3,#ffd6ea)',
                '--user-bubble-bg': 'linear-gradient(145deg,#f472b6,#d9467a)',
                '--input-bg': '#fff6fb',
                '--notes-overlay-bg': 'rgba(255,250,252,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#ffd6ee,#ffc0e6)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffdede,#ffcccc)',
                '--peel-indicator-soon': '#f472b6',
                '--peel-indicator-overdue': '#ff6b6b'
            },
            gray: {
                '--bg-gradient': 'linear-gradient(135deg,#f7f7f8 0%,#ebebec 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#1f2933',
                '--muted': '#6b7280',
                '--border': '#e6e7e9',
                '--accent-1': '#6b7280',
                '--accent-2': '#4b5563',
                '--peel-bg': 'linear-gradient(145deg,#fbfbfc,#f0f0f2)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fbfbfc,#f5f5f7)',
                '--chat-system-bg': 'linear-gradient(145deg,#eef2f6,#e6ebf0)',
                '--user-bubble-bg': 'linear-gradient(145deg,#4b5563,#374151)',
                '--input-bg': '#f7f7f8',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#e9edf3,#dfe6ef)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffecec,#ffdede)',
                '--peel-indicator-soon': '#6b7280',
                '--peel-indicator-overdue': '#d64545'
            },
            purple: {
                '--bg-gradient': 'linear-gradient(135deg,#f3e8ff 0%,#e9d5ff 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#2d1b69',
                '--muted': '#7c3aed',
                '--border': '#d8b4fe',
                '--accent-1': '#8b5cf6',
                '--accent-2': '#7c3aed',
                '--peel-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#faf5ff,#f3e8ff)',
                '--chat-system-bg': 'linear-gradient(145deg,#e9d5ff,#d8b4fe)',
                '--user-bubble-bg': 'linear-gradient(145deg,#8b5cf6,#7c3aed)',
                '--input-bg': '#f3e8ff',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#ddd6fe,#c4b5fd)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#8b5cf6',
                '--peel-indicator-overdue': '#dc3545'
            },
            orange: {
                '--bg-gradient': 'linear-gradient(135deg,#fff7ed 0%,#fed7aa 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#7c2d12',
                '--muted': '#ea580c',
                '--border': '#fdba74',
                '--accent-1': '#f97316',
                '--accent-2': '#ea580c',
                '--peel-bg': 'linear-gradient(145deg,#fff7ed,#fef3c7)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fff8f1,#fef3c7)',
                '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--user-bubble-bg': 'linear-gradient(145deg,#f97316,#ea580c)',
                '--input-bg': '#fff7ed',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#f97316',
                '--peel-indicator-overdue': '#dc3545'
            },
            yellow: {
                '--bg-gradient': 'linear-gradient(135deg,#fefce8 0%,#fde68a 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#713f12',
                '--muted': '#d97706',
                '--border': '#fcd34d',
                '--accent-1': '#f59e0b',
                '--accent-2': '#d97706',
                '--peel-bg': 'linear-gradient(145deg,#fefce8,#fef3c7)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fffbeb,#fef3c7)',
                '--chat-system-bg': 'linear-gradient(145deg,#fde68a,#fcd34d)',
                '--user-bubble-bg': 'linear-gradient(145deg,#f59e0b,#d97706)',
                '--input-bg': '#fefce8',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#fde68a,#fcd34d)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#f59e0b',
                '--peel-indicator-overdue': '#dc3545'
            },
            brown: {
                '--bg-gradient': 'linear-gradient(135deg,#f5f5f4 0%,#d6d3d1 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#44403c',
                '--muted': '#a8a29e',
                '--border': '#d6d3d1',
                '--accent-1': '#78716c',
                '--accent-2': '#57534e',
                '--peel-bg': 'linear-gradient(145deg,#f5f5f4,#e7e5e4)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fafaf9,#f5f5f4)',
                '--chat-system-bg': 'linear-gradient(145deg,#d6d3d1,#a8a29e)',
                '--user-bubble-bg': 'linear-gradient(145deg,#78716c,#57534e)',
                '--input-bg': '#f5f5f4',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#d6d3d1,#a8a29e)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#78716c',
                '--peel-indicator-overdue': '#dc3545'
            },
            sunset: {
                '--bg-gradient': 'linear-gradient(135deg,#fef2f2 0%,#fecaca 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#7f1d1d',
                '--muted': '#dc2626',
                '--border': '#fca5a5',
                '--accent-1': '#ef4444',
                '--accent-2': '#dc2626',
                '--peel-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
                '--chat-system-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--user-bubble-bg': 'linear-gradient(145deg,#ef4444,#dc2626)',
                '--input-bg': '#fef2f2',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#ef4444',
                '--peel-indicator-overdue': '#dc3545'
            },
            ocean: {
                '--bg-gradient': 'linear-gradient(135deg,#ecfeff 0%,#a5f3fc 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#164e63',
                '--muted': '#0891b2',
                '--border': '#67e8f9',
                '--accent-1': '#06b6d4',
                '--accent-2': '#0891b2',
                '--peel-bg': 'linear-gradient(145deg,#ecfeff,#cffafe)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f0fdfa,#ecfeff)',
                '--chat-system-bg': 'linear-gradient(145deg,#a5f3fc,#67e8f9)',
                '--user-bubble-bg': 'linear-gradient(145deg,#06b6d4,#0891b2)',
                '--input-bg': '#ecfeff',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#a5f3fc,#67e8f9)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#06b6d4',
                '--peel-indicator-overdue': '#dc3545'
            },
            red: {
                '--bg-gradient': 'linear-gradient(135deg,#fef2f2 0%,#fecaca 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#7f1d1d',
                '--muted': '#dc2626',
                '--border': '#fca5a5',
                '--accent-1': '#ef4444',
                '--accent-2': '#dc2626',
                '--peel-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
                '--chat-system-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--user-bubble-bg': 'linear-gradient(145deg,#ef4444,#dc2626)',
                '--input-bg': '#fef2f2',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#ef4444',
                '--peel-indicator-overdue': '#dc3545'
            },
            teal: {
                '--bg-gradient': 'linear-gradient(135deg,#f0fdfa 0%,#ccfbf1 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#115e59',
                '--muted': '#0d9488',
                '--border': '#5eead4',
                '--accent-1': '#14b8a6',
                '--accent-2': '#0d9488',
                '--peel-bg': 'linear-gradient(145deg,#f0fdfa,#ecfdf5)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f0fdfa,#ecfdf5)',
                '--chat-system-bg': 'linear-gradient(145deg,#ccfbf1,#5eead4)',
                '--user-bubble-bg': 'linear-gradient(145deg,#14b8a6,#0d9488)',
                '--input-bg': '#f0fdfa',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#ccfbf1,#5eead4)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#14b8a6',
                '--peel-indicator-overdue': '#dc3545'
            },
            indigo: {
                '--bg-gradient': 'linear-gradient(135deg,#eef2ff 0%,#c7d2fe 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#312e81',
                '--muted': '#6366f1',
                '--border': '#a5b4fc',
                '--accent-1': '#818cf8',
                '--accent-2': '#6366f1',
                '--peel-bg': 'linear-gradient(145deg,#eef2ff,#e0e7ff)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f5f3ff,#eef2ff)',
                '--chat-system-bg': 'linear-gradient(145deg,#c7d2fe,#a5b4fc)',
                '--user-bubble-bg': 'linear-gradient(145deg,#818cf8,#6366f1)',
                '--input-bg': '#eef2ff',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#c7d2fe,#a5b4fc)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#818cf8',
                '--peel-indicator-overdue': '#dc3545'
            },
            rainbow: {
                '--bg-gradient': 'linear-gradient(135deg,#fef3c7 0%,#a7f3d0 50%,#bfdbfe 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#1f2937',
                '--muted': '#7c3aed',
                '--border': '#d1d5db',
                '--accent-1': '#8b5cf6',
                '--accent-2': '#06b6d4',
                '--peel-bg': 'linear-gradient(145deg,#fef3c7,#fde68a)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fef3c7,#fde68a)',
                '--chat-system-bg': 'linear-gradient(145deg,#a7f3d0,#6ee7b7)',
                '--user-bubble-bg': 'linear-gradient(145deg,#8b5cf6,#7c3aed)',
                '--input-bg': '#fef3c7',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#a7f3d0,#6ee7b7)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-indicator-soon': '#10b981',
                '--peel-indicator-overdue': '#ef4444'
            },
            lime: {
                '--bg-gradient': 'linear-gradient(135deg,#f7fee7 0%,#d9f99d 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#365314',
                '--muted': '#65a30d',
                '--border': '#bef264',
                '--accent-1': '#84cc16',
                '--accent-2': '#65a30d',
                '--peel-bg': 'linear-gradient(145deg,#f7fee7,#ecfccb)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f7fee7,#ecfccb)',
                '--chat-system-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
                '--user-bubble-bg': 'linear-gradient(145deg,#84cc16,#65a30d)',
                '--input-bg': '#f7fee7',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#84cc16',
                '--peel-indicator-overdue': '#dc3545'
            },
            cyan: {
                '--bg-gradient': 'linear-gradient(135deg,#ecfeff 0%,#cffafe 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#164e63',
                '--muted': '#0891b2',
                '--border': '#67e8f9',
                '--accent-1': '#06b6d4',
                '--accent-2': '#0891b2',
                '--peel-bg': 'linear-gradient(145deg,#ecfeff,#cffafe)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#ecfeff,#cffafe)',
                '--chat-system-bg': 'linear-gradient(145deg,#a5f3fc,#67e8f9)',
                '--user-bubble-bg': 'linear-gradient(145deg,#06b6d4,#0891b2)',
                '--input-bg': '#ecfeff',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#a5f3fc,#67e8f9)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#06b6d4',
                '--peel-indicator-overdue': '#dc3545'
            },
            rose: {
                '--bg-gradient': 'linear-gradient(135deg,#fff1f2 0%,#fce7f3 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#831843',
                '--muted': '#db2777',
                '--border': '#f9a8d4',
                '--accent-1': '#ec4899',
                '--accent-2': '#db2777',
                '--peel-bg': 'linear-gradient(145deg,#fff1f2,#fce7f3)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fff1f2,#fce7f3)',
                '--chat-system-bg': 'linear-gradient(145deg,#fce7f3,#f9a8d4)',
                '--user-bubble-bg': 'linear-gradient(145deg,#ec4899,#db2777)',
                '--input-bg': '#fff1f2',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#fce7f3,#f9a8d4)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#ec4899',
                '--peel-indicator-overdue': '#dc3545'
            },
            amber: {
                '--bg-gradient': 'linear-gradient(135deg,#fffbeb 0%,#fed7aa 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#78350f',
                '--muted': '#d97706',
                '--border': '#fdba74',
                '--accent-1': '#f97316',
                '--accent-2': '#d97706',
                '--peel-bg': 'linear-gradient(145deg,#fffbeb,#fef3c7)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fffbeb,#fef3c7)',
                '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--user-bubble-bg': 'linear-gradient(145deg,#f97316,#d97706)',
                '--input-bg': '#fffbeb',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#f97316',
                '--peel-indicator-overdue': '#dc3545'
            },
            emerald: {
                '--bg-gradient': 'linear-gradient(135deg,#ecfdf5 0%,#a7f3d0 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#064e3b',
                '--muted': '#047857',
                '--border': '#6ee7b7',
                '--accent-1': '#10b981',
                '--accent-2': '#047857',
                '--peel-bg': 'linear-gradient(145deg,#ecfdf5,#d1fae5)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#ecfdf5,#d1fae5)',
                '--chat-system-bg': 'linear-gradient(145deg,#a7f3d0,#6ee7b7)',
                '--user-bubble-bg': 'linear-gradient(145deg,#10b981,#047857)',
                '--input-bg': '#ecfdf5',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#a7f3d0,#6ee7b7)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#10b981',
                '--peel-indicator-overdue': '#dc3545'
            },
            sky: {
                '--bg-gradient': 'linear-gradient(135deg,#f0f9ff 0%,#bae6fd 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#0c4a6e',
                '--muted': '#0369a1',
                '--border': '#7dd3fc',
                '--accent-1': '#0ea5e9',
                '--accent-2': '#0369a1',
                '--peel-bg': 'linear-gradient(145deg,#f0f9ff,#e0f2fe)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f0f9ff,#e0f2fe)',
                '--chat-system-bg': 'linear-gradient(145deg,#bae6fd,#7dd3fc)',
                '--user-bubble-bg': 'linear-gradient(145deg,#0ea5e9,#0369a1)',
                '--input-bg': '#f0f9ff',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#bae6fd,#7dd3fc)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#0ea5e9',
                '--peel-indicator-overdue': '#dc3545'
            },
            violet: {
                '--bg-gradient': 'linear-gradient(135deg,#f5f3ff 0%,#c4b5fd 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#581c87',
                '--muted': '#7c3aed',
                '--border': '#a78bfa',
                '--accent-1': '#8b5cf6',
                '--accent-2': '#7c3aed',
                '--peel-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
                '--chat-system-bg': 'linear-gradient(145deg,#c4b5fd,#a78bfa)',
                '--user-bubble-bg': 'linear-gradient(145deg,#8b5cf6,#7c3aed)',
                '--input-bg': '#f5f3ff',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#c4b5fd,#a78bfa)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#8b5cf6',
                '--peel-indicator-overdue': '#dc3545'
            },
            fuchsia: {
                '--bg-gradient': 'linear-gradient(135deg,#fdf4ff 0%,#f0abfc 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#701a75',
                '--muted': '#c026d3',
                '--border': '#e879f9',
                '--accent-1': '#d946ef',
                '--accent-2': '#c026d3',
                '--peel-bg': 'linear-gradient(145deg,#fdf4ff,#fce7f3)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fdf4ff,#fce7f3)',
                '--chat-system-bg': 'linear-gradient(145deg,#f0abfc,#e879f9)',
                '--user-bubble-bg': 'linear-gradient(145deg,#d946ef,#c026d3)',
                '--input-bg': '#fdf4ff',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#f0abfc,#e879f9)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#d946ef',
                '--peel-indicator-overdue': '#dc3545'
            },
            aurora: {
                '--bg-gradient': 'linear-gradient(135deg,#ecfdf5 0%,#a5f3fc 50%,#c4b5fd 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#1f2937',
                '--muted': '#059669',
                '--border': '#6b7280',
                '--accent-1': '#10b981',
                '--accent-2': '#0891b2',
                '--peel-bg': 'linear-gradient(145deg,#ecfdf5,#d1fae5)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#ecfdf5,#d1fae5)',
                '--chat-system-bg': 'linear-gradient(145deg,#a5f3fc,#67e8f9)',
                '--user-bubble-bg': 'linear-gradient(145deg,#8b5cf6,#7c3aed)',
                '--input-bg': '#ecfdf5',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#a5f3fc,#67e8f9)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-indicator-soon': '#06b6d4',
                '--peel-indicator-overdue': '#ef4444'
            },
            forest: {
                '--bg-gradient': 'linear-gradient(135deg,#f0fdf4 0%,#d9f99d 30%,#a3a3a3 70%,#92400e 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#14532d',
                '--muted': '#166534',
                '--border': '#86efac',
                '--accent-1': '#22c55e',
                '--accent-2': '#15803d',
                '--peel-bg': 'linear-gradient(145deg,#f0fdf4,#dcfce7)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f0fdf4,#dcfce7)',
                '--chat-system-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
                '--user-bubble-bg': 'linear-gradient(145deg,#a3a3a3,#78716c)',
                '--input-bg': '#f0fdf4',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-indicator-soon': '#16a34a',
                '--peel-indicator-overdue': '#dc2626'
            },
            fire: {
                '--bg-gradient': 'linear-gradient(135deg,#fef2f2 0%,#fed7aa 40%,#fde68a 70%,#fca5a5 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#7f1d1d',
                '--muted': '#dc2626',
                '--border': '#fca5a5',
                '--accent-1': '#ef4444',
                '--accent-2': '#dc2626',
                '--peel-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
                '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--user-bubble-bg': 'linear-gradient(145deg,#f97316,#ea580c)',
                '--input-bg': '#fef2f2',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#f97316',
                '--peel-indicator-overdue': '#dc3545'
            },
            ice: {
                '--bg-gradient': 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 30%,#bae6fd 60%,#a5f3fc 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#0f172a',
                '--muted': '#334155',
                '--border': '#cbd5e1',
                '--accent-1': '#0ea5e9',
                '--accent-2': '#0284c7',
                '--peel-bg': 'linear-gradient(145deg,#f8fafc,#f1f5f9)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f8fafc,#f1f5f9)',
                '--chat-system-bg': 'linear-gradient(145deg,#bae6fd,#7dd3fc)',
                '--user-bubble-bg': 'linear-gradient(145deg,#06b6d4,#0891b2)',
                '--input-bg': '#f8fafc',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#bae6fd,#7dd3fc)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-indicator-soon': '#0ea5e9',
                '--peel-indicator-overdue': '#ef4444'
            },
            galaxy: {
                '--bg-gradient': 'linear-gradient(135deg,#2d1b69 0%,#3730a3 30%,#7c3aed 60%,#c026d3 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#581c87',
                '--muted': '#7c3aed',
                '--border': '#a78bfa',
                '--accent-1': '#8b5cf6',
                '--accent-2': '#a855f7',
                '--peel-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
                '--chat-system-bg': 'linear-gradient(145deg,#c4b5fd,#a78bfa)',
                '--user-bubble-bg': 'linear-gradient(145deg,#d946ef,#c026d3)',
                '--input-bg': '#f5f3ff',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#c4b5fd,#a78bfa)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-indicator-soon': '#8b5cf6',
                '--peel-indicator-overdue': '#ef4444'
            },
            desert: {
                '--bg-gradient': 'linear-gradient(135deg,#fef3c7 0%,#fed7aa 30%,#d97706 60%,#92400e 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#78350f',
                '--muted': '#d97706',
                '--border': '#fdba74',
                '--accent-1': '#f97316',
                '--accent-2': '#ea580c',
                '--peel-bg': 'linear-gradient(145deg,#fffbeb,#fef3c7)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fffbeb,#fef3c7)',
                '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--user-bubble-bg': 'linear-gradient(145deg,#d97706,#92400e)',
                '--input-bg': '#fffbeb',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#f97316',
                '--peel-indicator-overdue': '#dc3545'
            },
            meadow: {
                '--bg-gradient': 'linear-gradient(135deg,#f0fdf4 0%,#d9f99d 40%,#fce7f3 70%,#e9d5ff 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#14532d',
                '--muted': '#16a34a',
                '--border': '#86efac',
                '--accent-1': '#22c55e',
                '--accent-2': '#059669',
                '--peel-bg': 'linear-gradient(145deg,#f0fdf4,#dcfce7)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f0fdf4,#dcfce7)',
                '--chat-system-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
                '--user-bubble-bg': 'linear-gradient(145deg,#ec4899,#db2777)',
                '--input-bg': '#f0fdf4',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-indicator-soon': '#16a34a',
                '--peel-indicator-overdue': '#dc2626'
            },
            storm: {
                '--bg-gradient': 'linear-gradient(135deg,#1e293b 0%,#334155 30%,#475569 60%,#64748b 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#0f172a',
                '--muted': '#475569',
                '--border': '#cbd5e1',
                '--accent-1': '#64748b',
                '--accent-2': '#475569',
                '--peel-bg': 'linear-gradient(145deg,#f8fafc,#f1f5f9)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f8fafc,#f1f5f9)',
                '--chat-system-bg': 'linear-gradient(145deg,#e2e8f0,#cbd5e1)',
                '--user-bubble-bg': 'linear-gradient(145deg,#6366f1,#4f46e5)',
                '--input-bg': '#f8fafc',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#e2e8f0,#cbd5e1)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-indicator-soon': '#64748b',
                '--peel-indicator-overdue': '#ef4444'
            },
            candy: {
                '--bg-gradient': 'linear-gradient(135deg,#fdf2f8 0%,#dbeafe 30%,#fef3c7 60%,#fce7f3 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#831843',
                '--muted': '#db2777',
                '--border': '#f9a8d4',
                '--accent-1': '#ec4899',
                '--accent-2': '#3b82f6',
                '--peel-bg': 'linear-gradient(145deg,#fdf2f8,#fce7f3)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fdf2f8,#fce7f3)',
                '--chat-system-bg': 'linear-gradient(145deg,#dbeafe,#bfdbfe)',
                '--user-bubble-bg': 'linear-gradient(145deg,#f59e0b,#d97706)',
                '--input-bg': '#fdf2f8',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#dbeafe,#bfdbfe)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#3b82f6',
                '--peel-indicator-overdue': '#dc2626'
            },
            autumn: {
                '--bg-gradient': 'linear-gradient(135deg,#fef2f2 0%,#fed7aa 30%,#dc2626 60%,#7c2d12 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#7f1d1d',
                '--muted': '#dc2626',
                '--border': '#fca5a5',
                '--accent-1': '#ef4444',
                '--accent-2': '#ea580c',
                '--peel-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fef2f2,#fee2e2)',
                '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--user-bubble-bg': 'linear-gradient(145deg,#92400e,#78350f)',
                '--input-bg': '#fef2f2',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#ea580c',
                '--peel-indicator-overdue': '#dc3545'
            },
            sunrise: {
                '--bg-gradient': 'linear-gradient(135deg,#fdf2f8 0%,#fed7aa 40%,#fef3c7 70%,#fce7f3 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#831843',
                '--muted': '#db2777',
                '--border': '#f9a8d4',
                '--accent-1': '#ec4899',
                '--accent-2': '#f97316',
                '--peel-bg': 'linear-gradient(145deg,#fdf2f8,#fce7f3)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fdf2f8,#fce7f3)',
                '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--user-bubble-bg': 'linear-gradient(145deg,#f59e0b,#d97706)',
                '--input-bg': '#fdf2f8',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#f97316',
                '--peel-indicator-overdue': '#dc2626'
            },
            twilight: {
                '--bg-gradient': 'linear-gradient(135deg,#1e1b4b 0%,#312e81 30%,#7c3aed 60%,#db2777 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#1e1b4b',
                '--muted': '#312e81',
                '--border': '#6366f1',
                '--accent-1': '#4f46e5',
                '--accent-2': '#7c3aed',
                '--peel-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f5f3ff,#ede9fe)',
                '--chat-system-bg': 'linear-gradient(145deg,#c4b5fd,#a78bfa)',
                '--user-bubble-bg': 'linear-gradient(145deg,#db2777,#be185d)',
                '--input-bg': '#f5f3ff',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#c4b5fd,#a78bfa)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-indicator-soon': '#4f46e5',
                '--peel-indicator-overdue': '#dc2626'
            },
            neon: {
                '--bg-gradient': 'linear-gradient(135deg,#0c0a09 0%,#ec4899 30%,#06b6d4 60%,#10b981 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#0c0a09',
                '--muted': '#374151',
                '--border': '#6b7280',
                '--accent-1': '#ec4899',
                '--accent-2': '#06b6d4',
                '--peel-bg': 'linear-gradient(145deg,#f9fafb,#f3f4f6)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f9fafb,#f3f4f6)',
                '--chat-system-bg': 'linear-gradient(145deg,#dbeafe,#bfdbfe)',
                '--user-bubble-bg': 'linear-gradient(145deg,#10b981,#059669)',
                '--input-bg': '#f9fafb',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#dbeafe,#bfdbfe)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-indicator-soon': '#06b6d4',
                '--peel-indicator-overdue': '#dc2626'
            },
            vintage: {
                '--bg-gradient': 'linear-gradient(135deg,#fef7ed 0%,#d6d3d1 30%,#a8a29e 60%,#78716c 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#374151',
                '--muted': '#6b7280',
                '--border': '#d1d5db',
                '--accent-1': '#92400e',
                '--accent-2': '#a16207',
                '--peel-bg': 'linear-gradient(145deg,#fef7ed,#fffbeb)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fef7ed,#fffbeb)',
                '--chat-system-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--user-bubble-bg': 'linear-gradient(145deg,#78716c,#57534e)',
                '--input-bg': '#fef7ed',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#fed7aa,#fdba74)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#a16207',
                '--peel-indicator-overdue': '#dc2626'
            },
            tropical: {
                '--bg-gradient': 'linear-gradient(135deg,#ecfdf5 0%,#d9f99d 30%,#fed7aa 60%,#fce7f3 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#14532d',
                '--muted': '#16a34a',
                '--border': '#86efac',
                '--accent-1': '#22c55e',
                '--accent-2': '#f97316',
                '--peel-bg': 'linear-gradient(145deg,#ecfdf5,#dcfce7)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#ecfdf5,#dcfce7)',
                '--chat-system-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
                '--user-bubble-bg': 'linear-gradient(145deg,#ec4899,#db2777)',
                '--input-bg': '#ecfdf5',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#d9f99d,#bef264)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-indicator-soon': '#22c55e',
                '--peel-indicator-overdue': '#dc2626'
            },
            metallic: {
                '--bg-gradient': 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 30%,#f59e0b 60%,#b91c1c 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#1f2937',
                '--muted': '#4b5563',
                '--border': '#9ca3af',
                '--accent-1': '#f59e0b',
                '--accent-2': '#dc2626',
                '--peel-bg': 'linear-gradient(145deg,#f8fafc,#f1f5f9)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f8fafc,#f1f5f9)',
                '--chat-system-bg': 'linear-gradient(145deg,#e2e8f0,#cbd5e1)',
                '--user-bubble-bg': 'linear-gradient(145deg,#7c3aed,#5b21b6)',
                '--input-bg': '#f8fafc',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#e2e8f0,#cbd5e1)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#fecaca,#fca5a5)',
                '--peel-indicator-soon': '#f59e0b',
                '--peel-indicator-overdue': '#dc2626'
            },
            pastel: {
                '--bg-gradient': 'linear-gradient(135deg,#fdf2f8 0%,#e0e7ff 30%,#f0fdf4 60%,#fef7ed 100%)',
                '--panel-bg': '#ffffff',
                '--text-primary': '#374151',
                '--muted': '#6b7280',
                '--border': '#d1d5db',
                '--accent-1': '#ec4899',
                '--accent-2': '#6366f1',
                '--peel-bg': 'linear-gradient(145deg,#fdf2f8,#fce7f3)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#fdf2f8,#fce7f3)',
                '--chat-system-bg': 'linear-gradient(145deg,#e0e7ff,#c7d2fe)',
                '--user-bubble-bg': 'linear-gradient(145deg,#22c55e,#16a34a)',
                '--input-bg': '#fdf2f8',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-soon-bg': 'linear-gradient(145deg,#e0e7ff,#c7d2fe)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#ffe6e6,#ffdede)',
                '--peel-indicator-soon': '#6366f1',
                '--peel-indicator-overdue': '#dc2626'
            },
            'dark-blue': {
                '--bg-gradient': 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
                '--panel-bg': '#0f172a',
                '--text-primary': '#f1f5f9',
                '--muted': '#94a3b8',
                '--border': '#334155',
                '--accent-1': '#3b82f6',
                '--accent-2': '#1d4ed8',
                '--peel-bg': 'linear-gradient(145deg,#1e293b,#334155)',
                '--peel-soon-bg': 'linear-gradient(145deg,#1e40af,#1e3a8a)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#7f1d1d,#991b1b)',
                '--peel-indicator-soon': '#3b82f6',
                '--peel-indicator-overdue': '#ef4444',
                '--notes-overlay-bg': 'rgba(15,23,42,0.95)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#1e293b,#334155)',
                '--chat-system-bg': 'linear-gradient(145deg,#1e40af,#1e3a8a)',
                '--user-bubble-bg': 'linear-gradient(145deg,#3b82f6,#1d4ed8)',
                '--input-bg': '#1e293b',
                '--system-text': '#93c5fd',
                '--assistant-text': '#f1f5f9',
                '--user-text': '#ffffff'
            },
            'dark-green': {
                '--bg-gradient': 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
                '--panel-bg': '#0f172a',
                '--text-primary': '#f1f5f9',
                '--muted': '#94a3b8',
                '--border': '#334155',
                '--accent-1': '#10b981',
                '--accent-2': '#059669',
                '--peel-bg': 'linear-gradient(145deg,#1e293b,#334155)',
                '--peel-soon-bg': 'linear-gradient(145deg,#065f46,#047857)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#7f1d1d,#991b1b)',
                '--peel-indicator-soon': '#10b981',
                '--peel-indicator-overdue': '#ef4444',
                '--notes-overlay-bg': 'rgba(15,23,42,0.95)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#1e293b,#334155)',
                '--chat-system-bg': 'linear-gradient(145deg,#065f46,#047857)',
                '--user-bubble-bg': 'linear-gradient(145deg,#10b981,#059669)',
                '--input-bg': '#1e293b',
                '--system-text': '#6ee7b7',
                '--assistant-text': '#f1f5f9',
                '--user-text': '#ffffff'
            },
            'dark-purple': {
                '--bg-gradient': 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
                '--panel-bg': '#0f172a',
                '--text-primary': '#f1f5f9',
                '--muted': '#94a3b8',
                '--border': '#334155',
                '--accent-1': '#8b5cf6',
                '--accent-2': '#7c3aed',
                '--peel-bg': 'linear-gradient(145deg,#1e293b,#334155)',
                '--peel-soon-bg': 'linear-gradient(145deg,#5b21b6,#6d28d9)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#7f1d1d,#991b1b)',
                '--peel-indicator-soon': '#8b5cf6',
                '--peel-indicator-overdue': '#ef4444',
                '--notes-overlay-bg': 'rgba(15,23,42,0.95)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#1e293b,#334155)',
                '--chat-system-bg': 'linear-gradient(145deg,#5b21b6,#6d28d9)',
                '--user-bubble-bg': 'linear-gradient(145deg,#8b5cf6,#7c3aed)',
                '--input-bg': '#1e293b',
                '--system-text': '#c4b5fd',
                '--assistant-text': '#f1f5f9',
                '--user-text': '#ffffff'
            },
            'dark-red': {
                '--bg-gradient': 'linear-gradient(135deg,#0f172a 0%,#1e293b 100%)',
                '--panel-bg': '#0f172a',
                '--text-primary': '#f1f5f9',
                '--muted': '#94a3b8',
                '--border': '#334155',
                '--accent-1': '#ef4444',
                '--accent-2': '#dc2626',
                '--peel-bg': 'linear-gradient(145deg,#1e293b,#334155)',
                '--peel-soon-bg': 'linear-gradient(145deg,#991b1b,#b91c1c)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#7f1d1d,#991b1b)',
                '--peel-indicator-soon': '#ef4444',
                '--peel-indicator-overdue': '#f87171',
                '--notes-overlay-bg': 'rgba(15,23,42,0.95)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#1e293b,#334155)',
                '--chat-system-bg': 'linear-gradient(145deg,#991b1b,#b91c1c)',
                '--user-bubble-bg': 'linear-gradient(145deg,#ef4444,#dc2626)',
                '--input-bg': '#1e293b',
                '--system-text': '#fca5a5',
                '--assistant-text': '#f1f5f9',
                '--user-text': '#ffffff'
            },
            'darker-teal': {
                '--bg-gradient': 'linear-gradient(135deg,#0f4c3a 0%,#1e5f4c 100%)',
                '--panel-bg': '#0f4c3a',
                '--text-primary': '#ecfdf5',
                '--muted': '#86efac',
                '--border': '#065f46',
                '--accent-1': '#0d9488',
                '--accent-2': '#0f766e',
                '--peel-bg': 'linear-gradient(145deg,#1e5f4c,#2d7a5f)',
                '--peel-soon-bg': 'linear-gradient(145deg,#065f46,#047857)',
                '--peel-overdue-bg': 'linear-gradient(145deg,#7f1d1d,#991b1b)',
                '--peel-indicator-soon': '#0d9488',
                '--peel-indicator-overdue': '#ef4444',
                '--notes-overlay-bg': 'rgba(15,76,58,0.95)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#1e5f4c,#2d7a5f)',
                '--chat-system-bg': 'linear-gradient(145deg,#065f46,#047857)',
                '--user-bubble-bg': 'linear-gradient(145deg,#0d9488,#0f766e)',
                '--input-bg': '#1e5f4c',
                '--system-text': '#5eead4',
                '--assistant-text': '#ecfdf5',
                '--user-text': '#ffffff'
            }
        };

        // =====================
        // LocalStorage Helpers
        // =====================
        function saveState() {
            localStorage.setItem('sa_reminders', JSON.stringify(reminders));
            localStorage.setItem('sa_notes', JSON.stringify(notes));
            localStorage.setItem('sa_theme', localStorage.getItem('sa_theme') || 'light');
        }

        function loadState() {
            try {
                const r = JSON.parse(localStorage.getItem('sa_reminders') || 'null');
                const n = JSON.parse(localStorage.getItem('sa_notes') || 'null');
                const theme = localStorage.getItem('sa_theme') || 'light';

                reminders = Array.isArray(r) ? r : [];

                notes = Array.isArray(n) ? n : [];
                applyTheme(theme, false);
            } catch (e) {
                console.error('Failed to load state', e);
            }
        }

    // Configuration: Gemini endpoint (set via .setEndpoint or .setProxy). Leave empty to use fallback/demo.
    function getGeminiEndpoint() { return localStorage.getItem('sa_gemini_endpoint') || localStorage.getItem('sa_gemini_proxy') || ''; }

    // API Key helpers
        function setApiKey(key) {
            localStorage.setItem('sa_api_key', key);
                addLocalMessage('API key saved.', 'assistant');
        }

        function getApiKey() {
            return localStorage.getItem('sa_api_key') || '';
        }

        // =====================
        // UI Update Functions
        // =====================
        function updatePeelBar() {
            const peelBar = document.getElementById('peelBar');
            const peelText = document.getElementById('peelText');

            const upcomingReminder = reminders.find(r => r.status === 'soon') || reminders.find(r => r.status === 'overdue') || reminders[0];
            if (!upcomingReminder) {
                peelText.textContent = 'No reminders';
                peelBar.className = 'peel-bar';
                return;
            }

                peelText.textContent = `${upcomingReminder.title} - ${upcomingReminder.dueDate}`;
                peelBar.className = `peel-bar ${upcomingReminder.status}`;
        }

        // Format a timestamp to a friendly string (Today/Tomorrow or full date)
        function formatTimestamp(ts) {
            if (!ts) return '';
            const d = new Date(ts);
            const now = new Date();
            const isToday = d.toDateString() === now.toDateString();
            const tomorrow = new Date(now); tomorrow.setDate(now.getDate()+1);
            const isTomorrow = d.toDateString() === tomorrow.toDateString();
            const hh = d.getHours();
            const mm = d.getMinutes();
            const ampm = hh >= 12 ? 'PM' : 'AM';
            const hour12 = ((hh + 11) % 12) + 1;
            const mins = mm.toString().padStart(2, '0');
            if (isToday) return `Today ${hour12}:${mins} ${ampm}`;
            if (isTomorrow) return `Tomorrow ${hour12}:${mins} ${ampm}`;
            return d.toLocaleString();
        }

        // Schedule all reminders and set timers for those with timestamps
        function scheduleAllReminders() {
            // clear previous timers
            console.log('[reminder] scheduleAllReminders: clearing', reminderTimers.size, 'timers');
            for (const t of reminderTimers.values()) {
                try { clearTimeout(t); } catch (e) {}
            }
            reminderTimers.clear();

            // perform immediate check for overdue reminders before scheduling future timers
            performReminderChecks();

            const now = Date.now();
            for (let i = 0; i < reminders.length; i++) {
                const r = reminders[i];
                // skip completed reminders
                if (r.status === 'completed' || r.fired) continue;
                // prefer numeric timestamp
                const ts = Number(r.timestamp) || null;
                if (!ts) continue;
                const delay = ts - now;
                if (delay <= 0) {
                    // overdue or due now -> trigger immediately (but defer to allow UI update)
                    console.log('[reminder] trigger immediately (overdue) index=', i, 'title=', r.title, 'ts=', ts);
                    setTimeout(() => triggerReminder(i), 200);
                } else {
                    // schedule exact trigger; cap delay to max safe timeout
                    const safeDelay = Math.min(delay, 2147483640);
                    const to = setTimeout(() => triggerReminder(i), safeDelay);
                    reminderTimers.set(r.id || i, to);
                    console.log('[reminder] scheduled index=', i, 'title=', r.title, 'in ms=', safeDelay, 'key=', (r.id||i));
                }
            }
            // ensure periodic check exists to catch missed/unsynced reminders
            if (!reminderCheckIntervalId) {
                reminderCheckIntervalId = setInterval(() => {
                    try { performReminderChecks(); } catch (e) { console.warn('Reminder check failed', e); }
                }, REMINDER_CHECK_INTERVAL);
            }
        }

        function performReminderChecks() {
            const now = Date.now();
            let updated = false;
            for (let i = 0; i < reminders.length; i++) {
                const r = reminders[i];
                if (r.status === 'completed' || r.fired) continue;
                const ts = Number(r.timestamp) || null;
                const prev = r.status;
                r.status = computeStatusFromTimestamp(ts, r.dueDate);
                if (r.status !== prev) updated = true;
                if (ts && ts <= now && !r.fired) {
                    // fire it
                    console.log('[reminder] performReminderChecks firing index=', i, 'title=', r.title, 'ts=', ts);
            triggerReminder(i);
                    updated = true;
                }
            }
            if (updated) persistAndRefresh();
        }

        async function triggerReminder(index) {
            const r = reminders[index];
            if (!r || r.fired || r.status === 'completed') return;
            console.log('[reminder] triggerReminder index=', index, 'title=', r && r.title);
        r.fired = true;
            // mark overdue and persist
            r.status = computeStatusFromTimestamp(r.timestamp, r.dueDate);
            persistAndRefresh();

            const title = r.title || 'Reminder';
            const body = r.dueDate || formatTimestamp(r.timestamp) || 'It is time.';

            // Show browser notification when permitted
            try {
                if (typeof Notification !== 'undefined') {
                    if (Notification.permission === 'default') await Notification.requestPermission();
                    if (Notification.permission === 'granted') {
                        const n = new Notification(title, { body, silent: false });
                        // close notification after 8s
                        setTimeout(() => { try { n.close(); } catch (e) {} }, 8000);
                    } else {
                        // fallback to in-app message and sound
                        addMessage(`🔔 Reminder: ${escapeHtml(title)} — ${escapeHtml(body)}`, 'assistant', true);
                        try { playReminderBeep(); } catch(e){}
                    }
                } else {
                    addMessage(`🔔 Reminder: ${escapeHtml(title)} — ${escapeHtml(body)}`, 'assistant', true);
                    try { playReminderBeep(); } catch(e){}
                }
            } catch (e) {
                // ensure user sees it in app if Notification API fails
                addMessage(`🔔 Reminder: ${escapeHtml(title)} — ${escapeHtml(body)}`, 'assistant', true);
            }

            // attempt to persist completion server-side (mark as fired/completed timestamp)
            try {
                if (r.id) {
                    await apiPut(`reminders/${r.id}`, { status: 'completed', completedAt: Date.now() });
                }
            } catch (e) { /* ignore server errors */ }
        }

        // Play a short beep using WebAudio as a fallback attention signal
        function playReminderBeep() {
            try {
                const ctx = new (window.AudioContext || window.webkitAudioContext)();
                const o = ctx.createOscillator();
                const g = ctx.createGain();
                o.type = 'sine'; o.frequency.value = 880;
                o.connect(g); g.connect(ctx.destination);
                o.start(); g.gain.setValueAtTime(0.001, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
                setTimeout(()=>{ try { o.stop(); ctx.close(); } catch(e){} }, 1200);
            } catch (e) { /* ignore audio failures */ }
        }

        // Debug helpers: expose to window so you can run from console
        window.debugReminders = function() { console.debug('reminders', reminders); return reminders; };
        window.testReminderIn = function(seconds = 10, title = 'Test Reminder') {
            const ts = Date.now() + (seconds * 1000);
            const item = { title, dueDate: formatTimestamp(ts), timestamp: ts, status: computeStatusFromTimestamp(ts, ''), createdAt: Date.now() };
            reminders.push(item);
            persistAndRefresh();
            console.log('[reminder] testReminderIn scheduled for', seconds, 's ->', item);
            return item;
        };

        // Rotate peel contents every 15s (small, centered peel)
        let peelRotateIndex = 0;
        function startPeelRotation() {
            try { clearInterval(window._peelRotateInterval); } catch (e) {}
            window._peelRotateInterval = setInterval(() => {
                const list = reminders.slice().sort((a,b)=>0); // copy
                if (!list.length) return;
                peelRotateIndex = (peelRotateIndex + 1) % list.length;
                const r = list[peelRotateIndex];
                const peelText = document.getElementById('peelText');
                if (peelText) peelText.textContent = `${r.title} - ${r.dueDate}`;
            }, 15000);
        }

        function stopPeelRotation() { try { clearInterval(window._peelRotateInterval); } catch (e) {} }

        function toggleReminderPanel() {
            const panel = document.getElementById('reminderPanel');
            reminderPanelOpen = !reminderPanelOpen;

            if (reminderPanelOpen) panel.classList.add('expanded'); else panel.classList.remove('expanded');
        }

        function populateReminderPanel() {
            const reminderList = document.getElementById('reminderList');
            // Render reminder items with a 'Complete' action; items clickable to toggle completion
            reminderList.innerHTML = reminders.map(reminder => `
                <div class="reminder-item" data-id="${escapeHtml(reminder.id || '')}">
                    <div class="reminder-info" style="cursor:pointer" data-action="toggle">
                        <h4>${escapeHtml(reminder.title)}</h4>
                        <p>${escapeHtml(reminder.dueDate)}</p>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px">
                        <div class="reminder-status status-${reminder.status}">
                            ${escapeHtml(reminder.status ? (reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)) : 'Pending')}
                        </div>
                    </div>
                </div>
            `).join('');

            // Entire reminder item is clickable: single click marks as completed (no separate button)
            reminderList.querySelectorAll('.reminder-item').forEach(item => {
                item.addEventListener('click', async () => {
                    const id = item.getAttribute('data-id');
                    const title = item.querySelector('h4') ? item.querySelector('h4').textContent : '';
                    const idx = reminders.findIndex(r => String(r.id) === String(id) || (!id && r.title === title));
                    if (idx === -1) return;
                    // mark completed locally with timestamp
                    reminders[idx].status = 'completed';
                    reminders[idx].completedAt = Date.now();
                    // Visually strike-through
                    const titleEl = item.querySelector('h4'); if (titleEl) titleEl.style.textDecoration = 'line-through';
                    // Persist to server if possible
                    try {
                        if (reminders[idx].id) {
                            await apiPut(`reminders/${reminders[idx].id}`, { status: 'completed', completedAt: reminders[idx].completedAt });
                        } else {
                            const saved = await apiPost('reminders', { title: reminders[idx].title, dueDate: reminders[idx].dueDate, timestamp: reminders[idx].timestamp || null, status: 'completed', completedAt: reminders[idx].completedAt });
                            reminders[idx].id = saved.id;
                        }
                    } catch (err) { console.warn('Failed to persist completion', err); }
                    // Remove from peel view (updatePeelBar ignores 'completed')
                    persistAndRefresh();
                });
            });

            // Cleanup: remove completed reminders older than 4 hours (both locally and attempt server delete)
            try {
                const FOUR_HOURS = 1000 * 60 * 60 * 4;
                const now = Date.now();
                const toRemove = reminders.filter(r => r.status === 'completed' && r.completedAt && (now - r.completedAt > FOUR_HOURS));
                if (toRemove.length) {
                    (async ()=>{
                        for (const r of toRemove) {
                            const idx = reminders.findIndex(x => x === r);
                            if (idx !== -1) reminders.splice(idx,1);
                            if (r.id) {
                                try { await apiDelete(`reminders/${r.id}`); } catch (e) { /* ignore */ }
                            }
                        }
                        localStorage.setItem('sa_reminders', JSON.stringify(reminders));
                        updatePeelBar();
                        populateReminderPanel();
                    })();
                }
            } catch (e) { /* non-fatal */ }
        }

        // =====================
        // Chat / Commands
        // =====================
    function addMessage(content, type = 'user', persist = true) {
            const chatArea = document.getElementById('chatArea');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            // allow markdown-like rendering for assistant/system messages
            const bubble = document.createElement('div'); bubble.className='message-bubble';
            if (type === 'assistant' || type === 'system') {
                // render basic markdown: headings (#), bold **, italics *, lists, code blocks
                bubble.innerHTML = renderBasicMarkdown(content);
            } else {
                bubble.innerHTML = escapeHtml(content);
            }
            messageDiv.appendChild(bubble);
            chatArea.appendChild(messageDiv);
            chatArea.scrollTop = chatArea.scrollHeight;
            // persist chat message to server if requested
            if (persist) {
                (async ()=>{
                    try {
                        const res = await apiPost('messages', { role: type, content: (type === 'assistant' || type === 'system') ? bubble.textContent : content });
                        // if server returns an id, mark it as seen to avoid re-rendering duplicates
                        if (res && res.id) seenMessageIds.add(String(res.id));
                    } catch (e) { /* non-fatal */ }
                })();
            }
        }

        // Helper for command feedback / UI-only messages that should NOT be persisted to server
        function addLocalMessage(content, type = 'assistant') {
            return addMessage(content, type, false);
        }

    // -------------------
    // Command Autocomplete
    // -------------------
    const COMMANDS = [
        { name: '.reminder', hint: 'Create or toggle reminders', aliases: ['r','rem','remi'] },
        { name: '.edit.reminder', hint: 'Edit an existing reminder', aliases: ['edit.reminder','er'] },
        { name: '.delete.reminder', hint: 'Delete a reminder', aliases: ['delete.reminder','dr'] },
        { name: '.note', hint: 'Open notes editor or create a note', aliases: ['n'] },
    { name: '.generate', hint: 'Generate content via AI (notes, summaries)', aliases: ['g','gen','generate'] },
        { name: '.theme', hint: 'Change UI theme (e.g. .theme dark)', aliases: ['t'] },
        { name: '.setApiKey', hint: 'Save API key for Gemini proxy', aliases: ['setapi','key','s'] },
        { name: '.quiz', hint: 'Start a quiz (.quiz.math)', aliases: ['q'] },
    { name: '.suggest', hint: 'Ask AI for suggested tasks or ideas', aliases: ['suggest','sug'] },
        { name: '.setEndpoint', hint: 'Set Gemini endpoint', aliases: ['endpoint'] },
        { name: '.setProxy', hint: 'Set Gemini proxy', aliases: ['proxy'] }
    ];

    let _cmdSuggest = null;
    let _cmdSuggestIndex = -1;

    function initCommandAutocomplete() {
        const input = document.getElementById('messageInput');
        if (!input) return;

        // create suggestion box
        _cmdSuggest = document.createElement('div');
        _cmdSuggest.id = 'cmdSuggest';
        // Use fixed positioning so it won't be clipped by parent containers; we'll compute viewport-safe coords
        _cmdSuggest.style.position = 'fixed';
        _cmdSuggest.style.zIndex = 9999;
        _cmdSuggest.style.minWidth = '220px';
        _cmdSuggest.style.background = 'var(--panel-bg, #fff)';
        _cmdSuggest.style.border = '1px solid rgba(0,0,0,0.08)';
        _cmdSuggest.style.boxShadow = '0 6px 18px rgba(0,0,0,0.08)';
        _cmdSuggest.style.borderRadius = '8px';
        _cmdSuggest.style.padding = '6px 0';
        _cmdSuggest.style.display = 'none';
        _cmdSuggest.style.fontSize = '13px';
        _cmdSuggest.style.maxHeight = '240px';
        _cmdSuggest.style.overflow = 'auto';
        document.body.appendChild(_cmdSuggest);

        function position() {
            const rect = input.getBoundingClientRect();
            const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
            const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

            // suggested width (don't exceed viewport)
            const desiredWidth = Math.min(360, Math.max(220, rect.width));
            _cmdSuggest.style.width = desiredWidth + 'px';

            // measure estimated height (use maxHeight if not measured yet)
            const estHeight = Math.min(240, _cmdSuggest.scrollHeight || 200);

            // space below and above the input
            const spaceBelow = vh - rect.bottom;
            const spaceAbove = rect.top;

            let top;
            // flip above when not enough space below and there is more space above
            if (spaceBelow < estHeight + 12 && spaceAbove > spaceBelow) {
                top = Math.max(8, rect.top - estHeight - 8);
            } else {
                top = Math.min(vh - estHeight - 8, rect.bottom + 6);
            }

            // keep within horizontal bounds
            let left = rect.left;
            if (left + desiredWidth > vw - 8) {
                left = Math.max(8, rect.right - desiredWidth);
            }

            _cmdSuggest.style.left = Math.max(8, left) + 'px';
            _cmdSuggest.style.top = Math.max(8, top) + 'px';
        }

        function hide() {
            _cmdSuggest.style.display = 'none';
            _cmdSuggestIndex = -1;
        }

        function show(matches) {
            if (!matches || !matches.length) { hide(); return; }
            _cmdSuggest.innerHTML = '';
            matches.forEach((m, i) => {
                const el = document.createElement('div');
                el.className = 'cmd-suggestion';
                el.style.padding = '8px 12px';
                el.style.cursor = 'pointer';
                el.style.display = 'flex';
                el.style.justifyContent = 'space-between';
                el.style.gap = '8px';
                el.innerHTML = `<div style="color:var(--text-primary)"><strong>${escapeHtml(m.name)}</strong><div style="font-size:12px;color:var(--muted);margin-top:4px">${escapeHtml(m.hint)}</div></div>`;
                el.addEventListener('click', ()=>{ applySuggestion(m); hide(); input.focus(); });
                _cmdSuggest.appendChild(el);
            });
            position();
            _cmdSuggest.style.display = 'block';
        }

        function applySuggestion(cmd) {
            // place the full command into the input, preserving any trailing args placeholder
            input.value = cmd.name + ' ';
            try {
                // put cursor at end
                input.focus();
                const len = input.value.length;
                input.setSelectionRange(len, len);
            } catch (e) { /* ignore if not supported */ }
            // notify any input listeners and ensure suggestions update/hide
            try { input.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
        }

        function updateSuggestions() {
            const val = (input.value || '').trim();
            if (!val.startsWith('.')) { hide(); return; }
            const q = val.slice(1).toLowerCase();
            const matches = COMMANDS.filter(c => c.name.slice(1).startsWith(q) || c.aliases.some(a => a.startsWith(q))).slice(0,8);
            show(matches);
        }

        input.addEventListener('input', () => { updateSuggestions(); });
    input.addEventListener('blur', () => { setTimeout(()=>{ if (_cmdSuggest) _cmdSuggest.style.display='none'; }, 120); });
        input.addEventListener('keydown', (e)=>{
            if (!_cmdSuggest || _cmdSuggest.style.display === 'none') return;
            const items = Array.from(_cmdSuggest.querySelectorAll('.cmd-suggestion'));
            if (!items.length) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); _cmdSuggestIndex = Math.min(_cmdSuggestIndex + 1, items.length - 1); items.forEach((it, i)=> it.style.background = i===_cmdSuggestIndex ? 'rgba(0,0,0,0.06)' : 'transparent'); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); _cmdSuggestIndex = Math.max(_cmdSuggestIndex - 1, 0); items.forEach((it, i)=> it.style.background = i===_cmdSuggestIndex ? 'rgba(0,0,0,0.06)' : 'transparent'); }
            else if (e.key === 'Tab' || e.key === 'Enter') {
                if (_cmdSuggestIndex === -1) _cmdSuggestIndex = 0;
                const sel = items[_cmdSuggestIndex];
                if (sel) {
                    e.preventDefault(); sel.click();
                }
            }
        });
    }

        // Minimal markdown renderer for preview and assistant messages
        function renderBasicMarkdown(md) {
            if (!md) return '';
            // escape then replace simple patterns
            let s = md.toString();
            // If content contains HTML, keep as-is (used elsewhere)
            if (s.trim().startsWith('<div') || s.trim().startsWith('<pre') || s.trim().startsWith('<')) return s;
            s = escapeHtml(s);
            // code fences
            s = s.replace(/```([\s\S]*?)```/g, (m, code)=>`<pre style="background:#0b1220;color:#e6eef6;padding:8px;border-radius:6px;overflow:auto">${escapeHtml(code)}</pre>`);
            // headings
            s = s.replace(/^### (.*$)/gim, (m, content) => `<h3>${escapeHtml(content)}</h3>`);
            s = s.replace(/^## (.*$)/gim, (m, content) => `<h2>${escapeHtml(content)}</h2>`);
            s = s.replace(/^# (.*$)/gim, (m, content) => `<h1>${escapeHtml(content)}</h1>`);
            // bold & italics
            s = s.replace(/\*\*(.*?)\*\*/g, (m, content) => `<strong>${escapeHtml(content)}</strong>`);
            s = s.replace(/\*(.*?)\*/g, (m, content) => `<em>${escapeHtml(content)}</em>`);
            // unordered lists
            s = s.replace(/^\s*[-\*] (.*)/gim, (m, content) => `<li>${escapeHtml(content)}</li>`);
            s = s.replace(/(<li>[\s\S]*?<\/li>)/g, '<ul>$1</ul>');
            // inline code
            s = s.replace(/`([^`]+)`/g, (m, content) => `<code>${escapeHtml(content)}</code>`);
            // line breaks
            s = s.replace(/\n/g, '<br/>');
            return s;
        }

        // Prefer keydown for reliable Enter handling; preserve legacy handleKeyPress for compatibility
        function handleKeyDown(event) {
            // If Enter pressed without Shift/Ctrl/Meta, prevent default and send
            if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                sendMessage();
            }
        }

        // Legacy handler kept for callers that may still reference handleKeyPress
        function handleKeyPress(event) { return handleKeyDown(event); }

        // Prevent accidental form submissions site-wide (defensive). If any <form> exists and is submitted,
        // prevent the default full-page navigation which causes the UI to reset.
        document.addEventListener('submit', function (e) {
            e.preventDefault();
        }, true);

        // Default system prompt for the assistant
        const DEFAULT_SYSTEM_PROMPT = `You are Study Assistant, a friendly, concise, and helpful tutor. Answer clearly and helpfully, include examples and analogies when helpful. Keep responses focused and practical.`;

        function sendMessage() {
            const input = document.getElementById('messageInput');
            const message = input.value.trim();
            if (!message) return;
            // If message starts with a dot, treat as a local command and do not persist the raw command text
            const isCommand = message.startsWith('.');
            addMessage(escapeHtml(message), 'user', !isCommand);
            input.value = '';
            if (isCommand) {
                setTimeout(() => processCommand(message), 200);
            } else {
                // Send normal message to Gemini API
                sendToGemini(message).catch(err => {
                    addLocalMessage('Error contacting assistant: ' + String(err), 'assistant');
                });
            }
        }

        // Send user message (non-command) to the Gemini proxy and render assistant reply
        async function sendToGemini(userMessage) {
            const endpoint = `${API_ROOT.replace(/\/$/, '')}/gemini`;
            // Build combined prompt: system persona + user message
            const system = DEFAULT_SYSTEM_PROMPT;
            // Show a transient local assistant message to indicate processing
            addLocalMessage('Thinking...', 'assistant');
            try {
                // Use explicit roles: Google GL accepts 'user' and 'model' roles.
                // Put the system prompt under role 'model' and the user's text under role 'user'.
                // Build request contents including recent persisted conversation history (if available)
                const body = { contents: [] };
                // always include system persona as the first entry
                body.contents.push({ role: 'model', parts: [{ text: system }] });
                try {
                    // Build history from currently rendered DOM messages (avoids race where apiPost hasn't completed)
                    const chatArea = document.getElementById('chatArea');
                    if (chatArea) {
                        const all = Array.from(chatArea.querySelectorAll('.message'));
                        const N = 30; // keep the last N rendered messages
                        const recent = all.slice(Math.max(0, all.length - N));
                        for (const el of recent) {
                            try {
                                const bubble = el.querySelector('.message-bubble');
                                const text = bubble ? (bubble.textContent || '').trim() : '';
                                if (!text) continue;
                                // skip transient processing indicators
                                if (text === 'Thinking...' || text.startsWith('Error contacting assistant')) continue;
                                const cls = (el.className || '').toLowerCase();
                                if (cls.includes('assistant') || cls.includes('system')) {
                                    body.contents.push({ role: 'model', parts: [{ text }] });
                                } else {
                                    body.contents.push({ role: 'user', parts: [{ text }] });
                                }
                            } catch (inner) { /* ignore single element errors */ }
                        }
                    }
                } catch (e) {
                    // ignore DOM history errors and fall back to single-turn below
                }
                // Append the current user message as the last user turn only if it's not already the last rendered message
                try {
                    const chatArea = document.getElementById('chatArea');
                    let alreadyIncluded = false;
                    if (chatArea) {
                        const last = Array.from(chatArea.querySelectorAll('.message')).pop();
                        if (last) {
                            const bubble = last.querySelector('.message-bubble');
                            const lastText = bubble ? (bubble.textContent || '').trim() : '';
                            const isUser = (last.className || '').toLowerCase().includes('user');
                            if (isUser && lastText === userMessage) alreadyIncluded = true;
                        }
                    }
                    if (!alreadyIncluded) body.contents.push({ role: 'user', parts: [{ text: userMessage }] });
                } catch (e) {
                    // on any error fall back to appending the user message
                    body.contents.push({ role: 'user', parts: [{ text: userMessage }] });
                }
                const resp = await fetch(endpoint, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(body) });
                const txt = await resp.text();
                const extracted = extractTextFromApiResponse(txt) || txt || 'No response';
                // Add assistant reply and persist it to server
                addMessage(extracted, 'assistant', true);
            } catch (e) {
                throw e;
            }
        }

        function processCommand(raw) {
            const command = raw.trim();
            const lower = command.toLowerCase();

            // Reminder create: .reminder [smart natural language input]
                if (lower.startsWith('.reminder ')) {
                    const args = command.slice(10).trim();
                    if (!args) {
                        addLocalMessage('Usage: .reminder [task description with time/date]', 'assistant');
                    return;
                }
                // Use smart parsing for natural language reminders
                const smartParse = parseSmartReminder(args);
                console.log('Smart reminder parse:', smartParse);

                // Create the reminder with parsed information
                // Note: Backend currently only supports title, dueDate, timestamp, status
                const reminderData = {
                    title: smartParse.title,
                    dueDate: smartParse.dueDate || formatTimestamp(Date.now() + 3600000), // Default to 1 hour from now
                    timestamp: smartParse.dueDate ? parseDueDate(smartParse.dueDate).timestamp : Date.now() + 3600000,
                    status: 'pending'
                    // priority, recurrence, category not yet supported by backend
                };

                createReminder(reminderData.title, reminderData.dueDate);
                return;
            }

            // Edit reminder: .edit.reminder TaskName newTime newDate
                if (lower.startsWith('.edit.reminder ')) {
                    const args = command.slice(14).trim();
                    const parts = args.split(' ');
                    if (parts.length < 3) {
                        addLocalMessage('Usage: .edit.reminder TaskName newTime newDate', 'assistant');
                    return;
                }
                const newTimeDate = parts.slice(-2).join(' ');
                const title = parts.slice(0, -2).join(' ');
                editReminder(title, newTimeDate);
                return;
            }

            // Delete reminder: .delete.reminder TaskName
            if (lower.startsWith('.delete.reminder ')) {
                const title = command.slice(17).trim();
                deleteReminder(title);
                return;
            }

            // Toggle panel
                if (lower === '.reminder') {
                    toggleReminderPanel();
                    addLocalMessage('Reminder panel toggled (top bar opens).', 'assistant');
                return;
            }

            // Notes: .note or .note Title
                if (lower === '.note') {
                    openNotesEditor();
                    addLocalMessage('Opening notes editor...', 'assistant');
                return;
            }
            // Logout command
            if (lower === '.logout') {
                window.logout();
                return;
            }
            if (lower.startsWith('.note ')) {
                const title = command.slice(6).trim();
                viewNote(title);
                return;
            }

            // Theme: .theme name
                if (lower.startsWith('.theme ')) {
                    const name = lower.slice(7).trim();
                    if (THEMES[name]) {
                        applyTheme(name, true);
                    } else {
                        addLocalMessage('Available themes: light, dark, blue, green, pink, gray, purple, orange, yellow, brown, sunset, ocean, red, teal, indigo, rainbow, lime, cyan, rose, amber, emerald, sky, violet, fuchsia, aurora, forest, fire, ice, galaxy, desert, meadow, storm, candy, autumn, sunrise, twilight, neon, vintage, tropical, metallic, pastel, dark-blue, dark-green, dark-purple, dark-red, darker-teal', 'assistant');
                }
                return;
            }

            // API Key: .setApiKey KEY
                if (lower.startsWith('.setapikey ')) {
                    const key = command.slice(11).trim();
                    if (!key) { addLocalMessage('Usage: .setApiKey YOUR_KEY', 'assistant'); return; }
                setApiKey(key);
                return;
            }

            // Set proxy/endpoint: .setProxy URL or .setEndpoint URL
                if (lower.startsWith('.setproxy ') || lower.startsWith('.setendpoint ')) {
                    const url = command.slice(command.indexOf(' ')+1).trim();
                    if (!url) { addLocalMessage('Usage: .setEndpoint URL', 'assistant'); return; }
                    localStorage.setItem('sa_gemini_endpoint', url);
                    addLocalMessage('Gemini endpoint URL saved.', 'assistant');
                return;
            }

            // Debug API connectivity
                if (lower === '.debugapi') { debugApi(); return; }

            // Undo last delete
                if (lower === '.undo') { undoDelete(); return; }

            // Quiz: .quiz.<topic text>  OR  .quiz <topic text>
                if (lower.startsWith('.quiz.')) {
                    const topic = command.slice(command.indexOf('.quiz.') + 6).trim();
                    runQuizTopic(topic || 'general', command);
                return;
            }
            if (lower.startsWith('.quiz ')) {
                const topic = command.slice(6).trim();
                runQuizTopic(topic || 'general', command);
                return;
            }

            // Gemini: generate note -> accept .generate.note, .generate note, .gen note, .g note
                if (lower.startsWith('.generate') || lower.startsWith('.gen ') || lower.startsWith('.g ')) {
                    // determine where the 'note' token is and extract args after it
                    let args = '';
                    if (lower.indexOf('.note') !== -1) {
                        args = command.slice(lower.indexOf('.note') + 5).trim();
                    } else {
                        // remove the leading '.generate' or '.gen' or '.g'
                        args = command.replace(/^(\.(?:generate|gen|g))\s*/i, '').trim();
                        // if it begins with 'note' remove that token
                        if (args.toLowerCase().startsWith('note')) args = args.slice(4).trim();
                    }
                    if (!args) { addLocalMessage('Usage: .generate.note Title | note text', 'assistant'); return; }
                    // allow 'Title | body' format
                    const parts = args.split('|').map(s=>s.trim());
                    const title = parts[0] || 'AI Note';
                    const body = parts.slice(1).join(' ') || title;
                    generateNoteCommand(title, body);
                    return;
                }

            // Gemini: suggest tasks -> .suggest.task [optional context text]
                if (lower.startsWith('.suggest.task')) {
                    const ctx = command.slice(13).trim();
                    // allow calling without context; the function will include current reminders/interests
                    suggestTaskCommand(ctx);
                return;
            }

            // Edit reminder by id: .edit.reminder [id] newTime newDate
                if (lower.startsWith('.edit.reminder ')) {
                    const args = command.slice(14).trim();
                    const parts = args.split(' ');
                    if (parts.length < 2) { addLocalMessage('Usage: .edit.reminder [id] newTime newDate', 'assistant'); return; }
                const id = parseInt(parts[0],10);
                const newTimeDate = parts.slice(1).join(' ');
                editReminderById(id, newTimeDate);
                return;
            }

            addMessage('Command not recognized. Try .reminder, .note, .theme, .setApiKey, or .quiz.topic', 'assistant');
                addLocalMessage('Command not recognized. Try .reminder, .note, .theme, .setApiKey, or .quiz.topic', 'assistant');
        }

        // =====================
        // Reminder CRUD
        // =====================
        function createReminder(title, dueDate) {
            if (!title) { addMessage('Invalid reminder. Please provide a task description.', 'assistant'); return; }
            const parsed = parseDueDate(dueDate);
            const item = {
                title,
                dueDate: parsed.display || dueDate,
                timestamp: parsed.timestamp || null,
                status: computeStatusFromTimestamp(parsed.timestamp, parsed.display),
                createdAt: Date.now()
            };
            reminders.push(item);
            // Try to persist to server; attach returned id if available
            (async () => {
                try {
                    const saved = await apiPost('reminders', {
                        title: item.title,
                        dueDate: item.dueDate,
                        timestamp: item.timestamp || null,
                        status: item.status
                    });
                    if (saved && saved.id) item.id = saved.id;
                } catch (e) { /* ignore server errors */ }
                persistAndRefresh();
            })();
            addLocalMessage(`Reminder "${escapeHtml(title)}" created for ${escapeHtml(item.dueDate)}.`, 'assistant');
        }

        function editReminder(title, newDueDate) {
            const idx = reminders.findIndex(r => r.title.toLowerCase() === title.toLowerCase());
                if (idx === -1) { addLocalMessage(`Reminder "${escapeHtml(title)}" not found.`, 'assistant'); return; }
            const parsed = parseDueDate(newDueDate);
            reminders[idx].dueDate = parsed.display || newDueDate;
            reminders[idx].timestamp = parsed.timestamp || null;
            reminders[idx].status = computeStatusFromTimestamp(parsed.timestamp, parsed.display);
            // persist change to server if we have an id
            (async () => {
                try {
                    if (reminders[idx].id) await apiPut(`reminders/${reminders[idx].id}`, { dueDate: reminders[idx].dueDate, timestamp: reminders[idx].timestamp, status: reminders[idx].status });
                    else {
                        const saved = await apiPost('reminders', { title: reminders[idx].title, dueDate: reminders[idx].dueDate, timestamp: reminders[idx].timestamp, status: reminders[idx].status });
                        if (saved && saved.id) reminders[idx].id = saved.id;
                    }
                } catch (e) { /* ignore */ }
                persistAndRefresh();
            })();
            addLocalMessage(`Reminder "${escapeHtml(title)}" updated.`, 'assistant');
        }

        // Delete with confirmation and undo
        let pendingDelete = null; // { item, timeoutId }
        function deleteReminder(title) {
            const idx = reminders.findIndex(r => r.title.toLowerCase() === title.toLowerCase());
                if (idx === -1) { addLocalMessage(`Reminder "${escapeHtml(title)}" not found.`, 'assistant'); return; }
            const item = reminders[idx];
            // set pending delete, remove from list after 5s unless undone
            reminders.splice(idx, 1);
            persistAndRefresh();
            addLocalMessage(`Reminder "${escapeHtml(title)}" removed. You can undo with '.undo' within 5s.`, 'assistant');
            if (pendingDelete && pendingDelete.timeoutId) clearTimeout(pendingDelete.timeoutId);
            const timeoutId = setTimeout(() => { pendingDelete = null; localStorage.setItem('sa_reminders', JSON.stringify(reminders)); }, 5000);
            pendingDelete = { item, timeoutId };

            // attempt server delete after grace period (only if not undone)
            setTimeout(async () => {
                if (!pendingDelete && item.id) {
                    try { await apiDelete(`reminders/${item.id}`); } catch (e) { /* ignore */ }
                }
            }, 5500);
        }

        function undoDelete() {
                if (!pendingDelete) { addLocalMessage('Nothing to undo.', 'assistant'); return; }
            clearTimeout(pendingDelete.timeoutId);
            reminders.push(pendingDelete.item);
            pendingDelete = null;
            persistAndRefresh();
            addLocalMessage('Delete undone.', 'assistant');
        }

        // Compute status from timestamp if available
        function computeStatusFromTimestamp(timestamp, display) {
            if (!timestamp) {
                const s = (display || '').toLowerCase();
                if (s.includes('yesterday') || s.includes('overdue')) return 'overdue';
                if (s.includes('today') || s.includes('now') || s.includes('hour') || s.match(/\d{1,2}:\d{2}/)) return 'soon';
                return 'pending';
            }
            const now = Date.now();
            const diff = timestamp - now;
            if (diff < 0) return 'overdue';
            if (diff <= 1000 * 60 * 60 * 24) return 'soon'; // within 24h
            return 'pending';
        }

        // Smart natural language parsing for reminders
        function parseSmartReminder(text) {
            const lowerText = text.toLowerCase();
            let result = {
                title: text,
                dueDate: null,
                priority: null,
                recurrence: null,
                category: null,
                confidence: 0.3
            };

            // Time patterns
            const timePatterns = [
                /\btoday\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
                /\btoday\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
                /\btomorrow\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
                /\btomorrow\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
                /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i,
                /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
                /\bin\s+(\d+)\s+(hour|hours|minute|minutes|day|days|week|weeks)/i,
                /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,
                /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i
            ];

            // Priority keywords
            const priorityPatterns = {
                high: /\b(urgent|important|critical|asap|emergency|high priority)\b/i,
                medium: /\b(medium|normal|standard)\b/i,
                low: /\b(low priority|whenever|eventually|sometime)\b/i
            };

            // Recurrence patterns
            const recurrencePatterns = {
                daily: /\b(every day|daily|each day)\b/i,
                weekly: /\b(every week|weekly|each week)\b/i,
                monthly: /\b(every month|monthly|each month)\b/i
            };

            // Category patterns
            const categoryPatterns = {
                work: /\b(work|meeting|presentation|deadline|project|task)\b/i,
                personal: /\b(personal|shopping|grocery|clean|laundry|appointment)\b/i,
                health: /\b(health|doctor|exercise|gym|medication|appointment)\b/i,
                study: /\b(study|exam|assignment|homework|reading|research)\b/i
            };

            // Filler words to ignore
            const fillerWords = /\b(i need to|i have to|i should|i must|please|can you|could you|would you|remind me to|don't forget to|remember to|make sure to|set a reminder for)\b/gi;

            // Extract due date
            for (const pattern of timePatterns) {
                const match = text.match(pattern);
                if (match) {
                    result.dueDate = parseTimeExpression(match, text);
                    result.confidence += 0.3;
                    break;
                }
            }

            // Extract priority
            for (const [priority, pattern] of Object.entries(priorityPatterns)) {
                if (pattern.test(text)) {
                    result.priority = priority;
                    result.confidence += 0.2;
                    break;
                }
            }

            // Extract recurrence
            for (const [recurrence, pattern] of Object.entries(recurrencePatterns)) {
                if (pattern.test(text)) {
                    result.recurrence = recurrence;
                    result.confidence += 0.2;
                    break;
                }
            }

            // Extract category
            for (const [category, pattern] of Object.entries(categoryPatterns)) {
                if (pattern.test(text)) {
                    result.category = category;
                    result.confidence += 0.1;
                    break;
                }
            }

            // Smart title extraction
            let cleanTitle = text;

            // Remove filler words
            cleanTitle = cleanTitle.replace(fillerWords, '');

            // Remove time expressions
            if (result.dueDate) {
                cleanTitle = cleanTitle.replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+at\s+\d{1,2}(?::\d{2})?\s*(am|pm)?/gi, '');
                cleanTitle = cleanTitle.replace(/\b(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s+\d{1,2}(?::\d{2})?\s*(am|pm)/gi, '');
                cleanTitle = cleanTitle.replace(/\bin\s+\d+\s+(hour|hours|minute|minutes|day|days|week|weeks)/gi, '');
                cleanTitle = cleanTitle.replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(am|pm)/gi, '');
            }

            // Remove priority keywords
            cleanTitle = cleanTitle.replace(/\b(urgent|important|critical|asap|emergency|high priority|medium|normal|standard|low priority|whenever|eventually|sometime)\b/gi, '');

            // Remove recurrence keywords
            cleanTitle = cleanTitle.replace(/\b(every day|daily|each day|every week|weekly|each week|every month|monthly|each month)\b/gi, '');

            // Clean up
            cleanTitle = cleanTitle.replace(/\s+/g, ' ').trim();
            cleanTitle = cleanTitle.replace(/^[,.\s]+|[,.\s]+$/g, '');

            if (cleanTitle) {
                result.title = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
            }

            result.confidence = Math.max(result.confidence, 0.1);
            return result;
        }

        // Helper function to parse time expressions
        function parseTimeExpression(match, originalText) {
            const now = new Date();

            // Handle "in X time" patterns
            if (originalText.toLowerCase().includes('in ')) {
                const amount = parseInt(match[1]);
                const unit = match[2].toLowerCase();

                switch (unit) {
                    case 'hour':
                    case 'hours':
                        now.setHours(now.getHours() + amount);
                        break;
                    case 'minute':
                    case 'minutes':
                        now.setMinutes(now.getMinutes() + amount);
                        break;
                    case 'day':
                    case 'days':
                        now.setDate(now.getDate() + amount);
                        break;
                    case 'week':
                    case 'weeks':
                        now.setDate(now.getDate() + amount * 7);
                        break;
                }

                return now.toLocaleString();
            }

            // Handle specific times
            let hours = parseInt(match[1]);
            const minutes = match[2] ? parseInt(match[2]) : 0;
            const ampm = match[3]?.toLowerCase();

            if (ampm === 'pm' && hours < 12) hours += 12;
            if (ampm === 'am' && hours === 12) hours = 0;

            // Handle day of week
            const dayMatch = originalText.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i);
            if (dayMatch) {
                const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
                    .indexOf(dayMatch[1].toLowerCase());
                const currentDay = now.getDay();
                const daysUntil = (targetDay - currentDay + 7) % 7;
                if (daysUntil === 0 && now.getHours() > hours) {
                    now.setDate(now.getDate() + 7);
                } else {
                    now.setDate(now.getDate() + daysUntil);
                }
            } else if (originalText.toLowerCase().includes('tomorrow')) {
                now.setDate(now.getDate() + 1);
            }

            now.setHours(hours, minutes, 0, 0);
            return now.toLocaleString();
        }

        // Lightweight natural language due date parser: handles times like '3:00PM Monday', 'tomorrow 11:59 PM', 'today 3pm', 'in 2 hours'
        function parseDueDate(text) {
            const s = (text || '').trim();
            if (!s) return { display: '', timestamp: null };
            const lower = s.toLowerCase();

            // Handle time-first then day tokens: '3:00pm today', '3pm tomorrow', '4pm monday'
            let mm = lower.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(today|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/);
            if (mm) {
                const hr = parseInt(mm[1],10); const min = parseInt(mm[2]||'0',10); const ampm = mm[3]; const dayToken = mm[4]; let hours = hr;
                if (ampm) { if (ampm==='pm' && hr<12) hours = hr+12; if (ampm==='am' && hr===12) hours = 0; }
                const d = new Date();
                if (dayToken === 'tomorrow') d.setDate(d.getDate()+1);
                else if (['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].includes(dayToken)) {
                    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
                    const target = days.indexOf(dayToken);
                    const diff = (target + 7 - d.getDay()) % 7 || 7;
                    d.setDate(d.getDate()+diff);
                }
                d.setHours(hours, min, 0, 0);
                return { display: s, timestamp: d.getTime() };
            }

            // 'in X hours' or 'in X minutes'
            let m = lower.match(/in\s+(\d+)\s+hours?/);
            if (m) { const hrs = parseInt(m[1],10); return { display: s, timestamp: Date.now() + hrs*3600*1000 }; }
            m = lower.match(/in\s+(\d+)\s+minutes?/);
            if (m) { const mins = parseInt(m[1],10); return { display: s, timestamp: Date.now() + mins*60*1000 }; }

            // 'today 3pm' or 'today 15:00'
            m = lower.match(/today\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
            if (m) { const hr = parseInt(m[1],10); const min = parseInt(m[2]||'0',10); const ampm = m[3]; let hours = hr; if (ampm) { if (ampm==='pm' && hr<12) hours = hr+12; if (ampm==='am' && hr===12) hours = 0; } const d = new Date(); d.setHours(hours, min,0,0); return { display: s, timestamp: d.getTime() }; }

            // 'tomorrow 11:59 pm'
            m = lower.match(/tomorrow\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
            if (m) { const hr = parseInt(m[1],10); const min = parseInt(m[2]||'0',10); const ampm = m[3]; let hours = hr; if (ampm) { if (ampm==='pm' && hr<12) hours = hr+12; if (ampm==='am' && hr===12) hours = 0; } const d = new Date(); d.setDate(d.getDate()+1); d.setHours(hours, min,0,0); return { display: s, timestamp: d.getTime() }; }

            // 'Monday 3:00 PM' -> next occurrence of weekday
            m = lower.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
            if (m) {
                const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
                const target = days.indexOf(m[1]);
                const hr = parseInt(m[2],10); const min = parseInt(m[3]||'0',10); const ampm = m[4]; let hours = hr; if (ampm) { if (ampm==='pm' && hr<12) hours = hr+12; if (ampm==='am' && hr===12) hours = 0; }
                const d = new Date();
                const diff = (target + 7 - d.getDay()) % 7 || 7; // next occurrence
                d.setDate(d.getDate()+diff);
                d.setHours(hours,min,0,0);
                return { display: s, timestamp: d.getTime() };
            }

            // fallback: look for time like 15:00 or 3:00PM
            m = lower.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/);
            if (m) {
                const hr = parseInt(m[1],10); const min = parseInt(m[2],10); const ampm = m[3]; let hours = hr; if (ampm) { if (ampm==='pm' && hr<12) hours = hr+12; if (ampm==='am' && hr===12) hours = 0; }
                const d = new Date(); d.setHours(hours,min,0,0); return { display: s, timestamp: d.getTime() };
            }

            // last resort: return display only
            return { display: s, timestamp: null };
        }

        function persistAndRefresh() {
            try { localStorage.setItem('sa_reminders', JSON.stringify(reminders)); } catch (e) {}
            updatePeelBar();
            populateReminderPanel();
            // ensure timers are scheduled for any timestamped reminders
            scheduleAllReminders();
        }

    // -------------------
    // Backend API helpers
    // -------------------
    // API_ROOT: prefer an explicit saved server URL, else use environment variable or default
    const API_ROOT = localStorage.getItem('sa_api_root') ||
                     (import.meta.env?.VITE_API_BASE_URL) ||
                     'https://alfred-ai-backend.onrender.com';
    // store auth token
    const AUTH_TOKEN_KEY = 'sa_auth_token';

    async function apiGet(path) {
        const url = `${API_ROOT.replace(/\/$/, '')}/api/${path}`;
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const r = await fetch(url, { method: 'GET', headers });
        return r.ok ? r.json() : Promise.reject(await r.text());
    }

    async function apiPost(path, body) {
        const url = `${API_ROOT.replace(/\/$/, '')}/api/${path}`;
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        return r.ok ? r.json() : Promise.reject(await r.text());
    }

    async function apiDelete(path) {
        const url = `${API_ROOT.replace(/\/$/, '')}/api/${path}`;
        const r = await fetch(url, { method: 'DELETE' });
        return r.ok ? r.json() : Promise.reject(await r.text());
    }

    async function apiPut(path, body) {
        const url = `${API_ROOT.replace(/\/$/, '')}/api/${path}`;
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const r = await fetch(url, { method: 'PUT', headers, body: JSON.stringify(body) });
        return r.ok ? r.json() : Promise.reject(await r.text());
    }

    // Build headers for requests that should include the user's auth token (e.g. /gemini proxy)
    function getAuthHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token) headers['Authorization'] = 'Bearer ' + token;
        return headers;
    }

    // Sync reminders/notes from server into local arrays (and UI)
    async function syncFromServer() {
        try {
            const ns = await apiGet('notes');
            notes = Array.isArray(ns) ? ns : notes;
        } catch (e) { /* ignore */ }
        try {
            const rs = await apiGet('reminders');
            reminders = Array.isArray(rs) ? rs.map(r=>({ title: r.title, dueDate: r.dueDate || formatTimestamp(r.timestamp), timestamp: r.timestamp, status: r.status || computeStatusFromTimestamp(r.timestamp, r.dueDate), id: r.id })) : reminders;
        } catch (e) { /* ignore */ }
        persistAndRefresh();
    }

    // Create note via Gemini and save to server
    async function generateNoteCommand(title, text) {
    addLocalMessage(`Generating note '${escapeHtml(title)}' via AI...`, 'assistant');
        try {
            // Call server-side proxy /gemini with a more detailed system prompt for beginner-friendly notes
            const system = `You are an expert study-note author. Rewrite and expand the following text into a detailed, explanatory study note suitable for beginners. Use clear headings, short paragraphs, bullet points, and include simple analogies and examples where helpful. Make the explanation actionable and easy to understand. Source text:\n\n${text}`;
            const resp = await fetch(`${API_ROOT.replace(/\/$/, '')}/gemini`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ contents: [ { role: 'model', parts: [{ text: system }] }, { role: 'user', parts: [{ text }] } ] }) });
            const txt = await resp.text();
            const extracted = extractTextFromApiResponse(txt) || txt || system;
            // Save to server
            const saved = await apiPost('notes', { title, content: extracted });
            notes.unshift(saved);
            localStorage.setItem('sa_notes', JSON.stringify(notes));
            addLocalMessage(`Note '${escapeHtml(title)}' saved.`, 'assistant');
        } catch (e) {
            addLocalMessage('AI note generation failed: ' + escapeHtml(String(e)), 'assistant');
        }
    }

    // Suggest tasks using Gemini, show them and allow saving as reminders
    async function suggestTaskCommand(ctx) {
    addLocalMessage('Asking AI for suggested tasks...', 'assistant');
        try {
            // If no explicit context provided, summarize current reminders and user info
            let contextSummary = ctx || '';
            try {
                const user = await apiGet('user').catch(()=>null);
                if (user && (user.name || user.school)) {
                    contextSummary += `\nUser: ${user.name || ''} ${user.school ? '(' + user.school + ')' : ''}`;
                }
            } catch (e) { /* ignore */ }
            if (!contextSummary) {
                // summarize current reminders
                if (reminders && reminders.length) {
                    const top = reminders.slice(0,6).map(r=>`${r.title} (${r.dueDate || r.display || ''})`).join('; ');
                    contextSummary = `Current reminders: ${top}`;
                } else contextSummary = 'No current reminders.';
            }

            const system = `You are a task-suggestion assistant. Given the following context, suggest 1-6 short activities the user could do (study, relax, read, practice, or have fun). Return strict JSON array like [{"title":"...","due":"optional due hint","reason":"short"}, ...]. Context: ${contextSummary}`;
            const r = await fetch(`${API_ROOT.replace(/\/$/, '')}/gemini`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ contents: [ { role: 'model', parts: [{ text: system }] }, { role: 'user', parts: [{ text: contextSummary || '' }] } ] }) });
            const t = await r.text();
            const extracted = extractTextFromApiResponse(t) || t;
            const json = tryParseJSON(extracted) || tryParseJSON(t) || null;
                if (!json) {
                addLocalMessage('AI did not return parsable JSON. Preview: <pre>' + escapeHtml((extracted||'').slice(0,800)) + '</pre>', 'assistant');
                return;
            }
            const tasks = Array.isArray(json) ? json : json.tasks || json.suggestions || [];
            if (!tasks.length) { addLocalMessage('No task suggestions returned by AI.', 'assistant'); return; }
            // Build HTML with data attributes and then bind actions safely
            const html = tasks.map((tt,i)=>{
                const title = tt.title || tt.name || ('Task '+(i+1));
                const due = tt.due || tt.hint || '';
                return `<div style="padding:8px 0;border-bottom:1px solid var(--border);"><strong>${escapeHtml(title)}</strong><div style='color:var(--muted);margin-top:6px'>${escapeHtml(due)}</div><div style='margin-top:8px'><button class='btn ai-save-reminder' data-title='${escapeHtml(title)}' data-due='${escapeHtml(due)}'>Save as reminder</button></div></div>`;
            }).join('');
            addLocalMessage(`<div style="padding:8px;background:var(--input-bg);border-radius:8px">${html}</div>`, 'assistant');

            // Attach handlers to the newly inserted save buttons so they post to the proper API_ROOT
            try {
                const chatArea = document.getElementById('chatArea');
                const lastMsg = chatArea && chatArea.lastElementChild;
                if (lastMsg) {
                    lastMsg.querySelectorAll('.ai-save-reminder').forEach(btn => {
                        btn.addEventListener('click', async () => {
                            const title = btn.getAttribute('data-title');
                            const due = btn.getAttribute('data-due');
                            try {
                                await apiPost('reminders', { title, dueDate: due, status: 'pending' });
                                addLocalMessage('Saved reminder: ' + escapeHtml(title), 'assistant');
                                syncFromServer();
                            } catch (e) { addLocalMessage('Save failed: ' + escapeHtml(String(e)), 'assistant'); }
                        });
                    });
                }
            } catch (e) { /* non-fatal */ }
        } catch (e) {
            addLocalMessage('Task suggestion failed: ' + escapeHtml(String(e)), 'assistant');
        }
    }

    // Edit reminder by numeric id
    async function editReminderById(id, newTimeDate) {
        try {
            const parsed = parseDueDate(newTimeDate);
            // Update locally
            const idx = reminders.findIndex(r=>r.id === id || r.title.toLowerCase() === String(id));
            if (idx === -1) { addMessage('Reminder id not found.', 'assistant'); return; }
            reminders[idx].dueDate = parsed.display;
            reminders[idx].timestamp = parsed.timestamp || null;
            reminders[idx].status = computeStatusFromTimestamp(parsed.timestamp, parsed.display);
            // Persist to server - naive approach: delete and re-create or skip server update for now
            persistAndRefresh();
            addMessage('Reminder updated locally. Server sync will happen on next sync.', 'assistant');
        } catch (e) { addMessage('Edit failed: ' + escapeHtml(String(e)), 'assistant'); }
    }

    // Selection helpers removed: use the inline 'Explain with AI' button inserted near the textarea selection.
    function removeSelectionMenu() { const m = document.getElementById('selMenu'); if (m) m.remove(); }

    // ---- Notes title suggestions and inline explain button ----
    function ensureTitleSuggestionBox() {
        if (document.getElementById('noteTitleSuggestions')) return;
        const content = document.querySelector('.notes-content'); if (!content) return;
        const box = document.createElement('div'); box.id = 'noteTitleSuggestions'; box.style.position = 'relative'; box.style.margin = '6px 0'; box.style.display = 'none';
        const inner = document.createElement('div'); inner.style.position='relative'; inner.style.background='var(--panel-bg)'; inner.style.border='1px solid var(--border)'; inner.style.maxHeight='160px'; inner.style.overflow='auto'; inner.style.padding='6px'; box.appendChild(inner);
        content.insertBefore(box, content.firstChild);
    }

    function updateTitleSuggestions() {
        ensureTitleSuggestionBox();
        const box = document.getElementById('noteTitleSuggestions'); if (!box) return;
        const inner = box.firstChild; inner.innerHTML = '';
        const title = (document.getElementById('noteTitle') || {}).value || '';
        if (!title.trim()) { box.style.display='none'; return; }
        const matches = notes.filter(n => n.title.toLowerCase().includes(title.toLowerCase()));
        if (!matches.length) { box.style.display='none'; return; }
        inner.innerHTML = matches.map(n=>`<div class='note-suggest' data-title='${escapeHtml(n.title)}' style='padding:8px;border-bottom:1px solid var(--border);cursor:pointer'><strong>${escapeHtml(n.title)}</strong><div style='color:var(--muted);font-size:0.9rem'>${escapeHtml(n.lastModified||n.created||'')}</div></div>`).join('');
        box.style.display = 'block';
        inner.querySelectorAll('.note-suggest').forEach(el=>el.addEventListener('click', ()=>{
            const t = el.getAttribute('data-title'); const note = notes.find(x=>x.title===t); if (!note) return;
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('notesTextarea').value = note.content;
            box.style.display='none';
        }));
    }

    // Show all saved notes in the compact title suggestion box (used when user types 'notes')
    function showAllTitleSuggestions() {
        ensureTitleSuggestionBox();
        const box = document.getElementById('noteTitleSuggestions'); if (!box) return;
        const inner = box.firstChild; inner.innerHTML = '';
        if (!notes.length) {
            inner.innerHTML = `<div style="color:var(--muted);padding:8px">No saved notes.</div>`;
            box.style.display = 'block';
            return;
        }
        inner.innerHTML = notes.map(n=>`<div class='note-suggest' data-title='${escapeHtml(n.title)}' style='padding:8px;border-bottom:1px solid var(--border);cursor:pointer'><strong>${escapeHtml(n.title)}</strong><div style='color:var(--muted);font-size:0.9rem'>${escapeHtml(n.lastModified||n.created||'')}</div></div>`).join('');
        box.style.display = 'block';
        inner.querySelectorAll('.note-suggest').forEach(el=>el.addEventListener('click', ()=>{
            const t = el.getAttribute('data-title'); const note = notes.find(x=>x.title===t); if (!note) return;
            document.getElementById('noteTitle').value = note.title;
            document.getElementById('notesTextarea').value = note.content;
            box.style.display='none';
        }));
        // ensure the big overlay is not visible
        const big = document.getElementById('notesListOverlay'); if (big) big.remove();
    }

    // wire up title input and textarea for inline explain button when DOM ready
    document.addEventListener('DOMContentLoaded', ()=>{
        const titleInput = document.getElementById('noteTitle');
        if (titleInput) {
            titleInput.addEventListener('input', ()=>{
                updateTitleSuggestions();
                const val = titleInput.value.trim();
                if (!val) {
                    // hide notes list if title cleared
                    const existing = document.getElementById('notesListOverlay'); if (existing) existing.remove();
                    return;
                }
                const lower = val.toLowerCase();
                // If user types "notes", show the compact title suggestion box with all notes
                if (lower.includes('notes')) {
                    showAllTitleSuggestions();
                } else {
                    const sug = document.getElementById('noteTitleSuggestions'); if (sug) sug.style.display='none';
                }
                const exact = notes.find(n => n.title.toLowerCase() === val.toLowerCase());
                if (exact) document.getElementById('notesTextarea').value = exact.content;
            });
        }

        const ta = document.getElementById('notesTextarea');
        if (ta) {
            ta.addEventListener('mouseup', (e)=>{
                setTimeout(()=>{
                    const sel = window.getSelection();
                    const text = (sel && sel.toString && sel.toString().trim()) || '';
                    const exBtn = document.getElementById('inlineExplainBtn'); if (exBtn) exBtn.remove();
                    if (text.length > 3) {
                        const btn = document.createElement('button'); btn.id='inlineExplainBtn'; btn.className='btn'; btn.textContent='Explain';
                        btn.style.position='absolute'; btn.style.zIndex=2100; btn.style.left=(e.pageX)+'px'; btn.style.top=(e.pageY - 36)+'px'; document.body.appendChild(btn);
                        btn.onclick = async ()=>{
                            btn.disabled = true;
                            addLocalMessage('Explaining selected text...', 'assistant');
                            try {
                                const r = await fetch(`${API_ROOT.replace(/\/$/, '')}/gemini`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify({ contents:[ { role: 'user', parts:[{ text: `Explain the following text simply for a beginner, include analogies and examples: ${text}` }] } ] }) });
                                const t = await r.text(); const ex = extractTextFromApiResponse(t) || t;
                                // insert explanation into textarea at cursor
                                const cur = ta.value; const selStart = ta.selectionStart || cur.length; const newVal = cur.slice(0, selStart) + '\n\nExplanation:\n' + ex + '\n' + cur.slice(selStart);
                                ta.value = newVal;
                                // show the actual AI explanation in chat as an assistant message (local-only)
                                // Pass the raw explanation so the message renderer can apply markdown formatting
                                addLocalMessage(String(ex), 'assistant');
                            } catch (err) { addMessage('Explain failed: '+escapeHtml(String(err)),'assistant'); }
                            btn.remove();
                        };
                    }
                },40);
            });
            // live preview for markdown-sensitive textarea
            const preview = document.getElementById('notesPreview');
            if (preview) {
                const updatePreview = ()=>{ preview.innerHTML = renderMarkdown(ta.value); };
                ta.addEventListener('input', updatePreview);
                // initial render
                updatePreview();
            }
        }
    });

        // =====================
        // Notes (persisted)
        // =====================
    // toggleNotesList was removed when the "My Notes" button was removed from the UI.
    // Notes list should be shown by typing "notes" in the title input instead.
    function toggleNotesList() { /* no-op: legacy function removed */ }

        function openNotesEditor() {
            const overlay = document.getElementById('notesOverlay');
            overlay.classList.add('active');
            // Clear editor fields when opening; do NOT show the notes list by default
            document.getElementById('noteTitle').value = '';
            document.getElementById('notesTextarea').value = '';
            // remove any suggestions or lists
            const existing = document.getElementById('notesListOverlay'); if (existing) existing.remove();
            const sug = document.getElementById('noteTitleSuggestions'); if (sug) sug.remove();
            // Preview wiring
            const ta = document.getElementById('notesTextarea');
            const prev = document.getElementById('notesPreview');
            if (ta && prev) {
                const upd = ()=>{ try { prev.innerHTML = renderMarkdown(ta.value); } catch(e){ prev.textContent = ta.value; } };
                ta.removeEventListener('input', upd);
                ta.addEventListener('input', upd);
                upd();
            }
        }

        function closeNotesEditor() {
            const overlay = document.getElementById('notesOverlay');
            overlay.classList.remove('active');
        }

        function saveNote() {
            const title = document.getElementById('noteTitle').value.trim();
            const content = document.getElementById('notesTextarea').value.trim();
            if (!title || !content) { alert('Please enter both title and content.'); return; }
            const idx = notes.findIndex(n => n.title.toLowerCase() === title.toLowerCase());
            const now = new Date().toLocaleString();
            if (idx >= 0) { notes[idx].content = content; notes[idx].lastModified = now; }
            else notes.push({ title, content, created: now, lastModified: now });
            // Persist locally immediately
            localStorage.setItem('sa_notes', JSON.stringify(notes));

            // Also try to persist to server; if this note has an id we update, else create
            (async () => {
                try {
                    const existing = notes.find(n => n.title.toLowerCase() === title.toLowerCase() && n.id);
                    if (existing && existing.id) {
                        // naive approach: re-create as new note on server (update endpoint not implemented)
                        // For now, create a new server note to ensure server has a copy
                        const saved = await apiPost('notes', { title, content });
                        existing.id = saved.id;
                    } else {
                        const saved = await apiPost('notes', { title, content });
                        // attach returned id to local note so future deletes/updates can reference it
                        const local = notes.find(n => n.title === title && n.content === content);
                        if (local) local.id = saved.id;
                    }
                    localStorage.setItem('sa_notes', JSON.stringify(notes));
                } catch (e) {
                    // server may be down; that's fine — local copy remains
                    console.warn('Failed to save note to server:', e);
                }
            })();

            closeNotesEditor();
            addLocalMessage(`Note "${escapeHtml(title)}" saved successfully!`, 'assistant');
            // keep notes list hidden by default; only render if user toggles My Notes
            // but update any suggestions if visible
            const s = document.getElementById('noteTitleSuggestions'); if (s) updateTitleSuggestions();
        }

        // renderNotesList previously created a large overlay inside the notes editor.
        // To simplify UI and follow the new behavior, the large overlay was removed.
        // Calling renderNotesList() will now show the compact title suggestion box with all notes.
        function renderNotesList() {
            showAllTitleSuggestions();
        }

        function viewNote(noteTitle) {
            const note = notes.find(n => n.title.toLowerCase() === noteTitle.toLowerCase());
            if (!note) { addLocalMessage(`Note "${escapeHtml(noteTitle)}" not found. Available notes: ${notes.map(n=>n.title).join(', ') || 'None'}`, 'assistant'); return; }
            const noteDisplay = `
                <div style="background: var(--input-bg); padding: 15px; border-radius: 10px; margin: 10px 0;">
                    <h3 style="color: var(--muted); margin-bottom: 10px;">${escapeHtml(note.title)}</h3>
                    <div style="line-height: 1.5; color: inherit;">${renderMarkdown(note.content)}</div>
                    <small style="color: var(--muted); margin-top: 10px; display: block;">Last modified: ${note.lastModified}</small>
                </div>
            `;
            addLocalMessage(noteDisplay, 'assistant');
        }

        // =====================
        // Themes
        // =====================
        function applyTheme(name, save = true) {
            const theme = THEMES[name] || THEMES.light;
            const root = document.documentElement;

            // Apply all provided theme variables first
            Object.keys(theme).forEach(k => root.style.setProperty(k, theme[k]));

            // Required variables and sensible defaults when missing from a theme
            const FALLBACKS = {
                '--text-primary': '#0b1220',
                '--assistant-text': '#0b1220',
                '--user-text': '#ffffff',
                '--muted': '#6c757d',
                '--border': 'rgba(0,0,0,0.08)',
                '--input-bg': '#f8f9fa',
                '--notes-overlay-bg': 'rgba(255,255,255,0.96)',
                '--peel-bg': 'linear-gradient(145deg,#ffffff,#f8f9fa)',
                '--chat-assistant-bg': 'linear-gradient(145deg,#f8f9fa,#e9ecef)',
                '--chat-system-bg': 'linear-gradient(145deg,#e3f2fd,#bbdefb)',
                '--user-bubble-bg': 'linear-gradient(145deg,#667eea,#764ba2)'
            };

            // Ensure every fallback key exists in the computed style
            Object.keys(FALLBACKS).forEach(k => {
                const cur = root.style.getPropertyValue(k);
                if (!cur || cur.trim() === '') root.style.setProperty(k, FALLBACKS[k]);
            });

            // Helper: attempt to pick a hex color from a CSS value (handles gradients)
            function pickHexFromCss(val) {
                if (!val || typeof val !== 'string') return null;
                const m = val.match(/#([0-9a-f]{6}|[0-9a-f]{3})/i);
                return m ? m[0] : null;
            }

            // Helper: convert hex to relative luminance and return '#000' or '#fff'
            function pickContrastColor(hex, preferDark=false) {
                if (!hex) return preferDark ? '#000' : '#fff';
                // normalize 3-digit hex
                let h = hex.replace('#','');
                if (h.length === 3) h = h.split('').map(c=>c+c).join('');
                const r = parseInt(h.substr(0,2),16)/255;
                const g = parseInt(h.substr(2,2),16)/255;
                const b = parseInt(h.substr(4,2),16)/255;
                const srgb = [r,g,b].map(c => (c <= 0.03928) ? c/12.92 : Math.pow((c+0.055)/1.055,2.4));
                const L = 0.2126*srgb[0] + 0.7152*srgb[1] + 0.0722*srgb[2];
                // threshold 0.5: light backgrounds -> black text, dark backgrounds -> white text
                return L > 0.5 ? '#000000' : '#ffffff';
            }

            // Compute sensible message/quiz text colors based on available backgrounds
            const panelBg = pickHexFromCss(theme['--panel-bg'] || root.style.getPropertyValue('--panel-bg'));
            const assistantBg = pickHexFromCss(theme['--chat-assistant-bg'] || root.style.getPropertyValue('--chat-assistant-bg'));
            const userBubbleBg = pickHexFromCss(theme['--user-bubble-bg'] || root.style.getPropertyValue('--user-bubble-bg'));

            const messageText = pickContrastColor(panelBg || assistantBg, false);
            const assistantText = pickContrastColor(assistantBg || panelBg, false);
            const userText = pickContrastColor(userBubbleBg || panelBg, true);

            // Expose variables that CSS can use for message and quiz readability
            root.style.setProperty('--message-text', messageText);
            root.style.setProperty('--assistant-text', assistantText);
            root.style.setProperty('--user-text', userText);

            // Backwards compatibility: make a couple of aliases used by styles
            if (!root.style.getPropertyValue('--system-text')) root.style.setProperty('--system-text', root.style.getPropertyValue('--muted') || FALLBACKS['--muted']);
            if (!root.style.getPropertyValue('--peel-soon-bg')) root.style.setProperty('--peel-soon-bg', root.style.getPropertyValue('--peel-bg'));

            if (save) {
                try { localStorage.setItem('sa_theme', name); } catch (e) {}
                // Persist theme server-side as a user preference (key/value) so theme can be shared across devices
                (async ()=>{
                    try { await apiPost('settings/theme', { theme: name }); } catch (e) { /* ignore */ }
                })();
                // Announce theme change locally (do not persist announcement to DB)
                addLocalMessage(`Theme set to ${name}.`, 'assistant');
            }
        }

        // =====================
        // Quiz: Gemini API + fallback
        // =====================
        async function runQuizTopic(topic, rawCommand) {
            addMessage(`Generating quiz for topic: ${escapeHtml(topic)}...`, 'assistant');
            const apiKey = getApiKey();
            let quiz = null;
            const count = quizDesiredCount || 10;

            // reset UI counters
            quizScore = 0; quizStreak = 0; currentQuestionIndex = 0; totalQuizQuestions = 0;

            // Try to fetch a quiz from the configured endpoint (allow server-side proxy to supply API key).
            try {
                quiz = await fetchGeminiQuiz(apiKey, topic, count);
            } catch (e) {
                console.warn('Gemini API failed or not available, falling back to demo quiz.', e);
                quiz = null;
            }

            if (!quiz) {
                // fallback to demo topic if available, duplicate items to reach count
                if (quizData[topic]) {
                    quiz = quizData[topic].slice(0, count);
                    while (quiz.length < count) quiz = quiz.concat(quizData[topic].slice(0, count - quiz.length));
                } else {
                    // generic demo repeated
                    quiz = [];
                    const demo = [
                        { question: 'Demo: What is 2+2?', options: ['3','4','5','6'], correct: 1 },
                        { question: 'Demo: Capital of France?', options: ['Berlin','Rome','Paris','Madrid'], correct: 2 },
                        { question: 'Demo: Color of the sky?', options: ['Green','Blue','Red','Yellow'], correct: 1 }
                    ];
                    while (quiz.length < count) quiz = quiz.concat(demo.slice(0, Math.min(demo.length, count - quiz.length)));
                }
            }

            // Start quiz
            currentQuiz = quiz;
            totalQuizQuestions = (Array.isArray(quiz) ? quiz.length : 0);
            addMessage('Quiz ready. Answer the questions inside chat.', 'assistant');
            showQuizQuestion();
        }

    async function fetchGeminiQuiz(apiKey, topic, desiredCount = 10) {
            const endpoint = getGeminiEndpoint();
            if (!endpoint) throw new Error('No Gemini endpoint configured');

            const system = `You are an assistant that outputs JSON only. Generate a short quiz on the following topic: "${topic}". Respond in strict JSON: { "questions": [ { "question": "...", "options": ["A","B","C","D"], "answer": "A" }, ... ] } with exactly ${desiredCount} questions.`;
                let resp;
            // Detect Google Generative Language API endpoint and use its request shape.
            // Also treat local proxy endpoints that contain '/gemini' as Google-GL-shaped backends
            const isGoogleGL = endpoint.includes('generativelanguage.googleapis.com') || endpoint.includes('generativelanguage') || endpoint.includes('/gemini');

                addMessage(`Calling endpoint: ${escapeHtml(endpoint)} using ${isGoogleGL ? 'Google-GL (contents/parts + X-goog-api-key header)' : 'generic (prompt + Bearer)'} request shape.`, 'assistant');
                if (isGoogleGL) {
                    // Use X-goog-api-key header and contents/parts body. Include stored auth token when calling local /gemini proxy so server can attach preferences.
                    const headers = getAuthHeaders();
                    if (apiKey) headers['X-goog-api-key'] = apiKey;
                    resp = await fetchWithRetries(endpoint, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ contents: [ { role: 'model', parts: [{ text: system }] }, { role: 'user', parts: [{ text: '' }] } ] })
                    });
                } else {
                    // Generic endpoint with Bearer token
                    resp = await fetchWithRetries(endpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                        body: JSON.stringify({ prompt: system, max_tokens: 800 })
                    });
            }

            if (!resp.ok) {
                const txt = await resp.text().catch(()=>'');
                const short = txt.slice(0,800);
                addMessage(`API call failed: ${resp.status}. Response preview: <pre style="white-space:pre-wrap;max-height:200px;overflow:auto">${escapeHtml(short)}</pre>`, 'assistant');
                throw new Error('API response not OK: ' + resp.status + ' ' + txt);
            }

            // Get full response text for parsing attempts
            let text = await resp.text();

            // Use a robust extractor to pull human-readable/generated text from the API response
            const generatedText = extractTextFromApiResponse(text);
            // prefer extracted generatedText if found, else the raw text
            const sourceText = (generatedText || text || '').toString();

            // Try to parse JSON embedded in the generated text (model was asked to output JSON)
            let json = tryParseJSON(sourceText);

            // If parsing failed and this is a Google-GL (or /gemini proxy) endpoint, try extracting JSON from markdown code fences
            if (!json && isGoogleGL) {
                // Look for ```json ... ``` blocks and attempt to parse their contents first
                try {
                    const fenceMatch = sourceText.match(/```(?:json)?\s*([\s\S]*?)```/i);
                    if (fenceMatch && fenceMatch[1]) {
                        json = tryParseJSON(fenceMatch[1]);
                        if (json) text = fenceMatch[1];
                    }
                } catch (e) { /* ignore */ }

                // Also try to strip any leading/trailing markdown or backticks and parse the remainder
                if (!json) {
                    const cleaned = sourceText.replace(/```/g, '').trim();
                    json = tryParseJSON(cleaned);
                    if (json) text = cleaned;
                }

                // If still no JSON, do NOT attempt other API shapes (they will be rejected by Google GL). Show a preview and abort.
                if (!json) {
                    const short = (sourceText||'').slice(0,1200);
                    addMessage(`Unable to parse JSON from Google-GL response. Preview: <pre style="white-space:pre-wrap;max-height:300px;overflow:auto">${escapeHtml(short)}</pre>`, 'assistant');
                    throw new Error('Failed to parse JSON from Google-GL API response');
                }
            }

            // If not Google-GL, allow trying alternate request shapes to other APIs
            if (!json && !isGoogleGL) {
                const attempts = [
                    { body: { input: system } },
                    { body: { messages: [{ role: 'user', content: system }] } },
                    { body: { text: system } }
                ];
                for (const a of attempts) {
                    try {
                        const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify(a.body) });
                        const t = await r.text();
                        json = tryParseJSON(t) || tryParseJSON(extractTextFromApiResponse(t));
                        if (json) { text = t; break; }
                    } catch (e) { /* continue */ }
                }
            }

            if (!json) {
                const short = (sourceText||'').slice(0,1200);
                addMessage(`Unable to parse JSON from API response. Preview: <pre style="white-space:pre-wrap;max-height:300px;overflow:auto">${escapeHtml(short)}</pre>`, 'assistant');
                throw new Error('Failed to parse JSON from API');
            }

            // Accept either array directly, or { questions: [...] }
            const questions = Array.isArray(json) ? json : json.questions || json.data?.questions;
            if (!Array.isArray(questions)) throw new Error('Unexpected quiz format');

            // Normalize each question and sanitize option prefixes like 'A) '
            function cleanOption(opt) { return (opt || '').toString().replace(/^[A-D]\)\s*/i, '').replace(/^[A-D]\.?\s*/i, '').trim(); }
            return questions.slice(0, desiredCount).map((q, idx) => {
                const opts = q.options || q.choices || q.answers || [];
                const cleaned = opts.map(cleanOption);
                const ans = (q.answer || q.correct || q.solution || '').toString().trim();
                const correctIndex = typeof ans === 'string' && ans.length === 1 && 'ABCD'.includes(ans.toUpperCase()) ? 'ABCD'.indexOf(ans.toUpperCase()) : (typeof ans === 'number' ? ans : 0);
                return { question: q.question || q.prompt || '', options: cleaned, correct: correctIndex };
            });
        }

        function extractTextFromApiResponse(respText) {
            // Attempt to pull human readable text from a JSON API response string
            try {
                const p = JSON.parse(respText);
                // candidates -> content -> parts -> text
                if (p?.candidates && Array.isArray(p.candidates)) {
                    const parts = p.candidates.map(c => {
                        // candidate.content.parts is the typical nested structure
                        if (c?.content?.parts && Array.isArray(c.content.parts)) return c.content.parts.map(pt => pt.text || '').join('\n');
                        // sometimes candidate directly holds text
                        return c?.content || c?.output || c?.message || c?.text || '';
                    });
                    return parts.join('\n');
                }
                // older/alternate shapes
                if (p?.output) return typeof p.output === 'string' ? p.output : JSON.stringify(p.output);
                if (p?.items) return p.items.map(i => i.text || '').join('\n');
                if (p?.contents) {
                    return p.contents.map(c => (c.parts||[]).map(p=>p.text||'').join('\n')).join('\n');
                }
                // fallback: return serialized JSON string
                return JSON.stringify(p);
            } catch (e) {
                // If respText is already an object, stringify it; otherwise return as string
                try { return typeof respText === 'string' ? respText : JSON.stringify(respText); } catch (e2) { return String(respText); }
            }
        }

        // Command to debug API connectivity and keys
        async function debugApi() {
            const endpoint = getGeminiEndpoint();
            const apiKey = getApiKey();
            if (!endpoint) { addMessage('No Gemini endpoint configured. Use .setEndpoint <url>', 'assistant'); return; }
            // If endpoint looks like Google's Generative Language API, prefer the X-goog-api-key + contents/parts shape
            const isGoogleGL = endpoint.includes('generativelanguage.googleapis.com') || endpoint.includes('generativelanguage') || endpoint.includes('/gemini');
            if (!apiKey && isGoogleGL) {
                // Allow cases where a proxy supplies the key server-side (user may have configured a local proxy)
                addMessage('No API key found locally. If you are using a server-side proxy that injects the key, proceed; otherwise use .setApiKey <key> or run the proxy with GEMINI_API_KEY set.', 'assistant');
            }

            addMessage('Testing Gemini endpoint... (showing truncated response)', 'assistant');
            try {
                const testPrompt = 'Respond with a short JSON: {"ok":true, "time": "now"}';
                let r;
                if (isGoogleGL) {
                    // Use Google GL request shape. Include auth token when testing local /gemini proxy.
                    const headers = getAuthHeaders();
                    if (apiKey) headers['X-goog-api-key'] = apiKey;
                        r = await fetchWithRetries(endpoint, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({ contents: [ { role: 'user', parts: [{ text: testPrompt }] } ] })
                    });
                } else {
                    // Generic endpoint with Bearer token
                    if (!apiKey) { addMessage('No API key found. Use .setApiKey <key>', 'assistant'); return; }
                        r = await fetchWithRetries(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }, body: JSON.stringify({ prompt: testPrompt, max_tokens: 100 }) });
                }

                const status = r.status;
                const txt = await r.text();
                const short = txt.slice(0,1000);
                addMessage(`Status: ${status}. Response preview: <pre style="white-space:pre-wrap;max-height:300px;overflow:auto">${escapeHtml(short)}</pre>`, 'assistant');
            } catch (e) {
                addMessage('API debug request failed: ' + escapeHtml(String(e)), 'assistant');
            }
        }

        function tryParseJSON(text) {
            if (!text) return null;
            try { return JSON.parse(text); } catch (e) {}
            // extract first {...}
            const start = text.indexOf('{');
            const end = text.lastIndexOf('}');
            if (start !== -1 && end !== -1 && end > start) {
                const sub = text.slice(start, end + 1);
                try { return JSON.parse(sub); } catch (e) {}
            }
            // extract first [..]
            const s2 = text.indexOf('[');
            const e2 = text.lastIndexOf(']');
            if (s2 !== -1 && e2 !== -1 && e2 > s2) {
                const sub = text.slice(s2, e2 + 1);
                try { return JSON.parse(sub); } catch (e) {}
            }
            return null;
        }

        function showQuizQuestion() {
            if (!currentQuiz) return;
            if (currentQuestionIndex >= currentQuiz.length) {
                addMessage(`🎉 Quiz completed! Score: ${quizScore}/${totalQuizQuestions}. Streak: ${quizStreak}`, 'assistant');
                // small summary card
                addMessage(`<div style="padding:12px;border-radius:12px;background:var(--input-bg);">Final score: <strong>${quizScore}/${totalQuizQuestions}</strong><br/>Streak: <strong>${quizStreak}</strong></div>`, 'assistant');
                // Friendly final remark
                const pct = totalQuizQuestions ? (quizScore / totalQuizQuestions) : 0;
                if (pct >= 0.7) {
                    addMessage(`<div style="margin-top:8px;color:var(--muted)">${escapeHtml(randomFrom(QUIZ_END_FUNNY))} ${escapeHtml(randomFrom(QUIZ_CELEBRATE) || '')}</div>`, 'assistant');
                } else {
                    addMessage(`<div style="margin-top:8px;color:var(--muted)">${escapeHtml(randomFrom(QUIZ_END_NEGATIVE))}</div>`, 'assistant');
                }
                currentQuiz = null; return;
            }

            const question = currentQuiz[currentQuestionIndex];
            const pct = Math.round(((currentQuestionIndex) / Math.max(1,totalQuizQuestions)) * 100);

            // Small unique preamble to make each question feel a bit different
            const preambles = [
                "Ready? Here we go!",
                "Fresh one — show what you know:",
                "Give this a shot:",
                "Let's test you on this:",
                "Quick question — think fast!"
            ];

            // reset any existing per-question timer
            clearQuizTimer();

            // create a unique id for this question so timers/controls cannot clash
            const uid = 'q' + Date.now() + '-' + currentQuestionIndex;
            currentTimerUid = uid;

            const questionHtml = `
                <div class="quiz-question">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
                        <div style="font-weight:700">Question ${currentQuestionIndex + 1} / ${totalQuizQuestions}</div>
                        <div style="font-size:0.9rem;color:var(--muted)">Score: ${quizScore} • Streak: ${quizStreak}</div>
                    </div>
                    <div class="quiz-progress" style="height:8px;background:rgba(0,0,0,0.06);border-radius:8px;overflow:hidden;margin-bottom:8px;">
                        <div style="width:${pct}%;height:100%;background:linear-gradient(90deg,var(--accent-1),var(--accent-2));transition:width:200ms"></div>
                    </div>
                    <div style="margin-bottom:8px;color:var(--muted);font-weight:600">${escapeHtml(randomFrom(preambles))}</div>
                    <h3 style="margin:0 0 8px 0;color:var(--message-text);">${escapeHtml(question.question)}</h3>
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                        <div style="flex:1;margin-right:12px">
                            <div class=\"quiz-timer\" style=\"height:8px;background:rgba(0,0,0,0.06);border-radius:8px;overflow:hidden;\">
                                <div id=\"quiz-timer-bar-${uid}\" style=\"width:100%;height:100%;background:linear-gradient(90deg,var(--accent-1),var(--accent-2));transition:width:250ms\"></div>
                            </div>
                        </div>
                        <div style=\"width:62px;text-align:right;color:var(--muted);font-weight:600\"><span id=\"quiz-timer-label-${uid}\">${QUIZ_TIME_LIMIT}s</span></div>
                    </div>
                    <div class="quiz-options duolingo-style" role="list">
                        ${question.options.map((opt, idx) => `<button class="quiz-option btn-quiz" data-idx="${idx}" onclick="handleQuizAnswer(${idx})" aria-label="Option ${idx+1}">${escapeHtml(opt)}</button>`).join('')}
                    </div>
                </div>
            `;
            addMessage(questionHtml, 'assistant');

            // Start per-question countdown interval that references the same uid used in HTML
            quizTimeLeft = QUIZ_TIME_LIMIT;
            const timerLabelId = 'quiz-timer-label-' + uid;
            const timerBarId = 'quiz-timer-bar-' + uid;
            const timerLabel = document.getElementById(timerLabelId);
            const timerBar = document.getElementById(timerBarId);
            if (timerLabel) timerLabel.textContent = `${quizTimeLeft}s`;
            if (timerBar) timerBar.style.width = '100%';
            quizTimerInterval = setInterval(() => {
                // Ensure this interval belongs to the current question
                if (!currentTimerUid || currentTimerUid !== uid) { clearQuizTimer(); return; }
                quizTimeLeft -= 1;
                const lbl = document.getElementById(timerLabelId);
                const bar = document.getElementById(timerBarId);
                if (lbl) lbl.textContent = `${quizTimeLeft}s`;
                if (bar) bar.style.width = `${Math.max(0, (quizTimeLeft/QUIZ_TIME_LIMIT)*100)}%`;
                if (quizTimeLeft <= 0) {
                    clearQuizTimer();
                    // Handle timeout for this question
                    onQuizTimeout(uid);
                }
            }, 1000);
        }

        function clearQuizTimer() {
            if (quizTimerInterval) { clearInterval(quizTimerInterval); quizTimerInterval = null; }
            if (quizAdvanceTimeout) { clearTimeout(quizAdvanceTimeout); quizAdvanceTimeout = null; }
            quizTimeLeft = 0;
            if (currentTimerUid) {
                const timerLabel = document.getElementById('quiz-timer-label-' + currentTimerUid);
                const timerBar = document.getElementById('quiz-timer-bar-' + currentTimerUid);
                if (timerLabel) timerLabel.textContent = '';
                if (timerBar) timerBar.style.width = '0%';
            }
            currentTimerUid = null;
        }

        function onQuizTimeout(timeoutUid) {
            // Only act if this timeout corresponds to the current visible question
            if (timeoutUid && timeoutUid !== currentTimerUid) return;
            const lastQuestion = document.querySelector('.quiz-question:last-child');
            if (!lastQuestion) return;
            let correct = currentQuiz[currentQuestionIndex].correct;
            // normalize correct to number index
            if (typeof correct === 'string') {
                const s = correct.trim();
                if (/^[A-D]$/i.test(s)) correct = 'ABCD'.indexOf(s.toUpperCase());
                else if (!isNaN(parseInt(s,10))) correct = parseInt(s,10);
                else correct = 0;
            }
            const options = lastQuestion.querySelectorAll('.quiz-option, .btn-quiz');
            options.forEach(o => { o.onclick = null; o.style.cursor = 'default'; });
            const correctEl = lastQuestion.querySelector(`[data-idx='${correct}']`);
            if (correctEl) correctEl.classList.add('correct');
            quizStreak = 0;
            // Prefer the canonical answer text from the quiz data to avoid relying on DOM textContent (can be clipped or ambiguous)
            const canonicalAnswerTimeout = (currentQuiz && currentQuiz[currentQuestionIndex] && Array.isArray(currentQuiz[currentQuestionIndex].options)) ? currentQuiz[currentQuestionIndex].options[correct] : ((correctEl && correctEl.textContent) || 'See above');
            addMessage(`<div>⏰ Time's up! ${escapeHtml(randomFrom(QUIZ_NEGATIVE))} <div style="font-size:0.9rem;color:var(--muted);margin-top:6px">Correct: <strong>${escapeHtml(canonicalAnswerTimeout)}</strong></div></div>`, 'assistant');

            const continueId = 'quiz-continue-' + Date.now();
            addMessage(`<div style="margin-top:8px;display:flex;gap:8px;align-items:center"><button id='${continueId}' class='btn-quiz' style='padding:8px 14px'>Continue</button><div style='color:var(--muted);font-size:0.9rem'>${escapeHtml(randomFrom(QUIZ_ENCOURAGE))}</div></div>`, 'assistant');

            setTimeout(() => {
                const btn = document.getElementById(continueId);
                if (btn) {
                    btn.onclick = () => {
                        btn.disabled = true;
                        if (quizAdvanceTimeout) { clearTimeout(quizAdvanceTimeout); quizAdvanceTimeout = null; }
                        currentQuestionIndex++;
                        showQuizQuestion();
                    };
                }
            }, 50);

            // Auto-advance after short delay if user does nothing
            quizAdvanceTimeout = setTimeout(() => {
                if (currentQuiz && currentQuestionIndex < currentQuiz.length) {
                    currentQuestionIndex++;
                    showQuizQuestion();
                }
            }, 3500);
        }

        function handleQuizAnswer(selected) {
            // Stop countdown and any pending auto-advance for the active question immediately
            clearQuizTimer();

            const lastQuestion = document.querySelector('.quiz-question:last-child');
            if (!lastQuestion) return;
            const options = lastQuestion.querySelectorAll('.quiz-option, .btn-quiz');
            options.forEach(o => { o.onclick = null; o.style.cursor = 'default'; });

            const correct = currentQuiz[currentQuestionIndex].correct;
            // Add lively, varied feedback and a Continue button so pacing feels interactive
            const chosenEl = lastQuestion.querySelector(`[data-idx='${selected}']`);
            const correctEl = lastQuestion.querySelector(`[data-idx='${correct}']`);

            // coerce selected to number
            const selNum = (typeof selected === 'string') ? parseInt(selected,10) : selected;
            if (selNum === correct) {
                if (chosenEl) chosenEl.classList.add('correct');
                quizScore++; quizStreak++;
                // Friendly positive message
                addMessage(`<div style="display:flex;align-items:center;gap:10px;"><div>✅</div><div style="flex:1">${escapeHtml(randomFrom(QUIZ_POSITIVE))}</div><div style="color:var(--muted);font-size:0.9rem">+1</div></div>`, 'assistant');
                // follow-up encouragement
                addMessage(`<div style="color:var(--muted);font-size:0.95rem;margin-top:6px">${escapeHtml(randomFrom(QUIZ_ENCOURAGE))}</div>`, 'assistant');
            } else {
                if (chosenEl) chosenEl.classList.add('incorrect');
                if (correctEl) correctEl.classList.add('correct');
                quizStreak = 0;
                // Use the canonical answer from the quiz data (safer than reading DOM textContent)
                const canonicalAnswer = (currentQuiz && currentQuiz[currentQuestionIndex] && Array.isArray(currentQuiz[currentQuestionIndex].options)) ? currentQuiz[currentQuestionIndex].options[correct] : ((correctEl && correctEl.textContent) || 'See above');
                addMessage(`<div style="display:flex;align-items:center;gap:10px;"><div>❌</div><div style="flex:1">${escapeHtml(randomFrom(QUIZ_NEGATIVE))} <div style="font-size:0.9rem;color:var(--muted);margin-top:6px">Answer: <strong>${escapeHtml(canonicalAnswer)}</strong></div></div></div>`, 'assistant');
                // follow-up encouragement for incorrect answers
                addMessage(`<div style="color:var(--muted);font-size:0.95rem;margin-top:6px">${escapeHtml(randomFrom(QUIZ_ENCOURAGE))}</div>`, 'assistant');
            }

            // Add an encourage/continue control so users can choose pacing
            const continueId = 'quiz-continue-' + Date.now();
            addMessage(`<div style="margin-top:8px;display:flex;gap:8px;align-items:center"><button id='${continueId}' class='btn-quiz' style='padding:8px 14px'>Continue</button><div style='color:var(--muted);font-size:0.9rem'>${escapeHtml(randomFrom(QUIZ_ENCOURAGE))}</div></div>`, 'assistant');

            // Wire the continue button to advance; clear any pending auto-advance first
            setTimeout(() => {
                const btn = document.getElementById(continueId);
                if (btn) {
                    btn.onclick = () => {
                        btn.disabled = true;
                        if (quizAdvanceTimeout) { clearTimeout(quizAdvanceTimeout); quizAdvanceTimeout = null; }
                        currentQuestionIndex++;
                        showQuizQuestion();
                    };
                }
            }, 50);

            // Safety: auto-advance after 6s if user doesn't click (use central quizAdvanceTimeout so it can be cleared)
            if (quizAdvanceTimeout) { clearTimeout(quizAdvanceTimeout); quizAdvanceTimeout = null; }
            quizAdvanceTimeout = setTimeout(() => {
                // only advance if quiz still active
                if (currentQuiz && currentQuestionIndex < currentQuiz.length) {
                    currentQuestionIndex++;
                    showQuizQuestion();
                }
            }, 6000);
        }

        // =====================
        // Utilities
        // =====================
        // Resilient fetch helper with retries for transient errors (503, 429)
        async function fetchWithRetries(url, opts = {}, maxRetries = 4) {
            let attempt = 0;
            while (true) {
                try {
                    const resp = await fetch(url, opts);
                    // Retry on transient server overload or rate limit
                    if ((resp.status === 503 || resp.status === 429) && attempt < maxRetries) {
                        const delay = Math.round((500 * Math.pow(2, attempt)) + Math.random() * 300);
                        addMessage(`Transient error ${resp.status} received from server; retrying (${attempt + 1}/${maxRetries}) in ${delay}ms...`, 'assistant');
                        await new Promise(r => setTimeout(r, delay));
                        attempt++;
                        continue;
                    }
                    return resp;
                } catch (e) {
                    // Network error - retry a few times
                    if (attempt < maxRetries) {
                        const delay = Math.round((500 * Math.pow(2, attempt)) + Math.random() * 300);
                        addMessage(`Network error while contacting server; retrying (${attempt + 1}/${maxRetries}) in ${delay}ms...`, 'assistant');
                        await new Promise(r => setTimeout(r, delay));
                        attempt++;
                        continue;
                    }
                    throw e;
                }
            }
        }
        // Lightweight markdown renderer used in notes preview (subset)
        function renderMarkdown(text) {
            if (!text) return '';
            // normalize newlines (CRLF -> LF) so regexes work on Windows-sourced notes
            text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            // code fences
            let out = text.replace(/```([\s\S]*?)```/g, (m, p1) => `<pre style="white-space:pre-wrap;background:rgba(0,0,0,0.04);padding:8px;border-radius:6px">${escapeHtml(p1)}</pre>`);
            out = out.replace(/^### (.*$)/gim, (m, content) => `<h3>${escapeHtml(content)}</h3>`);
            out = out.replace(/^## (.*$)/gim, (m, content) => `<h2>${escapeHtml(content)}</h2>`);
            out = out.replace(/^# (.*$)/gim, (m, content) => `<h1>${escapeHtml(content)}</h1>`);
            out = out.replace(/\*\*(.*?)\*\*/gim, (m, content) => `<strong>${escapeHtml(content)}</strong>`);
            out = out.replace(/\*(.*?)\*/gim, (m, content) => `<em>${escapeHtml(content)}</em>`);
            out = out.replace(/(^|\n)\s*[-\*\+] (.*)/gim, (m, prefix, content) => `${prefix}<li>${escapeHtml(content)}</li>`);
            out = out.replace(/(<li>[\s\S]*?<\/li>)/gim, '<ul>$1</ul>');
            out = out.replace(/`([^`]+)`/gim, (m, content) => `<code style="background:rgba(0,0,0,0.04);padding:2px 6px;border-radius:4px">${escapeHtml(content)}</code>`);
            out = out.replace(/\n\n+/g, '</p><p>');
            return `<p>${out}</p>`;
        }
        function escapeHtml(str) {
            if (typeof str !== 'string') return str;
            return str.replace(/[&<>"']/g, function (m) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]; });
        }

        // =====================
        // Init
        // =====================
        function init() {
            loadState();
            // load chat history from server if available (best-effort)
            (async ()=>{
                try {
                        const msgs = await apiGet('messages');
                        if (Array.isArray(msgs)) {
                                            for (const m of msgs) {
                                                // skip if we've already rendered this server message
                                                if (m && m.id && seenMessageIds.has(String(m.id))) continue;
                                                // filter out automated theme messages previously saved to DB
                                                if (m && m.content && typeof m.content === 'string' && m.content.startsWith('Theme set to ')) continue;
                                                if (m && m.id) seenMessageIds.add(String(m.id));
                                                addMessage(m.content, m.role || 'user', false);
                                            }
                        }
                } catch (e) { /* ignore */ }
            })();
            updatePeelBar();
            populateReminderPanel();
            // If no Gemini endpoint is configured, default to the production backend proxy to make it easier to get started.
            // The user can override this with .setEndpoint <url>.
            if (!getGeminiEndpoint()) {
                const defaultProxy = 'https://alfred-ai-73gj.onrender.com/gemini';
                try { localStorage.setItem('sa_gemini_endpoint', defaultProxy); } catch (e) { /* ignore storage errors */ }
                addMessage(`No Gemini endpoint configured; defaulting to production proxy at ${defaultProxy}. Use .setEndpoint <url> to change.`, 'assistant', false);
            }

            // Fetch server-stored theme preference (if any) and apply it without announcing
            (async ()=>{
                try {
                    const s = await apiGet('settings/theme');
                    if (s && s.theme) applyTheme(s.theme, false);
                } catch (e) { /* ignore */ }
            })();

            // Start rotating the peel content every 15s so the top peel cycles through reminders
            startPeelRotation();

            // Schedule reminders and start periodic checks
            scheduleAllReminders();

            // Ask for notification permission quietly if not set
            try { if (typeof Notification !== 'undefined' && Notification.permission === 'default') Notification.requestPermission().catch(()=>{}); } catch (e) {}

            // Re-schedule reminders when page becomes visible or window gains focus
            document.addEventListener('visibilitychange', () => { if (!document.hidden) { console.log('[reminder] visibilitychange -> scheduling'); scheduleAllReminders(); } });
            window.addEventListener('focus', () => { console.log('[reminder] window focus -> scheduling'); scheduleAllReminders(); });

            // Stop rotation when page is unloaded to avoid dangling intervals
            window.addEventListener('beforeunload', () => stopPeelRotation());

            // Welcome message stays
            addMessage('Welcome! Everything is command-driven — try .reminder TaskName 3:00PM Monday, .note, .theme dark, or .quiz.math', 'system', false);
        // First-load onboarding: if no token and user hasn't completed onboarding, redirect to login/signup flow
        try {
            const token = localStorage.getItem(AUTH_TOKEN_KEY);
            const seen = localStorage.getItem('sa_seen_onboarding');
            if (!token && !seen) {
                // open the dedicated login/signup page for first-time users
                window.location.href = '/login.html';
                return;
            }
        } catch (e) {}
        }

        document.addEventListener('DOMContentLoaded', init);
        // Preview toggle wiring
    // Initialize command autocomplete after DOM ready
    document.addEventListener('DOMContentLoaded', initCommandAutocomplete);
        document.addEventListener('DOMContentLoaded', ()=>{
            const previewBtn = document.getElementById('previewToggleBtn');
            const overlay = document.getElementById('notesOverlay');
            const prev = document.getElementById('notesPreview');
            const ta = document.getElementById('notesTextarea');
            if (previewBtn && prev && overlay) {
                previewBtn.addEventListener('click', ()=>{
                    // toggle visible class on overlay to show/hide preview
                    if (overlay.classList.contains('preview-visible')) {
                        overlay.classList.remove('preview-visible');
                        prev.style.display = 'none';
                    } else {
                        overlay.classList.add('preview-visible');
                        prev.style.display = 'block';
                        try { prev.innerHTML = renderMarkdown(ta.value); } catch(e){ prev.textContent = ta.value; }
                    }
                });
            }
            if (ta && prev) ta.addEventListener('input', ()=>{ try { prev.innerHTML = renderMarkdown(ta.value); } catch(e){ prev.textContent = ta.value; } });
        });
    // Expose some functions to global scope used by inline HTML
    window.toggleReminderPanel = toggleReminderPanel;
    window.handleKeyPress = handleKeyPress;
    window.handleKeyDown = handleKeyDown; // required by index.html input onkeydown
    window.sendMessage = sendMessage;
    window.openNotesEditor = openNotesEditor;
    window.closeNotesEditor = closeNotesEditor;
    window.saveNote = saveNote;
    // Quiz handlers exposed for inline onclick attributes
    window.handleQuizAnswer = handleQuizAnswer;
    window.selectQuizOption = function(){ /* kept for compatibility, new handler used */ };

    // --- Auth & Profile UX ---
    function showAuthBanner() {
        const bannerId = 'authBanner';
        let el = document.getElementById(bannerId);
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const htmlLoggedOut = `<a class='btn-quiz' href='/login.html'>Login</a><a class='btn-quiz' href='/signup.html'>Signup</a>`;
    const htmlLoggedIn = `<a class='btn-quiz' href='/profile.html'>Profile</a><button class='btn-quiz' onclick='logout()'>Logout</button>`;
        if (!el) {
            el = document.createElement('div');
            el.id = bannerId;
            el.style.padding = '10px';
            el.style.display = 'flex';
            el.style.justifyContent = 'flex-end';
            el.style.gap = '8px';
            document.body.prepend(el);
        }
        el.innerHTML = token ? htmlLoggedIn : htmlLoggedOut;
    }

    function openSignupModal() {
        const html = `
            <div style='padding:14px'>
              <h3>Create account</h3>
              <input id='su_email' placeholder='Email' style='width:100%;margin-bottom:8px'/>
              <input id='su_password' placeholder='Password' type='password' style='width:100%;margin-bottom:8px'/>
              <input id='su_name' placeholder='Name' style='width:100%;margin-bottom:8px'/>
              <input id='su_school' placeholder='Class / School' style='width:100%;margin-bottom:8px'/>
              <div style='display:flex;gap:8px;justify-content:flex-end'><button onclick='closeModal()' class='btn-quiz'>Cancel</button><button onclick='signup()' class='btn-quiz'>Create</button></div>
            </div>`;
        openModal(html);
    }

    function openLoginModal() {
        const html = `
            <div style='padding:14px'>
              <h3>Login</h3>
              <input id='li_email' placeholder='Email' style='width:100%;margin-bottom:8px'/>
              <input id='li_password' placeholder='Password' type='password' style='width:100%;margin-bottom:8px'/>
              <div style='display:flex;gap:8px;justify-content:flex-end'><button onclick='closeModal()' class='btn-quiz'>Cancel</button><button onclick='login()' class='btn-quiz'>Login</button></div>
            </div>`;
        openModal(html);
    }

    function openProfileForm() {
        // load existing prefs
        (async ()=>{
            let meta = {};
            try { const r = await apiGet('user/preferences').catch(()=>null); meta = r && r.meta ? r.meta : {}; } catch(e){}
            const html = `
            <div style='padding:14px;max-width:600px'>
              <h3>Your profile & preferences</h3>
              <input id='pf_name' placeholder='Name' value='${escapeHtml(meta.name||'')}' style='width:100%;margin-bottom:8px'/>
              <input id='pf_school' placeholder='Class / School' value='${escapeHtml(meta.school||'')}' style='width:100%;margin-bottom:8px'/>
              <input id='pf_fav' placeholder='Favorite things' value='${escapeHtml(meta.fav||'')}' style='width:100%;margin-bottom:8px'/>
              <input id='pf_hobbies' placeholder='Hobbies' value='${escapeHtml(meta.hobbies||'')}' style='width:100%;margin-bottom:8px'/>
              <input id='pf_movies' placeholder='Best movies/music' value='${escapeHtml(meta.movies||'')}' style='width:100%;margin-bottom:8px'/>
              <textarea id='pf_goals' placeholder='Goals / what you want from the app' style='width:100%;height:80px;margin-bottom:8px'>${escapeHtml(meta.goals||'')}</textarea>
              <div style='display:flex;gap:8px;justify-content:flex-end'><button onclick='closeModal()' class='btn-quiz'>Cancel</button><button onclick='saveProfilePrefs()' class='btn-quiz'>Save</button></div>
            </div>`;
            openModal(html);
        })();
    }

    async function signup() {
        const email = document.getElementById('su_email').value;
        const password = document.getElementById('su_password').value;
        const name = document.getElementById('su_name').value;
        const school = document.getElementById('su_school').value;
        try {
            const r = await fetch(`${API_ROOT.replace(/\/$/, '')}/api/auth/signup`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, name, school }) });
            const j = await r.json();
            if (!r.ok) throw new Error(j && j.error ? j.error : 'signup failed');
            localStorage.setItem(AUTH_TOKEN_KEY, j.token);
            closeModal();
            addMessage('Signup successful. Please complete your profile.', 'assistant');
            try { showAuthBanner(); } catch(e){}
            openProfileForm();
        } catch (e) { addMessage('Signup failed: ' + escapeHtml(String(e)), 'assistant'); }
    }

    async function login() {
        const email = document.getElementById('li_email').value;
        const password = document.getElementById('li_password').value;
        try {
            const r = await fetch(`${API_ROOT.replace(/\/$/, '')}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
            const j = await r.json();
            if (!r.ok) throw new Error(j && j.error ? j.error : 'login failed');
            localStorage.setItem(AUTH_TOKEN_KEY, j.token);
            closeModal();
            addMessage('Login successful.', 'assistant');
            try { showAuthBanner(); } catch(e){}
        } catch (e) { addMessage('Login failed: ' + escapeHtml(String(e)), 'assistant'); }
    }

    async function saveProfilePrefs() {
        const meta = {
            name: document.getElementById('pf_name').value,
            school: document.getElementById('pf_school').value,
            fav: document.getElementById('pf_fav').value,
            hobbies: document.getElementById('pf_hobbies').value,
            movies: document.getElementById('pf_movies').value,
            goals: document.getElementById('pf_goals').value
        };
        try {
            const r = await apiPost('user/preferences', { meta });
            addMessage('Profile saved. Your details will be included in future AI prompts.', 'assistant');
            closeModal();
            try { showAuthBanner(); } catch(e){}
        } catch (e) { addMessage('Failed saving profile: ' + escapeHtml(String(e)), 'assistant'); }
    }

    // Minimal modal helpers
    function openModal(html) {
        let m = document.getElementById('sa_modal');
        if (!m) {
            m = document.createElement('div'); m.id = 'sa_modal';
            m.style.position = 'fixed'; m.style.left = 0; m.style.top = 0; m.style.right = 0; m.style.bottom = 0; m.style.background = 'rgba(0,0,0,0.4)'; m.style.display = 'flex'; m.style.alignItems = 'center'; m.style.justifyContent = 'center'; m.style.zIndex = 9999;
            const inner = document.createElement('div'); inner.id = 'sa_modal_inner'; inner.style.background = 'var(--panel-bg)'; inner.style.padding = '12px'; inner.style.borderRadius = '8px'; inner.style.width = '90%'; inner.style.maxWidth = '720px'; m.appendChild(inner);
            document.body.appendChild(m);
        }
        document.getElementById('sa_modal_inner').innerHTML = html;
        m.style.display = 'flex';
    }
    function closeModal() { const m = document.getElementById('sa_modal'); if (m) m.style.display = 'none'; }

    // Expose to window
    window.openLoginModal = openLoginModal;
    window.openSignupModal = openSignupModal;
    window.openProfileForm = openProfileForm;
    window.closeModal = closeModal;
    window.logout = function(){ localStorage.removeItem(AUTH_TOKEN_KEY); localStorage.removeItem('sa_seen_onboarding'); addMessage('Logged out.', 'assistant'); window.location.href = '/login.html'; };
const quizTemplates = {
  math: [
    {
      question: "What is 15 × 7?",
      options: ["95", "105", "115", "125"],
      correct: 1
    },
    {
      question: "What is the square root of 144?",
      options: ["11", "12", "13", "14"],
      correct: 1
    },
    {
      question: "What is 8² + 3²?",
      options: ["73", "64", "81", "100"],
      correct: 0
    },
    {
      question: "Solve for x: 2x + 5 = 17",
      options: ["6", "11", "7", "12"],
      correct: 0
    },
    {
      question: "What is 25% of 200?",
      options: ["50", "75", "25", "100"],
      correct: 0
    },
    {
      question: "What is the area of a circle with radius 5? (Use π ≈ 3.14)",
      options: ["78.5", "31.4", "15.7", "62.8"],
      correct: 0
    },
    {
      question: "What is 100 ÷ 4?",
      options: ["25", "20", "30", "35"],
      correct: 0
    },
    {
      question: "What is 2³?",
      options: ["6", "8", "9", "12"],
      correct: 1
    },
    {
      question: "What is the perimeter of a square with side 6?",
      options: ["24", "36", "18", "30"],
      correct: 0
    },
    {
      question: "What is 45 + 27?",
      options: ["72", "63", "81", "54"],
      correct: 0
    }
  ],

  spanish: [
    {
      question: "What does 'Hola' mean in English?",
      options: ["Goodbye", "Hello", "Please", "Thank you"],
      correct: 1
    },
    {
      question: "How do you say 'cat' in Spanish?",
      options: ["Perro", "Gato", "Pájaro", "Pez"],
      correct: 1
    },
    {
      question: "What is 'gracias' in English?",
      options: ["Please", "Sorry", "Thank you", "You're welcome"],
      correct: 2
    },
    {
      question: "How do you say 'water' in Spanish?",
      options: ["Fuego", "Agua", "Tierra", "Aire"],
      correct: 1
    },
    {
      question: "What does 'adiós' mean?",
      options: ["Hello", "Goodbye", "Please", "Thank you"],
      correct: 1
    },
    {
      question: "How do you say 'house' in Spanish?",
      options: ["Casa", "Coche", "Perro", "Gato"],
      correct: 0
    },
    {
      question: "What is 'rojo' in English?",
      options: ["Blue", "Red", "Green", "Yellow"],
      correct: 1
    },
    {
      question: "How do you say 'I am' in Spanish?",
      options: ["Soy", "Eres", "Es", "Somos"],
      correct: 0
    },
    {
      question: "What does 'por favor' mean?",
      options: ["Thank you", "Please", "Excuse me", "You're welcome"],
      correct: 1
    },
    {
      question: "How do you say 'friend' in Spanish?",
      options: ["Amigo", "Hermano", "Padre", "Madre"],
      correct: 0
    }
  ],

  science: [
    {
      question: "What is the chemical symbol for water?",
      options: ["H2O", "CO2", "O2", "NaCl"],
      correct: 0
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correct: 1
    },
    {
      question: "What is the powerhouse of the cell?",
      options: ["Nucleus", "Ribosome", "Mitochondria", "Endoplasmic Reticulum"],
      correct: 2
    },
    {
      question: "What gas do plants absorb from the atmosphere?",
      options: ["Oxygen", "Carbon Dioxide", "Nitrogen", "Hydrogen"],
      correct: 1
    },
    {
      question: "What is the largest organ in the human body?",
      options: ["Heart", "Brain", "Liver", "Skin"],
      correct: 3
    },
    {
      question: "Which element has atomic number 1?",
      options: ["Helium", "Hydrogen", "Lithium", "Carbon"],
      correct: 1
    },
    {
      question: "What is the process by which plants make their own food?",
      options: ["Respiration", "Photosynthesis", "Transpiration", "Digestion"],
      correct: 1
    },
    {
      question: "What is the boiling point of water in Celsius?",
      options: ["0°C", "50°C", "100°C", "150°C"],
      correct: 2
    },
    {
      question: "Which blood type is known as the universal donor?",
      options: ["A", "B", "AB", "O"],
      correct: 3
    },
    {
      question: "What is the speed of light approximately?",
      options: ["300,000 km/s", "150,000 km/s", "500,000 km/s", "1,000,000 km/s"],
      correct: 0
    }
  ],

  history: [
    {
      question: "In which year did World War II end?",
      options: ["1944", "1945", "1946", "1947"],
      correct: 1
    },
    {
      question: "Who was the first President of the United States?",
      options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
      correct: 2
    },
    {
      question: "Which ancient civilization built the pyramids at Giza?",
      options: ["Romans", "Greeks", "Egyptians", "Mesopotamians"],
      correct: 2
    },
    {
      question: "In which year did the Titanic sink?",
      options: ["1910", "1912", "1914", "1916"],
      correct: 1
    },
    {
      question: "Who painted the Mona Lisa?",
      options: ["Vincent van Gogh", "Pablo Picasso", "Leonardo da Vinci", "Michelangelo"],
      correct: 2
    },
    {
      question: "Which war was fought between the North and South regions in the United States?",
      options: ["World War I", "World War II", "Civil War", "Revolutionary War"],
      correct: 2
    },
    {
      question: "In which year did man first land on the moon?",
      options: ["1967", "1968", "1969", "1970"],
      correct: 2
    },
    {
      question: "Who was the British Prime Minister during most of World War II?",
      options: ["Neville Chamberlain", "Winston Churchill", "Clement Attlee", "Anthony Eden"],
      correct: 1
    },
    {
      question: "Which empire was ruled by Julius Caesar?",
      options: ["Greek Empire", "Roman Empire", "Persian Empire", "Ottoman Empire"],
      correct: 1
    },
    {
      question: "In which year was the Declaration of Independence signed?",
      options: ["1774", "1775", "1776", "1777"],
      correct: 2
    }
  ],

  general: [
    {
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correct: 2
    },
    {
      question: "Which is the largest ocean on Earth?",
      options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      correct: 3
    },
    {
      question: "What is 2 + 2 × 3?",
      options: ["12", "8", "10", "6"],
      correct: 1
    },
    {
      question: "Which planet is closest to the Sun?",
      options: ["Venus", "Mars", "Mercury", "Earth"],
      correct: 2
    },
    {
      question: "What color do you get when you mix red and white?",
      options: ["Purple", "Orange", "Pink", "Brown"],
      correct: 2
    },
    {
      question: "How many continents are there?",
      options: ["5", "6", "7", "8"],
      correct: 2
    },
    {
      question: "What is the largest mammal?",
      options: ["Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
      correct: 1
    },
    {
      question: "Which season comes after winter?",
      options: ["Summer", "Autumn", "Spring", "Winter"],
      correct: 2
    },
    {
      question: "What do bees make?",
      options: ["Milk", "Honey", "Butter", "Cheese"],
      correct: 1
    },
    {
      question: "How many legs does a spider have?",
      options: ["6", "8", "10", "12"],
      correct: 1
    }
  ],

  programming: [
    {
      question: "What does HTML stand for?",
      options: ["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"],
      correct: 0
    },
    {
      question: "Which programming language is known as the 'mother of all languages'?",
      options: ["Java", "C", "Python", "JavaScript"],
      correct: 1
    },
    {
      question: "What does CSS stand for?",
      options: ["Computer Style Sheets", "Creative Style Sheets", "Cascading Style Sheets", "Colorful Style Sheets"],
      correct: 2
    },
    {
      question: "Which of these is NOT a programming language?",
      options: ["Python", "JavaScript", "HTML", "Java"],
      correct: 2
    },
    {
      question: "What is the purpose of a variable in programming?",
      options: ["To store data", "To perform calculations", "To display output", "To create loops"],
      correct: 0
    },
    {
      question: "Which symbol is used for comments in JavaScript?",
      options: ["//", "/*", "#", "<!--"],
      correct: 0
    },
    {
      question: "What does 'debugging' mean?",
      options: ["Writing code", "Finding and fixing errors", "Running programs", "Designing interfaces"],
      correct: 1
    },
    {
      question: "Which data type stores true/false values?",
      options: ["String", "Number", "Boolean", "Array"],
      correct: 2
    },
    {
      question: "What is a loop used for in programming?",
      options: ["Storing data", "Repeating code", "Making decisions", "Defining functions"],
      correct: 1
    },
    {
      question: "Which company developed JavaScript?",
      options: ["Microsoft", "Apple", "Netscape", "Google"],
      correct: 2
    }
  ]
};

module.exports = quizTemplates;
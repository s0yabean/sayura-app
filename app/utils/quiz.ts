export interface QuizQuestion {
  id: number;
  question: string;
  options: Array<{
    id: string;
    text: string;
    categories: string[];
  }>;
}

export interface QuizResult {
  dominantCategories: string[];
  recommendations: Array<{
    text: string;
    category: string;
  }>;
}

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "When you wake up in the morning, what's your first instinct?",
    options: [
      { id: 'a', text: "Check my goals and plan my day", categories: ['career', 'growth'] },
      { id: 'b', text: "Practice gratitude and meditation", categories: ['health', 'growth'] },
      { id: 'c', text: "Connect with loved ones", categories: ['love', 'growth'] },
      { id: 'd', text: "Review my financial goals", categories: ['wealth', 'career'] }
    ]
  },
  {
    id: 2,
    question: "What brings you the most fulfillment?",
    options: [
      { id: 'a', text: "Achieving my professional dreams", categories: ['career', 'growth'] },
      { id: 'b', text: "Feeling healthy and energized", categories: ['health', 'growth'] },
      { id: 'c', text: "Deep, meaningful relationships", categories: ['love', 'growth'] },
      { id: 'd', text: "Financial freedom and security", categories: ['wealth', 'career'] }
    ]
  },
  {
    id: 3,
    question: "When facing challenges, you tend to:",
    options: [
      { id: 'a', text: "Focus on solutions and opportunities", categories: ['career', 'growth'] },
      { id: 'b', text: "Take care of my mental and physical wellbeing first", categories: ['health', 'growth'] },
      { id: 'c', text: "Seek support from family and friends", categories: ['love', 'growth'] },
      { id: 'd', text: "Look for ways to turn challenges into profit", categories: ['wealth', 'career'] }
    ]
  },
  {
    id: 4,
    question: "Your ideal evening involves:",
    options: [
      { id: 'a', text: "Learning new skills or working on projects", categories: ['career', 'growth'] },
      { id: 'b', text: "Yoga, reading, or peaceful activities", categories: ['health', 'growth'] },
      { id: 'c', text: "Quality time with people I care about", categories: ['love', 'growth'] },
      { id: 'd', text: "Planning investments or side hustles", categories: ['wealth', 'career'] }
    ]
  },
  {
    id: 5,
    question: "What would make you feel most proud in 5 years?",
    options: [
      { id: 'a', text: "Leading my industry and inspiring others", categories: ['career', 'growth'] },
      { id: 'b', text: "Living with vibrant health and inner peace", categories: ['health', 'growth'] },
      { id: 'c', text: "Having built beautiful, lasting relationships", categories: ['love', 'growth'] },
      { id: 'd', text: "Achieving complete financial independence", categories: ['wealth', 'career'] }
    ]
  }
];

const affirmationBank = {
  growth: [
    "I am constantly evolving and becoming my best self",
    "Every challenge is an opportunity for me to grow stronger",
    "I trust my journey and embrace continuous learning",
    "My potential is limitless and I expand every day",
    "I welcome change as a pathway to my highest self"
  ],
  career: [
    "I am a leader who inspires and creates positive impact",
    "My skills and talents open doors to amazing opportunities",
    "I confidently pursue my professional dreams",
    "Success flows to me as I align with my purpose",
    "I am worthy of recognition and career advancement"
  ],
  health: [
    "My body is strong, vibrant, and full of energy",
    "I nourish myself with love, care, and healthy choices",
    "Every breath I take fills me with vitality and peace",
    "I honor my body as the temple of my spirit",
    "My mind is clear, focused, and beautifully balanced"
  ],
  wealth: [
    "Money flows to me easily and abundantly",
    "I am a magnet for prosperity and financial opportunities",
    "My wealth grows while I serve others with my gifts",
    "I deserve abundance in all areas of my life",
    "I make wise decisions that multiply my resources"
  ],
  love: [
    "I am worthy of deep, unconditional love",
    "My heart is open to giving and receiving beautiful connections",
    "Love surrounds me in every relationship I nurture",
    "I attract people who celebrate and support my authentic self",
    "My capacity for love grows stronger every day"
  ]
};

export const calculateQuizResult = (answers: Record<number, string>): QuizResult => {
  // Count category frequencies
  const categoryCount: Record<string, number> = {};
  
  Object.entries(answers).forEach(([questionId, answerId]) => {
    const question = quizQuestions.find(q => q.id === parseInt(questionId));
    const selectedOption = question?.options.find(o => o.id === answerId);
    
    selectedOption?.categories.forEach(category => {
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
  });
  
  // Find top categories
  const sortedCategories = Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .map(([category]) => category);
  
  const dominantCategories = sortedCategories.slice(0, 3);
  
  // Generate recommendations
  const recommendations = dominantCategories.map(category => {
    const affirmations = affirmationBank[category as keyof typeof affirmationBank] || [];
    const randomAffirmation = affirmations[Math.floor(Math.random() * affirmations.length)];
    return {
      text: randomAffirmation,
      category
    };
  });
  
  return {
    dominantCategories,
    recommendations
  };
};
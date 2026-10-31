export interface CosmicAffirmation {
  id: string;
  text: string;
  category: 'work' | 'career' | 'love' | 'family' | 'personal-growth' | 'spiritual-growth';
}

export const cosmicVault: CosmicAffirmation[] = [
  // Work (8 affirmations)
  { id: '1', text: 'I bring creativity and passion to everything I do', category: 'work' },
  { id: '2', text: 'My work contributes meaningfully to the world around me', category: 'work' },
  { id: '3', text: 'I approach challenges with confidence and innovative solutions', category: 'work' },
  { id: '4', text: 'I deserve recognition for my talents and dedication', category: 'work' },
  { id: '5', text: 'Every project I touch becomes more beautiful and effective', category: 'work' },
  { id: '6', text: 'I balance productivity with peace in my daily work', category: 'work' },
  { id: '7', text: 'My expertise grows stronger with each passing day', category: 'work' },
  { id: '8', text: 'I collaborate effortlessly and inspire those around me', category: 'work' },

  // Career (8 affirmations)
  { id: '9', text: 'My career path unfolds perfectly according to my highest purpose', category: 'career' },
  { id: '10', text: 'I attract opportunities that align with my dreams and values', category: 'career' },
  { id: '11', text: 'Leadership flows naturally through me in all situations', category: 'career' },
  { id: '12', text: 'I am worthy of advancement and increased responsibility', category: 'career' },
  { id: '13', text: 'My professional network expands with meaningful connections', category: 'career' },
  { id: '14', text: 'Success comes to me through authentic self-expression', category: 'career' },
  { id: '15', text: 'I make decisions with wisdom and trust my professional instincts', category: 'career' },
  { id: '16', text: 'My career brings me joy, fulfillment, and abundant prosperity', category: 'career' },

  // Love (8 affirmations)
  { id: '17', text: 'I am worthy of deep, unconditional love in all its forms', category: 'love' },
  { id: '18', text: 'My heart is open to giving and receiving beautiful connections', category: 'love' },
  { id: '19', text: 'I attract relationships that honor and celebrate my authentic self', category: 'love' },
  { id: '20', text: 'Love flows effortlessly into every area of my life', category: 'love' },
  { id: '21', text: 'I communicate with kindness, honesty, and compassionate understanding', category: 'love' },
  { id: '22', text: 'My capacity for love grows deeper and more radiant each day', category: 'love' },
  { id: '23', text: 'I choose partners who support my growth and dreams', category: 'love' },
  { id: '24', text: 'Self-love is the foundation of all my beautiful relationships', category: 'love' },

  // Family (8 affirmations)
  { id: '25', text: 'My family relationships are filled with understanding and support', category: 'family' },
  { id: '26', text: 'I create harmony and peace within my family dynamics', category: 'family' },
  { id: '27', text: 'Generations of love and wisdom flow through my family line', category: 'family' },
  { id: '28', text: 'I am a source of strength and comfort for those I love', category: 'family' },
  { id: '29', text: 'Family traditions bring joy and connection to our lives', category: 'family' },
  { id: '30', text: 'I forgive past hurts and choose love in family relationships', category: 'family' },
  { id: '31', text: 'My home is a sanctuary of love, laughter, and acceptance', category: 'family' },
  { id: '32', text: 'I nurture the bonds that matter most with presence and care', category: 'family' },

  // Personal Growth (9 affirmations)
  { id: '33', text: 'Every challenge is an opportunity for me to grow stronger', category: 'personal-growth' },
  { id: '34', text: 'I embrace change as a pathway to my highest potential', category: 'personal-growth' },
  { id: '35', text: 'My confidence expands with each brave step I take', category: 'personal-growth' },
  { id: '36', text: 'I trust my journey and celebrate my progress along the way', category: 'personal-growth' },
  { id: '37', text: 'Learning and growing bring me tremendous joy and satisfaction', category: 'personal-growth' },
  { id: '38', text: 'I release limiting beliefs and embrace my unlimited possibilities', category: 'personal-growth' },
  { id: '39', text: 'My past experiences have shaped me into someone incredibly resilient', category: 'personal-growth' },
  { id: '40', text: 'I honor my emotions while choosing responses that serve my growth', category: 'personal-growth' },
  { id: '41', text: 'Every day I become more aligned with my authentic self', category: 'personal-growth' },

  // Spiritual Growth (9 affirmations)
  { id: '42', text: 'I am connected to the infinite wisdom of the universe', category: 'spiritual-growth' },
  { id: '43', text: 'Divine guidance flows through me in perfect timing', category: 'spiritual-growth' },
  { id: '44', text: 'My spirit is peaceful, centered, and beautifully grounded', category: 'spiritual-growth' },
  { id: '45', text: 'I trust the sacred unfolding of my spiritual journey', category: 'spiritual-growth' },
  { id: '46', text: 'Meditation and mindfulness bring clarity to my daily life', category: 'spiritual-growth' },
  { id: '47', text: 'I am grateful for the blessings that surround me each moment', category: 'spiritual-growth' },
  { id: '48', text: 'My soul radiates light and attracts positive energy', category: 'spiritual-growth' },
  { id: '49', text: 'I am one with all life and feel the connection deeply', category: 'spiritual-growth' },
  { id: '50', text: 'The universe conspires to support my highest good always', category: 'spiritual-growth' },
];

export const getRandomAffirmation = (): CosmicAffirmation => {
  const randomIndex = Math.floor(Math.random() * cosmicVault.length);
  return cosmicVault[randomIndex];
};

export const getCategoryDisplayName = (category: string): string => {
  switch (category) {
    case 'work': return 'Work';
    case 'career': return 'Career';
    case 'love': return 'Love';
    case 'family': return 'Family';
    case 'personal-growth': return 'Personal Growth';
    case 'spiritual-growth': return 'Spiritual Growth';
    default: return 'Life';
  }
};
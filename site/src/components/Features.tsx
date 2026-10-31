import { Mic, Zap, Target } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: <Mic className="w-8 h-8" />,
      title: "When Clarity Feels Out of Reach",
      description: "Lost in negative thoughts or mental fog? Sayura blends cutting-edge AI with mindfulness to help you anchor peace through affirmations that grow with you.",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "When You Struggle To Express Yourself",
      description: "Struggling to believe your own words? Record daily affirmations with real-time waveforms and energy insights that strengthen your presence.",
      gradient: "from-blue-500 to-purple-500"
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "When Self-Doubt Creeps In",
      description: "Low confidence or uncertainty? Our AI listens for vocal strength and gives tailored feedback to rebuild self-trust.",
      gradient: "from-indigo-500 to-blue-500"
    }
  ];

  return (
    <section id="features" className="py-20 bg-gradient-to-b from-purple-900/20 to-blue-900/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            When Your Voice Feels{' '}
            <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Small
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
          Lost in negative thoughts or unclear boundaries? Sayura blends cutting-edge AI with mindfulness to help you anchor peace through affirmations that grow with you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white/10 backdrop-blur-md rounded-2xl p-8 hover:bg-white/12 transition-all duration-300 transform hover:-translate-y-0.5 border border-white/10"
            >
              <div className={`inline-flex p-4 rounded-full bg-gradient-to-r ${feature.gradient} mb-6 group-hover:scale-102 transition-transform duration-300`}>
                {feature.icon}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">
                {feature.title}
              </h3>
              
              <p className="text-gray-300 leading-relaxed">
                {feature.description}
              </p>
              
              {/* Ripple Effect on Hover - Reduced by 80% */}
              <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-purple-400/6 transition-colors duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
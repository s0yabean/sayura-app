import { Play, Brain, Share2 } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      icon: <Play className="w-12 h-12" />,
      title: "Record Your Affirmations",
      description: "Speak your daily affirmations while watching the mesmerizing voice visualization",
      color: "purple"
    },
    {
      icon: <Brain className="w-12 h-12" />,
      title: "AI Analysis & Feedback",
      description: "Our AI analyzes your vocal confidence and provides personalized insights",
      color: "blue"
    },
    {
      icon: <Share2 className="w-12 h-12" />,
      title: "Track Your Ripples",
      description: "Watch your progress expand through the Ripple Galaxy and share with friends",
      color: "pink"
    }
  ];

  return (
    <section id="how-it-works" className="py-20 bg-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Your Journey to{' '}
            <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
              Transformation
            </span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Three simple steps to unlock the power of your voice and create lasting positive change.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-8">
                {/* Connection Line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 w-12 h-0.5 bg-gradient-to-r from-purple-400/50 to-transparent"></div>
                )}
                
                {/* Step Circle */}
                <div className={`relative mx-auto w-24 h-24 rounded-full bg-gradient-to-r ${
                  step.color === 'purple' ? 'from-purple-600 to-pink-600' :
                  step.color === 'blue' ? 'from-blue-600 to-purple-600' :
                  'from-pink-600 to-purple-600'
                } flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  {step.icon}
                  
                  {/* Ripple Effect */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/30 group-hover:animate-ping"></div>
                  <div className="absolute -inset-2 rounded-full border-2 border-white/20 group-hover:animate-ping animation-delay-300"></div>
                </div>
                
                {/* Step Number */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white font-bold border border-white/30">
                  {index + 1}
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                {step.title}
              </h3>
              
              <p className="text-gray-300 leading-relaxed max-w-sm mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
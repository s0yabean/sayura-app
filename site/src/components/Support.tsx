import { Send, Sparkles, Heart } from 'lucide-react';

const Support = () => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Floating Particles */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/10 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center space-y-8">
          {/* Icon with glow effect */}
          <div className="inline-flex p-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse">
            <Heart className="w-16 h-16 text-white" />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-white">
            Need a{' '}
            <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
              Helping Hand?
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            We're here to guide you on your affirmation journey. Whether you have questions, 
            feedback, or just want to share your experience, we'd love to hear from you!
          </p>

          {/* Contact Card */}
          <div className="mt-12 bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20 hover:bg-white/15 transition-all duration-300">
            <div className="space-y-6">
              <div className="inline-flex p-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
                <Send className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl md:text-3xl font-bold text-white">
                Drop us a cosmic message
              </h2>
              
              <p className="text-lg text-gray-300">
                Reach out to the Sayura team. We're always excited to connect with 
                fellow travelers on the path to mindfulness.
              </p>

              <a 
                href="mailto:support@example.com" 
                className="inline-flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-4 px-8 rounded-full transition-all duration-300 transform hover:scale-105"
              >
                <Send className="w-5 h-5" />
                support@example.com
              </a>

              <div className="pt-6 flex justify-center items-center gap-2 text-gray-400">
                <Sparkles className="w-5 h-5" />
                <p className="text-sm">We typically respond within 24 cosmic hours</p>
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Additional support info */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 text-left">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-3">Bug Reports</h3>
              <p className="text-gray-300">Found something amiss? Let us know and help us make Sayura better for everyone.</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-3">Feature Requests</h3>
              <p className="text-gray-300">Have an idea that could enhance your affirmation journey? We're all ears!</p>
            </div>
            
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-bold text-white mb-3">General Questions</h3>
              <p className="text-gray-300">Curious about Sayura or need guidance? Don't hesitate to reach out.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Support;
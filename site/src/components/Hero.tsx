import appScreenshot from '../assets/images/IMG_2402-left.png';
import appStoreBadge from '../assets/images/Available_on_the_App_Store_(black)_SVG.svg';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 md:pt-16">
      {/* Cosmic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg fill=%22none%22 fill-rule=%22evenodd%22%3E%3Cg fill=%22%239C92AC%22 fill-opacity=%220.1%22%3E%3Ccircle cx=%227%22 cy=%227%22 r=%221%22/%3E%3Ccircle cx=%2227%22 cy=%227%22 r=%221%22/%3E%3Ccircle cx=%2247%22 cy=%227%22 r=%221%22/%3E%3Ccircle cx=%227%22 cy=%2227%22 r=%221%22/%3E%3Ccircle cx=%2227%22 cy=%2227%22 r=%221%22/%3E%3Ccircle cx=%2247%22 cy=%2227%22 r=%221%22/%3E%3Ccircle cx=%227%22 cy=%2247%22 r=%221%22/%3E%3Ccircle cx=%2227%22 cy=%2247%22 r=%221%22/%3E%3Ccircle cx=%2247%22 cy=%2247%22 r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-50"></div>

        {/* Floating Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="space-y-8 lg:mt-[-30%]">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight">
              Drowned by Doubt? {' '}
              <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Speak
              </span>
              <br />
              and spark{' '}
              <span className="bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                Change
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto lg:mx-0">
              Gamify affirmations with voice recording, AI feedback, and the Ripple Galaxy system that tracks your growth.
            </p>

            <div className="flex justify-center">
              <a
                href="#download"
                className="inline-block"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  (window as any)?.datafast?.("clicked_cta_app_store_button", {
                    location: "hero_section"
                  });
                }}
              >
                <img
                  src={appStoreBadge}
                  alt="Download on the App Store"
                  className="h-12 hover:opacity-90 transition-opacity duration-200"
                />
              </a>
            </div>
          </div>

          {/* App Screenshot */}
          <div className="relative">
            <div className="relative mx-auto max-w-md lg:max-w-lg">
              {/* Ripple Effects Behind Image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-96 h-96 rounded-full border-2 border-purple-400/20 animate-ping animation-delay-0"></div>
                <div className="absolute w-80 h-80 rounded-full border-2 border-blue-400/20 animate-ping animation-delay-1000"></div>
                <div className="absolute w-64 h-64 rounded-full border-2 border-pink-400/20 animate-ping animation-delay-2000"></div>
              </div>

              {/* Screenshot Image */}
              <div className="relative z-10">
                <img
                  src={appScreenshot}
                  alt="Sayura App Screenshot"
                  className="w-full h-auto rounded-3xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
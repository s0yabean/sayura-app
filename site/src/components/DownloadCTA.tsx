import appStoreBadge from '../assets/images/Available_on_the_App_Store_(black)_SVG.svg';

const DownloadCTA = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="relative">
          {/* Cosmic Background Effects */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
          </div>

          <div className="relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Start Your{' '}
              <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Transformation?
              </span>
            </h2>

            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto">
              Join thousands who are already creating ripples of positive change.
              Download Sayura today and discover the power of your voice.
            </p>

            {/* Download Button */}
            <div className="flex justify-center mb-12">
              <a
                href="#download"
                className="inline-block"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  (window as any)?.datafast?.("clicked_cta_app_store_button", {
                    location: "download_cta_section"
                  });
                }}
              >
                <img
                  src={appStoreBadge}
                  alt="Download on the App Store"
                  className="h-14 hover:opacity-90 transition-opacity duration-200"
                />
              </a>
            </div>

            {/* Social Proof */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <p className="text-gray-300 italic mb-4">
                  "Sayura has completely transformed my morning routine. The AI feedback is incredibly insightful!"
                </p>
                <p className="text-purple-300 font-semibold">- Nobody Yet</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <p className="text-gray-300 italic mb-4">
                  "The Ripple Galaxy system makes tracking progress so engaging. It's like meditation meets gaming!"
                </p>
                <p className="text-blue-300 font-semibold">- Nobody Yet</p>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                <p className="text-gray-300 italic mb-4">
                  "I've never been consistent with affirmations until Sayura. The voice analysis is amazing!"
                </p>
                <p className="text-pink-300 font-semibold">- Nobody Yet</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DownloadCTA;
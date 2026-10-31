import { Shield, Lock, Eye, Mail } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <section className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Floating Particles */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/10 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        <div className="relative z-10 space-y-8">
          <div className="text-center mb-12">
            <div className="inline-flex p-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mb-6">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Privacy{' '}
              <span className="bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                Policy
              </span>
            </h1>
            <p className="text-gray-400">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/20 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Welcome to Sayura</h2>
              <p className="text-gray-300 leading-relaxed">
                Sayura ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our mobile application for daily affirmations and voice recording.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Information We Collect</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-purple-300 mb-2">Personal Information</h3>
                  <p className="text-gray-300">
                    When you create an account, we may collect:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                    <li>Email address</li>
                    <li>Name (optional)</li>
                    <li>Profile information you choose to provide</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-purple-300 mb-2">Voice Recordings</h3>
                  <p className="text-gray-300">
                    Your voice recordings are processed locally on your device. We only store metadata about your affirmations 
                    and AI-generated feedback to track your progress.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-purple-300 mb-2">Usage Data</h3>
                  <p className="text-gray-300">
                    We automatically collect:
                  </p>
                  <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                    <li>App usage patterns</li>
                    <li>Feature interactions</li>
                    <li>Device information (type, OS version)</li>
                    <li>Crash reports and performance data</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">How We Use Your Information</h2>
              </div>
              
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>To provide and maintain our affirmation tracking service</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>To personalize your experience and provide AI-powered feedback</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>To track your progress and generate your Ripple Galaxy visualizations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>To improve our app and develop new features</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>To send you updates about your affirmation streaks and achievements</span>
                </li>
              </ul>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
              <p className="text-gray-300 leading-relaxed">
                We implement industry-standard security measures to protect your personal information. Your data is encrypted 
                both in transit and at rest. Voice recordings are processed using secure AI services and are not stored 
                permanently on our servers.
              </p>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Data Sharing</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>With service providers who assist in app operations (under strict confidentiality)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>When required by law or to protect our legal rights</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>With your explicit consent</span>
                </li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
              <p className="text-gray-300 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Access your personal information</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Correct or update your data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Delete your account and associated data</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Opt-out of marketing communications</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-400 mr-2">•</span>
                  <span>Export your affirmation history</span>
                </li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Data Retention</h2>
              <p className="text-gray-300 leading-relaxed">
                We retain your personal information only as long as necessary to provide our services and fulfill the purposes 
                outlined in this policy. When you delete your account, we will delete your personal information within 30 days, 
                except where retention is required for legal obligations.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Children's Privacy</h2>
              <p className="text-gray-300 leading-relaxed">
                Sayura is not intended for children under 13 years of age. We do not knowingly collect personal information 
                from children under 13. If you believe we have collected information from a child under 13, please contact us 
                immediately.
              </p>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
              <p className="text-gray-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
                Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this Privacy 
                Policy periodically.
              </p>
            </section>

            {/* Contact Us */}
            <section className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Mail className="w-6 h-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white">Contact Us</h2>
              </div>
              <p className="text-gray-300 mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <a 
                href="mailto:support@example.com" 
                className="inline-flex items-center gap-2 text-purple-300 hover:text-purple-200 transition-colors"
              >
                <Mail className="w-4 h-4" />
                support@example.com
              </a>
            </section>

            {/* Opt-Out */}
            <section className="text-center pt-8">
              <p className="text-gray-300 mb-4">
                To opt-out of data collection or request data deletion, please email us at{' '}
                <a href="mailto:support@example.com" className="text-purple-300 hover:text-purple-200">
                  support@example.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PrivacyPolicy;
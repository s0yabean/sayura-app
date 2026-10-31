import { Mail, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-black/40 backdrop-blur-md border-t border-white/10 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-white mb-4">
            Sayura
            <span className="text-purple-300 ml-2">✨</span>
          </h3>
          
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Transform your daily affirmation practice into a cosmic journey of self-discovery 
            and positive transformation.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-8">
            <Link
              to="/support"
              className="text-gray-300 hover:text-purple-300 transition-colors"
            >
              Support
            </Link>
            <Link
              to="/privacy"
              className="text-gray-300 hover:text-purple-300 transition-colors"
            >
              Privacy Policy
            </Link>
            <a
              href="mailto:support@example.com"
              className="flex items-center gap-2 text-gray-300 hover:text-purple-300 transition-colors"
            >
              <Mail size={20} />
              support@example.com
            </a>
          </div>
          
          <div className="border-t border-white/10 pt-8">
            <p className="text-gray-400 text-sm flex items-center justify-center gap-2">
              Made with <Heart size={16} className="text-red-400" /> for mindful transformation
            </p>
            <p className="text-gray-500 text-xs mt-2">
              © 2025 Sayura. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
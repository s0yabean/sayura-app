import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-white">
              Sayura
              <span className="text-purple-300 ml-1">✨</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {location.pathname === '/' ? (
                <>
                  <a href="#features" className="text-gray-300 hover:text-white transition-colors">
                    Features
                  </a>
                  <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors">
                    How It Works
                  </a>
                </>
              ) : (
                <Link to="/" className="text-gray-300 hover:text-white transition-colors">
                  Home
                </Link>
              )}
              <Link 
                to="/support" 
                className="text-gray-300 hover:text-white transition-colors"
              >
                Support
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-300 hover:text-white p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {location.pathname === '/' ? (
              <>
                <a
                  href="#features"
                  className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  How It Works
                </a>
              </>
            ) : (
              <Link
                to="/"
                className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Home
              </Link>
            )}
            <Link
              to="/support"
              className="text-gray-300 hover:text-white block px-3 py-2 text-base font-medium transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Support
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
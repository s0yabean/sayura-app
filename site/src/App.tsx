import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import DownloadCTA from './components/DownloadCTA';
import Footer from './components/Footer';
import Support from './components/Support';
import PrivacyPolicy from './components/PrivacyPolicy';
import ScrollToTop from './components/ScrollToTop';

function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <DownloadCTA />
    </>
  );
}

function App() {
  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <Navigation />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/support" element={<Support />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
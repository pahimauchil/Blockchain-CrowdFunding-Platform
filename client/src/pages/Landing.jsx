import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CustomButton } from "../components";
import { useStateContext } from "../context";
import { logo } from "../assets";

/**
 * Landing Page - Redesigned with two user paths:
 * 1. Become a Donor - Simple wallet connect, browse and donate
 * 2. Become a Campaign Creator - Full signup form required
 */
const Landing = () => {
  const navigate = useNavigate();
  const { address, connect } = useStateContext();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDonorPath = async () => {
    if (!address) {
      await connect();
    }
    // Navigate to campaigns page for browsing
    navigate("/campaigns");
  };

  const handleCreatorPath = () => {
    // Navigate to creator signup page
    navigate("/creator-signup");
  };

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: "Blockchain Security",
      description: "Every transaction is immutable and transparent on zkSync Sepolia, ensuring complete trust and accountability.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      title: "AI-Powered Analysis",
      description: "Advanced sentiment analysis and risk assessment help identify trustworthy campaigns before they go live.",
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Lightning Fast",
      description: "Built on zkSync for near-instant transactions with minimal fees, making micro-donations practical.",
    },
  ];

  const stats = [
    { value: "100%", label: "Transparent" },
    { value: "0%", label: "Platform Fees" },
    { value: "zkSync", label: "Powered By" },
  ];

  return (
    <div className="min-h-screen bg-primary-light dark:bg-primary-dark">
      {/* Navigation Bar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 dark:bg-secondary-dark/80 backdrop-blur-md shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <img src={logo} alt="Logo" className="h-10 w-10" />
              <span className="font-epilogue font-bold text-xl text-text-light dark:text-text-dark">
                FundAid
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => navigate("/campaigns")}
                className="font-epilogue text-text-light dark:text-text-dark hover:text-accent-primary dark:hover:text-accent-secondary transition-colors"
              >
                Campaigns
              </button>
              <button
                onClick={() => navigate("/about")}
                className="font-epilogue text-text-light dark:text-text-dark hover:text-accent-primary dark:hover:text-accent-secondary transition-colors"
              >
                About
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-primary/5 dark:from-accent-primary/10 via-transparent to-accent-secondary/5 dark:to-accent-secondary/10"></div>
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block mb-6">
              <span className="px-4 py-2 bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary dark:text-accent-secondary rounded-full text-sm font-epilogue font-medium">
                Decentralized Crowdfunding on zkSync Sepolia
              </span>
            </div>
            <h1 className="font-epilogue font-bold text-5xl sm:text-6xl lg:text-7xl text-text-light dark:text-text-dark mb-6 leading-tight tracking-tight">
              Fund Your Vision,
              <br />
              <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                Built on Trust
              </span>
            </h1>
            <p className="font-epilogue text-xl sm:text-2xl text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Choose your path: Support causes as a donor or create campaigns as a verified creator.
            </p>

            {/* Two Path Selection */}
            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
              {/* Donor Path */}
              <div className="bg-white dark:bg-secondary-dark border-2 border-accent-primary/20 dark:border-accent-primary/30 rounded-2xl p-8 hover:border-accent-primary dark:hover:border-accent-secondary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <h3 className="font-epilogue font-bold text-2xl text-text-light dark:text-text-dark mb-3">
                  Become a Donor
                </h3>
                <p className="font-epilogue text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Connect your wallet and start supporting campaigns instantly. No signup required. Browse, discover, and donate to causes you care about.
                </p>
                <ul className="text-left mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Connect wallet only</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Browse all campaigns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Donate instantly</span>
                  </li>
                </ul>
                <CustomButton
                  btnType="button"
                  title={address ? "Browse Campaigns" : "Connect Wallet & Browse"}
                  styles="w-full bg-blue-500 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  handleClick={handleDonorPath}
                />
              </div>

              {/* Creator Path */}
              <div className="bg-white dark:bg-secondary-dark border-2 border-accent-primary/20 dark:border-accent-primary/30 rounded-2xl p-8 hover:border-accent-primary dark:hover:border-accent-secondary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="w-16 h-16 rounded-full bg-accent-primary/10 dark:bg-accent-primary/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-accent-primary dark:text-accent-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="font-epilogue font-bold text-2xl text-text-light dark:text-text-dark mb-3">
                  Become a Creator
                </h3>
                <p className="font-epilogue text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                  Create and launch your own campaigns. Complete a quick verification process to get started and build trust with backers.
                </p>
                <ul className="text-left mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="text-accent-primary">✓</span>
                    <span>Create campaigns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent-primary">✓</span>
                    <span>Verification required</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent-primary">✓</span>
                    <span>Enhanced trust scores</span>
                  </li>
                </ul>
                <CustomButton
                  btnType="button"
                  title="Start Creator Signup"
                  styles="w-full bg-accent-primary dark:bg-accent-secondary text-white hover:bg-accent-hover-primary dark:hover:bg-accent-hover-secondary px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  handleClick={handleCreatorPath}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12 border-t border-gray-200 dark:border-gray-700">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="font-epilogue font-bold text-3xl sm:text-4xl text-accent-primary dark:text-accent-secondary mb-2">
                    {stat.value}
                  </div>
                  <div className="font-epilogue text-sm text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-secondary-dark/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-epilogue font-bold text-3xl sm:text-4xl lg:text-5xl text-text-light dark:text-text-dark mb-4">
              Why FundAid?
            </h2>
            <p className="font-epilogue text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              A platform designed for creators and backers who value transparency, security, and impact.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl bg-white dark:bg-secondary-dark border border-gray-100 dark:border-gray-800 hover:border-accent-primary dark:hover:border-accent-secondary hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-xl bg-accent-primary/10 dark:bg-accent-primary/20 text-accent-primary dark:text-accent-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="font-epilogue font-semibold text-2xl text-text-light dark:text-text-dark mb-3">
                  {feature.title}
                </h3>
                <p className="font-epilogue text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-secondary-light dark:bg-secondary-dark/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-epilogue font-bold text-3xl sm:text-4xl lg:text-5xl text-text-light dark:text-text-dark mb-4">
              How It Works
            </h2>
            <p className="font-epilogue text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Simple steps to get started, whether you're a donor or creator.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-accent-primary to-accent-secondary"></div>
            {[
              {
                step: "01",
                title: "Choose Your Path",
                description: "Decide whether you want to support campaigns as a donor or create your own as a verified creator.",
              },
              {
                step: "02",
                title: "Connect & Verify",
                description: "Connect your wallet. Donors can start immediately. Creators complete a quick verification process.",
              },
              {
                step: "03",
                title: "Make an Impact",
                description: "Donors contribute to causes they care about. Creators launch campaigns and receive support directly.",
              },
            ].map((item, index) => (
              <div key={index} className="relative text-center">
                <div className="w-20 h-20 rounded-full bg-accent-primary dark:bg-accent-secondary text-white font-epilogue font-bold text-2xl flex items-center justify-center mx-auto mb-6 shadow-lg relative z-10">
                  {item.step}
                </div>
                <h3 className="font-epilogue font-semibold text-xl text-text-light dark:text-text-dark mb-3">
                  {item.title}
                </h3>
                <p className="font-epilogue text-gray-600 dark:text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-primary/10 dark:from-accent-primary/20 to-accent-secondary/10 dark:to-accent-secondary/20"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-epilogue font-bold text-3xl sm:text-4xl lg:text-5xl text-text-light dark:text-text-dark mb-6">
            Ready to Make an Impact?
          </h2>
          <p className="font-epilogue text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            Join creators and backers building the future of decentralized crowdfunding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <CustomButton
              btnType="button"
              title="Browse Campaigns"
              styles="bg-accent-primary dark:bg-accent-secondary text-white hover:bg-accent-hover-primary dark:hover:bg-accent-hover-secondary px-10 py-5 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              handleClick={() => navigate("/campaigns")}
            />
            <button
              onClick={() => navigate("/about")}
              className="font-epilogue text-lg text-text-light dark:text-text-dark hover:text-accent-primary dark:hover:text-accent-secondary transition-colors px-6 py-5"
            >
              Learn More →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <img src={logo} alt="Logo" className="h-8 w-8" />
              <span className="font-epilogue font-semibold text-text-light dark:text-text-dark">
                FundAid
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate("/campaigns")}
                className="font-epilogue text-sm text-gray-600 dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-secondary transition-colors"
              >
                Campaigns
              </button>
              <button
                onClick={() => navigate("/about")}
                className="font-epilogue text-sm text-gray-600 dark:text-gray-400 hover:text-accent-primary dark:hover:text-accent-secondary transition-colors"
              >
                About
              </button>
              <span className="font-epilogue text-sm text-gray-500 dark:text-gray-500">
                Powered by zkSync Sepolia
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

import React from "react";
import { useNavigate } from "react-router-dom";
import { CustomButton } from "../components";

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="font-epilogue font-bold text-4xl sm:text-5xl text-text-light dark:text-text-dark mb-8 text-center">
        About Our Platform
      </h1>

      <div className="space-y-8 text-gray-700 dark:text-gray-300">
        <section>
          <h2 className="font-epilogue font-semibold text-2xl text-text-light dark:text-text-dark mb-4">
            Our Mission
          </h2>
          <p className="font-epilogue text-lg leading-relaxed">
            We're building a decentralized crowdfunding platform that combines the transparency 
            of blockchain technology with intelligent AI-powered campaign analysis. Our goal is 
            to create a trusted space where creators can fund their dreams and backers can 
            support causes they believe in, all while maintaining complete transparency and security.
          </p>
        </section>

        <section>
          <h2 className="font-epilogue font-semibold text-2xl text-text-light dark:text-text-dark mb-4">
            How It Works
          </h2>
          <div className="space-y-4">
            <div className="bg-secondary-light dark:bg-secondary-dark p-4 rounded-lg">
              <h3 className="font-epilogue font-semibold text-xl text-text-light dark:text-text-dark mb-2">
                1. Create Your Campaign
              </h3>
              <p className="font-epilogue">
                Connect your wallet and submit your campaign with details about your project, 
                funding goal, and deadline. Our AI will analyze your campaign for trustworthiness.
              </p>
            </div>
            <div className="bg-secondary-light dark:bg-secondary-dark p-4 rounded-lg">
              <h3 className="font-epilogue font-semibold text-xl text-text-light dark:text-text-dark mb-2">
                2. Admin Review
              </h3>
              <p className="font-epilogue">
                Our admin team reviews your campaign along with AI-generated trust scores and 
                risk factors. Approved campaigns are published on the blockchain.
              </p>
            </div>
            <div className="bg-secondary-light dark:bg-secondary-dark p-4 rounded-lg">
              <h3 className="font-epilogue font-semibold text-xl text-text-light dark:text-text-dark mb-2">
                3. Receive Support
              </h3>
              <p className="font-epilogue">
                Once approved, your campaign goes live and backers can contribute directly 
                through the blockchain. Funds are transferred immediately to your wallet.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-epilogue font-semibold text-2xl text-text-light dark:text-text-dark mb-4">
            Technology Stack
          </h2>
          <p className="font-epilogue text-lg leading-relaxed mb-4">
            Our platform is built with cutting-edge Web3 technologies:
          </p>
          <ul className="list-disc list-inside space-y-2 font-epilogue text-lg">
            <li><strong>Blockchain:</strong> zkSync Sepolia for fast, low-cost transactions</li>
            <li><strong>Smart Contracts:</strong> Solidity contracts for secure campaign management</li>
            <li><strong>Frontend:</strong> React 18 with Vite for a modern, responsive UI</li>
            <li><strong>Backend:</strong> Node.js with Express and MongoDB for campaign management</li>
            <li><strong>AI Analysis:</strong> Hugging Face models for sentiment analysis and trust scoring</li>
          </ul>
        </section>

        <section>
          <h2 className="font-epilogue font-semibold text-2xl text-text-light dark:text-text-dark mb-4">
            Security & Transparency
          </h2>
          <p className="font-epilogue text-lg leading-relaxed">
            All transactions are recorded on the blockchain, ensuring complete transparency. 
            Campaign creators receive funds directly to their wallets, and all donations are 
            publicly verifiable. Our AI analysis helps identify potentially fraudulent campaigns 
            before they go live, protecting both creators and backers.
          </p>
        </section>

        <div className="flex justify-center mt-12">
          <CustomButton
            btnType="button"
            title="Explore Campaigns"
            styles="bg-accent-primary dark:bg-accent-secondary text-white hover:bg-accent-hover-primary dark:hover:bg-accent-hover-secondary px-8 py-4 text-lg"
            handleClick={() => navigate("/campaigns")}
          />
        </div>
      </div>
    </div>
  );
};

export default About;


















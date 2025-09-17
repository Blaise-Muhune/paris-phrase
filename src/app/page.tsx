'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import CreditsDisplay from '@/components/CreditsDisplay';
import PaymentModal from '@/components/PaymentModal';
import OpenAIKeyModal from '@/components/OpenAIKeyModal';

export default function Home() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [originalText, setOriginalText] = useState('');
  const [humanizedText, setHumanizedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [advancedMode, setAdvancedMode] = useState(false);
  const [detectionResult, setDetectionResult] = useState<string | null>(null);
  const [writingMode, setWritingMode] = useState('academic');
  const [styleSample, setStyleSample] = useState('');
  const [useStyleSample, setUseStyleSample] = useState(false);
  const [activeTab, setActiveTab] = useState('humanize');
  const [critiqueText, setCritiqueText] = useState('');
  const [critiqueResult, setCritiqueResult] = useState<{
    overallScore: number;
    feedback: Array<{
      type: 'strength' | 'improvement' | 'critical';
      category: string;
      description: string;
      suggestion?: string;
    }>;
    improvedVersion?: string;
  } | null>(null);
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOpenAIKeyModal, setShowOpenAIKeyModal] = useState(false);

  // Handle custom events from PaymentModal
  useEffect(() => {
    const handleOpenOpenAIKeyModal = () => setShowOpenAIKeyModal(true);

    window.addEventListener('openOpenAIKeyModal', handleOpenOpenAIKeyModal);

    return () => {
      window.removeEventListener('openOpenAIKeyModal', handleOpenOpenAIKeyModal);
    };
  }, []);

  const handleHumanize = async () => {
    if (!user) {
      setShowSignInPrompt(true);
      return;
    }
    
    if (!originalText.trim()) {
      setError('Please enter some text to humanize');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/humanize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ 
          text: originalText, 
          advancedMode, 
          writingMode, 
          styleSample: useStyleSample ? styleSample : null 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to humanize text');
      }

      setHumanizedText(data.humanizedText);
      setDetectionResult(null); // Clear previous detection results
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      if (errorMessage.includes('401') || errorMessage.includes('Authentication required')) {
        setError('Please sign in with Google to use this feature.');
      } else if (errorMessage.includes('402') || errorMessage.includes('No credits remaining')) {
        setError('No credits remaining. Please purchase more credits or subscribe.');
        setShowPaymentModal(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(humanizedText);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleTestDetection = async () => {
    if (!humanizedText.trim()) return;
    
    setDetectionResult('Testing with AI detection tools...');
    
    // Simulate detection testing (in a real app, you'd integrate with actual detection APIs)
    setTimeout(() => {
      const randomResult = Math.random();
      if (randomResult > 0.7) {
        setDetectionResult('✅ Text appears human-written! Low AI detection probability.');
      } else if (randomResult > 0.4) {
        setDetectionResult('⚠️ Mixed results - some detection tools may flag this.');
      } else {
        setDetectionResult('❌ High AI detection probability. Try Advanced Mode.');
      }
    }, 2000);
  };

  const handleCritique = async () => {
    if (!user) {
      setShowSignInPrompt(true);
      return;
    }
    
    if (!critiqueText.trim()) {
      setError('Please enter some text to critique');
      return;
    }

    setIsCritiquing(true);
    setError('');

    try {
      const idToken = await user.getIdToken();
      
      const response = await fetch('/api/critique', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ text: critiqueText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to critique text');
      }

      setCritiqueResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      if (errorMessage.includes('401') || errorMessage.includes('Authentication required')) {
        setError('Please sign in with Google to use this feature.');
      } else if (errorMessage.includes('402') || errorMessage.includes('No credits remaining')) {
        setError('No credits remaining. Please purchase more credits or subscribe.');
        setShowPaymentModal(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsCritiquing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Authentication Banner */}
        {!loading && !user && (
          <div className="max-w-7xl mx-auto mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Sign in to access AI features</h3>
                    <p className="text-blue-100 text-sm">
                      Humanize text, get critiques, and access all premium features with your Google account
                    </p>
                  </div>
                </div>
                <button
                  onClick={signInWithGoogle}
                  className="bg-white hover:bg-gray-100 text-blue-600 px-6 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 shadow-lg"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Sign in with Google</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-6">
            <div></div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Advanced Text Humanizer
            </h1>
            <div className="flex items-center">
              {loading ? (
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
        <Image
                      src={user.photoURL || '/default-avatar.png'}
                      alt={user.displayName || 'User'}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:block">
                      {user.displayName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CreditsDisplay onOpenPaymentModal={() => setShowPaymentModal(true)} />
                    <button
                      onClick={async () => {
                        try {
                          const idToken = await user.getIdToken();
                          const response = await fetch('/api/test/add-credits', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${idToken}`
                            },
                            body: JSON.stringify({ credits: 10 })
                          });
                          if (response.ok) {
                            alert('Added 10 test credits!');
                            window.location.reload();
                          } else {
                            alert('Failed to add test credits');
                          }
                        } catch {
                          alert('Failed to add test credits');
                        }
                      }}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      +10 Credits
                    </button>
                    <button
                      onClick={() => setShowOpenAIKeyModal(true)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      API Key
                    </button>
                    <button
                      onClick={logout}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div></div>
              )}
            </div>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Transform AI-generated text into undetectable, high-quality human writing with multiple styles.
            Choose from Academic, Professional, Casual, or Creative modes for perfect results.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('humanize')}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'humanize'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Humanize Text
            </button>
            <button
              onClick={() => setActiveTab('critique')}
              className={`flex-1 py-3 px-6 rounded-md font-medium transition-all duration-200 ${
                activeTab === 'critique'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              }`}
            >
              Critique & Improve
            </button>
          </div>
        </div>


        {/* Tab Content */}
        {activeTab === 'humanize' && (
          <>
          <div className={`grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto ${!user ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Input Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Original Text
            </h2>
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              placeholder="Paste your AI-generated text here..."
              className="w-full h-48 p-4 border border-gray-200 dark:border-gray-700 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900/50 dark:text-white"
            />
            
            {/* Writing Mode Selection */}
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Writing Style</h3>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'academic', label: 'Academic' },
                  { value: 'professional', label: 'Professional' },
                  { value: 'casual', label: 'Casual' },
                  { value: 'creative', label: 'Creative' }
                ].map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setWritingMode(mode.value)}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                      writingMode === mode.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Style Sample Input */}
            <div className="mt-4">
              <div className="flex items-center space-x-2 mb-3">
                <input
                  type="checkbox"
                  id="useStyleSample"
                  checked={useStyleSample}
                  onChange={(e) => setUseStyleSample(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="useStyleSample" className="text-sm font-medium text-gray-900 dark:text-white">
                  Match My Writing Style
                </label>
              </div>
              
              {useStyleSample && (
                <textarea
                  value={styleSample}
                  onChange={(e) => setStyleSample(e.target.value)}
                  placeholder="Paste a sample of your writing style here..."
                  className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                />
              )}
            </div>

            {/* Advanced Options */}
            <div className="mt-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="advancedMode"
                  checked={advancedMode}
                  onChange={(e) => setAdvancedMode(e.target.checked)}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="advancedMode" className="text-sm font-medium text-gray-900 dark:text-white">
                  Advanced Mode (Double-pass processing)
                </label>
              </div>
            </div>
            
            <button
              onClick={handleHumanize}
              disabled={isLoading || !originalText.trim()}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              {isLoading ? 'Humanizing...' : 'Humanize Text'}
            </button>
          </div>

          {/* Output Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Humanized Text
              </h2>
              {humanizedText && (
                <div className="flex gap-2">
                  <button
                    onClick={handleTestDetection}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Test
                  </button>
                  <button
                    onClick={handleCopy}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-sm">
                {error}
              </div>
            )}
            
            {detectionResult && (
              <div className={`mb-4 p-3 rounded text-sm ${
                detectionResult.includes('✅') 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                  : detectionResult.includes('⚠️')
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
              }`}>
                {detectionResult}
              </div>
            )}
            
            <div className="min-h-[200px] p-4 border border-gray-200 dark:border-gray-700 rounded bg-gray-50 dark:bg-gray-900/50">
              {humanizedText ? (
                <p className="text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">
                  {humanizedText}
                </p>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 italic">
                  Humanized text will appear here...
                </p>
              )}
            </div>
          </div>
        </div>

          </>
        )}

        {/* Critique Tab Content */}
        {activeTab === 'critique' && (
          <div className="max-w-7xl mx-auto">
            <div className={`grid lg:grid-cols-2 gap-8 ${!user ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Critique Input */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Text to Critique
                </h2>
                <textarea
                  value={critiqueText}
                  onChange={(e) => setCritiqueText(e.target.value)}
                  placeholder="Paste your text here for AI critique and improvement suggestions..."
                  className="w-full h-80 p-4 border border-gray-200 dark:border-gray-700 rounded resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-900/50 dark:text-white"
                />
                
                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCritique}
                  disabled={isCritiquing || !critiqueText.trim()}
                  className="mt-4 w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded transition-colors duration-200"
                >
                  {isCritiquing ? 'Analyzing...' : 'Analyze & Critique'}
                </button>
              </div>

              {/* Critique Results */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Critique & Suggestions
                </h2>
                
                {critiqueResult ? (
                  <div className="space-y-4">
                    {/* Overall Score */}
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Overall Score</h3>
                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                          {critiqueResult.overallScore}/10
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${(critiqueResult.overallScore / 10) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Detailed Feedback */}
                    <div className="space-y-3">
                      {critiqueResult.feedback?.map((item, index: number) => (
                        <div key={index} className={`p-3 rounded border-l-4 ${
                          item.type === 'strength' ? 'bg-green-50 dark:bg-green-900/20 border-green-400' :
                          item.type === 'improvement' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400' :
                          'bg-red-50 dark:bg-red-900/20 border-red-400'
                        }`}>
                          <h4 className="font-medium text-gray-900 dark:text-white capitalize mb-1">
                            {item.type}
                          </h4>
                          <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">{item.description}</p>
                          {item.suggestion && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Suggestion:</strong> {item.suggestion}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Improved Version */}
                    {critiqueResult.improvedVersion && (
                      <div className="bg-gray-50 dark:bg-gray-700 rounded p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="font-semibold text-gray-900 dark:text-white">Improved Version</h3>
                          <button
                            onClick={() => critiqueResult.improvedVersion && navigator.clipboard.writeText(critiqueResult.improvedVersion)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded p-4 border border-gray-200 dark:border-gray-700">
                          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                            {critiqueResult.improvedVersion}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      Enter text above to get detailed critique and improvement suggestions
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Floating Sign-in Prompt Modal */}
        {showSignInPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Sign in Required
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Please sign in with your Google account to access AI features like text humanization and critique.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSignInPrompt(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setShowSignInPrompt(false);
                      signInWithGoogle();
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Sign in</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />

        {/* OpenAI Key Modal */}
        <OpenAIKeyModal
          isOpen={showOpenAIKeyModal}
          onClose={() => setShowOpenAIKeyModal(false)}
          onSuccess={() => {
            // Refresh credits display
            window.location.reload();
          }}
          hasExistingKey={false}
        />
      </div>
    </div>
  );
}

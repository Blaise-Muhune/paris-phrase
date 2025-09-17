'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface OpenAIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  hasExistingKey: boolean;
}

export default function OpenAIKeyModal({ isOpen, onClose, onSuccess, hasExistingKey }: OpenAIKeyModalProps) {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/user/update-openai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ apiKey }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
        setApiKey('');
      } else {
        setError(data.error || 'Failed to update API key');
      }
    } catch {
      setError('Failed to update API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveKey = async () => {
    setLoading(true);
    setError('');

    try {
      const idToken = await user?.getIdToken();
      const response = await fetch('/api/user/update-openai-key', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Failed to remove API key');
      }
    } catch {
      setError('Failed to remove API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {hasExistingKey ? 'Manage OpenAI API Key' : 'Add OpenAI API Key'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {hasExistingKey ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-green-600 dark:text-green-400">
                    Custom OpenAI API Key Active - Unlimited Usage
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">Benefits of using your own API key:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Unlimited usage without credit limits</li>
                  <li>No additional charges from our service</li>
                  <li>Direct billing from OpenAI</li>
                  <li>Full control over your usage</li>
                </ul>
              </div>

              <button
                onClick={handleRemoveKey}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
              >
                {loading ? 'Removing...' : 'Remove API Key & Use Credits'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  id="apiKey"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Your API key is stored securely and only used for your requests.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded text-sm">
                  {error}
                </div>
              )}

              <div className="text-sm text-gray-600 dark:text-gray-400">
                <p className="mb-2">Benefits of using your own API key:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Unlimited usage without credit limits</li>
                  <li>No additional charges from our service</li>
                  <li>Direct billing from OpenAI</li>
                  <li>Full control over your usage</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !apiKey.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  {loading ? 'Adding...' : 'Add API Key'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

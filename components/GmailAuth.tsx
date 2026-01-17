import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';
import { getAuthUrl, handleAuthCallback, isAuthenticated, logout } from '../services/gmailService';

interface GmailAuthProps {
  onAuthSuccess: () => void;
  onClose: () => void;
}

const GmailAuth: React.FC<GmailAuthProps> = ({ onAuthSuccess, onClose }) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'idle' | 'authenticating' | 'success' | 'error'>('idle');

  // Check if already authenticated on mount
  useEffect(() => {
    if (isAuthenticated()) {
      setAuthStatus('success');
    }
  }, []);

  // Handle OAuth callback if code is in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');

    if (error) {
      setError('Authentication was cancelled or failed.');
      setAuthStatus('error');
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    // Only process callback if we have both a code AND a PKCE verifier
    // This prevents errors when the component mounts with a leftover code parameter
    if (code) {
      // Check if PKCE verifier exists before attempting callback
      const pkceDataStr = localStorage.getItem('gmail_pkce_verifier');
      if (!pkceDataStr) {
        // No verifier means this isn't a valid callback - clean up URL and ignore
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      setIsAuthenticating(true);
      setAuthStatus('authenticating');
      
      handleAuthCallback(code)
        .then((success) => {
          if (success) {
            setAuthStatus('success');
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => {
              onAuthSuccess();
            }, 1000);
          } else {
            setAuthStatus('error');
            setError('Failed to authenticate. Please try again.');
          }
          setIsAuthenticating(false);
        })
        .catch((err) => {
          console.error('Auth error:', err);
          setAuthStatus('error');
          setError('An error occurred during authentication.');
          setIsAuthenticating(false);
        });
    }
  }, [onAuthSuccess]);

  const handleAuthenticate = async () => {
    try {
      setError(null);
      setIsAuthenticating(true);
      setAuthStatus('authenticating');
      
      const authUrl = await getAuthUrl();
      // Redirect to OAuth
      window.location.href = authUrl;
    } catch (err: any) {
      console.error('Error initiating auth:', err);
      setError(err.message || 'Failed to start authentication. Please check your Gmail API configuration.');
      setAuthStatus('error');
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    logout();
    setAuthStatus('idle');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gmail Authentication</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {authStatus === 'success' ? (
            <div className="text-center">
              <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Authenticated Successfully</h3>
              <p className="text-sm text-gray-600 mb-6">
                Your Gmail account is connected and ready to use.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Connect your Gmail account to enable email automation. You'll be redirected to Google to authorize access.
                </p>
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                    <AlertCircle className="text-red-500" size={20} />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isAuthenticating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAuthenticate}
                  disabled={isAuthenticating || authStatus === 'authenticating'}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAuthenticating || authStatus === 'authenticating' ? 'Connecting...' : 'Connect Gmail'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GmailAuth;

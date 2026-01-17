// Note: googleapis is a Node.js library and won't work directly in the browser
// For the demo, we'll use browser-compatible Gmail API calls
// In production, this should be handled by a backend API

// Browser-compatible Gmail API implementation
const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1';

// Gmail API OAuth2 configuration
const CLIENT_ID = (import.meta as any).env?.VITE_GMAIL_CLIENT_ID || '30119822639-s61ksf68v892gd9hppuiqf0424ldg0d1.apps.googleusercontent.com';
// WARNING: Client secret in browser code is a security risk - it will be exposed in the bundle
// Only use this for demo/testing. In production, use PKCE-only flow or handle OAuth on a backend server
const CLIENT_SECRET = (import.meta as any).env?.VITE_GMAIL_CLIENT_SECRET || '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';
const REDIRECT_URI = window.location.origin + '/oauth2/callback';

// Gmail API scope - modify includes read, send, and modify permissions
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

// OAuth2 client
let oauth2Client: any = null;

// Initialize OAuth2 client (browser-compatible)
export const initGmailClient = () => {
  if (!CLIENT_ID) {
    console.warn('Gmail API CLIENT_ID not configured');
    return null;
  }

  // Check for existing tokens
  const tokens = localStorage.getItem('gmail_tokens');
  if (tokens) {
    try {
      oauth2Client = JSON.parse(tokens);
    } catch (e) {
      console.error('Error loading stored tokens:', e);
    }
  }

  return oauth2Client;
};

// Generate PKCE code verifier and challenge (for browser-only OAuth2)
const generatePKCE = async () => {
  // Generate code verifier (43-128 characters, URL-safe base64)
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
    .substring(0, 43); // Ensure proper length
  
  // Generate code challenge using SHA256 (S256 method)
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const codeChallenge = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return { codeVerifier, codeChallenge };
};

// Store PKCE verifier in localStorage (persists across redirects)
let currentPKCE: { codeVerifier: string; codeChallenge: string } | null = null;

// Get authorization URL for OAuth2 flow with PKCE (browser-compatible, no client secret needed)
export const getAuthUrl = async (): Promise<string> => {
  if (!CLIENT_ID) {
    throw new Error('Gmail API CLIENT_ID not configured. Please set VITE_GMAIL_CLIENT_ID in your .env file.');
  }

  // Generate PKCE parameters (async for SHA256)
  currentPKCE = await generatePKCE();
  // Store in localStorage with timestamp (expires after 10 minutes)
  const pkceData = {
    verifier: currentPKCE.codeVerifier,
    timestamp: Date.now()
  };
  localStorage.setItem('gmail_pkce_verifier', JSON.stringify(pkceData));

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    code_challenge: currentPKCE.codeChallenge,
    code_challenge_method: 'S256', // Proper PKCE with SHA256
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// Handle OAuth2 callback and exchange code for tokens (browser-compatible with PKCE)
export const handleAuthCallback = async (code: string): Promise<boolean> => {
  if (!CLIENT_ID) {
    throw new Error('Gmail API CLIENT_ID not configured');
  }

  try {
    // Retrieve PKCE verifier from localStorage
    const pkceDataStr = localStorage.getItem('gmail_pkce_verifier');
    if (!pkceDataStr) {
      throw new Error('PKCE verifier not found. Please restart the authentication flow.');
    }

    const pkceData = JSON.parse(pkceDataStr);
    const codeVerifier = pkceData.verifier;
    
    // Check if verifier expired (older than 10 minutes)
    if (Date.now() - pkceData.timestamp > 10 * 60 * 1000) {
      localStorage.removeItem('gmail_pkce_verifier');
      throw new Error('PKCE verifier expired. Please restart the authentication flow.');
    }

    if (!codeVerifier) {
      throw new Error('PKCE verifier not found. Please restart the authentication flow.');
    }

    // Exchange code for tokens using fetch with PKCE
    // If CLIENT_SECRET is provided, include it (not recommended for production browser apps)
    const tokenParams: Record<string, string> = {
      code,
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    };
    
    // Only add client_secret if provided (for demo/testing purposes)
    if (CLIENT_SECRET) {
      tokenParams.client_secret = CLIENT_SECRET;
    }
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(tokenParams),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Token exchange error:', errorData);
      
      // If Google requires client_secret, the OAuth client might not be configured for PKCE
      if (errorData.error === 'invalid_request' && errorData.error_description?.includes('client_secret')) {
        throw new Error(
          'OAuth client configuration issue: Your Google OAuth client may not be configured for PKCE. ' +
          'Please ensure your OAuth client in Google Cloud Console is set up as a "Web application" that supports PKCE, ' +
          'or contact your administrator to configure it properly.'
        );
      }
      
      throw new Error(`Failed to exchange code for tokens: ${errorData.error || 'Unknown error'} - ${errorData.error_description || ''}`);
    }

    const tokens = await response.json();
    
    // Store tokens in localStorage
    localStorage.setItem('gmail_tokens', JSON.stringify(tokens));
    oauth2Client = tokens;
    
    // Clean up PKCE verifier
    localStorage.removeItem('gmail_pkce_verifier');
    
    return true;
  } catch (error) {
    console.error('Error getting tokens:', error);
    localStorage.removeItem('gmail_pkce_verifier');
    return false;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  if (!oauth2Client) {
    initGmailClient();
  }

  if (!oauth2Client) {
    return false;
  }

  // oauth2Client is now the tokens object directly
  return !!(oauth2Client && oauth2Client.access_token);
};

// Refresh access token if needed (browser-compatible, no client secret needed for refresh)
const refreshTokenIfNeeded = async (): Promise<boolean> => {
  if (!oauth2Client || !oauth2Client.refresh_token) {
    return false;
  }

  if (!CLIENT_ID) {
    return false;
  }

  // Check if token expires in next 5 minutes
  if (oauth2Client.expiry_date && oauth2Client.expiry_date > Date.now() + 5 * 60 * 1000) {
    return true; // Token is still valid
  }

  try {
    // For refresh token, Google allows using just client_id (no secret needed for public clients)
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: oauth2Client.refresh_token,
        client_id: CLIENT_ID,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const newTokens = await response.json();
    // Merge with existing tokens to preserve refresh_token
    const updatedTokens = { ...oauth2Client, ...newTokens };
    oauth2Client = updatedTokens;
    localStorage.setItem('gmail_tokens', JSON.stringify(updatedTokens));
    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
};

// Get authenticated access token
const getAccessToken = async (): Promise<string> => {
  if (!oauth2Client) {
    initGmailClient();
  }

  if (!oauth2Client || !isAuthenticated()) {
    throw new Error('Not authenticated. Please authenticate with Gmail first.');
  }

  await refreshTokenIfNeeded();

  return oauth2Client.access_token;
};

// Get emails from inbox (browser-compatible)
export const getEmails = async (maxResults: number = 10): Promise<any[]> => {
  try {
    const accessToken = await getAccessToken();
    
    // List messages
    const listResponse = await fetch(
      `${GMAIL_API_BASE}/users/me/messages?maxResults=${maxResults}&q=in:inbox`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!listResponse.ok) {
      throw new Error('Failed to fetch emails');
    }

    const listData = await listResponse.json();
    if (!listData.messages) {
      return [];
    }

    // Get full message details
    const messages = await Promise.all(
      listData.messages.map(async (message: any) => {
        const messageResponse = await fetch(
          `${GMAIL_API_BASE}/users/me/messages/${message.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        return messageResponse.json();
      })
    );

    return messages;
  } catch (error) {
    console.error('Error getting emails:', error);
    throw error;
  }
};

// Send email (browser-compatible)
export const sendEmail = async (
  to: string,
  subject: string,
  body: string,
  attachments?: Array<{ filename: string; content: string; contentType: string }>
): Promise<string> => {
  try {
    const accessToken = await getAccessToken();

    // Create email message
    const messageParts = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      body,
    ];

    let rawMessage = messageParts.join('\r\n');

    // Add attachments if provided
    if (attachments && attachments.length > 0) {
      // For simplicity, we'll use a multipart message
      // In production, you'd want to use a proper MIME library
      const boundary = '----=_Part_' + Date.now();
      rawMessage = [
        `To: ${to}`,
        `Subject: ${subject}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body,
      ].join('\r\n');

      attachments.forEach((attachment) => {
        rawMessage += [
          '',
          `--${boundary}`,
          `Content-Type: ${attachment.contentType}`,
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          'Content-Transfer-Encoding: base64',
          '',
          attachment.content,
        ].join('\r\n');
      });

      rawMessage += `\r\n--${boundary}--`;
    }

    // Encode message in base64url format (browser-compatible)
    const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch(`${GMAIL_API_BASE}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    const data = await response.json();
    return data.id || '';
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Reply to email (browser-compatible)
export const replyToEmail = async (
  threadId: string,
  to: string,
  subject: string,
  body: string
): Promise<string> => {
  try {
    const accessToken = await getAccessToken();

    // Get original message to preserve thread
    const messageResponse = await fetch(
      `${GMAIL_API_BASE}/users/me/messages/${threadId}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!messageResponse.ok) {
      throw new Error('Failed to fetch original message');
    }

    const originalMessage = await messageResponse.json();
    const messageIdHeader = originalMessage.payload?.headers?.find((h: any) => h.name === 'Message-ID')?.value || '';

    // Create reply message
    const messageParts = [
      `To: ${to}`,
      `Subject: ${subject.startsWith('Re:') ? subject : `Re: ${subject}`}`,
      `In-Reply-To: ${messageIdHeader}`,
      `References: ${messageIdHeader}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      body,
    ];

    const rawMessage = messageParts.join('\r\n');
    const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch(`${GMAIL_API_BASE}/users/me/messages/send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedMessage,
        threadId: threadId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send reply');
    }

    const data = await response.json();
    return data.id || '';
  } catch (error) {
    console.error('Error replying to email:', error);
    throw error;
  }
};

// Logout (clear tokens)
export const logout = () => {
  localStorage.removeItem('gmail_tokens');
  oauth2Client = null;
};

// Initialize on module load
initGmailClient();

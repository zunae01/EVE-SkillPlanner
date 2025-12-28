import axios from 'axios';

const CLIENT_ID = '966d7606bb554f3b83376d7440a975fb';
const SCOPES = 'esi-skills.read_skills.v1 esi-skills.read_skillqueue.v1';
const REDIRECT_URI = window.location.origin + '/callback';
const SSO_URL = 'https://login.eveonline.com';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token: string;
}

export interface CharacterProfile {
  CharacterID: number;
  CharacterName: string;
  ExpiresOn: string;
  Scopes: string;
  TokenType: string;
  CharacterOwnerHash: string;
}

// PKCE Helpers
function generateRandomString(length: number) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, (byte) => ('0' + byte.toString(16)).slice(-2)).join('');
}

async function sha256(plain: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

function base64UrlEncode(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export const AuthService = {
  async initiateLogin() {
    const codeVerifier = generateRandomString(32);
    const challengeBuffer = await sha256(codeVerifier);
    const codeChallenge = base64UrlEncode(challengeBuffer);

    // Store verifier for callback
    localStorage.setItem('pkce_code_verifier', codeVerifier);
    localStorage.setItem('pkce_state', 'eve_auth_state'); // Simple state check

    const params = new URLSearchParams({
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      scope: SCOPES,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state: 'eve_auth_state'
    });

    window.location.href = `${SSO_URL}/v2/oauth/authorize/?${params.toString()}`;
  },

  async handleCallback(code: string): Promise<{ tokens: TokenResponse, character: CharacterProfile }> {
    const codeVerifier = localStorage.getItem('pkce_code_verifier');
    if (!codeVerifier) throw new Error("No code verifier found");

    // Exchange Code for Tokens
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      client_id: CLIENT_ID,
      code_verifier: codeVerifier,
      redirect_uri: REDIRECT_URI,
    });

    const tokenRes = await axios.post<TokenResponse>(
      `${SSO_URL}/v2/oauth/token`,
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const tokens = tokenRes.data;
    
    // Verify Token & Get Character Info
    // EVE ESI verification endpoint requires the access token
    const verifyRes = await axios.get<CharacterProfile>(
      `${SSO_URL}/oauth/verify`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );

    // Clean up
    localStorage.removeItem('pkce_code_verifier');
    localStorage.removeItem('pkce_state');

    return {
      tokens,
      character: verifyRes.data
    };
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: CLIENT_ID,
    });

    const res = await axios.post<TokenResponse>(
      `${SSO_URL}/v2/oauth/token`,
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    return res.data;
  }
};

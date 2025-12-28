import { useEffect, useState } from 'react';
import { AuthService } from '../lib/auth';
import { ESIService } from '../lib/esi';
import { useSkillStore } from '../store/useSkillStore';
import { Loader2 } from 'lucide-react';

export function AuthCallback() {
  const { login, setTrainedSkills } = useSkillStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (!code) {
      setError('No authorization code received.');
      return;
    }

    const processLogin = async () => {
      try {
        const { tokens, character } = await AuthService.handleCallback(code);
        
        // Fetch Skills immediately
        const skills = await ESIService.fetchCharacterSkills(character.CharacterID, tokens.access_token);
        
        login({
          characterId: character.CharacterID,
          characterName: character.CharacterName,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + (tokens.expires_in * 1000)
        });
        
        setTrainedSkills(skills);
        
        // Redirect home
        window.location.href = '/';
      } catch (err) {
        console.error(err);
        setError('Authentication failed. Please try again.');
      }
    };

    processLogin();
  }, [login, setTrainedSkills]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-destructive">
        <h1 className="text-xl font-bold">Login Error</h1>
        <p>{error}</p>
        <button 
          onClick={() => window.location.href = '/'} 
          className="mt-4 px-4 py-2 bg-white/10 rounded hover:bg-white/20 text-foreground"
        >
          Return Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-primary">
      <Loader2 className="w-12 h-12 animate-spin mb-4" />
      <h2 className="text-lg font-medium animate-pulse">Authenticating with EVE Online...</h2>
    </div>
  );
}
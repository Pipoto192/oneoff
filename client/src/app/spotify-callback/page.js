'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SpotifyCallback() {
  const router = useRouter();

  useEffect(() => {
    // Parse hash parameters
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken) {
      localStorage.setItem('spotify_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('spotify_refresh_token', refreshToken);
      }
      // Redirect back to home or last visited lobby?
      // For now, go home, user can rejoin lobby.
      // Ideally we should store the return URL before redirecting.
      router.push('/');
    } else {
      router.push('/?error=spotify_auth_failed');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <p>Connecting to Spotify...</p>
    </div>
  );
}

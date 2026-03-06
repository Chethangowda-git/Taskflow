import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import App from './App';
import { useAuthStore } from './stores/authStore';
import './index.css';

const queryClient = new QueryClient();

async function initAuth() {
  try {
    const { data } = await axios.post(
      'http://localhost:4000/api/auth/refresh',
      {},
      { withCredentials: true }
    );
    const { data: user } = await axios.get('http://localhost:4000/api/auth/me', {
      headers: { Authorization: `Bearer ${data.accessToken}` },
      withCredentials: true,
    });
    useAuthStore.getState().setAuth(user, data.accessToken);
  } catch {
    // No valid session
  }
}

function Root() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initAuth().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <Root />
  </QueryClientProvider>
);
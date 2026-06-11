import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      window.location.href = '/dashboard';
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return <div className="flex h-screen items-center justify-center">Authenticating...</div>;
}

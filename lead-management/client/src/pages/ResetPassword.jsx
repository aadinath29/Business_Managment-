import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../components/UI/Card';
import { Button } from '../components/UI/Button';
import { Building2, CheckCircle } from 'lucide-react';
import apiClient from '../services/api/apiClient';



export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState({ loading: false, success: false, error: '' });

  // If there's no token in the URL, they shouldn't be here
  useEffect(() => {
    if (!token) {
      setStatus(prev => ({ ...prev, error: 'Invalid or missing password reset token.' }));
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setStatus({ loading: false, success: false, error: 'Passwords do not match.' });
    }
    
    if (password.length < 6) {
      return setStatus({ loading: false, success: false, error: 'Password must be at least 6 characters long.' });
    }

    setStatus({ loading: true, success: false, error: '' });
    
    try {
      await apiClient.post('/auth/reset-password', { token, password });
      setStatus({ loading: false, success: true, error: '' });
    } catch (error) {
      setStatus({ 
        loading: false, 
        success: false, 
        error: error.response?.data?.message || 'Something went wrong while resetting your password.' 
      });
    }
  };

  if (!token && !status.error) {
    return null; // Will trigger the useEffect error
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center">
          <Building2 className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Create new password
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {status.success ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Password reset complete</h3>
              <p className="text-sm text-slate-500 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full justify-center">
                Sign in
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {status.error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md border border-red-200">
                  {status.error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700">New Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    disabled={!token || status.loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    disabled={!token || status.loading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-slate-100"
                  />
                </div>
              </div>

              <div>
                <Button 
                  type="submit" 
                  className="w-full justify-center" 
                  disabled={!token || status.loading}
                >
                  {status.loading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </div>
              
              <div className="text-sm text-center">
                <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

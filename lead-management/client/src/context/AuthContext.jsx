import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api/apiClient';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const savedAuth = localStorage.getItem('kosqu_auth');
    if (savedAuth) {
      try {
        return JSON.parse(savedAuth);
      } catch (err) {
        console.error('AuthProvider: Error parsing auth from localStorage', err);
      }
    }
    return {
      isLoggedIn: false,
      role: null,
      backendRole: null,
      branch: null,
      leaderId: null,
      teamId: null,
      name: null,
      userId: null,
      accessToken: null,
      refreshToken: null
    };
  });

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      
      if (response.data.success) {
        const { accessToken, refreshToken, user: backendUser } = response.data.data;

        // Map backend database role names to frontend client roles
        let role = 'developer';
        if (backendUser.role === 'SUPER_ADMIN') {
          role = 'admin';
        } else if (backendUser.role === 'ADMIN') {
          role = 'branch_manager'; // Branch Manager: scoped to their own branch, not a full admin
        } else if (backendUser.role === 'TEAM_LEADER') {
          role = 'team_leader';
        }

        let branch = 'all';
        let leaderId = null;
        let teamId = null;

        // For Branch Managers, resolve their assigned branch from backend automatically
        // (GET /branches is backend-scoped to return exactly their own branch)
        if (backendUser.role === 'ADMIN') {
          try {
            const brRes = await apiClient.get('/branches', {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            });
            if (brRes.data.success && brRes.data.data.length > 0) {
              branch = brRes.data.data[0].id;
            }
          } catch (brErr) {
            console.error('AuthProvider: Failed to auto-resolve branch manager branch', brErr);
          }
        }

        // For Team Leaders, resolve their assigned branch and team ID from backend automatically
        if (backendUser.role === 'TEAM_LEADER') {
          try {
            const tlRes = await apiClient.get('/team-leaders', {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            });
            if (tlRes.data.success && tlRes.data.data.length > 0) {
              const tl = tlRes.data.data[0];
              branch = tl.branch_id || 'all';
              leaderId = tl.id;
              teamId = tl.team_id;
            }
          } catch (tlErr) {
            console.error('AuthProvider: Failed to auto-resolve team leader info', tlErr);
            leaderId = 'TL001';
          }
        }

        const newAuth = {
          isLoggedIn: true,
          role,
          backendRole: backendUser.role,
          branch,
          leaderId,
          teamId,
          email: backendUser.email,
          name: backendUser.name,
          userId: backendUser.id,
          accessToken,
          refreshToken
        };

        setAuth(newAuth);
        localStorage.setItem('kosqu_auth', JSON.stringify(newAuth));
        return { success: true };
      }
      return { success: false, message: response.data.message || 'Login failed' };
    } catch (err) {
      console.error('AuthProvider: Login service error', err);
      const errorMsg = err.response?.data?.error?.message || err.message || 'Authentication failed';
      return { success: false, message: errorMsg };
    }
  };

  const logout = async () => {
    try {
      if (auth.accessToken) {
        await apiClient.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${auth.accessToken}`
          }
        });
      }
    } catch (err) {
      console.error('AuthProvider: Logout API call failed', err);
    } finally {
      const defaultAuth = {
        isLoggedIn: false,
        role: null,
        backendRole: null,
        branch: null,
        leaderId: null,
        teamId: null,
        name: null,
        userId: null,
        accessToken: null,
        refreshToken: null
      };
      setAuth(defaultAuth);
      localStorage.removeItem('kosqu_auth');
    }
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

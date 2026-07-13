import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TeamsPage } from './TeamsPage';

export function TeamsIndex() {
  const { role, leaderId } = useAuth();
  
  if (role === 'team_leader' && leaderId) {
    return <Navigate to={`/teams/${leaderId}`} replace />;
  }
  
  return <TeamsPage />;
}

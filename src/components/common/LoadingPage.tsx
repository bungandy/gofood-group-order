import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingPageProps {
  text?: string;
}

export const LoadingPage: React.FC<LoadingPageProps> = ({ 
  text = 'Memuat...' 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}; 
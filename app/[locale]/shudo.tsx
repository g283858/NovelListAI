"use client"
import React from 'react';
import EmojiSudoku from '@/components/Games/shudo';

const Index: React.FC = () => {
  
  return (
    <div className="min-h-screen bg-purple-50">
      <EmojiSudoku />
    </div>
  );
};

export default Index;

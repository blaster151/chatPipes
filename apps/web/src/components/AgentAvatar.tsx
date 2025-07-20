'use client';

import React from 'react';
import { Bot, User, Zap, Sparkles } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  platform: string;
  avatar?: string;
  color?: string;
  isActive: boolean;
}

interface AgentAvatarProps {
  agent: Agent;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
}

const platformIcons = {
  chatgpt: Sparkles,
  claude: Zap,
  perplexity: Bot,
  deepseek: Bot,
  default: Bot
};

const platformColors = {
  chatgpt: '#10a37f',
  claude: '#ff6b35',
  perplexity: '#6366f1',
  deepseek: '#059669',
  default: '#6b7280'
};

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg'
};

export const AgentAvatar: React.FC<AgentAvatarProps> = ({ 
  agent, 
  size = 'md',
  showStatus = true 
}) => {
  const IconComponent = platformIcons[agent.platform as keyof typeof platformIcons] || platformIcons.default;
  const color = agent.color || platformColors[agent.platform as keyof typeof platformColors] || platformColors.default;
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative inline-block">
      {/* Avatar */}
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white shadow-sm`}
        style={{ backgroundColor: color }}
      >
        {agent.avatar ? (
          <img 
            src={agent.avatar} 
            alt={agent.name}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          <IconComponent className="w-1/2 h-1/2" />
        )}
      </div>

      {/* Status Indicator */}
      {showStatus && (
        <div className="absolute -bottom-1 -right-1">
          <div className={`w-3 h-3 rounded-full border-2 border-white ${
            agent.isActive ? 'bg-green-500' : 'bg-gray-400'
          }`} />
        </div>
      )}

      {/* Platform Badge */}
      <div className="absolute -top-1 -right-1">
        <div className="bg-white rounded-full px-1 py-0.5 shadow-sm">
          <span className="text-xs font-medium text-gray-600 capitalize">
            {agent.platform}
          </span>
        </div>
      </div>
    </div>
  );
}; 
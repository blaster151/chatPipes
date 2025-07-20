'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, AlertCircle, User, Bot } from 'lucide-react';
import { AgentAvatar } from './AgentAvatar';

interface Message {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'interjection' | 'system';
  avatar?: string;
  color?: string;
}

interface MessageBubbleProps {
  message: Message;
  isInterjection?: boolean;
  showAvatar?: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isInterjection = false,
  showAvatar = true 
}) => {
  const isOwnMessage = message.agentId === 'user';
  const isSystemMessage = message.type === 'system';
  const isInterjectionMessage = message.type === 'interjection';

  const getBubbleStyles = () => {
    if (isInterjectionMessage) {
      return {
        container: 'bg-yellow-50 border-yellow-200',
        bubble: 'bg-yellow-100 border-yellow-300',
        text: 'text-yellow-900'
      };
    }
    
    if (isSystemMessage) {
      return {
        container: 'bg-gray-50 border-gray-200',
        bubble: 'bg-gray-100 border-gray-300',
        text: 'text-gray-700'
      };
    }
    
    if (isOwnMessage) {
      return {
        container: 'justify-end',
        bubble: 'bg-blue-600 text-white',
        text: 'text-white'
      };
    }
    
    return {
      container: 'justify-start',
      bubble: 'bg-white border border-gray-200',
      text: 'text-gray-900'
    };
  };

  const styles = getBubbleStyles();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={`flex ${styles.container} ${isInterjectionMessage ? 'mb-6' : 'mb-4'}`}
    >
      {/* Avatar */}
      {showAvatar && !isOwnMessage && (
        <div className="flex-shrink-0 mr-3">
          <AgentAvatar
            agent={{
              id: message.agentId,
              name: message.agentName,
              platform: 'ai',
              avatar: message.avatar,
              color: message.color,
              isActive: true
            }}
            size="sm"
          />
        </div>
      )}

      {/* Message Content */}
      <div className={`flex flex-col max-w-2xl ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Interjection Label */}
        {isInterjectionMessage && (
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Interjection</span>
          </div>
        )}

        {/* Message Bubble */}
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${styles.bubble}`}>
          <div className={`${styles.text} whitespace-pre-wrap`}>
            {message.content}
          </div>
        </div>

        {/* Timestamp */}
        <div className={`text-xs text-gray-500 mt-1 ${isOwnMessage ? 'text-right' : 'text-left'}`}>
          {message.timestamp.toLocaleTimeString()}
        </div>

        {/* Agent Name for Interjections */}
        {isInterjectionMessage && (
          <div className="text-xs text-gray-500 mt-1">
            From: {message.agentName}
          </div>
        )}
      </div>

      {/* Avatar for own messages */}
      {showAvatar && isOwnMessage && (
        <div className="flex-shrink-0 ml-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </motion.div>
  );
}; 
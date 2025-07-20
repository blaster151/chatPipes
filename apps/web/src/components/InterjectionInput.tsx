'use client';

import React, { useState } from 'react';
import { Send, AlertCircle, Target, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface Agent {
  id: string;
  name: string;
  platform: string;
  avatar?: string;
  color?: string;
  isActive: boolean;
}

interface InterjectionInputProps {
  onInterjection: (text: string, target: string, priority: string) => void;
  agents: Agent[];
}

export const InterjectionInput: React.FC<InterjectionInputProps> = ({ 
  onInterjection, 
  agents 
}) => {
  const [text, setText] = useState('');
  const [target, setTarget] = useState('both');
  const [priority, setPriority] = useState('medium');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onInterjection(text.trim(), target, priority);
      setText('');
      setIsExpanded(false);
    }
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-700 border-gray-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    high: 'bg-red-100 text-red-700 border-red-300'
  };

  const priorityIcons = {
    low: null,
    medium: AlertCircle,
    high: Zap
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Input */}
        <div className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Add an interjection..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <Target className="w-5 h-5" />
          </button>
          
          <button
            type="submit"
            disabled={!text.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </div>

        {/* Expanded Options */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-4 border-t border-gray-200"
          >
            {/* Target Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTarget('both')}
                  className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    target === 'both'
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  Both Agents
                </button>
                {agents.slice(0, 2).map((agent, index) => (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setTarget(agent.id)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      target === agent.id
                        ? 'bg-blue-100 text-blue-700 border-blue-300'
                        : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {agent.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map((priorityLevel) => {
                  const IconComponent = priorityIcons[priorityLevel];
                  return (
                    <button
                      key={priorityLevel}
                      type="button"
                      onClick={() => setPriority(priorityLevel)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center space-x-1 ${
                        priority === priorityLevel
                          ? priorityColors[priorityLevel]
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {IconComponent && <IconComponent className="w-4 h-4" />}
                      <span className="capitalize">{priorityLevel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Actions
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setText('What are the ethical implications?');
                    setTarget('both');
                    setPriority('high');
                  }}
                  className="px-3 py-2 bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  Ethical Question
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setText('Can you elaborate on that point?');
                    setTarget('both');
                    setPriority('medium');
                  }}
                  className="px-3 py-2 bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  Request Elaboration
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setText('Let\'s focus on practical applications');
                    setTarget('both');
                    setPriority('medium');
                  }}
                  className="px-3 py-2 bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  Redirect Focus
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setText('This seems off-topic, let\'s return to the main discussion');
                    setTarget('both');
                    setPriority('high');
                  }}
                  className="px-3 py-2 bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                >
                  Return to Topic
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </form>
    </div>
  );
}; 
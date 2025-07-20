'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Save, Trash2, Palette, User, Bot } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import { AgentAvatar } from './AgentAvatar';

interface Agent {
  id: string;
  name: string;
  platform: string;
  avatar?: string;
  color?: string;
  isActive: boolean;
  persona?: {
    description: string;
    instructions: string;
    introPrompt: string;
    behaviorStyle: string;
    temperature: number;
  };
}

interface PersonaEditorProps {
  onClose: () => void;
  agents: Agent[];
  onAgentsUpdate: (agents: Agent[]) => void;
}

const platforms = [
  { id: 'chatgpt', name: 'ChatGPT', icon: '🤖' },
  { id: 'claude', name: 'Claude', icon: '🧠' },
  { id: 'perplexity', name: 'Perplexity', icon: '🔍' },
  { id: 'deepseek', name: 'DeepSeek', icon: '🚀' }
];

const defaultColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
];

export const PersonaEditor: React.FC<PersonaEditorProps> = ({
  onClose,
  agents,
  onAgentsUpdate
}) => {
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#3b82f6');

  const addAgent = () => {
    const newAgent: Agent = {
      id: `agent-${Date.now()}`,
      name: `Agent ${agents.length + 1}`,
      platform: 'chatgpt',
      color: defaultColors[agents.length % defaultColors.length],
      isActive: true,
      persona: {
        description: 'A helpful AI assistant',
        instructions: 'You are a helpful AI assistant. Provide thoughtful and engaging responses.',
        introPrompt: 'You are an AI assistant.',
        behaviorStyle: 'helpful and knowledgeable',
        temperature: 0.7
      }
    };
    
    onAgentsUpdate([...agents, newAgent]);
    setEditingAgent(newAgent);
  };

  const updateAgent = (updatedAgent: Agent) => {
    const updatedAgents = agents.map(agent => 
      agent.id === updatedAgent.id ? updatedAgent : agent
    );
    onAgentsUpdate(updatedAgents);
    setEditingAgent(updatedAgent);
  };

  const deleteAgent = (agentId: string) => {
    const updatedAgents = agents.filter(agent => agent.id !== agentId);
    onAgentsUpdate(updatedAgents);
    setEditingAgent(null);
  };

  const handleSave = () => {
    if (editingAgent) {
      updateAgent(editingAgent);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Persona Editor</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* Agent List */}
            <div className="w-1/3 border-r border-gray-200 p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Agents</h3>
                <button
                  onClick={addAgent}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Agent</span>
                </button>
              </div>

              <div className="space-y-3">
                {agents.map((agent) => (
                  <div
                    key={agent.id}
                    onClick={() => setEditingAgent(agent)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      editingAgent?.id === agent.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <AgentAvatar agent={agent} size="md" />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{agent.name}</div>
                        <div className="text-sm text-gray-500">{agent.platform}</div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteAgent(agent.id);
                        }}
                        className="p-1 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Editor */}
            <div className="flex-1 p-6 overflow-y-auto">
              {editingAgent ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Name
                        </label>
                        <input
                          type="text"
                          value={editingAgent.name}
                          onChange={(e) => updateAgent({ ...editingAgent, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Platform
                        </label>
                        <select
                          value={editingAgent.platform}
                          onChange={(e) => updateAgent({ ...editingAgent, platform: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          {platforms.map((platform) => (
                            <option key={platform.id} value={platform.id}>
                              {platform.icon} {platform.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Appearance */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h3>
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color
                        </label>
                        <div className="relative">
                          <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="w-12 h-12 rounded-lg border-2 border-gray-300"
                            style={{ backgroundColor: editingAgent.color }}
                          />
                          {showColorPicker && (
                            <div className="absolute top-14 left-0 z-10">
                              <HexColorPicker
                                color={editingAgent.color || '#3b82f6'}
                                onChange={(color) => updateAgent({ ...editingAgent, color })}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Preview
                        </label>
                        <AgentAvatar agent={editingAgent} size="lg" />
                      </div>
                    </div>
                  </div>

                  {/* Persona Configuration */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Persona Configuration</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description
                        </label>
                        <textarea
                          value={editingAgent.persona?.description || ''}
                          onChange={(e) => updateAgent({
                            ...editingAgent,
                            persona: { ...editingAgent.persona, description: e.target.value }
                          })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Instructions
                        </label>
                        <textarea
                          value={editingAgent.persona?.instructions || ''}
                          onChange={(e) => updateAgent({
                            ...editingAgent,
                            persona: { ...editingAgent.persona, instructions: e.target.value }
                          })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Intro Prompt
                        </label>
                        <textarea
                          value={editingAgent.persona?.introPrompt || ''}
                          onChange={(e) => updateAgent({
                            ...editingAgent,
                            persona: { ...editingAgent.persona, introPrompt: e.target.value }
                          })}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Behavior Style
                          </label>
                          <input
                            type="text"
                            value={editingAgent.persona?.behaviorStyle || ''}
                            onChange={(e) => updateAgent({
                              ...editingAgent,
                              persona: { ...editingAgent.persona, behaviorStyle: e.target.value }
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Temperature: {editingAgent.persona?.temperature || 0.7}
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={editingAgent.persona?.temperature || 0.7}
                            onChange={(e) => updateAgent({
                              ...editingAgent,
                              persona: { ...editingAgent.persona, temperature: parseFloat(e.target.value) }
                            })}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Select an agent to edit their persona</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Settings, Users, MessageSquare, Clock, Zap } from 'lucide-react';

interface PipelineConfigProps {
  onClose: () => void;
  dialogueId?: string;
}

interface PipelineSettings {
  type: 'pipe' | 'multi';
  maxRounds: number;
  turnDelay: number;
  enableStreaming: boolean;
  synthesisStrategy?: 'recent' | 'all' | 'weighted';
  contextWindow?: number;
  sessionName: string;
}

export const PipelineConfig: React.FC<PipelineConfigProps> = ({
  onClose,
  dialogueId
}) => {
  const [settings, setSettings] = useState<PipelineSettings>({
    type: 'pipe',
    maxRounds: 10,
    turnDelay: 2000,
    enableStreaming: true,
    synthesisStrategy: 'recent',
    contextWindow: 3,
    sessionName: 'New Dialogue'
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (dialogueId) {
      // Load existing settings
      loadSettings();
    }
  }, [dialogueId]);

  const loadSettings = async () => {
    try {
      const response = await fetch(`/api/dialogue/${dialogueId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSettings({
            type: data.dialogue.type,
            maxRounds: data.dialogue.maxRounds || 10,
            turnDelay: data.dialogue.turnDelay || 2000,
            enableStreaming: data.dialogue.enableStreaming !== false,
            synthesisStrategy: data.dialogue.synthesisStrategy || 'recent',
            contextWindow: data.dialogue.contextWindow || 3,
            sessionName: data.dialogue.sessionName || 'Dialogue'
          });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dialogue/${dialogueId || 'new'}`, {
        method: dialogueId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Close modal and refresh
          onClose();
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsLoading(false);
    }
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
          className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Pipeline Configuration</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Pipeline Type */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Type</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setSettings({ ...settings, type: 'pipe' })}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      settings.type === 'pipe'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Dialogue Pipe</div>
                        <div className="text-sm text-gray-500">Two-agent conversation</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setSettings({ ...settings, type: 'multi' })}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      settings.type === 'multi'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Users className="w-6 h-6 text-purple-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">Multi-Agent</div>
                        <div className="text-sm text-gray-500">Round-robin discussion</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Basic Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Name
                    </label>
                    <input
                      type="text"
                      value={settings.sessionName}
                      onChange={(e) => setSettings({ ...settings, sessionName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Rounds: {settings.maxRounds}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="50"
                        value={settings.maxRounds}
                        onChange={(e) => setSettings({ ...settings, maxRounds: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Turn Delay: {settings.turnDelay}ms
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10000"
                        step="500"
                        value={settings.turnDelay}
                        onChange={(e) => setSettings({ ...settings, turnDelay: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="streaming"
                      checked={settings.enableStreaming}
                      onChange={(e) => setSettings({ ...settings, enableStreaming: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="streaming" className="text-sm font-medium text-gray-700">
                      Enable real-time streaming
                    </label>
                  </div>
                </div>
              </div>

              {/* Multi-Agent Specific Settings */}
              {settings.type === 'multi' && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Multi-Agent Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Context Synthesis Strategy
                      </label>
                      <select
                        value={settings.synthesisStrategy}
                        onChange={(e) => setSettings({ 
                          ...settings, 
                          synthesisStrategy: e.target.value as 'recent' | 'all' | 'weighted' 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="recent">Recent (Last N exchanges)</option>
                        <option value="all">All (Full conversation history)</option>
                        <option value="weighted">Weighted (Recent exchanges weighted higher)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Context Window: {settings.contextWindow} exchanges
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={settings.contextWindow}
                        onChange={(e) => setSettings({ ...settings, contextWindow: parseInt(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Settings</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Auto-save sessions</span>
                    <span className="text-sm font-medium text-green-600">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Save interval</span>
                    <span className="text-sm font-medium text-gray-900">30 seconds</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Max log entries</span>
                    <span className="text-sm font-medium text-gray-900">1000</span>
                  </div>
                </div>
              </div>
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
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}; 
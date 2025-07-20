'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  MessageSquare, 
  Settings, 
  Download,
  User,
  Bot,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { PersonaEditor } from './PersonaEditor';
import { PipelineConfig } from './PipelineConfig';
import { MessageBubble } from './MessageBubble';
import { InterjectionInput } from './InterjectionInput';
import { AgentAvatar } from './AgentAvatar';

interface DialogueInterfaceProps {
  dialogueId?: string;
  onDialogueUpdate?: (data: any) => void;
}

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

interface Agent {
  id: string;
  name: string;
  platform: string;
  avatar?: string;
  color?: string;
  isActive: boolean;
}

export const DialogueInterface: React.FC<DialogueInterfaceProps> = ({ 
  dialogueId, 
  onDialogueUpdate 
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentRound, setCurrentRound] = useState(0);
  const [showPersonaEditor, setShowPersonaEditor] = useState(false);
  const [showPipelineConfig, setShowPipelineConfig] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate real-time messages (in real app, this would come from WebSocket)
  useEffect(() => {
    if (isRunning && !isPaused) {
      const interval = setInterval(() => {
        // Simulate message updates
        setCurrentRound(prev => prev + 1);
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [isRunning, isPaused]);

  // Control functions
  const startDialogue = async () => {
    try {
      const response = await fetch(`/api/dialogue/${dialogueId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start' })
      });

      if (response.ok) {
        setIsRunning(true);
        setIsPaused(false);
        toast.success('Dialogue started');
      } else {
        toast.error('Failed to start dialogue');
      }
    } catch (error) {
      toast.error('Error starting dialogue');
    }
  };

  const pauseDialogue = async () => {
    try {
      const response = await fetch(`/api/dialogue/${dialogueId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause' })
      });

      if (response.ok) {
        setIsPaused(true);
        toast.success('Dialogue paused');
      } else {
        toast.error('Failed to pause dialogue');
      }
    } catch (error) {
      toast.error('Error pausing dialogue');
    }
  };

  const resumeDialogue = async () => {
    try {
      const response = await fetch(`/api/dialogue/${dialogueId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' })
      });

      if (response.ok) {
        setIsPaused(false);
        toast.success('Dialogue resumed');
      } else {
        toast.error('Failed to resume dialogue');
      }
    } catch (error) {
      toast.error('Error resuming dialogue');
    }
  };

  const stopDialogue = async () => {
    try {
      const response = await fetch(`/api/dialogue/${dialogueId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' })
      });

      if (response.ok) {
        setIsRunning(false);
        setIsPaused(false);
        toast.success('Dialogue stopped');
      } else {
        toast.error('Failed to stop dialogue');
      }
    } catch (error) {
      toast.error('Error stopping dialogue');
    }
  };

  const addInterjection = async (text: string, target: string, priority: string) => {
    try {
      const response = await fetch(`/api/dialogue/${dialogueId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'interjection',
          text,
          target,
          priority,
          type: 'side_question'
        })
      });

      if (response.ok) {
        const newMessage: Message = {
          id: `interjection-${Date.now()}`,
          agentId: 'interjection',
          agentName: 'Interjection',
          content: text,
          timestamp: new Date(),
          type: 'interjection',
          color: '#f59e0b'
        };
        setMessages(prev => [...prev, newMessage]);
        toast.success('Interjection added');
      } else {
        toast.error('Failed to add interjection');
      }
    } catch (error) {
      toast.error('Error adding interjection');
    }
  };

  const exportSession = async () => {
    try {
      const response = await fetch(`/api/sessions/${dialogueId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-${dialogueId}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Session exported');
      } else {
        toast.error('Failed to export session');
      }
    } catch (error) {
      toast.error('Error exporting session');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">AI Dialogue</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isRunning ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {isRunning ? (isPaused ? 'Paused' : 'Running') : 'Stopped'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Control Buttons */}
            <button
              onClick={startDialogue}
              disabled={isRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              <span>Start</span>
            </button>
            
            <button
              onClick={isPaused ? resumeDialogue : pauseDialogue}
              disabled={!isRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              <span>{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            
            <button
              onClick={stopDialogue}
              disabled={!isRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Square className="w-4 h-4" />
              <span>Stop</span>
            </button>
            
            {/* Configuration Buttons */}
            <button
              onClick={() => setShowPersonaEditor(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <User className="w-4 h-4" />
              <span>Personas</span>
            </button>
            
            <button
              onClick={() => setShowPipelineConfig(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Settings className="w-4 h-4" />
              <span>Pipeline</span>
            </button>
            
            <button
              onClick={exportSession}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Round: {currentRound}</span>
            <span>Messages: {messages.length}</span>
            <span>Agents: {agents.length}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Messages Panel */}
        <div className="flex-1 flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <MessageBubble
                    message={message}
                    isInterjection={message.type === 'interjection'}
                    showAvatar={true}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
          
          {/* Interjection Input */}
          <div className="border-t border-gray-200 p-4">
            <InterjectionInput
              onInterjection={addInterjection}
              agents={agents}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Agents</h3>
          
          <div className="space-y-3">
            {agents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => setSelectedAgent(agent)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedAgent?.id === agent.id
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
                  <div className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                </div>
              </div>
            ))}
          </div>
          
          {selectedAgent && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Agent Details</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>Name: {selectedAgent.name}</div>
                <div>Platform: {selectedAgent.platform}</div>
                <div>Status: {selectedAgent.isActive ? 'Active' : 'Inactive'}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showPersonaEditor && (
          <PersonaEditor
            onClose={() => setShowPersonaEditor(false)}
            agents={agents}
            onAgentsUpdate={setAgents}
          />
        )}
        
        {showPipelineConfig && (
          <PipelineConfig
            onClose={() => setShowPipelineConfig(false)}
            dialogueId={dialogueId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}; 
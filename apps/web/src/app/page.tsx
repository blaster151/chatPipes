'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Play, 
  Pause, 
  Square, 
  Download, 
  Upload, 
  Settings,
  Users,
  MessageSquare,
  Clock,
  Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { DialogueInterface } from '../components/DialogueInterface';
import { PersonaEditor } from '../components/PersonaEditor';
import { PipelineConfig } from '../components/PipelineConfig';

interface Session {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  agentCount: number;
  exchangeCount: number;
  interjectionCount: number;
}

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

export default function Home() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [activeDialogueId, setActiveDialogueId] = useState<string | null>(null);
  const [showPersonaEditor, setShowPersonaEditor] = useState(false);
  const [showPipelineConfig, setShowPipelineConfig] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSessions(data.sessions.map((session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt)
          })));
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewDialogue = async () => {
    try {
      // Default agents for new dialogue
      const defaultAgents: Agent[] = [
        {
          id: 'agent-1',
          name: 'GPT Assistant',
          platform: 'chatgpt',
          color: '#10a37f',
          isActive: true,
          persona: {
            description: 'A helpful ChatGPT assistant',
            instructions: 'You are a helpful AI assistant. Provide thoughtful and engaging responses.',
            introPrompt: 'You are an AI assistant powered by ChatGPT.',
            behaviorStyle: 'helpful and knowledgeable',
            temperature: 0.7
          }
        },
        {
          id: 'agent-2',
          name: 'Claude Assistant',
          platform: 'claude',
          color: '#ff6b35',
          isActive: true,
          persona: {
            description: 'A thoughtful Claude assistant',
            instructions: 'You are a helpful AI assistant. Provide thoughtful and detailed responses.',
            introPrompt: 'You are an AI assistant powered by Claude.',
            behaviorStyle: 'thoughtful and detailed',
            temperature: 0.7
          }
        }
      ];

      setAgents(defaultAgents);
      setShowPipelineConfig(true);
    } catch (error) {
      console.error('Error creating new dialogue:', error);
      toast.error('Failed to create new dialogue');
    }
  };

  const startDialogue = async (sessionId: string) => {
    setActiveDialogueId(sessionId);
  };

  const exportSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session-${sessionId}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Session exported successfully');
      } else {
        toast.error('Failed to export session');
      }
    } catch (error) {
      console.error('Error exporting session:', error);
      toast.error('Error exporting session');
    }
  };

  const importSession = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: text
      });

      if (response.ok) {
        toast.success('Session imported successfully');
        loadSessions();
      } else {
        toast.error('Failed to import session');
      }
    } catch (error) {
      console.error('Error importing session:', error);
      toast.error('Error importing session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'paused': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <Square className="w-4 h-4" />;
      case 'error': return <Activity className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (activeDialogueId) {
    return (
      <DialogueInterface
        dialogueId={activeDialogueId}
        onDialogueUpdate={() => {
          setActiveDialogueId(null);
          loadSessions();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">ChatPipes</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPersonaEditor(true)}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Users className="w-4 h-4" />
                <span>Personas</span>
              </button>
              
              <button
                onClick={createNewDialogue}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                <span>New Dialogue</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">{sessions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {sessions.filter(s => s.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Agents</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {sessions.reduce((sum, s) => sum + s.agentCount, 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Exchanges</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {sessions.reduce((sum, s) => sum + s.exchangeCount, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Sessions</h2>
              
              <div className="flex items-center space-x-3">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importSession}
                    className="hidden"
                  />
                  <div className="flex items-center space-x-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Upload className="w-4 h-4" />
                    <span>Import</span>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {isLoading ? (
              <div className="p-6 text-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading sessions...</p>
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
                <p className="text-gray-600 mb-6">Create your first dialogue to get started</p>
                <button
                  onClick={createNewDialogue}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Dialogue</span>
                </button>
              </div>
            ) : (
              sessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          {session.type === 'multi' ? (
                            <Users className="w-5 h-5 text-blue-600" />
                          ) : (
                            <MessageSquare className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{session.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="capitalize">{session.type}</span>
                          <span>•</span>
                          <span>{session.agentCount} agents</span>
                          <span>•</span>
                          <span>{session.exchangeCount} exchanges</span>
                          <span>•</span>
                          <span>{session.interjectionCount} interjections</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                        {getStatusIcon(session.status)}
                        <span className="capitalize">{session.status}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startDialogue(session.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Open Dialogue"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => exportSession(session.id)}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Export Session"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-500">
                    Created {session.createdAt.toLocaleDateString()} • 
                    Last updated {session.updatedAt.toLocaleDateString()}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>

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
            dialogueId={undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
} 
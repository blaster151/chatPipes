'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward, 
  RotateCcw,
  Settings,
  Download,
  Clock,
  MessageSquare
} from 'lucide-react';
import { DialogueExchange, ReplayState, ReplayEvent } from '@chatpipes/ai-conductor';

interface ReplayInterfaceProps {
  sessionId: string;
  onClose: () => void;
}

interface ReplayControls {
  speed: 'instant' | 'fast' | 'normal' | 'slow';
  autoAdvance: boolean;
  loop: boolean;
  showMetadata: boolean;
}

export const ReplayInterface: React.FC<ReplayInterfaceProps> = ({ 
  sessionId, 
  onClose 
}) => {
  const [exchanges, setExchanges] = useState<DialogueExchange[]>([]);
  const [currentExchange, setCurrentExchange] = useState<DialogueExchange | null>(null);
  const [replayState, setReplayState] = useState<ReplayState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [controls, setControls] = useState<ReplayControls>({
    speed: 'normal',
    autoAdvance: true,
    loop: false,
    showMetadata: true
  });
  const [showControls, setShowControls] = useState(true);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);

  // Load session data
  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  // Auto-advance logic
  useEffect(() => {
    if (isPlaying && controls.autoAdvance && currentIndex < exchanges.length - 1) {
      const delay = getSpeedDelay(controls.speed);
      autoAdvanceRef.current = setTimeout(() => {
        setCurrentIndex(prev => prev + 1);
      }, delay);
    }

    return () => {
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }
    };
  }, [isPlaying, controls.autoAdvance, currentIndex, exchanges.length, controls.speed]);

  // Update current exchange when index changes
  useEffect(() => {
    if (exchanges.length > 0 && currentIndex < exchanges.length) {
      setCurrentExchange(exchanges[currentIndex]);
    }
  }, [currentIndex, exchanges]);

  // Handle loop
  useEffect(() => {
    if (currentIndex >= exchanges.length - 1 && controls.loop && isPlaying) {
      setCurrentIndex(0);
    } else if (currentIndex >= exchanges.length - 1 && !controls.loop && isPlaying) {
      setIsPlaying(false);
    }
  }, [currentIndex, exchanges.length, controls.loop, isPlaying]);

  const loadSessionData = async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Convert session exchanges to DialogueExchange format
          const dialogueExchanges: DialogueExchange[] = data.session.exchanges.map((exchange: any) => ({
            id: exchange.id,
            from: exchange.from,
            to: exchange.to,
            prompt: exchange.prompt,
            response: exchange.response,
            round: exchange.round,
            timestamp: new Date(exchange.timestamp),
            interjectionId: exchange.metadata?.interjectionId,
            metadata: {
              duration: exchange.metadata?.duration || 0,
              tokens: exchange.metadata?.tokens || 0,
              platform: exchange.metadata?.platform || 'unknown',
              model: exchange.metadata?.model || 'unknown',
              interjectionId: exchange.metadata?.interjectionId
            }
          }));
          
          setExchanges(dialogueExchanges);
          if (dialogueExchanges.length > 0) {
            setCurrentExchange(dialogueExchanges[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const getSpeedDelay = (speed: string): number => {
    switch (speed) {
      case 'instant': return 0;
      case 'fast': return 300;
      case 'normal': return 1000;
      case 'slow': return 3000;
      default: return 1000;
    }
  };

  const play = () => {
    setIsPlaying(true);
  };

  const pause = () => {
    setIsPlaying(false);
  };

  const stop = () => {
    setIsPlaying(false);
    setCurrentIndex(0);
  };

  const previous = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const next = () => {
    if (currentIndex < exchanges.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const jumpTo = (index: number) => {
    if (index >= 0 && index < exchanges.length) {
      setCurrentIndex(index);
    }
  };

  const exportReplay = () => {
    const replayData = {
      sessionId,
      exchanges,
      controls,
      exportedAt: new Date()
    };
    
    const blob = new Blob([JSON.stringify(replayData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `replay-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const progress = exchanges.length > 0 ? (currentIndex + 1) / exchanges.length : 0;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900">Session Replay</h1>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isPlaying ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-sm text-gray-600">
                {isPlaying ? 'Playing' : 'Paused'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={exportReplay}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Exchange {currentIndex + 1} of {exchanges.length}</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={stop}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <Square className="w-5 h-5" />
          </button>
          
          <button
            onClick={previous}
            disabled={currentIndex === 0}
            className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={isPlaying ? pause : play}
            className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          
          <button
            onClick={next}
            disabled={currentIndex === exchanges.length - 1}
            className="p-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            <SkipForward className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => jumpTo(0)}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
        
        {/* Speed Controls */}
        <div className="mt-4 flex items-center justify-center space-x-4">
          <select
            value={controls.speed}
            onChange={(e) => setControls(prev => ({ ...prev, speed: e.target.value as any }))}
            className="px-3 py-1 border border-gray-300 rounded-lg"
          >
            <option value="instant">Instant</option>
            <option value="fast">Fast</option>
            <option value="normal">Normal</option>
            <option value="slow">Slow</option>
          </select>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={controls.autoAdvance}
              onChange={(e) => setControls(prev => ({ ...prev, autoAdvance: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-sm">Auto Advance</span>
          </label>
          
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={controls.loop}
              onChange={(e) => setControls(prev => ({ ...prev, loop: e.target.checked }))}
              className="w-4 h-4"
            />
            <span className="text-sm">Loop</span>
          </label>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Exchange Timeline */}
        <div className="w-1/3 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-2">
              {exchanges.map((exchange, index) => (
                <motion.div
                  key={exchange.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => jumpTo(index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    index === currentIndex
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {exchange.from} → {exchange.to}
                      </div>
                      <div className="text-sm text-gray-500">
                        Round {exchange.round} • {exchange.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    {exchange.interjectionId && (
                      <div className="text-yellow-600">
                        💡
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-gray-600 truncate">
                    {exchange.response.substring(0, 50)}...
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Exchange */}
        <div className="flex-1 flex flex-col">
          {currentExchange ? (
            <>
              {/* Exchange Header */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Exchange {currentIndex + 1}
                    </h2>
                    <div className="text-sm text-gray-500">
                      {currentExchange.from} → {currentExchange.to} • Round {currentExchange.round} • {currentExchange.timestamp.toLocaleString()}
                    </div>
                  </div>
                  {currentExchange.interjectionId && (
                    <div className="flex items-center space-x-2 text-yellow-600">
                      <span>💡</span>
                      <span className="text-sm">Interjection Applied</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Exchange Content */}
              <div className="flex-1 flex">
                {/* Prompt */}
                <div className="w-1/2 p-4 border-r border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Prompt</h3>
                  <div className="bg-gray-50 rounded-lg p-4 h-full overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-gray-800">{currentExchange.prompt}</pre>
                  </div>
                </div>

                {/* Response */}
                <div className="w-1/2 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Response</h3>
                  <div className="bg-blue-50 rounded-lg p-4 h-full overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-gray-800">{currentExchange.response}</pre>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              {controls.showMetadata && currentExchange.metadata && (
                <div className="bg-gray-50 border-t border-gray-200 p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Metadata</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Duration:</span> {currentExchange.metadata.duration}ms
                    </div>
                    <div>
                      <span className="font-medium">Tokens:</span> {currentExchange.metadata.tokens || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Platform:</span> {currentExchange.metadata.platform}
                    </div>
                    <div>
                      <span className="font-medium">Model:</span> {currentExchange.metadata.model || 'N/A'}
                    </div>
                    {currentExchange.interjectionId && (
                      <div className="col-span-2">
                        <span className="font-medium">Interjection ID:</span> {currentExchange.interjectionId}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No exchange selected</h3>
                <p className="text-gray-600">Select an exchange from the timeline to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
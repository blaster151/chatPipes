import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';
import Divider from 'ink-divider';
import { ObservabilityManager, DialogueExchange, ReplayState, ReplayEvent } from '@chatpipes/ai-conductor';

interface ReplayInterfaceProps {
  sessionManager: ObservabilityManager; // Changed from SessionManager to ObservabilityManager
  sessionId: string;
  speed: 'slow' | 'normal' | 'fast' | 'instant';
  onExit: () => void;
}

export const ReplayInterface: React.FC<ReplayInterfaceProps> = ({ 
  sessionManager, 
  sessionId, 
  speed, 
  onExit 
}) => {
  const [session, setSession] = useState<any | null>(null); // Changed from SessionState to any
  const [replaySessionId, setReplaySessionId] = useState<string | null>(null);
  const [replayState, setReplayState] = useState<ReplayState | null>(null);
  const [currentExchange, setCurrentExchange] = useState<DialogueExchange | null>(null);
  const [exchanges, setExchanges] = useState<DialogueExchange[]>([]);
  const [showControls, setShowControls] = useState(true);
  const { exit } = useApp();

  // Load session and create replay
  useEffect(() => {
    const loadSessionAndReplay = async () => {
      try {
        const sessionData = sessionManager.getSession(sessionId);
        if (sessionData) {
          setSession(sessionData);
          
          // Convert session exchanges to DialogueExchange format
          const dialogueExchanges: DialogueExchange[] = sessionData.exchanges.map(exchange => ({
            id: exchange.id,
            from: exchange.from,
            to: exchange.to,
            prompt: exchange.prompt,
            response: exchange.response,
            round: exchange.round,
            timestamp: exchange.timestamp,
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
          
          // Create replay session
          const observabilityManager = new ObservabilityManager();
          const replayId = observabilityManager.createReplaySession(dialogueExchanges, {
            speed,
            enableInterjections: true,
            enableMetadata: true,
            autoAdvance: true,
            loop: false,
            sessionName: sessionData.name
          });
          
          setReplaySessionId(replayId);
          
          // Listen for replay events
          observabilityManager.on('replay_exchange', (event: ReplayEvent) => {
            setCurrentExchange(event.exchange || null);
            setReplayState(observabilityManager.getReplayState(replayId));
          });
          
          observabilityManager.on('replay_playing', (data) => {
            setReplayState(observabilityManager.getReplayState(replayId));
          });
          
          observabilityManager.on('replay_paused', (data) => {
            setReplayState(observabilityManager.getReplayState(replayId));
          });
          
          observabilityManager.on('replay_completed', (data) => {
            setReplayState(observabilityManager.getReplayState(replayId));
          });
          
          // Start replay
          await observabilityManager.startReplay(replayId);
        }
      } catch (error) {
        console.error('Error loading session:', error);
      }
    };

    loadSessionAndReplay();
  }, [sessionManager, sessionId, speed]);

  // Handle input
  useInput((input, key) => {
    if (key.escape) {
      exit();
      onExit();
    }

    if (key.space && replaySessionId) {
      if (replayState?.isPlaying) {
        // Pause/resume
        if (replayState.isPaused) {
          // Resume logic would be implemented here
        } else {
          // Pause logic would be implemented here
        }
      }
    }

    if (key.leftArrow && replaySessionId) {
      // Previous exchange
      if (replayState && replayState.currentIndex > 0) {
        // Jump to previous exchange logic would be implemented here
      }
    }

    if (key.rightArrow && replaySessionId) {
      // Next exchange
      if (replayState && replayState.currentIndex < replayState.totalExchanges - 1) {
        // Jump to next exchange logic would be implemented here
      }
    }

    if (key.home && replaySessionId) {
      // Go to beginning
      // Jump to first exchange logic would be implemented here
    }

    if (key.end && replaySessionId) {
      // Go to end
      // Jump to last exchange logic would be implemented here
    }

    if (key.ctrl && input === 'c') {
      setShowControls(!showControls);
    }
  });

  if (!session) {
    return (
      <Box justifyContent="center" alignItems="center" height={process.stdout.rows}>
        <Text color="red">Session not found: {sessionId}</Text>
      </Box>
    );
  }

  const progress = replayState ? (replayState.currentIndex + 1) / replayState.totalExchanges : 0;
  const progressBar = '█'.repeat(Math.floor(progress * 20)) + '░'.repeat(20 - Math.floor(progress * 20));

  return (
    <Box flexDirection="column" height={process.stdout.rows - 2}>
      {/* Header */}
      <Box borderStyle="round" borderColor="blue" padding={1}>
        <Gradient name="rainbow">
          <Text bold>🎬 Session Replay</Text>
        </Gradient>
        <Box marginLeft="auto">
          <Text color={replayState?.isPlaying ? 'green' : 'yellow'}>
            {replayState?.isPlaying ? 
              (replayState.isPaused ? '⏸️  Paused' : <><Spinner type="dots" /> Playing</>) : 
              '⏹️  Stopped'
            }
          </Text>
        </Box>
      </Box>

      {/* Session Info */}
      <Box borderStyle="single" borderColor="gray" padding={1}>
        <Box flexDirection="column" flexGrow={1}>
          <Text bold color="white">{session.name}</Text>
          <Text color="gray">Type: {session.type} | Agents: {session.agents.length}</Text>
          <Text color="gray">Created: {session.createdAt.toLocaleString()}</Text>
        </Box>
        <Box flexDirection="column" alignItems="flex-end">
          <Text color="cyan">Speed: {speed}</Text>
          <Text color="gray">
            Exchange {replayState?.currentIndex ? replayState.currentIndex + 1 : 0} of {replayState?.totalExchanges || 0}
          </Text>
        </Box>
      </Box>

      {/* Progress Bar */}
      <Box borderStyle="single" borderColor="gray" padding={1}>
        <Text color="blue">Progress: </Text>
        <Text color="green">{progressBar}</Text>
        <Text color="gray"> {Math.round(progress * 100)}%</Text>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1} borderStyle="single" borderColor="gray" flexDirection="row">
        {/* Exchange History */}
        <Box width="60%" flexDirection="column" padding={1}>
          <Text bold color="blue">📜 Exchange History</Text>
          <Divider />
          
          <Box flexDirection="column" height="100%" overflow="hidden">
            {exchanges.map((exchange, index) => (
              <Box 
                key={exchange.id}
                borderStyle={index === replayState?.currentIndex ? 'round' : undefined}
                borderColor={index === replayState?.currentIndex ? 'green' : undefined}
                padding={1}
                marginY={1}
              >
                <Box flexDirection="column">
                  <Box>
                    <Text color="cyan" bold>{exchange.from}</Text>
                    <Text color="gray"> → </Text>
                    <Text color="cyan" bold>{exchange.to}</Text>
                    <Text color="gray"> (Round {exchange.round})</Text>
                  </Box>
                  <Text color="gray" dimColor>{exchange.timestamp.toLocaleTimeString()}</Text>
                  <Text color="white" wrap="wrap">{exchange.response}</Text>
                  {exchange.metadata && (
                    <Text color="gray" dimColor>
                      Duration: {exchange.metadata.duration}ms | 
                      Tokens: {exchange.metadata.tokens || 'N/A'}
                    </Text>
                  )}
                  {exchange.interjectionId && (
                    <Text color="yellow" dimColor>💡 Interjection applied</Text>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Current Exchange Details */}
        <Box width="40%" flexDirection="column" padding={1} borderStyle="single" borderColor="gray">
          <Text bold color="blue">📄 Current Exchange</Text>
          <Divider />
          
          {currentExchange ? (
            <Box flexDirection="column">
              <Text bold color="white">From: {currentExchange.from}</Text>
              <Text bold color="white">To: {currentExchange.to}</Text>
              <Text color="gray">Round: {currentExchange.round}</Text>
              <Text color="gray">Time: {currentExchange.timestamp.toLocaleTimeString()}</Text>
              
              <Divider />
              <Text bold color="blue">Prompt</Text>
              <Text color="gray" wrap="wrap">{currentExchange.prompt}</Text>
              
              <Divider />
              <Text bold color="blue">Response</Text>
              <Text color="white" wrap="wrap">{currentExchange.response}</Text>
              
              {currentExchange.metadata && (
                <>
                  <Divider />
                  <Text bold color="blue">Metadata</Text>
                  <Text color="gray">Duration: {currentExchange.metadata.duration}ms</Text>
                  <Text color="gray">Tokens: {currentExchange.metadata.tokens || 'N/A'}</Text>
                  <Text color="gray">Platform: {currentExchange.metadata.platform}</Text>
                  <Text color="gray">Model: {currentExchange.metadata.model || 'N/A'}</Text>
                </>
              )}
              
              {currentExchange.interjectionId && (
                <>
                  <Divider />
                  <Text bold color="yellow">💡 Interjection Applied</Text>
                  <Text color="yellow" dimColor>ID: {currentExchange.interjectionId}</Text>
                </>
              )}
            </Box>
          ) : (
            <Box padding={2}>
              <Text color="gray">No exchange selected</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Controls */}
      {showControls && (
        <Box borderStyle="round" borderColor="gray" padding={1}>
          <Text color="gray">
            Space: Play/Pause | ←→: Navigate | Home/End: Jump | Ctrl+C: Toggle Controls | ESC: Exit
          </Text>
        </Box>
      )}
    </Box>
  );
}; 
import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import TextInput from 'ink-text-input';
import SelectInput from 'ink-select-input';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';
import Divider from 'ink-divider';
import { DialoguePipe, SessionManager, Spectator, Interjection } from '@chatpipes/ai-conductor';
import { v4 as uuidv4 } from 'uuid';

interface ChatInterfaceProps {
  dialogue: DialoguePipe;
  sessionManager: SessionManager;
  onExit: () => void;
}

interface Message {
  id: string;
  agent: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'interjection' | 'system';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ dialogue, sessionManager, onExit }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentInput, setCurrentInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [interjectionText, setInterjectionText] = useState('');
  const [showInterjectionInput, setShowInterjectionInput] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'chat' | 'logs' | 'stats'>('chat');
  const { exit } = useApp();

  // CLI Spectator for real-time updates
  useEffect(() => {
    const cliSpectator: Spectator = {
      id: 'tui-spectator',
      type: 'ui',
      name: 'TUI Observer',
      onTurnEvent: (event) => {
        if (event.type === 'turn_start') {
          setMessages(prev => [...prev, {
            id: uuidv4(),
            agent: event.agentName,
            content: 'Thinking...',
            timestamp: event.timestamp,
            type: 'system'
          }]);
        } else if (event.type === 'turn_end' && event.message) {
          setMessages(prev => {
            const newMessages = [...prev];
            // Update the last "Thinking..." message
            const lastIndex = newMessages.length - 1;
            if (lastIndex >= 0 && newMessages[lastIndex].content === 'Thinking...') {
              newMessages[lastIndex] = {
                id: uuidv4(),
                agent: event.agentName,
                content: event.message,
                timestamp: event.timestamp,
                type: 'message'
              };
            } else {
              newMessages.push({
                id: uuidv4(),
                agent: event.agentName,
                content: event.message,
                timestamp: event.timestamp,
                type: 'message'
              });
            }
            return newMessages;
          });
        }
      },
      onDialogueEvent: (event) => {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          agent: 'System',
          content: `${event.type}: ${JSON.stringify(event.data)}`,
          timestamp: event.timestamp,
          type: 'system'
        }]);
      },
      onError: (error) => {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          agent: 'Error',
          content: error.message,
          timestamp: new Date(),
          type: 'system'
        }]);
      }
    };

    dialogue.addSpectator(cliSpectator);
  }, [dialogue]);

  // Handle input
  useInput((input, key) => {
    if (key.escape) {
      exit();
      onExit();
    }

    if (key.tab) {
      setSelectedTab(prev => prev === 'chat' ? 'logs' : prev === 'logs' ? 'stats' : 'chat');
    }

    if (key.ctrl && input === 'p') {
      if (isRunning) {
        dialogue.pause();
        setIsRunning(false);
      } else {
        dialogue.resume();
        setIsRunning(true);
      }
    }

    if (key.ctrl && input === 's') {
      dialogue.stop();
      exit();
      onExit();
    }

    if (key.ctrl && input === 'i') {
      setShowInterjectionInput(true);
      setShowInput(false);
    }

    if (key.ctrl && input === 'm') {
      setShowInput(true);
      setShowInterjectionInput(false);
    }
  });

  // Start dialogue
  useEffect(() => {
    const startDialogue = async () => {
      setIsRunning(true);
      try {
        await dialogue.runLoopUntilStopped();
      } catch (error) {
        setMessages(prev => [...prev, {
          id: uuidv4(),
          agent: 'Error',
          content: `Dialogue error: ${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date(),
          type: 'system'
        }]);
      } finally {
        setIsRunning(false);
      }
    };

    startDialogue();
  }, [dialogue]);

  // Handle interjection submission
  const handleInterjectionSubmit = () => {
    if (interjectionText.trim()) {
      const interjection: Interjection = {
        id: uuidv4(),
        type: 'side_question',
        text: interjectionText.trim(),
        target: 'both',
        priority: 'medium',
        timestamp: new Date()
      };

      dialogue.addInterjection(interjection);
      setInterjectionText('');
      setShowInterjectionInput(false);
      setShowInput(false);
    }
  };

  // Get session stats
  const getSessionStats = () => {
    if (sessionManager && dialogue.getState().sessionId) {
      return sessionManager.getSessionStats(dialogue.getState().sessionId!);
    }
    return null;
  };

  // Get live logs
  const getLiveLogs = () => {
    if (sessionManager && dialogue.getState().sessionId) {
      return sessionManager.getLiveLogs(dialogue.getState().sessionId!, 20);
    }
    return [];
  };

  const stats = getSessionStats();
  const logs = getLiveLogs();

  return (
    <Box flexDirection="column" height={process.stdout.rows - 2}>
      {/* Header */}
      <Box borderStyle="round" borderColor="blue" padding={1}>
        <Gradient name="rainbow">
          <Text bold>🤖 AI Chat - Real-time Dialogue</Text>
        </Gradient>
        <Box marginLeft="auto">
          <Text color={isRunning ? 'green' : 'yellow'}>
            {isRunning ? <><Spinner type="dots" /> Running</> : '⏸️  Paused'}
          </Text>
        </Box>
      </Box>

      {/* Tabs */}
      <Box borderStyle="single" borderColor="gray">
        <Box 
          paddingX={2} 
          paddingY={1}
          borderStyle={selectedTab === 'chat' ? 'round' : undefined}
          borderColor={selectedTab === 'chat' ? 'blue' : undefined}
        >
          <Text color={selectedTab === 'chat' ? 'blue' : 'gray'}>💬 Chat</Text>
        </Box>
        <Box 
          paddingX={2} 
          paddingY={1}
          borderStyle={selectedTab === 'logs' ? 'round' : undefined}
          borderColor={selectedTab === 'logs' ? 'blue' : undefined}
        >
          <Text color={selectedTab === 'logs' ? 'blue' : 'gray'}>📋 Logs</Text>
        </Box>
        <Box 
          paddingX={2} 
          paddingY={1}
          borderStyle={selectedTab === 'stats' ? 'round' : undefined}
          borderColor={selectedTab === 'stats' ? 'blue' : undefined}
        >
          <Text color={selectedTab === 'stats' ? 'blue' : 'gray'}>📊 Stats</Text>
        </Box>
      </Box>

      {/* Content Area */}
      <Box flexGrow={1} borderStyle="single" borderColor="gray" flexDirection="row">
        {/* Main Content */}
        <Box flexGrow={1} flexDirection="column" padding={1}>
          {selectedTab === 'chat' && (
            <Box flexDirection="column" height="100%">
              {/* Messages */}
              <Box flexGrow={1} flexDirection="column" overflow="hidden">
                {messages.map((message, index) => (
                  <Box key={message.id} marginY={1}>
                    <Box width={15}>
                      <Text color="cyan" bold>{message.agent}</Text>
                    </Box>
                    <Box flexGrow={1}>
                      <Text 
                        color={message.type === 'system' ? 'gray' : 'white'}
                        wrap="wrap"
                      >
                        {message.content}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Input Area */}
              {showInput && (
                <Box borderStyle="round" borderColor="green" padding={1}>
                  <Text color="green">💬 Message: </Text>
                  <TextInput
                    value={currentInput}
                    onChange={setCurrentInput}
                    onSubmit={() => {
                      // Handle message input
                      setCurrentInput('');
                      setShowInput(false);
                    }}
                  />
                </Box>
              )}

              {showInterjectionInput && (
                <Box borderStyle="round" borderColor="yellow" padding={1}>
                  <Text color="yellow">💡 Interjection: </Text>
                  <TextInput
                    value={interjectionText}
                    onChange={setInterjectionText}
                    onSubmit={handleInterjectionSubmit}
                  />
                </Box>
              )}
            </Box>
          )}

          {selectedTab === 'logs' && (
            <Box flexDirection="column" height="100%">
              <Text bold color="blue">📋 Live Logs</Text>
              <Divider />
              {logs.map((log, index) => (
                <Box key={log.id} marginY={1}>
                  <Text color="gray" dimColor>[{log.timestamp.toLocaleTimeString()}]</Text>
                  <Text color={log.level === 'error' ? 'red' : log.level === 'warning' ? 'yellow' : 'green'}>
                    [{log.level.toUpperCase()}]
                  </Text>
                  <Text color="cyan">[{log.category}]</Text>
                  <Text> {log.message}</Text>
                </Box>
              ))}
            </Box>
          )}

          {selectedTab === 'stats' && (
            <Box flexDirection="column" height="100%">
              <Text bold color="blue">📊 Session Statistics</Text>
              <Divider />
              {stats ? (
                <Box flexDirection="column">
                  <Text>Total Exchanges: <Text color="green">{stats.totalExchanges}</Text></Text>
                  <Text>Total Interjections: <Text color="yellow">{stats.totalInterjections}</Text></Text>
                  <Text>Average Response Length: <Text color="cyan">{Math.round(stats.averageResponseLength)} chars</Text></Text>
                  <Text>Total Duration: <Text color="magenta">{stats.totalDuration}ms</Text></Text>
                  <Text>Error Count: <Text color="red">{stats.errorCount}</Text></Text>
                </Box>
              ) : (
                <Text color="gray">No statistics available</Text>
              )}
            </Box>
          )}
        </Box>

        {/* Sidebar */}
        <Box width={30} borderStyle="single" borderColor="gray" padding={1}>
          <Text bold color="blue">Controls</Text>
          <Divider />
          <Text color="gray">ESC - Exit</Text>
          <Text color="gray">TAB - Switch tabs</Text>
          <Text color="gray">Ctrl+P - Pause/Resume</Text>
          <Text color="gray">Ctrl+S - Stop</Text>
          <Text color="gray">Ctrl+I - Add interjection</Text>
          <Text color="gray">Ctrl+M - Send message</Text>
          
          <Divider />
          <Text bold color="blue">Session Info</Text>
          <Text>Status: <Text color={isRunning ? 'green' : 'yellow'}>{isRunning ? 'Running' : 'Paused'}</Text></Text>
          <Text>Rounds: {dialogue.getState().currentRound}</Text>
          <Text>Turn: {dialogue.getState().currentTurn || 'None'}</Text>
          <Text>Interjections: {dialogue.getState().pendingInterjections}</Text>
        </Box>
      </Box>

      {/* Footer */}
      <Box borderStyle="round" borderColor="gray" padding={1}>
        <Text color="gray">
          {selectedTab === 'chat' && '💬 Chat Mode - Real-time dialogue streaming'}
          {selectedTab === 'logs' && '📋 Logs Mode - Live system logs'}
          {selectedTab === 'stats' && '📊 Stats Mode - Session statistics'}
        </Text>
      </Box>
    </Box>
  );
}; 
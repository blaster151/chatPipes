import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';
import Divider from 'ink-divider';
import { SessionManager, SessionState } from '@chatpipes/ai-conductor';

interface SessionMonitorProps {
  sessionManager: SessionManager;
  onExit: () => void;
}

export const SessionMonitor: React.FC<SessionMonitorProps> = ({ sessionManager, onExit }) => {
  const [sessions, setSessions] = useState<SessionState[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionState | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const { exit } = useApp();

  // Refresh sessions periodically
  useEffect(() => {
    const refreshSessions = () => {
      const allSessions = sessionManager.getAllSessions();
      setSessions(allSessions);
    };

    refreshSessions();
    const interval = setInterval(refreshSessions, refreshInterval);

    return () => clearInterval(interval);
  }, [sessionManager, refreshInterval]);

  // Handle input
  useInput((input, key) => {
    if (key.escape) {
      exit();
      onExit();
    }

    if (key.upArrow) {
      if (selectedSession) {
        const currentIndex = sessions.findIndex(s => s.id === selectedSession.id);
        const newIndex = Math.max(0, currentIndex - 1);
        setSelectedSession(sessions[newIndex]);
      } else if (sessions.length > 0) {
        setSelectedSession(sessions[0]);
      }
    }

    if (key.downArrow) {
      if (selectedSession) {
        const currentIndex = sessions.findIndex(s => s.id === selectedSession.id);
        const newIndex = Math.min(sessions.length - 1, currentIndex + 1);
        setSelectedSession(sessions[newIndex]);
      } else if (sessions.length > 0) {
        setSelectedSession(sessions[0]);
      }
    }

    if (key.return && selectedSession) {
      // Toggle session selection
      setSelectedSession(null);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'paused': return 'yellow';
      case 'completed': return 'blue';
      case 'error': return 'red';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'paused': return '🟡';
      case 'completed': return '🔵';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <Box flexDirection="column" height={process.stdout.rows - 2}>
      {/* Header */}
      <Box borderStyle="round" borderColor="blue" padding={1}>
        <Gradient name="rainbow">
          <Text bold>📊 Session Monitor</Text>
        </Gradient>
        <Box marginLeft="auto">
          <Text color="gray">
            <Spinner type="dots" /> Auto-refresh every {refreshInterval / 1000}s
          </Text>
        </Box>
      </Box>

      {/* Main Content */}
      <Box flexGrow={1} borderStyle="single" borderColor="gray" flexDirection="row">
        {/* Sessions List */}
        <Box width="50%" flexDirection="column" padding={1}>
          <Text bold color="blue">📋 Sessions ({sessions.length})</Text>
          <Divider />
          
          {sessions.length === 0 ? (
            <Box padding={2}>
              <Text color="gray">No sessions found</Text>
            </Box>
          ) : (
            <Box flexDirection="column">
              {sessions.map((session, index) => (
                <Box 
                  key={session.id}
                  borderStyle={selectedSession?.id === session.id ? 'round' : undefined}
                  borderColor={selectedSession?.id === session.id ? 'blue' : undefined}
                  padding={1}
                  marginY={1}
                >
                  <Box flexDirection="column" flexGrow={1}>
                    <Box>
                      <Text color={getStatusColor(session.status)}>
                        {getStatusIcon(session.status)}
                      </Text>
                      <Text bold color="white"> {session.name}</Text>
                    </Box>
                    <Text color="gray" dimColor>ID: {session.id.substring(0, 8)}...</Text>
                    <Text color="gray" dimColor>Type: {session.type}</Text>
                    <Text color="gray" dimColor>
                      Created: {session.createdAt.toLocaleDateString()}
                    </Text>
                    <Text color="gray" dimColor>
                      Exchanges: {session.exchanges.length} | Interjections: {session.interjections.length}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>

        {/* Session Details */}
        <Box width="50%" flexDirection="column" padding={1} borderStyle="single" borderColor="gray">
          <Text bold color="blue">📄 Session Details</Text>
          <Divider />
          
          {selectedSession ? (
            <Box flexDirection="column">
              <Text bold color="white">{selectedSession.name}</Text>
              <Text color="gray">ID: {selectedSession.id}</Text>
              <Text color="gray">Type: {selectedSession.type}</Text>
              <Text color="gray">Status: <Text color={getStatusColor(selectedSession.status)}>{selectedSession.status}</Text></Text>
              <Text color="gray">Created: {selectedSession.createdAt.toLocaleString()}</Text>
              <Text color="gray">Updated: {selectedSession.updatedAt.toLocaleString()}</Text>
              
              <Divider />
              <Text bold color="blue">Agents ({selectedSession.agents.length})</Text>
              {selectedSession.agents.map((agent, index) => (
                <Box key={agent.id} marginY={1}>
                  <Text color="cyan">{agent.name}</Text>
                  <Text color="gray"> ({agent.platform})</Text>
                  <Text color={agent.isActive ? 'green' : 'red'}>
                    {agent.isActive ? ' ●' : ' ○'}
                  </Text>
                </Box>
              ))}
              
              <Divider />
              <Text bold color="blue">Configuration</Text>
              <Text color="gray">Max Rounds: {selectedSession.config.maxRounds || 'Unlimited'}</Text>
              <Text color="gray">Turn Delay: {selectedSession.config.turnDelay || 'None'}ms</Text>
              <Text color="gray">Streaming: {selectedSession.config.enableStreaming ? 'Enabled' : 'Disabled'}</Text>
              {selectedSession.config.synthesisStrategy && (
                <Text color="gray">Strategy: {selectedSession.config.synthesisStrategy}</Text>
              )}
              
              <Divider />
              <Text bold color="blue">Statistics</Text>
              {selectedSession.metadata ? (
                <Box flexDirection="column">
                  <Text color="gray">Total Tokens: {selectedSession.metadata.totalTokens || 0}</Text>
                  <Text color="gray">Total Duration: {selectedSession.metadata.totalDuration || 0}ms</Text>
                  <Text color="gray">Avg Response Time: {selectedSession.metadata.averageResponseTime || 0}ms</Text>
                  <Text color="gray">Error Count: {selectedSession.metadata.errorCount || 0}</Text>
                </Box>
              ) : (
                <Text color="gray">No statistics available</Text>
              )}
              
              <Divider />
              <Text bold color="blue">Recent Exchanges</Text>
              {selectedSession.exchanges.slice(-3).map((exchange, index) => (
                <Box key={exchange.id} marginY={1} flexDirection="column">
                  <Text color="cyan">{exchange.from} → {exchange.to}</Text>
                  <Text color="gray" dimColor>Round {exchange.round} - {exchange.timestamp.toLocaleTimeString()}</Text>
                  <Text color="white" wrap="wrap">{exchange.response.substring(0, 100)}...</Text>
                </Box>
              ))}
            </Box>
          ) : (
            <Box padding={2}>
              <Text color="gray">Select a session to view details</Text>
            </Box>
          )}
        </Box>
      </Box>

      {/* Footer */}
      <Box borderStyle="round" borderColor="gray" padding={1}>
        <Text color="gray">
          ↑↓ Navigate | Enter Select | ESC Exit | Auto-refresh: {refreshInterval / 1000}s
        </Text>
      </Box>
    </Box>
  );
}; 
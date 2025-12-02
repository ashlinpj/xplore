import { useState, useCallback, useEffect } from 'react';
import {
  LiveKitRoom,
  useVoiceAssistant,
  BarVisualizer,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  useConnectionState,
  useMaybeRoomContext,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { Mic, MicOff, Phone, PhoneOff, Bot, Loader2, Volume2, X } from 'lucide-react';
import { Button } from './ui/Button';
import { getApiUrl } from '../lib/api';

// Connection state component
function ConnectionStatus() {
  const connectionState = useConnectionState();
  
  const statusColors = {
    disconnected: 'bg-gray-500',
    connecting: 'bg-yellow-500',
    connected: 'bg-green-500',
    reconnecting: 'bg-yellow-500',
  };
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-2 h-2 rounded-full ${statusColors[connectionState]} animate-pulse`} />
      <span className="text-muted-foreground capitalize">{connectionState}</span>
    </div>
  );
}

// Voice assistant visualizer component
function VoiceVisualizer() {
  const { state, audioTrack, agentTranscriptions, agentAudioTrack } = useVoiceAssistant();
  
  return (
    <div className="flex flex-col items-center gap-4">
      {/* Agent state indicator */}
      <div className="text-center">
        <div className={`text-sm font-medium ${
          state === 'listening' ? 'text-green-400' :
          state === 'thinking' ? 'text-yellow-400' :
          state === 'speaking' ? 'text-primary' :
          'text-muted-foreground'
        }`}>
          {state === 'listening' && '🎤 Listening...'}
          {state === 'thinking' && '🤔 Thinking...'}
          {state === 'speaking' && '🗣️ Speaking...'}
          {state === 'idle' && '💤 Ready'}
          {state === 'connecting' && '⏳ Connecting...'}
        </div>
      </div>
      
      {/* Audio visualizer */}
      <div className="w-full h-24 bg-muted/30 rounded-lg overflow-hidden flex items-center justify-center">
        {agentAudioTrack ? (
          <BarVisualizer
            state={state}
            trackRef={agentAudioTrack}
            barCount={12}
            options={{ 
              minHeight: 4,
            }}
            className="w-full h-full"
          />
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Volume2 className="w-5 h-5" />
            <span>Waiting for agent...</span>
          </div>
        )}
      </div>
      
      {/* Recent transcription */}
      {agentTranscriptions && agentTranscriptions.length > 0 && (
        <div className="w-full max-h-32 overflow-y-auto bg-muted/20 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">
            {agentTranscriptions[agentTranscriptions.length - 1]?.text}
          </p>
        </div>
      )}
    </div>
  );
}

// Main room content
function RoomContent({ onDisconnect }) {
  const room = useMaybeRoomContext();
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <ConnectionStatus />
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onDisconnect}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
        >
          <PhoneOff className="w-4 h-4 mr-2" />
          End Call
        </Button>
      </div>
      
      <VoiceVisualizer />
      
      <VoiceAssistantControlBar 
        controls={{ 
          microphone: true, 
          leave: false 
        }}
        className="bg-muted/30 rounded-lg p-2"
      />
      
      <RoomAudioRenderer />
    </div>
  );
}

// Main Voice Assistant Component
export function VoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [error, setError] = useState(null);

  const connectToRoom = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Generate a unique room name
      const roomName = `xplore-ai-${Date.now()}`;
      const participantName = `user-${Math.random().toString(36).substring(7)}`;
      
      // Get token from server
      const response = await fetch(getApiUrl('/api/livekit/token'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, participantName })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to connect');
      }
      
      const data = await response.json();
      
      setConnectionDetails({
        url: data.url,
        token: data.token,
        roomName: data.roomName
      });
      
    } catch (err) {
      console.error('Connection error:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    setConnectionDetails(null);
    setIsOpen(false);
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    connectToRoom();
  }, [connectToRoom]);

  // Floating action button when closed
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-primary hover:bg-primary/90 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
        title="Talk to XPLORE AI"
      >
        <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-10 right-0 bg-card text-foreground text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Talk to AI
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-card border border-white/10 rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-primary/10 border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">XPLORE AI</h3>
              <p className="text-xs text-muted-foreground">Tech News Assistant</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsOpen(false)}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={connectToRoom}
              className="mt-2 text-xs"
            >
              Try Again
            </Button>
          </div>
        )}
        
        {isConnecting && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Connecting to AI assistant...</p>
          </div>
        )}
        
        {connectionDetails && !isConnecting && (
          <LiveKitRoom
            serverUrl={connectionDetails.url}
            token={connectionDetails.token}
            connect={true}
            audio={true}
            video={false}
            options={{
              disconnectOnPageLeave: false,
              adaptiveStream: false,
            }}
            onDisconnected={(reason) => {
              console.log('Disconnected from room, reason:', reason);
              // Only clear connection if not a temporary disconnect
              if (reason !== 'DUPLICATE_IDENTITY') {
                setError('Disconnected: ' + (reason || 'Connection lost'));
              }
              setConnectionDetails(null);
            }}
            onError={(err) => {
              console.error('LiveKit error:', err);
              setError(err.message || 'Connection failed');
              setConnectionDetails(null);
            }}
            onMediaDeviceFailure={(failure) => {
              console.error('Media device failure:', failure);
              setError('Microphone access failed. Please allow microphone permissions.');
            }}
          >
            <RoomContent onDisconnect={handleDisconnect} />
          </LiveKitRoom>
        )}
        
        {!connectionDetails && !isConnecting && !error && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Ask me about the latest tech news, AI developments, space exploration, and more!
              </p>
            </div>
            <Button 
              onClick={connectToRoom} 
              className="bg-primary text-black hover:bg-primary/90"
            >
              <Phone className="w-4 h-4 mr-2" />
              Start Conversation
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceAssistant;

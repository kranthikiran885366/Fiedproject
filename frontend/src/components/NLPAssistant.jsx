import React, { useState, useEffect } from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

function NLPAssistant() {
  const [command, setCommand] = useState('');
  const { transcript, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    setCommand(transcript);
  }, [transcript]);

  const handleVoiceCommand = () => {
    if (!SpeechRecognition.browserSupportsSpeechRecognition()) {
      alert('Your browser does not support speech recognition.');
      return;
    }
    SpeechRecognition.startListening({ continuous: false, language: 'en-US' });
  };

  const processCommand = () => {
    alert(`Processing command: ${command}`);
    console.log("Detected Command:", command);
    
    // Convert command to lowercase and trim whitespace
    const lowerCommand = command.toLowerCase().trim();
    
    // Check for variations of "start attendance" including common misspellings
    const attendanceCommands = [
      "start attendance", "begin attendance", "take attendance", "open attendance session",
      "start attendence", "take attendence" // Handling common spelling mistakes
    ];
    
    if (attendanceCommands.some(cmd => lowerCommand.includes(cmd))) {
      window.open('http://localhost:3001/attendance-session', '_blank');
    }
    
    resetTranscript();
  };

  return (
    <div>
      <h2>NLP Voice Assistant</h2>
      <input 
        type="text" 
        placeholder="Speak or type a command..." 
        value={command} 
        onChange={(e) => setCommand(e.target.value)} 
      />
      <button onClick={handleVoiceCommand}>Start Voice Command</button>
      <button onClick={processCommand}>Execute Command</button>
    </div>
  );
}

export default NLPAssistant;

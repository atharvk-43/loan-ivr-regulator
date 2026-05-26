/**
 * @fileoverview CallSimulator component.
 * Provides a beautifully designed in-browser voice and key dial call simulator.
 * reuses existing TwiML webhooks, simulates actual DTMF tones,
 * speaks IVR instructions using browser TTS, transcribes user responses using browser SpeechRecognition,
 * and handles fallback manual typing, with real-time AI summary generation and feedback.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlinePhone,
  HiOutlinePhoneXMark,
  HiOutlineMicrophone,
  HiOutlineChatBubbleLeftRight,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
  HiOutlineSparkles,
  HiXMark,
} from 'react-icons/hi2';

const CallSimulator = () => {
  const {
    isCallSimulatorOpen,
    setIsCallSimulatorOpen,
    activeSimulatorCustomer,
    setActiveSimulatorCustomer,
    triggerCallFinished,
  } = useApp();

  if (!isCallSimulatorOpen || !activeSimulatorCustomer) return null;

  // Simulator Call States
  const [callState, setCallState] = useState('dialing'); // 'dialing', 'ringing', 'connected', 'disconnecting', 'completed', 'failed'
  const [callSid] = useState(() => `sim_${Math.random().toString(36).substring(2, 11)}`);
  const [messages, setMessages] = useState([]); // [{ role: 'system' | 'customer', text: '...' }]
  const [speechInput, setSpeechInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isBotSpeaking, setIsBotSpeaking] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('keypad'); // 'keypad', 'transcript', 'ai'
  const [callDuration, setCallDuration] = useState(0);
  const [aiSummaryResult, setAiSummaryResult] = useState(null);
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);

  // XML / Twilio flow states
  const [nextActionUrl, setNextActionUrl] = useState(null);
  const [gatherSettings, setGatherSettings] = useState(null); // { input: 'dtmf speech', numDigits: 1 }
  const [currentTwiXml, setCurrentTwiXml] = useState('');

  // Speech and Audio references
  const durationIntervalRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthesisUtteranceRef = useRef(null);
  const messageEndRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Duration Timer
  useEffect(() => {
    if (callState === 'connected') {
      durationIntervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
    return () => {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
    };
  }, [callState]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSpeechInput(transcript);
        handleSpeechSubmit(transcript);
      };

      rec.onerror = (event) => {
        console.error('Speech Recognition Error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please type your reply.');
        }
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Stop any active speech/listening when closing or unmounting
  useEffect(() => {
    return () => {
      stopTTS();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Start the call flow
  useEffect(() => {
    const startSequence = async () => {
      setCallState('dialing');
      playRingTone();

      // Ringing delay
      setTimeout(async () => {
        setCallState('ringing');
        
        setTimeout(async () => {
          try {
            // Trigger /api/webhooks/voice (CORS friendly)
            const response = await api.post(
              `/webhooks/voice?customerId=${activeSimulatorCustomer._id}`,
              { CallSid: callSid }
            );
            
            setCallState('connected');
            processTwiML(response.data);
          } catch (err) {
            console.error('Failed to contact voice webhook:', err);
            setCallState('failed');
            toast.error('Simulation connection failed.');
          }
        }, 1500);
      }, 1500);
    };

    startSequence();
  }, [activeSimulatorCustomer]);

  // Synthesize realistic telephone DTMF tones
  const playDTMF = (digit) => {
    const dtmfFrequencies = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
    };
    
    if (!dtmfFrequencies[digit]) return;
    
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc1.frequency.value = dtmfFrequencies[digit][0];
      osc2.frequency.value = dtmfFrequencies[digit][1];
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.02);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.15);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
      
      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(audioCtx.currentTime + 0.2);
      osc2.stop(audioCtx.currentTime + 0.2);
    } catch (err) {
      console.warn('AudioContext not supported or blocked:', err);
    }
  };

  // Play Dialing Ring Tone (Simulated)
  const playRingTone = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = 440; // Ring frequency
      
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime + 0.8);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.0);
      
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 1.0);
    } catch (e) {}
  };

  // Stop current bot text-to-speech
  const stopTTS = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsBotSpeaking(false);
  };

  // Run Text-to-Speech (TTS)
  const speakText = (text, onFinish) => {
    stopTTS();
    if (!window.speechSynthesis) {
      if (onFinish) onFinish();
      return;
    }

    // Scrub text of HTML elements or special characters
    const cleanText = text.replace(/<[^>]*>/g, '').trim();
    if (!cleanText) {
      if (onFinish) onFinish();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Choose a premium sounding English female voice if available
    const voices = window.speechSynthesis.getVoices();
    const premiumVoice = voices.find(v => 
      v.lang.startsWith('en') && 
      (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Zira'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (premiumVoice) {
      utterance.voice = premiumVoice;
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      setIsBotSpeaking(true);
    };

    utterance.onend = () => {
      setIsBotSpeaking(false);
      if (onFinish) onFinish();
    };

    utterance.onerror = (e) => {
      console.error('Speech Synthesis Error:', e);
      setIsBotSpeaking(false);
      if (onFinish) onFinish();
    };

    synthesisUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Parse TwiML XML Response
  const processTwiML = (xmlString) => {
    setCurrentTwiXml(xmlString);
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      // Parse <Say> Elements
      const sayElements = xmlDoc.getElementsByTagName('Say');
      let combinedSpeechText = '';
      for (let i = 0; i < sayElements.length; i++) {
        combinedSpeechText += sayElements[i].textContent + ' ';
      }
      combinedSpeechText = combinedSpeechText.trim();

      // Parse <Gather> Parameters
      const gatherElements = xmlDoc.getElementsByTagName('Gather');
      const isGatherActive = gatherElements.length > 0;
      const hangupElements = xmlDoc.getElementsByTagName('Hangup');
      let gatherInput = '';
      let gatherDigits = 1;
      
      if (isGatherActive) {
        const gatherNode = gatherElements[0];
        const action = gatherNode.getAttribute('action');
        const input = gatherNode.getAttribute('input') || 'dtmf';
        const numDigits = parseInt(gatherNode.getAttribute('numDigits') || '1', 10);
        
        gatherInput = input;
        gatherDigits = numDigits;
        
        // Strip backend domain and isolate endpoint relative path (removing duplicate /api prefix)
        const cleanedAction = action.replace(/^https?:\/\/[^/]+/i, '').replace(/^\/api/i, '');

        setNextActionUrl(cleanedAction);
        setGatherSettings({ input, numDigits });

        // If Say is inside Gather
        const gatherSayElements = gatherNode.getElementsByTagName('Say');
        if (gatherSayElements.length > 0) {
          combinedSpeechText = '';
          for (let i = 0; i < gatherSayElements.length; i++) {
            combinedSpeechText += gatherSayElements[i].textContent + ' ';
          }
          combinedSpeechText = combinedSpeechText.trim();
        }
      } else {
        setNextActionUrl(null);
        setGatherSettings(null);
      }

      // Append System Message
      if (combinedSpeechText) {
        setMessages((prev) => [...prev, { role: 'system', text: combinedSpeechText }]);
        
        // Speak out system message
        speakText(combinedSpeechText, () => {
          // Once speech ends, trigger microphone listening automatically if "speech" is allowed
          if (isGatherActive && gatherInput.includes('speech') && recognitionRef.current) {
            startMicrophoneListening();
          } else if (!isGatherActive && hangupElements.length > 0) {
            // Automatically hang up after speech completes if there is a hangup and no active gather
            setTimeout(() => {
              handleHangUp();
            }, 1500);
          }
        });
      } else {
        // If there's no speech and no active gather, hang up immediately
        if (!isGatherActive && hangupElements.length > 0) {
          handleHangUp();
        }
      }

    } catch (err) {
      console.error('TwiML Parse Error:', err);
      toast.error('Error processing voice dial parameters.');
    }
  };

  // Start browser speech recognizer
  const startMicrophoneListening = () => {
    stopTTS();
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Stop browser speech recognizer
  const stopMicrophoneListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  // Submit voice replies or manual text typing
  const handleSpeechSubmit = async (textToSubmit) => {
    const speechVal = textToSubmit || speechInput;
    if (!speechVal.trim() || !nextActionUrl) return;

    // Log customer reply
    setMessages((prev) => [...prev, { role: 'customer', text: speechVal }]);
    setSpeechInput('');
    stopMicrophoneListening();

    try {
      // POST user response back to backend /gather webhook
      const response = await api.post(nextActionUrl, {
        CallSid: callSid,
        SpeechResult: speechVal,
      });

      processTwiML(response.data);
    } catch (err) {
      console.error('Gather response submit failed:', err);
      toast.error('Simulation gather reply failed.');
    }
  };

  // Submit DTMF keypad digits
  const handleKeypadPress = async (digit) => {
    playDTMF(digit);
    if (isBotSpeaking) stopTTS();

    // Log keypress
    setMessages((prev) => [...prev, { role: 'customer', text: `[Keypad Press: ${digit}]` }]);

    if (!nextActionUrl) return;

    try {
      // POST keypad digit back to backend /gather webhook
      const response = await api.post(nextActionUrl, {
        CallSid: callSid,
        Digits: digit,
      });

      processTwiML(response.data);
    } catch (err) {
      console.error('Keypad submit failed:', err);
      toast.error('Simulation DTMF reply failed.');
    }
  };

  // Hang Up call sequence
  const handleHangUp = async () => {
    stopTTS();
    stopMicrophoneListening();
    setCallState('disconnecting');

    try {
      // Fire Twilio Status Webhook trigger
      await api.post(`/webhooks/status?customerId=${activeSimulatorCustomer._id}`, {
        CallSid: callSid,
        CallStatus: 'completed',
        CallDuration: callDuration.toString(),
      });

      setCallState('completed');
      toast.success('Call completed successfully!');
      triggerCallFinished();

      // Trigger AI Summary Fetch pipeline
      fetchAiSummary();
    } catch (err) {
      console.error('Failed to finalize call status:', err);
      setCallState('failed');
      toast.error('Failed to complete simulation pipeline.');
    }
  };

  // Polls MongoDB to retrieve Gemini compiled call summary
  const fetchAiSummary = async () => {
    setIsGeneratingAiSummary(true);
    setActiveTab('ai');
    
    // Poll backend every 2 seconds (up to 6 times) to give Gemini API time to analyze
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await api.get(`/customers/${activeSimulatorCustomer._id}`);
        const customerProfile = response.data.customer;

        if (customerProfile && customerProfile.aiSummary && customerProfile.aiSummary.summary) {
          setAiSummaryResult(customerProfile.aiSummary);
          setIsGeneratingAiSummary(false);
          clearInterval(interval);
          toast.success('🤖 AI Summary generated by Gemini!');
        }
      } catch (err) {
        console.error('AI summary polling failed:', err);
      }

      if (attempts >= 10) {
        setIsGeneratingAiSummary(false);
        clearInterval(interval);
        toast.error('AI Summary is taking longer to compile. View details on customer profile.');
      }
    }, 2000);
  };

  const closeSimulator = () => {
    setIsCallSimulatorOpen(false);
    setActiveSimulatorCustomer(null);
  };

  // Sentiment badge colors
  const getSentimentColor = (sent) => {
    const raw = sent ? sent.toLowerCase() : 'unknown';
    if (raw.includes('positive') || raw.includes('cooperative')) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    if (raw.includes('hostile') || raw.includes('negative')) return 'bg-red-500/10 border-red-500/20 text-red-400';
    return 'bg-white/[0.04] border-white/[0.08] text-brand-textSecondary';
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
        isCollapsed ? 'w-80 h-16' : 'w-[360px] h-[520px]'
      } glass-panel border border-brand-primary/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden bg-gradient-to-b from-[#0e0e2e]/95 to-[#08081f]/98 text-xs select-none`}
      style={{ boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(79, 70, 229, 0.15)' }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.06] bg-white/[0.01]">
        <div className="flex items-center gap-3">
          {/* Animated Dialing Ring Indicator */}
          {['dialing', 'ringing'].includes(callState) ? (
            <div className="relative w-7.5 h-7.5 bg-brand-primary/10 border border-brand-primary/30 rounded-xl flex items-center justify-center animate-pulse">
              <HiOutlinePhone className="w-4 h-4 text-brand-primary animate-bounce" />
            </div>
          ) : callState === 'connected' ? (
            <div className="relative w-7.5 h-7.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center">
              <span className="absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
              <HiOutlinePhone className="w-4 h-4 text-emerald-400 animate-pulse" />
            </div>
          ) : (
            <div className="w-7.5 h-7.5 bg-white/[0.03] border border-white/[0.08] rounded-xl flex items-center justify-center">
              <HiOutlinePhoneXMark className="w-4 h-4 text-brand-textSecondary" />
            </div>
          )}

          <div>
            <h4 className="font-extrabold text-brand-textPrimary text-[13px] tracking-tight truncate max-w-[160px]">
              {activeSimulatorCustomer.name}
            </h4>
            <div className="text-[10px] text-brand-textSecondary font-semibold mt-0.5 uppercase tracking-wider flex items-center gap-1.5">
              <span>{activeSimulatorCustomer.loanId}</span>
              {callState === 'connected' && (
                <span className="text-emerald-400 font-mono">
                  ({Math.floor(callDuration / 60)}:{(callDuration % 60).toString().padStart(2, '0')})
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Collapse Trigger */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-white/[0.04] text-brand-textSecondary hover:text-brand-textPrimary transition-all"
          >
            {isCollapsed ? <HiOutlineChevronUp className="w-4 h-4" /> : <HiOutlineChevronDown className="w-4 h-4" />}
          </button>
          
          {/* Close Trigger */}
          {['completed', 'failed'].includes(callState) && (
            <button
              onClick={closeSimulator}
              className="p-1.5 rounded-lg hover:bg-red-500/10 text-brand-textSecondary hover:text-red-400 transition-all"
            >
              <HiXMark className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main body (Hidden when collapsed) */}
      {!isCollapsed && (
        <>
          {/* Navigation Tabs */}
          <div className="flex border-b border-white/[0.04] bg-white/[0.01]">
            <button
              onClick={() => setActiveTab('keypad')}
              disabled={['completed', 'failed'].includes(callState)}
              className={`flex-1 py-3 text-center font-bold tracking-wide border-b-2 transition-all ${
                activeTab === 'keypad'
                  ? 'border-brand-primary text-brand-textPrimary'
                  : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
            >
              Dial Pad
            </button>
            <button
              onClick={() => setActiveTab('transcript')}
              className={`flex-1 py-3 text-center font-bold tracking-wide border-b-2 transition-all ${
                activeTab === 'transcript'
                  ? 'border-brand-primary text-brand-textPrimary'
                  : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary'
              }`}
            >
              Transcript ({messages.length})
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              disabled={!aiSummaryResult && !isGeneratingAiSummary}
              className={`flex-1 py-3 text-center font-bold tracking-wide border-b-2 transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'ai'
                  ? 'border-brand-primary text-brand-textPrimary'
                  : 'border-transparent text-brand-textSecondary hover:text-brand-textPrimary disabled:opacity-30 disabled:cursor-not-allowed'
              }`}
            >
              <HiOutlineSparkles className="w-3.5 h-3.5 text-brand-primary" />
              Gemini Synthesis
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-5 min-h-0 flex flex-col justify-between">
            {activeTab === 'keypad' && (
              <div className="flex-1 flex flex-col justify-between h-full">
                {/* Visual Status card */}
                <div className="glass-panel p-4 border border-white/[0.04] rounded-2xl flex flex-col items-center justify-center text-center bg-white/[0.01] mb-4">
                  {callState === 'dialing' && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider text-brand-textSecondary font-bold mb-1">
                        Outbound Routing Sequence
                      </p>
                      <h4 className="text-sm font-extrabold text-brand-textPrimary animate-pulse">
                        Establishing virtual dial...
                      </h4>
                    </>
                  )}
                  {callState === 'ringing' && (
                    <>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold mb-1">
                        Line Ringing
                      </p>
                      <h4 className="text-sm font-extrabold text-brand-textPrimary animate-pulse">
                        Waiting for customer pick up...
                      </h4>
                    </>
                  )}
                  {callState === 'connected' && (
                    <div className="w-full space-y-2">
                      <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-extrabold mb-1">
                        Secure Connection Active
                      </p>
                      <div className="h-10 overflow-y-auto pr-1 text-center font-semibold text-brand-textPrimary text-xs leading-relaxed max-h-[50px]">
                        {messages[messages.length - 1]?.role === 'system' ? (
                          <span className="text-brand-primary">🤖 Bot speaking: "{messages[messages.length - 1]?.text}"</span>
                        ) : messages[messages.length - 1]?.role === 'customer' ? (
                          <span className="text-emerald-400">👤 You: {messages[messages.length - 1]?.text}</span>
                        ) : (
                          <span className="text-brand-textSecondary">Listening for prompts...</span>
                        )}
                      </div>
                      
                      {/* Premium Soundwave Indicator */}
                      <div className="flex justify-center items-center gap-1.5 h-6 mt-1">
                        {isBotSpeaking ? (
                          // Speaking waves
                          [1, 2, 3, 4, 5, 6].map((i) => (
                            <span
                              key={i}
                              className="w-1 bg-brand-primary rounded-full animate-pulse"
                              style={{
                                height: `${Math.random() * 16 + 4}px`,
                                animationDuration: `${Math.random() * 0.4 + 0.2}s`
                              }}
                            />
                          ))
                        ) : isListening ? (
                          // Listening waves
                          [1, 2, 3, 4, 5, 6].map((i) => (
                            <span
                              key={i}
                              className="w-1 bg-emerald-400 rounded-full animate-pulse"
                              style={{
                                height: `${Math.random() * 16 + 4}px`,
                                animationDuration: `${Math.random() * 0.4 + 0.2}s`
                              }}
                            />
                          ))
                        ) : (
                          // Idle line
                          [1, 2, 3, 4, 5, 6].map((i) => (
                            <span key={i} className="w-1 h-1 bg-white/20 rounded-full" />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                  {callState === 'disconnecting' && (
                    <h4 className="text-sm font-extrabold text-red-400 animate-pulse">
                      Hanging up line...
                    </h4>
                  )}
                  {callState === 'completed' && (
                    <div className="py-2">
                      <h4 className="text-sm font-extrabold text-emerald-400">
                        Line Disconnected Successfully
                      </h4>
                      <p className="text-[10px] text-brand-textSecondary mt-1 leading-relaxed">
                        IVR conversation logged. Summary compilation initialized.
                      </p>
                    </div>
                  )}
                </div>

                {/* Keypad Grid */}
                <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto w-full mb-4">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
                    <button
                      key={digit}
                      onClick={() => handleKeypadPress(digit)}
                      disabled={callState !== 'connected'}
                      className="w-11.5 h-11.5 rounded-full flex flex-col justify-center items-center border border-white/[0.04] bg-white/[0.02] hover:bg-brand-primary/10 hover:border-brand-primary/20 text-brand-textPrimary font-extrabold disabled:opacity-20 disabled:cursor-not-allowed hover:scale-105 transition-all text-sm"
                    >
                      {digit}
                    </button>
                  ))}
                </div>

                {/* Simulated Dialer Triggers */}
                <div className="flex items-center justify-center gap-6 border-t border-white/[0.04] pt-4">
                  {callState === 'connected' ? (
                    <button
                      onClick={handleHangUp}
                      className="w-11 h-11 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center shadow-lg hover:shadow-red-500/20 hover:scale-105 transition-all"
                      title="End Call Sequence"
                    >
                      <HiOutlinePhoneXMark className="w-5 h-5 text-white" />
                    </button>
                  ) : ['completed', 'failed'].includes(callState) ? (
                    <button
                      onClick={closeSimulator}
                      className="btn-secondary text-xs py-2 px-5 font-bold"
                    >
                      Dismiss Simulator
                    </button>
                  ) : (
                    <span className="text-[10px] uppercase font-bold tracking-widest text-brand-textSecondary animate-pulse">
                      Simulating voice routing...
                    </span>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'transcript' && (
              <div className="flex-grow flex flex-col justify-between h-full min-h-0">
                {/* Transcript Scroll Area */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3.5 pr-1 min-h-[220px] max-h-[260px]">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center py-12 text-brand-textSecondary">
                      <p>Ringing connection... Conversation log will compile here live.</p>
                    </div>
                  ) : (
                    messages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col ${
                          msg.role === 'system' ? 'items-start' : 'items-end'
                        }`}
                      >
                        <span className="text-[9px] font-bold text-brand-textSecondary mb-0.5 uppercase tracking-wider">
                          {msg.role === 'system' ? '🤖 Bot Service' : '👤 Borrower (You)'}
                        </span>
                        <div
                          className={`p-3 rounded-2xl max-w-[85%] leading-relaxed font-semibold border ${
                            msg.role === 'system'
                              ? 'bg-brand-primary/10 border-brand-primary/20 text-brand-textPrimary rounded-tl-none'
                              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300 rounded-tr-none'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                  <div ref={messageEndRef} />
                </div>

                {/* Speak / Reply box */}
                {callState === 'connected' && (
                  <div className="border-t border-white/[0.04] pt-3 flex gap-2">
                    <input
                      type="text"
                      value={speechInput}
                      onChange={(e) => setSpeechInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSpeechSubmit()}
                      placeholder={
                        isListening
                          ? 'Listening... Speak into microphone.'
                          : 'Type simulated verbal response...'
                      }
                      className="glass-input flex-grow py-2 px-3 text-xs bg-[#09091f] border-white/[0.08]"
                    />

                    {/* Microphone Trigger */}
                    {recognitionRef.current && (
                      <button
                        onClick={startMicrophoneListening}
                        disabled={isListening}
                        className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                          isListening
                            ? 'bg-emerald-500/20 border-emerald-500/35 text-emerald-400 animate-pulse'
                            : 'bg-white/[0.02] border-white/[0.08] text-brand-textSecondary hover:text-brand-textPrimary'
                        }`}
                        title="Simulate speaking into mic"
                      >
                        <HiOutlineMicrophone className="w-4.5 h-4.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleSpeechSubmit()}
                      className="btn-primary text-[11px] font-bold px-3 py-1.5 rounded-xl flex items-center justify-center"
                    >
                      Say
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="flex-1 flex flex-col justify-between h-full min-h-0">
                <div className="flex-1 overflow-y-auto max-h-[300px]">
                  {isGeneratingAiSummary ? (
                    <div className="py-16 text-center space-y-3.5">
                      <div className="w-9 h-9 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mx-auto" />
                      <div>
                        <h5 className="font-extrabold text-brand-textPrimary">
                          Gemini Analyzing Conversation...
                        </h5>
                        <p className="text-[10px] text-brand-textSecondary mt-1 leading-relaxed">
                          Evaluating caller replies, promissory notes, and mapping repayments.
                        </p>
                      </div>
                    </div>
                  ) : aiSummaryResult ? (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.04]">
                        <span className="text-base">🤖</span>
                        <h4 className="font-bold text-brand-textPrimary text-xs uppercase tracking-wider">
                          Gemini Synthesis Report
                        </h4>
                      </div>

                      {/* Escalation recommendations */}
                      {aiSummaryResult.escalationRecommended && (
                        <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 font-semibold leading-relaxed">
                          ⚠️ Escalation Recommended: Action item flagged for recovery agent.
                        </div>
                      )}

                      {/* Summary quote */}
                      <p className="font-medium text-brand-textPrimary leading-relaxed text-xs italic">
                        "{aiSummaryResult.summary}"
                      </p>

                      {/* Metrics cards */}
                      <div className="grid grid-cols-2 gap-3 border-t border-white/[0.04] pt-4">
                        <div className="glass-panel p-2.5 border border-white/[0.04] rounded-xl flex flex-col">
                          <span className="text-[9px] uppercase tracking-wider text-brand-textSecondary font-bold mb-0.5">
                            Tone Sentiment
                          </span>
                          <span
                            className={`px-2 py-0.5 border rounded-full text-center mt-1 font-bold ${getSentimentColor(
                              aiSummaryResult.sentiment
                            )}`}
                          >
                            {aiSummaryResult.sentiment}
                          </span>
                        </div>

                        <div className="glass-panel p-2.5 border border-white/[0.04] rounded-xl flex flex-col">
                          <span className="text-[9px] uppercase tracking-wider text-brand-textSecondary font-bold mb-0.5">
                            Payment Likelihood
                          </span>
                          <span
                            className={`px-2 py-0.5 border rounded-full text-center mt-1 font-bold ${getSentimentColor(
                              aiSummaryResult.repaymentLikelihood
                            )}`}
                          >
                            {aiSummaryResult.repaymentLikelihood}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-center py-12 text-brand-textSecondary">
                      <p>Completed call logs are required to trigger AI synthesis.</p>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/[0.04] pt-4 flex items-center justify-end">
                  <button onClick={closeSimulator} className="btn-secondary font-bold text-xs py-2 px-5">
                    Close Dialer
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CallSimulator;

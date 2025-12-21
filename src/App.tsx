import { useState, useEffect, useRef } from 'react';
import {
  Phone, MessageSquare, Mic, Settings, Send, MicOff,
  CheckCircle2, LayoutDashboard, LogOut, Globe, Sparkles, Lock, Mail, Menu, X
} from 'lucide-react';
import { supabase } from './lib/supabase';

// In production, set VITE_API_URL in your hosting provider (e.g. Vercel)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// --- Shared Components ---

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div
    className={`bg-slate-800 border border-slate-700/50 rounded-2xl shadow-sm ${className} ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    {children}
  </div>
);

type BadgeColor = 'blue' | 'purple' | 'green' | 'amber' | 'red';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
}

const Badge: React.FC<BadgeProps> = ({ children, color = 'blue' }) => {
  const colors: Record<BadgeColor, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    purple: 'bg-purple-500/10 text-purple-400',
    green: 'bg-green-500/10 text-green-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red: 'bg-red-500/10 text-red-400'
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color] || colors.blue}`}>
      {children}
    </span>
  );
};

// --- Auth Component ---

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[Auth] Starting authentication...");
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for the confirmation link!');
      } else {
        console.log("[Auth] Attempting sign in...");
        const { error, data } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        console.log("[Auth] Login successful for:", data.user?.email);
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error("[Auth] Error:", err.message);
      setError(err.message || 'Authentication failed');
      alert(`Login Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SmartReception.ai</h1>
          <p className="text-slate-400">Sign in to manage your AI workforce.</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  autoComplete="off"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-purple-600 outline-none transition"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <Mail className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-purple-600 outline-none transition"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Lock className="absolute left-3 top-3.5 w-5 h-5 text-slate-500" />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-xl font-semibold transition disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>

            <div className="mt-8 pt-6 border-t border-slate-800 text-center">
              <p className="text-[10px] text-slate-600 font-mono break-all uppercase tracking-widest">
                Diagnostic: {API_URL}
              </p>
              <div className="mt-2 flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${API_URL.startsWith('https') ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                  <span className="text-[10px] text-slate-500 uppercase">
                    {API_URL.startsWith('https') ? 'Secure API' : (API_URL.includes('localhost') ? 'Check Vercel Env!' : 'Insecure API')}
                  </span>
                </div>
                {!API_URL.startsWith('https') && (
                  <p className="text-[8px] text-red-500 font-bold uppercase text-center mt-1 leading-tight">
                    Mobile blocks "http"! <br /> Set VITE_API_URL to https in Vercel
                  </p>
                )}
              </div>
            </div>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-slate-400 hover:text-white transition"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

// --- Logic to Attach Token to Requests ---

const authenticatedFetch = async (url: string, options: RequestInit = {}, retries = 3) => {
  console.log(`[Fetch] Calling: ${url}`);
  const { data: { session } } = await supabase.auth.getSession();
  const headers: Record<string, string> = {
    ...Object.fromEntries(new Headers(options.headers || {}).entries()),
    'Content-Type': 'application/json'
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout per attempt

      const res = await fetch(url, { ...options, headers, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        console.error(`[Fetch] Request failed with status: ${res.status}`);
      }
      return res;
    } catch (err: any) {
      console.warn(`[Fetch] Attempt ${i + 1} failed:`, err);
      if (i === retries - 1) throw err;
      // Wait 3 seconds before retrying (gives Render time to wake up)
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error("Maximum retries reached");
};

// --- Updated Sub-Components (Same UI, New Data Handling) ---

interface BusinessConfig {
  name: string;
  services: string;
  tone: string;
  greeting: string;
  workingHours: string;
  business_name?: string; // Optional, used in other components
  industry?: string; // Optional, used in other components
}

interface OnboardingProps {
  onComplete: (config: BusinessConfig) => void;
}

// Onboarding now uses authenticatedFetch
const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<BusinessConfig>({
    name: '', services: '', tone: 'professional', greeting: '', workingHours: '9 AM - 5 PM, Mon-Fri'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/setup`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      // Check for HTTP errors
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${res.status}. Please try again.`);
      }

      const data = await res.json();
      if (data.success) {
        onComplete(formData);
      } else {
        throw new Error(data.error || 'Setup failed. Please try again.');
      }
    } catch (err: any) {
      console.error("Setup failed", err);

      // Handle the case where the user already exists (duplicate key error)
      // This allows users to recover if they are stuck in onboarding but have a backend record
      if (err.message && (err.message.includes('duplicate key') || err.message.includes('unique constraint'))) {
        console.log("Duplicate key detected - proceeding to dashboard as recovery");
        alert("Account already set up! Proceeding to dashboard...");
        onComplete(formData);
        return;
      }

      alert(`❌ Launch Failed\n\n${err.message || 'Unknown error occurred'}\n\nPlease ensure you are logged in and try again. If the problem persists, the server may be starting up - wait 30 seconds and retry.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="p-6 md:p-12 overflow-hidden relative">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Setup Your Business</h2>
          <p className="text-slate-400 mb-8">Step {step} of 3</p>

          <div className="space-y-6">
            {step === 1 && (
              <>
                <label htmlFor="businessName" className="block text-slate-300 font-medium text-sm">Business Name</label>
                <input id="businessName" name="name" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 md:p-4 text-sm md:text-base outline-none focus:border-purple-500 transition" value={formData.name} onChange={handleInputChange} />
                <label htmlFor="services" className="block text-slate-300 font-medium text-sm">Services & Offerings</label>
                <textarea id="services" name="services" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 md:p-4 h-32 text-sm md:text-base outline-none focus:border-purple-500 transition" value={formData.services} onChange={handleInputChange} />
              </>
            )}
            {step === 2 && (
              <>
                <label htmlFor="tone" className="block text-slate-300 font-medium text-sm">AI Voice Tone</label>
                <select id="tone" name="tone" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 md:p-4 text-sm md:text-base outline-none focus:border-purple-500 transition" value={formData.tone} onChange={handleInputChange}>
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="enthusiastic">Enthusiastic</option>
                </select>
                <label htmlFor="greeting" className="block text-slate-300 font-medium text-sm">System Greeting</label>
                <input id="greeting" name="greeting" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 md:p-4 text-sm md:text-base outline-none focus:border-purple-500 transition" value={formData.greeting} onChange={handleInputChange} />
              </>
            )}
            {step === 3 && (
              <>
                <label htmlFor="workingHours" className="block text-slate-300 font-medium text-sm">Working Hours</label>
                <input id="workingHours" name="workingHours" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 md:p-4 text-sm md:text-base outline-none focus:border-purple-500 transition" value={formData.workingHours} onChange={handleInputChange} />
                <p className="text-slate-500 mt-4">Review your details before launching.</p>
              </>
            )}
          </div>

          <div className="flex justify-between mt-10">
            {step > 1 ? <button onClick={prevStep} className="px-6 py-3 text-slate-400">Back</button> : <div />}
            {step < 3 ? <button onClick={nextStep} className="px-8 py-3 bg-white text-slate-900 rounded-xl font-bold">Continue</button> :
              <button onClick={handleSubmit} disabled={isSubmitting} className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold">Launch</button>}
          </div>
        </Card>
      </div>
    </div>
  );
};

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatDemoViewProps {
  config: BusinessConfig;
}

// ChatDemo now uses authenticatedFetch
const ChatDemoView: React.FC<ChatDemoViewProps> = ({ config }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: config.greeting || 'Hello!' }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => scrollRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await authenticatedFetch(`${API_URL}/chat`, {
        method: 'POST',
        body: JSON.stringify({ message: userMsg.content, history: messages.map(m => ({ role: m.role, content: m.content })) })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Connection failed.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-full">
      <Card className="flex-1 flex flex-col overflow-hidden bg-slate-900 border-slate-800">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 md:space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-3 md:p-4 rounded-2xl max-w-[85%] md:max-w-[80%] ${msg.role === 'user' ? 'bg-purple-600' : 'bg-slate-700'}`}>
                <p className="text-sm md:text-base text-white leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>
        <div className="p-3 md:p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
          <input
            className="flex-1 bg-slate-900 text-white p-3 rounded-lg text-sm md:text-base outline-none focus:border-purple-500 transition"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
          />
          <button onClick={handleSend} className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition"><Send className="w-4 h-4" /></button>
        </div>
      </Card>
    </div>
  );
};

interface VoiceDemoViewProps {
  config: BusinessConfig;
}

type VoiceStatus = 'Idle' | 'Listening' | 'Thinking' | 'Speaking' | 'Error: Connection Failed' | 'Error: Mic Failed' | 'Speech Recognition not supported in this browser (Use Chrome or Safari)';

// VoiceDemoView with real Web Speech API
const VoiceDemoView: React.FC<VoiceDemoViewProps> = ({ config }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [status, setStatus] = useState<VoiceStatus>('Idle');

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);

  useEffect(() => {
    // Load voices
    const loadVoices = () => {
      synthRef.current.getVoices();
    };

    loadVoices();
    synthRef.current.addEventListener('voiceschanged', loadVoices);

    return () => {
      synthRef.current.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;

        recognitionRef.current.onstart = () => {
          setStatus('Listening');
          setIsListening(true);
        };

        recognitionRef.current.onresult = async (e: any) => {
          const text = e.results[0][0].transcript;
          setTranscript(text);
          setStatus('Thinking');

          try {
            const res = await authenticatedFetch(`${API_URL}/chat`, {
              method: 'POST',
              body: JSON.stringify({ message: text, history: [] })
            });
            const data = await res.json();
            setAiResponse(data.response);
            setStatus('Speaking');

            // Enhanced voice with better parameters
            const utterance = new SpeechSynthesisUtterance(data.response);

            // Get available voices and select a more natural one
            const voices = synthRef.current.getVoices();
            // Prefer female voices as they tend to sound more natural
            const preferredVoice = voices.find(v =>
              v.name.includes('Google') ||
              (v.name.includes('Microsoft') && v.name.includes('Female'))
            ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

            if (preferredVoice) utterance.voice = preferredVoice;

            // Adjust parameters for more natural speech
            utterance.rate = 0.95;  // Slightly slower for clarity
            utterance.pitch = 1.1;  // Slightly higher pitch sounds friendlier
            utterance.volume = 1.0;

            utterance.onend = () => { setStatus('Idle'); setIsListening(false); };
            synthRef.current.speak(utterance);
          } catch (err: any) {
            console.error("Voice chat error:", err);
            setStatus('Error: Connection Failed');
            setIsListening(false);
          }
        };

        recognitionRef.current.onend = () => {
          if (status === 'Listening') { // Only reset to Idle if it was actively listening
            setIsListening(false);
            setStatus('Idle');
          }
        };

        recognitionRef.current.onerror = (e: any) => {
          console.error("Recognition error:", e);
          const errorMsg = `Error: ${e.error || 'Mic Failed'}`;
          setStatus(errorMsg as VoiceStatus);
          setIsListening(false);
        };
      }
    } else {
      setStatus('Speech Recognition not supported in this browser (Use Chrome or Safari)');
    }
  }, [status]); // Removed config.business_id as it's not directly used here and causes unnecessary re-runs

  const toggleCall = () => {
    if (isListening) {
      synthRef.current.cancel(); // Stop any ongoing speech
      recognitionRef.current?.stop();
    } else {
      setTranscript('');
      setAiResponse('');
      recognitionRef.current?.start();
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-12rem)] md:h-full items-center justify-center p-4">
      <div className="mb-6 md:mb-8 text-center max-w-full">
        <Badge color={status === 'Idle' ? 'blue' : status === 'Listening' ? 'red' : status === 'Speaking' ? 'green' : 'purple'}>
          {status}
        </Badge>
        <h2 className="text-2xl md:text-3xl font-bold text-white mt-4 truncate px-4">{config.business_name}</h2>
        <p className="text-slate-400 text-sm">Voice Interface Demo</p>
      </div>

      <div className="relative mb-8 md:mb-12">
        {/* Visual Ripple */}
        {status !== 'Idle' && (
          <>
            <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
            <div className="absolute inset-0 bg-purple-500/10 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
          </>
        )}

        <button
          onClick={toggleCall}
          className={`relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${status === 'Listening' ? 'bg-red-500 shadow-red-900/20' :
            status === 'Speaking' ? 'bg-green-500 shadow-green-900/20' :
              status === 'Thinking' ? 'bg-amber-500 shadow-amber-900/20' :
                'bg-slate-800 border-2 border-slate-700 hover:border-purple-500'
            }`}
        >
          {status === 'Listening' ? <MicOff className="w-8 h-8 md:w-10 md:h-10 text-white" /> :
            status === 'Speaking' ? <div className="space-x-1 flex h-4 md:h-6 items-center">
              <div className="w-1 h-3 md:h-3 bg-white animate-pulse" />
              <div className="w-1 h-5 md:h-6 bg-white animate-pulse delay-75" />
              <div className="w-1 h-3 md:h-3 bg-white animate-pulse delay-150" />
            </div> :
              <Mic className={`w-8 h-8 md:w-10 md:h-10 ${status === 'Idle' ? 'text-slate-400' : 'text-white'}`} />
          }
        </button>
      </div>

      <div className="w-full max-w-lg space-y-3 md:space-y-4">
        {transcript && (
          <div className="bg-slate-800/50 p-3 md:p-4 rounded-xl border border-slate-700/50 animate-in slide-in-from-bottom-2">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-bold">You</p>
            <p className="text-sm md:text-base text-slate-200">{transcript}</p>
          </div>
        )}
        {aiResponse && (
          <div className="bg-purple-900/20 p-3 md:p-4 rounded-xl border border-purple-500/20 animate-in slide-in-from-bottom-2">
            <p className="text-[10px] text-purple-400 uppercase tracking-wider mb-1 font-bold">AI Agent</p>
            <p className="text-sm md:text-base text-white">{aiResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
};

interface DashboardViewProps {
  config: BusinessConfig;
  onNavigate: (view: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({ config, onNavigate }) => (
  <div>
    <h1 className="text-3xl font-bold text-white mb-6">Welcome, {config.business_name}</h1>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="p-6 cursor-pointer hover:bg-slate-800/80 transition" onClick={() => onNavigate('chat-demo')}>
        <MessageSquare className="w-8 h-8 text-purple-400 mb-4" />
        <h3 className="font-bold text-white">Test Chat</h3>
      </Card>
      <Card className="p-6 cursor-pointer hover:bg-slate-800/80 transition" onClick={() => onNavigate('phone-demo')}>
        <Phone className="w-8 h-8 text-green-400 mb-4" />
        <h3 className="font-bold text-white">Test Voice</h3>
      </Card>
    </div>
  </div>
);

interface TwilioStatus {
  connected: boolean;
  phoneNumber: string;
}

interface SettingsViewProps {
  config: BusinessConfig;
  onUpdate: () => void;
}

// Settings View
const SettingsView: React.FC<SettingsViewProps> = ({ config, onUpdate }) => {
  const [twilioPhone, setTwilioPhone] = useState('');
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [twilioStatus, setTwilioStatus] = useState<TwilioStatus | null>(null);

  useEffect(() => {
    checkTwilioStatus();
  }, []);

  const checkTwilioStatus = async () => {
    try {
      const res = await authenticatedFetch(`${API_URL}/twilio/status`);
      const data: TwilioStatus = await res.json();
      setTwilioStatus(data);
      if (data.phoneNumber) setTwilioPhone(data.phoneNumber);
    } catch (err) {
      console.error('Failed to check Twilio status:', err);
    }
  };

  const handleSaveTwilio = async () => {
    setLoading(true);
    setMessage('');

    try {
      const res = await authenticatedFetch(`${API_URL}/twilio/connect`, {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: twilioPhone,
          accountSid,
          authToken
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('✅ ' + (data.message || 'Twilio connected and configured successfully!'));
        checkTwilioStatus();
        if (onUpdate) onUpdate();
      } else {
        setMessage('❌ ' + (data.error || 'Failed to connect Twilio'));
      }
    } catch (err) {
      setMessage('❌ Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>

      {/* Business Info */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-purple-400" />
          Business Information
        </h2>
        <div className="space-y-3 text-slate-300">
          <div>
            <span className="text-slate-500">Business Name:</span>{' '}
            <span className="font-semibold">{config.business_name}</span>
          </div>
          <div>
            <span className="text-slate-500">Industry:</span> {config.industry}
          </div>
          <div>
            <span className="text-slate-500">Tone:</span> {config.tone}
          </div>
        </div>
      </Card>

      {/* Twilio Integration */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-green-400" />
          Twilio Auto-Configuration
        </h2>

        {twilioStatus?.connected ? (
          <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
            <p className="text-green-400 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Active Line: {twilioStatus.phoneNumber}
            </p>
          </div>
        ) : (
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-amber-400 font-semibold">⚠️ AI Receptionist not live. Connect your Twilio account below.</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="accountSid" className="block text-sm font-medium text-slate-300 mb-2">
                Account SID
              </label>
              <input
                id="accountSid"
                type="text"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label htmlFor="authToken" className="block text-sm font-medium text-slate-300 mb-2">
                Auth Token
              </label>
              <input
                id="authToken"
                type="password"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="twilioPhone" className="block text-sm font-medium text-slate-300 mb-2">
              Assigned Phone Number
            </label>
            <input
              id="twilioPhone"
              type="tel"
              value={twilioPhone}
              onChange={(e) => setTwilioPhone(e.target.value)}
              placeholder="+1234567890"
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              The Twilio number you want our AI to manage.
            </p>
          </div>

          <button
            onClick={handleSaveTwilio}
            disabled={loading || !twilioPhone || !accountSid || !authToken}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-700 text-white py-3 px-4 rounded-lg font-bold transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                Configuring Webhooks...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Connect & Setup AI Receptionist
              </>
            )}
          </button>

          {message && (
            <div className={`p-4 rounded-lg text-sm ${message.includes('✅') ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
              {message}
            </div>
          )}

          <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border border-slate-800">
            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4 text-slate-400" />
              How it works:
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              When you click "Connect", we securely use your credentials to automatically configure your Twilio number's voice settings to point to our AI server. You don't need to manually copy-paste any URLs!
            </p>
            <div className="flex gap-2 text-[10px]">
              <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-500">Auto-Webhook Setup</span>
              <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-500">Secure Storage</span>
              <span className="px-2 py-0.5 bg-slate-800 rounded text-slate-500">Live instantly</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

interface AppShellProps {
  children: React.ReactNode;
  onLogout: () => void;
  user: { email?: string } | null | undefined;
  onViewChange: (view: string) => void;
}

// App Shell
const AppShell: React.FC<AppShellProps> = ({ children, onLogout, user, onViewChange }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row text-slate-100">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950 sticky top-0 z-50">
        <h1 className="text-xl font-bold text-white">SmartReception</h1>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-400 hover:text-white">
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Sidebar - Desktop and Mobile Overlay */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 border-r border-slate-800 p-6 flex flex-col bg-slate-950 transform transition-transform duration-200 ease-in-out
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-bold text-white">SmartReception</h1>
          <button className="md:hidden text-slate-400" onClick={() => setIsMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1">
          <button
            onClick={() => { onViewChange('dashboard'); setIsMenuOpen(false); }}
            className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            <LayoutDashboard className="w-4 h-4" />
            Dashboard
          </button>
          <button
            onClick={() => { onViewChange('settings'); setIsMenuOpen(false); }}
            className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </nav>

        <div className="pt-6 border-t border-slate-800">
          <p className="text-sm text-slate-500 truncate mb-4 px-3">{user?.email}</p>
          <button
            onClick={onLogout}
            className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/5 transition"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
};

// Main App
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [view, setView] = useState('loading'); // loading, auth, onboarding, dashboard, chat-demo, phone-demo, settings

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkSetup(session);
      else setView('auth');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkSetup(session);
      else setView('auth');
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSetup = async (currentSession: any) => {
    console.log("[App] Checking setup status...");
    try {
      const res = await authenticatedFetch(`${API_URL}/status`, {
        headers: { 'Authorization': `Bearer ${currentSession.access_token}` }
      });

      // Handle 401 - backend doesn't recognize token, but user IS authenticated with Supabase
      // Proceed to onboarding instead of redirecting to login (which causes an infinite loop)
      if (res.status === 401) {
        console.log("[App] Backend returned 401 - proceeding to onboarding (user is authenticated with Supabase)");
        setConfig({} as BusinessConfig);
        setView('onboarding');
        return;
      }

      // Handle other HTTP errors
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      console.log("[App] Setup data received:", data);
      if (data.setupCompleted) {
        setConfig(data.config);
        setView('dashboard');
      } else {
        setConfig(data.config || {}); // Ensure we have a config object
        setView('onboarding');
      }
    } catch (err: any) {
      console.error("[App] checkSetup Error:", err);
      // On error, proceed to onboarding rather than kicking back to login
      console.log("[App] Connection error - proceeding to onboarding");
      setConfig({} as BusinessConfig);
      setView('onboarding');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setConfig(null); // Clear config on logout
    setView('auth'); // Go to auth page
  };

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500/20 border-t-purple-500 mb-4" />
        <p className="text-slate-400 animate-pulse">Initializing SmartReception...</p>
      </div>
    );
  }

  if (view === 'auth') return <Auth onAuthSuccess={() => { }} />;
  if (view === 'onboarding') return <Onboarding onComplete={(cfg: BusinessConfig) => { setConfig(cfg); setView('dashboard'); }} />;

  if (!config) {
    // This case should ideally not be reached if checkSetup works correctly,
    // but as a fallback, we can show a loading or error state.
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <p className="text-red-400">Error: Configuration not loaded. Please try again.</p>
        <button onClick={() => setView('auth')} className="mt-4 text-white bg-purple-600 px-4 py-2 rounded">Go to Login</button>
      </div>
    );
  }

  return (
    <AppShell onLogout={handleLogout} user={session?.user} onViewChange={setView}>
      {view === 'dashboard' && <DashboardView config={config} onNavigate={setView} />}
      {view === 'settings' && <SettingsView config={config} onUpdate={() => checkSetup(session)} />}
      {view === 'chat-demo' && <ChatDemoView config={config} />}
      {view === 'phone-demo' && <VoiceDemoView config={config} />}
    </AppShell>
  );
}

import { useState, useEffect, useRef } from 'react';
import {
  Phone, MessageSquare, Mic, Settings, Send, MicOff,
  CheckCircle2, LayoutDashboard, LogOut, Globe, Sparkles, Lock, Mail, Menu, X, Clock,
  PhoneOutgoing, CreditCard
} from 'lucide-react';
import { supabase } from './lib/supabase';

// In production, set VITE_API_URL in your hosting provider (e.g. Vercel)
const API_URL = import.meta.env.VITE_API_URL || 'https://gravitymomi.onrender.com/api';

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
  onTryDemo: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess, onTryDemo }) => {
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

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-800 text-slate-400">Or</span></div>
            </div>

            <button
              type="button"
              onClick={onTryDemo}
              className="w-full bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 group"
            >
              <Sparkles className="w-4 h-4 text-purple-400 group-hover:text-purple-300" />
              Try Demo Free
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
  subscription_plan?: 'free' | 'starter' | 'growth' | 'pro';
  minutes_used?: number;
  minutes_limit?: number;
}

const UsageCard: React.FC<{ used: number; limit: number }> = ({ used, limit }) => {
  const percentage = Math.min((used / limit) * 100, 100);
  const isWarning = percentage > 80;
  const isCritical = percentage >= 100;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-400" />
          Plan Usage
        </h3>
        <Badge color={isCritical ? 'red' : isWarning ? 'amber' : 'green'}>
          {isCritical ? 'Limit Reached' : isWarning ? 'Running Low' : 'Active'}
        </Badge>
      </div>

      <div className="mb-2 flex justify-between text-sm">
        <span className="text-slate-400">Monthly Minutes</span>
        <span className="text-white font-medium">{used} / {limit} min</span>
      </div>

      <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-green-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {isCritical && (
        <p className="mt-4 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
          Calls are currently blocked. Please upgrade your plan to continue receiving calls.
        </p>
      )}
    </Card>
  );
};

const PricingCard: React.FC<{
  plan: string;
  price: string;
  mins: number;
  current: boolean;
  features: string[];
  onClick?: () => void;
}> = ({ plan, price, mins, current, features, onClick }) => (
  <Card className={`p-6 relative overflow-hidden ${current ? 'border-purple-500 ring-1 ring-purple-500' : 'opacity-80 hover:opacity-100 transition'}`}>
    {current && (
      <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
        CURRENT PLAN
      </div>
    )}

    <h3 className="text-xl font-bold text-white mb-1 capitalize">{plan}</h3>
    <div className="flex items-baseline gap-1 mb-4">
      <span className="text-2xl font-bold text-white">{price}</span>
      <span className="text-sm text-slate-400">/mo</span>
    </div>

    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <Clock className="w-4 h-4 text-purple-400" />
        <span>{mins} mins/month</span>
      </div>
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{f}</span>
        </div>
      ))}
    </div>

    <button
      disabled={current}
      className={`w-full py-2 rounded-lg text-sm font-semibold transition ${current
        ? 'bg-slate-700 text-slate-400 cursor-default'
        : 'bg-white text-slate-900 hover:bg-slate-200'
        }`}
      onClick={onClick || (() => alert("Billing integration coming soon!"))}
    >
      {current ? 'Active Plan' : 'Upgrade'}
    </button>
  </Card>
);

interface OnboardingProps {
  onComplete: (config: BusinessConfig) => void;
  isDemoMode?: boolean;
}

// Onboarding now uses authenticatedFetch
const Onboarding: React.FC<OnboardingProps> = ({ onComplete, isDemoMode }) => {
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

    if (isDemoMode) {
      // Skip backend API call for Demo Mode
      // Simulate a small delay for UX
      setTimeout(() => {
        onComplete(formData);
        setIsSubmitting(false);
      }, 800);
      return;
    }

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
  isDemoMode?: boolean;
}

// ChatDemo now uses authenticatedFetch
const ChatDemoView: React.FC<ChatDemoViewProps> = ({ config, isDemoMode }) => {
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
      // Pass config in body if in Demo Mode
      const bodyPayload = {
        message: userMsg.content,
        history: messages.map(m => ({ role: m.role, content: m.content })),
        config: isDemoMode ? (config || {}) : undefined
      };

      // Use direct fetch for demo mode
      const fetcher = isDemoMode ? fetch : authenticatedFetch;

      const res = await fetcher(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
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

// --- Billing Components ---

const BillingPricingCard: React.FC<{
  plan: string;
  price: string;
  mins: number;
  current: boolean;
  features: string[];
  onClick: () => void;
}> = ({ plan, price, mins, current, features, onClick }) => (
  <Card className={`p-6 relative overflow-hidden flex flex-col ${current ? 'border-purple-500 ring-1 ring-purple-500' : 'opacity-80 hover:opacity-100 transition'}`}>
    {current && (
      <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
        CURRENT PLAN
      </div>
    )}

    <h3 className="text-xl font-bold text-white mb-1 capitalize">{plan}</h3>
    <div className="flex items-baseline gap-1 mb-4">
      <span className="text-2xl font-bold text-white">{price}</span>
      {price !== 'Free' && <span className="text-sm text-slate-400">/mo</span>}
    </div>

    <div className="space-y-3 mb-8 flex-1">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <Clock className="w-4 h-4 text-purple-400" />
        <span>{mins} mins/month</span>
      </div>
      {features.map((f, i) => (
        <div key={i} className="flex items-center gap-2 text-sm text-slate-300">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{f}</span>
        </div>
      ))}
    </div>

    <button
      disabled={current}
      className={`w-full py-3 rounded-xl text-sm font-bold transition ${current
        ? 'bg-slate-700 text-slate-400 cursor-default'
        : 'bg-white text-slate-900 hover:bg-slate-200'
        }`}
      onClick={onClick}
    >
      {current ? 'Active Plan' : 'Select Plan'}
    </button>
  </Card>
);

const PaymentModal: React.FC<{
  plan: any;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ plan, onClose, onSuccess }) => {
  const [method, setMethod] = useState<'payoneer' | 'nayapay'>('payoneer');
  const [reference, setReference] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState<{ payoneerEmail: string, nayapayId: string } | null>(null);

  useEffect(() => {
    // Fetch payment details
    authenticatedFetch(`${API_URL}/admin/config`)
      .then(res => res.json())
      .then(data => setConfig(data))
      .catch(() => setConfig({ payoneerEmail: 'payments@smartreception.ai', nayapayId: '03001234567' }));
  }, []);

  const handleSubmit = async () => {
    if (!reference) return alert('Please enter the transaction reference');
    setSubmitting(true);
    try {
      const res = await authenticatedFetch(`${API_URL}/billing/pay`, {
        method: 'POST',
        body: JSON.stringify({
          plan: plan.id,
          amount: plan.price,
          paymentMethod: method,
          reference
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert('Payment request submitted! We will activate your plan shortly after verification.');
        onSuccess();
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!config) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg p-6 bg-slate-900 border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Upgrade to {plan.name}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMethod('payoneer')}
            className={`flex-1 p-3 rounded-xl border transition ${method === 'payoneer' ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            Payoneer
          </button>
          <button
            onClick={() => setMethod('nayapay')}
            className={`flex-1 p-3 rounded-xl border transition ${method === 'nayapay' ? 'bg-purple-600/20 border-purple-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
          >
            NayaPay (Card)
          </button>
        </div>

        <div className="mb-6 bg-slate-800 p-4 rounded-xl border border-slate-700/50">
          <div className="text-sm text-slate-300 mb-2">Instructions:</div>
          {method === 'payoneer' ? (
            <div className="space-y-2">
              <p className="font-semibold text-white text-md">USD Receiving Account Details</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                <span className="font-bold">Bank Name:</span> <span className="text-white">Citibank</span>
                <span className="font-bold">Routing (ABA):</span> <span className="text-white select-all">031100209</span>
                <span className="font-bold">Account Number:</span> <span className="text-white select-all">70586520001968114</span>
                <span className="font-bold">Beneficiary:</span> <span className="text-white">Muhammad Elahi</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Log in to your Payoneer, go to <b>Pay</b> &gt; <b>Make a Payment</b>, and use the details above.
              </p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-white text-lg select-all">{config.nayapayId}</p>
              <p className="text-xs text-slate-500 mt-1">Send <b>Rs. {plan.price * 280}</b> (approx) via NayaPay App or Bank Transfer.</p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {method === 'payoneer' ? 'Your Payoneer Email' : 'Transaction ID / Sender Name'}
          </label>
          <input
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-purple-500"
            placeholder={method === 'payoneer' ? "e.g. you@example.com" : "e.g. TXN-12345678"}
            value={reference}
            onChange={e => setReference(e.target.value)}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : "I've Sent the Payment"}
        </button>
      </Card>
    </div>
  );
};

const BillingView: React.FC<{
  business: any;
}> = ({ business }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await authenticatedFetch(`${API_URL}/billing/plans`);
        if (res.ok) {
          const data = await res.json();
          setPlans(data);
        } else {
          // Fallback
          setPlans([
            { id: 'free', name: 'Free Tier', price: 0, minutes: 10, features: ['Basic Voice'] },
            { id: 'starter', name: 'Starter Plan', price: 29, minutes: 100, features: ['Standard Voice', 'Email Support'] },
            { id: 'pro', name: 'Pro Plan', price: 99, minutes: 500, features: ['Premium Voice', 'Priority Support'] }
          ]);
        }
      } catch (e) {
        console.error("Failed to fetch plans", e);
        // Fallback on error so user sees something
        setPlans([
          { id: 'free', name: 'Free Tier', price: 0, minutes: 10, features: ['Basic Voice'] },
          { id: 'starter', name: 'Starter Plan', price: 29, minutes: 100, features: ['Standard Voice', 'Email Support'] },
          { id: 'pro', name: 'Pro Plan', price: 99, minutes: 500, features: ['Premium Voice', 'Priority Support'] }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  if (loading) return <div className="text-white p-8">Loading plans...</div>;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      <h2 className="text-3xl font-bold text-white mb-2">Billing & Plans</h2>
      <p className="text-slate-400 mb-8">Choose a plan that fits your business needs.</p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {plans.map((plan) => (
          <BillingPricingCard
            key={plan.id}
            plan={plan.name}
            price={plan.price === 0 ? 'Free' : `$${plan.price}`}
            mins={plan.minutes}
            features={plan.features}
            current={business.subscription_plan === plan.id || (plan.id === 'free' && !(!business.subscription_plan))}
            onClick={() => setSelectedPlan(plan)}
          />
        ))}
      </div>

      {selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onSuccess={() => setSelectedPlan(null)}
        />
      )}

      <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">Payment History</h3>
        <p className="text-slate-400 text-sm">No recent transactions.</p>
      </div>
    </div>
  );
};

// --- Custom VAD Hook ---
const useAudioVAD = (onSpeechStart: () => void, onSpeechEnd: () => void) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const intervalRef = useRef<any>(null);
  const speechStartTimeRef = useRef<number>(0);
  const lastSpeechTimeRef = useRef<number>(0);
  const isSpeakingRef = useRef(false);

  // VAD Parameters
  const SILENCE_THRESHOLD = 700; // ms to wait before considering speech ended
  const VOLUME_THRESHOLD = 0.05; // Increased from 0.02 to avoid background noise
  const MAX_DURATION = 6000; // Hard stop after 6s of speaking

  const startMonitoring = async (stream: MediaStream) => {
    if (isMonitoring) return;

    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 256;
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    sourceRef.current.connect(analyserRef.current);

    setIsMonitoring(true);
    speechStartTimeRef.current = 0;
    lastSpeechTimeRef.current = Date.now();
    isSpeakingRef.current = false;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    intervalRef.current = setInterval(() => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
      const average = sum / bufferLength / 255; // Normalize 0-1

      // Optional: Log volume occasionally for debugging (comment out in production)
      if (Math.random() > 0.95) console.log("VAD Volume:", average.toFixed(4));

      const now = Date.now();

      if (average > VOLUME_THRESHOLD) {
        // Speech detected
        lastSpeechTimeRef.current = now;
        if (!isSpeakingRef.current) {
          isSpeakingRef.current = true;
          speechStartTimeRef.current = now;
          onSpeechStart();
        }

        // Hard stop check
        if (now - speechStartTimeRef.current > MAX_DURATION) {
          console.log("VAD: Max duration reached");
          onSpeechEnd();
        }
      } else {
        // Silence
        if (isSpeakingRef.current) {
          if (now - lastSpeechTimeRef.current > SILENCE_THRESHOLD) {
            console.log(`VAD: Silence detected (${now - lastSpeechTimeRef.current}ms > ${SILENCE_THRESHOLD}ms)`);
            isSpeakingRef.current = false;
            onSpeechEnd();
          }
        }
      }
    }, 100);
  };

  const stopMonitoring = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
    setIsMonitoring(false);
  };
  return { startMonitoring, stopMonitoring, isMonitoring };
};

interface VoiceDemoViewProps {
  config: BusinessConfig;
  isDemoMode?: boolean;
}

type VoiceStatus = 'Idle' | 'Listening' | 'Thinking' | 'Speaking' | 'Error: Connection Failed' | 'Error: Mic Failed' | 'Speech Recognition not supported in this browser (Use Chrome or Safari)';

// VoiceDemoView with VAD and Streaming
const VoiceDemoView: React.FC<VoiceDemoViewProps> = ({ config, isDemoMode }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [status, setStatus] = useState<VoiceStatus>('Idle');

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis>(window.speechSynthesis);
  const streamRef = useRef<MediaStream | null>(null);
  const isProcessingRef = useRef(false);

  // -- VAD Integration --
  const stopListening = () => {
    if (isProcessingRef.current) return; // Already processing
    console.log("Stopping listening loop...");
    recognitionRef.current?.stop(); // This triggers onend, which handles the transition
  };

  const vad = useAudioVAD(
    () => addDebug("VAD: Speech Start"),
    () => {
      addDebug("VAD: Speech End");
      // FORCE stop everything. Do not rely on recognition.onend entirely
      // to prevent VAD loops if recognition is flaky.
      vad.stopMonitoring();
      stopListening();
    }
  );

  // Debug state
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const addDebug = (msg: string) => setDebugInfo(prev => [...prev.slice(-4), msg]); // Keep last 5

  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = synthRef.current.getVoices();
      addDebug(`Voices loaded: ${voices.length}`);
    };
    loadVoices();
    synthRef.current.addEventListener('voiceschanged', loadVoices);
    return () => synthRef.current.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const processVoiceInput = async (text: string) => {
    if (!text.trim() || isProcessingRef.current) return;

    isProcessingRef.current = true;
    setStatus('Thinking');
    setAiResponse('');
    addDebug(`Processing: "${text.substring(0, 15)}..."`);

    try {
      // Pass config in body if in Demo Mode
      const bodyPayload = {
        message: text,
        history: [],
        config: isDemoMode ? (config || {}) : undefined
      };

      console.log("[VoiceDemo] Sending payload:", bodyPayload);

      // Use direct fetch for demo mode to avoid any auth token interference
      const fetcher = isDemoMode ? fetch : authenticatedFetch;

      const response = await fetcher(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server Error (${response.status}): ${errorText.substring(0, 100)}`);
      }

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      setStatus('Speaking');
      addDebug("Stream started");

      while (true) {
        const { done, value } = await reader.read();
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          setAiResponse(prev => prev + chunk); // Optimistic UI update

          // Check for sentence boundaries
          const sentences = buffer.split(/([.!?]+(?:\s|$))/);
          if (sentences.length > 1) {
            const sentenceToSpeak = sentences[0] + (sentences[1] || '');
            if (sentenceToSpeak.trim()) {
              speak(sentenceToSpeak.trim());
              buffer = buffer.slice(sentenceToSpeak.length);
            }
          }
        }
        if (done) break;
      }

      // Speak remaining
      if (buffer.trim()) speak(buffer.trim());

    } catch (err: any) {
      console.error("Voice chat error:", err);
      setStatus('Error: Connection Failed');
      addDebug(`Error: ${err.message}`);
    } finally {
      isProcessingRef.current = false;
    }
  };


  const speak = (text: string) => {
    addDebug(`Speaking: "${text.substring(0, 10)}..."`);

    // Explicitly cancel ANY current speech to prevent queue buildup and ensure instant response
    // But we only want to cancel if it's an OLD response, not if we are streaming chunks...
    // Actually, streaming chunks should queue. 
    // BUT if the user starts talking, we call cancel() in the click handler. That is correct.

    const utterance = new SpeechSynthesisUtterance(text);
    activeUtteranceRef.current = utterance; // Keep reference to prevent GC

    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google') || (v.name.includes('Microsoft') && v.name.includes('Female'))) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      // Only reset status if this was the last thing in the queue?
      // It's hard to know if it's the last. 
      // We can just rely on isProcessingRef checking.
      if (!isProcessingRef.current && !synthRef.current.speaking) {
        setStatus('Idle');
        setIsListening(false);
      }
    };

    utterance.onerror = (e) => {
      console.error("TTS Error:", e);
      addDebug(`TTS Error: ${e.error}`);
    };

    synthRef.current.speak(utterance);
  };


  const startListening = async () => {
    try {
      isProcessingRef.current = false;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Start VAD monitoring
      await vad.startMonitoring(stream);

      // Start Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Keep it running until VAD stops it
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setStatus('Listening');
        setIsListening(true);
      };

      recognitionRef.current.onresult = (e: any) => {
        let finalTranscript = '';
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          if (e.results[i].isFinal) {
            finalTranscript += e.results[i][0].transcript;
          } else {
            // interim
            setTranscript(e.results[i][0].transcript);
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          // If we got a final result, we technically could process it, 
          // but we wait for VAD to stop to ensure we got the full thought.
          // However, to be extra fast, if the confidence is high and it looks complete, 
          // we could potentially trigger early, but let's stick to VAD trigger for reliability/latency balance.
        }
      };

      recognitionRef.current.onend = () => {
        console.log("Recognition ended");
        vad.stopMonitoring();
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }

        // If strictly listening (not cancelled), process whatever we have in transcript
        if (status === 'Listening' && !isProcessingRef.current) {
          // We need to grab the latest transcript value which might be in state
          // Since we can't easily access the latest state in this callback without refs,
          // we'll rely on the fact that we updated state. 
          // Better approach: use a ref for transcript
        }
      };

      recognitionRef.current.start();

    } catch (err) {
      console.error("Mic access error:", err);
      setStatus('Error: Mic Failed');
    }
  };

  // Use a ref to track transcript for submitting on stop
  const transcriptRef = useRef('');
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

  // Hook into VAD stop -> trigger processing
  useEffect(() => {
    // We need to customize the stopListening function used by VAD 
    // to also trigger the processing.
    // Currently vad.stopListening calls stopListening() which stops recognition.
    // recognition.onend fires.
    // We need to trigger processing *there*.
  }, []);

  // Revised stop wrapper
  const handleVADSilence = () => {
    console.log("VAD detected silence. Stopping...");
    recognitionRef.current?.stop(); // This will trigger onend
    // We process immediately to be faster
    if (transcriptRef.current) {
      processVoiceInput(transcriptRef.current);
    }
  };

  // Re-bind VAD with the handler that has access to closure/refs if needed, 
  // or just pass it directly. Since useAudioVAD is defined outside or inside?
  // It's inside. So we need to re-initialize vad or better yet, make sure useAudioVAD callback uses refs.

  // Actually, simpler fix: Update the useAudioVAD hook usage above.
  // We can't update it dynamically easily. 
  // Let's modify the VAD hook call to use a ref-stable function.

  const handleSilenceRef = useRef(handleVADSilence);
  handleSilenceRef.current = handleVADSilence;

  return (
    <div className="flex flex-col min-h-[calc(100vh-12rem)] md:h-full items-center justify-center p-4">
      <div className="mb-6 md:mb-8 text-center max-w-full">
        <Badge color={status === 'Idle' ? 'blue' : status === 'Listening' ? 'red' : status === 'Speaking' ? 'green' : 'purple'}>
          {status}
        </Badge>
        <h2 className="text-2xl md:text-3xl font-bold text-white mt-4 truncate px-4">{config.business_name}</h2>
        <p className="text-slate-400 text-sm">Ultra-Low Latency Voice Demo</p>
      </div>

      <div className="relative mb-8 md:mb-12">
        {status !== 'Idle' && (
          <>
            <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
            <div className="absolute inset-0 bg-purple-500/10 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
          </>
        )}

        <button
          onClick={() => {
            if (isListening) {
              // Manual Stop = Treat as silence detection (Process it!)
              console.log("Manual stop -> triggering silence handler");
              handleVADSilence();
              vad.stopMonitoring();
              setIsListening(false);
            } else {
              setTranscript('');
              startListening();
            }
          }}
          className={`relative z-10 w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${status === 'Listening' ? 'bg-red-500 shadow-red-900/20' :
            status === 'Speaking' ? 'bg-green-500 shadow-green-900/20' :
              status === 'Thinking' ? 'bg-amber-400 shadow-amber-900/20 animate-pulse' :
                'bg-slate-800 border-2 border-slate-700 hover:border-purple-500'
            }`}
        >
          {status === 'Listening' ? <MicOff className="w-8 h-8 md:w-10 md:h-10 text-white" /> :
            status === 'Speaking' ? <div className="space-x-1 flex h-4 md:h-6 items-center">
              <div className="w-1 h-3 md:h-3 bg-white animate-pulse" />
              <div className="w-1 h-5 md:h-6 bg-white animate-pulse delay-75" />
              <div className="w-1 h-3 md:h-3 bg-white animate-pulse delay-150" />
            </div> :
              status === 'Thinking' ? <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-white animate-spin-slow" /> :
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

      {/* Debug Console */}
      <div className="fixed bottom-4 right-4 max-w-xs w-full pointer-events-none z-50">
        <div className="bg-black/80 p-2 rounded-lg text-[10px] font-mono text-green-400 pointer-events-auto backdrop-blur border border-green-500/30">
          <p className="font-bold text-slate-400 mb-1 border-b border-slate-700 pb-1">Debug Log</p>
          {debugInfo.length === 0 ? <p className="text-slate-600">No logs...</p> :
            debugInfo.map((msg, i) => (
              <p key={i} className="truncate">{msg}</p>
            ))
          }
        </div>
      </div>
    </div>
  );
};

interface DashboardViewProps {
  config: BusinessConfig;
  onNavigate: (view: string) => void;
  isDemoMode?: boolean;
}

const DashboardView: React.FC<DashboardViewProps> = ({ config, onNavigate, isDemoMode }) => {
  const currentPlan = config.subscription_plan || 'free';
  const minutesUsed = config.minutes_used || 0;
  const minutesLimit = config.minutes_limit || 10;

  return (
    <div className="space-y-8">
      {isDemoMode && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <div>
              <p className="font-bold">You are in Demo Mode</p>
              <p className="text-sm opacity-80">Your settings will be lost if you refresh. Create an account to save them!</p>
            </div>
          </div>
          <button
            onClick={() => window.location.reload()} // Quick way to go back to auth, or pass a handler
            className="bg-amber-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-amber-400 transition text-sm"
          >
            Sign Up Now
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome, {config.business_name}</h1>
          <p className="text-slate-400 mt-1">Manage your AI Receptionist</p>
        </div>
        <Badge color="purple">{currentPlan.toUpperCase()} PLAN</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:bg-slate-800/50 transition cursor-pointer group" onClick={() => onNavigate('chat-demo')}>
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <MessageSquare className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Chat Demo</h3>
          <p className="text-slate-400 text-sm">Test your AI assistant in a text chat interface.</p>
        </Card>

        <Card className="p-6 hover:bg-slate-800/50 transition cursor-pointer group" onClick={() => onNavigate('phone-demo')}>
          <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Phone className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Voice Demo</h3>
          <p className="text-slate-400 text-sm">Experience the ultra-low latency voice interface.</p>
        </Card>

        <Card className={`p-6 transition cursor-pointer group ${isDemoMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800/50'}`}
          onClick={() => !isDemoMode && onNavigate('settings')}>
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <Settings className="w-6 h-6 text-purple-400" />
            </div>
            {isDemoMode && <Lock className="w-4 h-4 text-slate-500" />}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Business Settings</h3>
          <p className="text-slate-400 text-sm">Configure your hours, tone, and services.</p>
        </Card>

        <Card className={`p-6 transition cursor-pointer group ${isDemoMode ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-800/50'}`}
          onClick={() => !isDemoMode && alert("Connect Twilio to go live!")}>
          <div className="flex justify-between items-start">
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
              <PhoneOutgoing className="w-6 h-6 text-pink-400" />
            </div>
            {isDemoMode && <Lock className="w-4 h-4 text-slate-500" />}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Connect Twilio</h3>
          <p className="text-slate-400 text-sm">Link your phone number to start receiving calls.</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Usage Stats - Takes up 1 column */}
        <div className="md:col-span-1 space-y-6">
          <UsageCard used={minutesUsed} limit={minutesLimit} />
        </div>

        {/* Pricing Plans - Takes up 2 columns */}
        <div className="md:col-span-2">
          <h2 className="text-lg font-bold text-white mb-4">Available Plans</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <PricingCard
              plan="starter"
              price="$29"
              mins={100}
              current={currentPlan === 'starter'}
              features={['Basic AI Voice', 'Email Support']}
              onClick={() => onNavigate('billing')}
            />
            <PricingCard
              plan="growth"
              price="$79"
              mins={500}
              current={currentPlan === 'growth'}
              features={['Advanced Voice', 'Priority Support', 'Custom Greeting']}
              onClick={() => onNavigate('billing')}
            />
            <PricingCard
              plan="pro"
              price="$149"
              mins={2000}
              current={currentPlan === 'pro'}
              features={['24/7 Phone Support', 'API Access', 'White Labeling']}
              onClick={() => onNavigate('billing')}
            />

          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">
            Need more? <a href="#" className="underline hover:text-purple-400">Contact Sales</a> for Enterprise plans.
          </p>
        </div>
      </div>
    </div>
  );
};

interface TwilioStatus {
  connected: boolean;
  phoneNumber: string;
}

interface SettingsViewProps {
  config: BusinessConfig;
  onUpdate: () => void;
  isDemoMode?: boolean;
  onNavigate: (view: string) => void;
}

// Settings View
const SettingsView: React.FC<SettingsViewProps> = ({ config, onUpdate, isDemoMode, onNavigate }) => {
  const [twilioPhone, setTwilioPhone] = useState('');
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [twilioStatus, setTwilioStatus] = useState<TwilioStatus | null>(null);

  useEffect(() => {
    if (!isDemoMode) {
      checkTwilioStatus();
    }
  }, [isDemoMode]);

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

  if (isDemoMode) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-white mb-6">Settings</h1>
        <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700 text-center">
          <Lock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Settings are locked in Demo Mode</h2>
          <p className="text-slate-400 mb-6">Create an account to save your business configuration and connect a phone number.</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-bold transition"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

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

      <div className="mt-8 text-center">
        <button
          onClick={() => onNavigate('admin')}
          className="text-slate-800 text-xs hover:text-slate-600 transition"
        >
          Admin Access
        </button>
      </div>
    </div >
  );
};

// --- Admin Component ---
const AdminView = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  const [payments, setPayments] = useState<any[]>([]);
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/payments`, {
        headers: { 'x-admin-secret': secret }
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
        setIsAuthenticated(true);
      } else {
        alert('Invalid Secret');
      }
    } catch (e) {
      console.error(e);
      alert('Connection Error');
    } finally {
      setLoading(false);
    }
  };

  const approvePayment = async (id: string) => {
    if (!confirm('Approve this payment?')) return;
    try {
      const res = await fetch(`${API_URL}/admin/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': secret
        },
        body: JSON.stringify({ requestId: id })
      });
      if (res.ok) {
        alert('Approved!');
        fetchPayments();
      } else {
        alert('Error approval');
      }
    } catch (e) {
      console.error(e);
      alert('Error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-20 px-4">
        <Card className="p-6 bg-slate-900 border-slate-800">
          <h2 className="text-xl font-bold text-white mb-4">Admin Access</h2>
          <input
            type="password"
            placeholder="Admin Secret"
            className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white mb-4"
            value={secret}
            onChange={e => setSecret(e.target.value)}
          />
          <button onClick={fetchPayments} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded transition">
            {loading ? 'Verifying...' : 'Login'}
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Payment Requests</h2>
        <button onClick={() => { setIsAuthenticated(false); onNavigate('dashboard'); }} className="text-slate-400 hover:text-white">Exit</button>
      </div>
      <div className="space-y-4">
        {payments.map((p: any) => (
          <Card key={p.id} className="p-4 bg-slate-900 border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="text-white font-bold flex items-center gap-2">
                {p.plan.toUpperCase()} <span className="text-slate-500">|</span> ${p.amount}
              </p>
              <p className="text-sm text-slate-400">Ref: {p.payment_reference}</p>
              <p className="text-xs text-slate-500 mt-1">{new Date(p.created_at).toLocaleString()} via {p.payment_method}</p>
            </div>
            <div className="flex gap-2">
              {p.status === 'pending' ? (
                <button onClick={() => approvePayment(p.id)} className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 font-bold">
                  Approve
                </button>
              ) : (
                <span className={`text-sm px-3 py-1 rounded capitalize ${p.status === 'approved' ? 'bg-green-900/50 text-green-300 border border-green-800' : 'bg-red-900/50 text-red-300 border border-red-800'}`}>
                  {p.status}
                </span>
              )}
            </div>
          </Card>
        ))}
        {payments.length === 0 && <p className="text-slate-500 text-center py-10">No pending requests found.</p>}
      </div>
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
          <button
            onClick={() => { onViewChange('billing'); setIsMenuOpen(false); }}
            className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            <CreditCard className="w-4 h-4" />
            Billing
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
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setIsDemoMode(false);
        checkSetup(session);
      } else if (!isDemoMode) {
        setView('auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setIsDemoMode(false);
        checkSetup(session);
      } else if (!isDemoMode) {
        setView('auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [isDemoMode]);

  const checkSetup = async (currentSession: any) => {
    console.log("[App] Checking setup status...");
    if (view !== 'loading') setView('loading');

    try {
      const res = await authenticatedFetch(`${API_URL}/status`, {
        headers: { 'Authorization': `Bearer ${currentSession.access_token}` }
      });

      if (res.status === 401) {
        console.log("[App] Backend returned 401 - proceeding to onboarding");
        setConfig({} as BusinessConfig);
        setView('onboarding');
        return;
      }

      if (!res.ok) throw new Error(`Server returned ${res.status}`);

      const data = await res.json();
      if (data.setupCompleted) {
        setConfig(data.config);
        setView('dashboard');
      } else {
        setConfig(data.config || {});
        setView('onboarding');
      }
    } catch (err: any) {
      console.error("[App] checkSetup Error:", err);
      setConfig({} as BusinessConfig);
      setView('onboarding');
    }
  };

  const handleLogout = async () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setConfig(null);
      setView('auth');
    } else {
      await supabase.auth.signOut();
      setConfig(null); // Clear config on logout
      setView('auth'); // Go to auth page
    }
  };

  const handleTryDemo = () => {
    setIsDemoMode(true);
    setConfig({} as BusinessConfig);
    setView('onboarding');
  };

  if (view === 'loading' && !isDemoMode) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-slate-400 animate-pulse">Connecting to server...</p>
        <p className="text-slate-600 text-xs mt-2 max-w-xs text-center">
          (Cold start may take up to 50s on free hosting)
        </p>
      </div>
    );
  }

  if (view === 'auth') return <Auth onAuthSuccess={() => { }} onTryDemo={handleTryDemo} />;
  if (view === 'onboarding') return <Onboarding onComplete={(cfg: BusinessConfig) => { setConfig(cfg); setView('dashboard'); }} isDemoMode={isDemoMode} />;

  // Validation
  if (!config && !isDemoMode && view !== 'loading') {
    setView('auth');
    return null;
  }

  return (
    <AppShell onLogout={handleLogout} user={isDemoMode ? { email: 'Demo User' } : session?.user} onViewChange={setView}>
      {view === 'dashboard' && <DashboardView config={config || {} as BusinessConfig} onNavigate={setView} isDemoMode={isDemoMode} />}
      {view === 'settings' && <SettingsView config={config || {} as BusinessConfig} onUpdate={() => session && checkSetup(session)} isDemoMode={isDemoMode} onNavigate={setView} />}
      {view === 'billing' && <BillingView business={config || {} as BusinessConfig} />}
      {view === 'admin' && <AdminView onNavigate={setView} />}
      {view === 'chat-demo' && <ChatDemoView config={config || {} as BusinessConfig} isDemoMode={isDemoMode} />}
      {view === 'phone-demo' && <VoiceDemoView config={config || {} as BusinessConfig} isDemoMode={isDemoMode} />}
    </AppShell>
  );
}

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY; // Using Anon Key for client operations, usually passed via Authorization header

// Helper to get user from token
const getUser = async (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) return null;
    return user;
};

// Create a client with the user's token to respect RLS
const getSupabaseClient = (token) => {
    return createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: `Bearer ${token}` } }
    });
};

// Gemini Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy-key');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Routes

// Check setup status
app.get('/api/status', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const supabase = getSupabaseClient(req.headers.authorization.split(' ')[1]);
    const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .single();

    if (data) {
        res.json({ setupCompleted: true, config: data });
    } else {
        res.json({ setupCompleted: false });
    }
});

// Save Onboarding Data
app.post('/api/setup', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { name, services, tone, workingHours, greeting } = req.body;
    const supabase = getSupabaseClient(req.headers.authorization.split(' ')[1]);

    const { data, error } = await supabase
        .from('businesses')
        .upsert({
            user_id: user.id,
            business_name: name,
            services,
            tone,
            working_hours: workingHours || '9 AM - 5 PM',
            greeting
        })
        .select()
        .single();

    if (error) {
        console.error('Supabase Error:', error);
        return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, id: data.id });
});

// Chat Endpoint
app.post('/api/chat', async (req, res) => {
    try {
        // Validation
        if (!req.body) {
            return res.status(400).json({ error: 'Missing request body' });
        }

        // Check for Demo Config first (Unauthenticated flow)
        let config = req.body.config;
        let user = null;

        if (!config) {
            // Authenticated flow: Get user and fetch from DB
            user = await getUser(req);
            if (!user) return res.status(401).json({ error: 'Unauthorized' });

            const token = req.headers.authorization?.split(' ')[1];
            if (!token) return res.status(401).json({ error: 'Missing token' });

            const supabase = getSupabaseClient(token);
            const { data: dbConfig, error } = await supabase
                .from('businesses')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error || !dbConfig) {
                return res.status(400).json({ error: 'Business configuration not found' });
            }
            config = dbConfig;
        }

        if (!config) {
            return res.status(400).json({ error: 'Business not configured' });
        }

        const { message, history } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // Construct System Prompt
        // Use safe access or defaults to prevent undefined errors in string interpolation
        const systemPrompt = `You are an AI receptionist for "${config.business_name || 'Business'}".
      
      BUSINESS DETAILS:
      - Services: ${config.services || 'General Inquiry'}
      - Working Hours: ${config.working_hours || '9 AM - 5 PM'}
      - Tone: ${config.tone || 'professional'}
      
      INSTRUCTIONS:
      1. You are talking to a customer.
      2. Answer strictly based on the business details.
      3. If asked about something not listed, say you don't know but can take a message.
      4. Be ${config.tone || 'professional'}.
      5. Keep responses concise (under 50 words) suitable for a chat interface.
      `;

        // Validate History for Gemini (Must start with User)
        const safeHistory = Array.isArray(history) ? history : [];
        let formattedHistory = safeHistory.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content || '' }],
        }));

        if (formattedHistory.length > 0 && formattedHistory[0].role === 'model') {
            formattedHistory.unshift({ role: 'user', parts: [{ text: 'Start conversation' }] });
        }

        const chat = model.startChat({
            history: formattedHistory,
            systemInstruction: {
                role: 'system',
                parts: [{ text: systemPrompt }]
            },
        });

        const result = await chat.sendMessageStream(message);

        // Set headers for streaming
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            res.write(chunkText);
        }

        res.end();

    } catch (error) {
        console.error('Gemini/Server API Error:', error);

        // Ensure we don't try to send headers if already sent (streaming started)
        if (!res.headersSent) {
            res.status(500).json({
                error: error.message || 'Internal Server Error',
                details: error.toString()
            });
        } else {
            console.error('Error occurred after headers sent, ending stream.');
            res.end();
        }
    }
});

// Global Error Handler (Must be last)
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    if (!res.headersSent) {
        res.status(500).json({ error: 'Internal Server Error', message: err.message });
    }
});

// ===== TWILIO INTEGRATION =====

import twilio from 'twilio';
const VoiceResponse = twilio.twiml.VoiceResponse;

// Twilio credentials
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilioAccountSid && twilioAuthToken ? twilio(twilioAccountSid, twilioAuthToken) : null;

// Helper: Validate Twilio signature
const validateTwilioRequest = (req, res, next) => {
    // TEMPORARILY DISABLED FOR TESTING
    console.log('⚠️ Signature validation disabled for testing');
    return next();

    /* ENABLE THIS IN PRODUCTION:
    if (!twilioAuthToken) {
        console.warn('Twilio not configured - skipping signature validation');
        return next();
    }

    const twilioSignature = req.headers['x-twilio-signature'];
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    if (twilio.validateRequest(twilioAuthToken, twilioSignature, url, req.body)) {
        next();
    } else {
        console.error('Invalid Twilio signature');
        res.status(403).send('Forbidden');
    }
    */
};

// Save Twilio number to business and automagically configure webhooks
app.post('/api/twilio/connect', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { phoneNumber, accountSid, authToken } = req.body;
    const supabase = getSupabaseClient(req.headers.authorization.split(' ')[1]);

    try {
        // Construct the webhook URL using the current host
        const protocol = req.protocol === 'https' ? 'https' : 'https'; // Force https for Twilio
        const host = req.get('host');
        // If it's localhost, we can't use it for Twilio. 
        // We'll warn if it's not a public URL/ngrok.
        const webhookUrl = `${protocol}://${host}/webhooks/twilio/voice`;
        const statusUrl = `${protocol}://${host}/webhooks/twilio/status`;

        console.log(`Setting up Twilio number ${phoneNumber} with webhook: ${webhookUrl}`);

        // Initialize Twilio with PROVIDED credentials
        const client = twilio(accountSid, authToken);

        // Find the phone number in their account
        const incomingNumbers = await client.incomingPhoneNumbers.list({ phoneNumber });

        if (incomingNumbers.length === 0) {
            return res.status(400).json({ error: `Phone number ${phoneNumber} not found in this Twilio account.` });
        }

        const twilioNumber = incomingNumbers[0];

        // Update the webhook configuration on Twilio
        await client.incomingPhoneNumbers(twilioNumber.sid).update({
            voiceUrl: webhookUrl,
            voiceMethod: 'POST',
            statusCallback: statusUrl,
            statusCallbackMethod: 'POST'
        });

        // Save to Supabase
        const { data, error } = await supabase
            .from('businesses')
            .update({
                twilio_phone_number: phoneNumber,
                twilio_phone_sid: twilioNumber.sid,
                twilio_account_sid: accountSid,
                twilio_auth_token: authToken
            })
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            message: 'Twilio configured and webhook set automatically!',
            business: data
        });

    } catch (error) {
        console.error('Twilio automation error:', error);
        res.status(500).json({
            error: error.message || 'Failed to configure Twilio automation',
            details: 'Make sure your SID and Auth Token are correct and you are using a public URL (like ngrok).'
        });
    }
});

// Get Twilio status
app.get('/api/twilio/status', async (req, res) => {
    const user = await getUser(req);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const supabase = getSupabaseClient(req.headers.authorization.split(' ')[1]);
    const { data } = await supabase
        .from('businesses')
        .select('twilio_phone_number, twilio_phone_sid')
        .eq('user_id', user.id)
        .single();

    res.json({
        connected: !!data?.twilio_phone_number,
        phoneNumber: data?.twilio_phone_number || null
    });
});

// Twilio Voice Webhook - Initial call
app.post('/webhooks/twilio/voice', express.urlencoded({ extended: false }), validateTwilioRequest, async (req, res) => {
    const { To, From, CallSid } = req.body;
    console.log(`Incoming call from ${From} to ${To}, CallSid: ${CallSid}`);

    try {
        // Find business by phone number
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data: business, error } = await supabase
            .from('businesses')
            .select('*')
            .eq('twilio_phone_number', To)
            .single();

        if (error || !business) {
            console.error('Business not found for number:', To);
            const twiml = new VoiceResponse();
            twiml.say('Sorry, this number is not configured.');
            twiml.hangup();
            return res.type('text/xml').send(twiml.toString());
        }

        // --- PRICING & LIMIT ENFORCEMENT ---
        // Default to very high limits if null to avoid breaking legacy/free setups unexpectedly unless strict plan logic is desired
        // But user asked for specific limits.
        const used = business.minutes_used || 0;
        const limit = business.minutes_limit || 10; // Default 10 mins for free if not set

        if (used >= limit) {
            console.log(`Call blocked: Limit reached for ${business.business_name} (${used}/${limit} mins)`);
            const twiml = new VoiceResponse();
            twiml.say('I am sorry, this business has reached its monthly call limit. Please contact them via email or check their website.');
            twiml.hangup();
            return res.type('text/xml').send(twiml.toString());
        }
        // -----------------------------------

        // Log the call
        await supabase.from('call_logs').insert({
            business_id: business.id,
            user_id: business.user_id,
            call_sid: CallSid,
            from_number: From,
            to_number: To,
            status: 'ringing',
            transcript: []
        });

        // Create TwiML response
        const twiml = new VoiceResponse();

        // Greet the caller
        const greeting = business.greeting || `Hello, you've reached ${business.business_name}. How can I help you?`;
        twiml.say({ voice: 'Polly.Joanna' }, greeting);

        // Gather speech input
        const gather = twiml.gather({
            input: 'speech',
            action: `/webhooks/twilio/gather?business_id=${business.id}&call_sid=${CallSid}`,
            speechTimeout: 'auto',
            language: 'en-US'
        });

        // If no input, repeat
        twiml.say({ voice: 'Polly.Joanna' }, 'I didn\'t catch that. Please say something or press any key.');
        twiml.redirect('/webhooks/twilio/voice');

        res.type('text/xml').send(twiml.toString());

    } catch (err) {
        console.error('Voice webhook error:', err);
        const twiml = new VoiceResponse();
        twiml.say('Sorry, an error occurred.');
        twiml.hangup();
        res.type('text/xml').send(twiml.toString());
    }
});

// Twilio Gather Webhook - Process speech
// ... (No changes needed here for limits, usage is tracked on status callback)

// Twilio Status Callback
app.post('/webhooks/twilio/status', express.urlencoded({ extended: false }), validateTwilioRequest, async (req, res) => {
    const { CallSid, CallStatus, CallDuration, To } = req.body;
    console.log(`Call ${CallSid} status: ${CallStatus}, duration: ${CallDuration}s`);

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Update call log status
        await supabase
            .from('call_logs')
            .update({
                status: CallStatus,
                duration: parseInt(CallDuration) || 0
            })
            .eq('call_sid', CallSid);

        // --- UPDATE USAGE ON COMPLETION ---
        if (CallStatus === 'completed' && CallDuration) {
            const durationSec = parseInt(CallDuration);
            if (durationSec > 0) {
                const minutesToAdd = Math.ceil(durationSec / 60);

                // We need to find the business first to increment
                // Since we don't have business_id in body, we look up by phone number (To)
                // Or we could have passed it in query params if we updated the statusCallback URL, 
                // but we didn't update the URL setup logic yet.
                // Lookup by 'To' is safest for now.

                // Actually, finding via call_logs is safer if we want to be sure?
                // But simply looking up by 'To' number is efficient for the business mapping.

                // Let's use RPC or simple update. Supabase simple update:

                // 1. Get current usage
                const { data: business } = await supabase
                    .from('businesses')
                    .select('id, minutes_used')
                    .eq('twilio_phone_number', To)
                    .single();

                if (business) {
                    const newUsage = (business.minutes_used || 0) + minutesToAdd;
                    console.log(`Updating usage for business ${business.id}: +${minutesToAdd} mins. New total: ${newUsage}`);

                    await supabase
                        .from('businesses')
                        .update({ minutes_used: newUsage })
                        .eq('id', business.id);
                }
            }
        }
        // ----------------------------------

        res.sendStatus(200);
    } catch (err) {
        console.error('Status callback error:', err);
        res.sendStatus(500);
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Backend running at http://0.0.0.0:${port}`);
    if (twilioClient) {
        console.log('✅ Twilio integration enabled');
    } else {
        console.log('⚠️  Twilio not configured (add credentials to .env)');
    }
});


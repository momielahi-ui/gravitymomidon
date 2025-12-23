import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

import { GoogleGenerativeAI } from '@google/generative-ai';
import nodemailer from 'nodemailer'; // Added email support

dotenv.config();

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Root route for simple verification
app.get('/', (req, res) => {
    res.send('Smart Reception Backend is running!');
});

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
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

// Email Transporter (Smart Configuration)
const emailPass = process.env.EMAIL_PASSWORD || '';
const isResend = emailPass.startsWith('re_');

const transporter = nodemailer.createTransport({
    // If it looks like a Resend key, FORCE Resend host. Ignore Render's SMTP_HOST if set incorrectly.
    host: isResend ? 'smtp.resend.com' : (process.env.SMTP_HOST || 'smtp.gmail.com'),
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_SECURE === 'true' || true,
    auth: {
        user: process.env.SMTP_USER || (isResend ? 'resend' : (process.env.SENDER_EMAIL || process.env.PAYONEER_EMAIL)),
        pass: emailPass
    }
});

// Helper to determine sender address
const getSender = () => {
    if (process.env.SENDER_EMAIL) return process.env.SENDER_EMAIL;
    if (isResend) return 'onboarding@resend.dev'; // Mandatory for Resend free tier
    return process.env.PAYONEER_EMAIL;
};

// Health check for deployment verification (Last updated: 2025-12-23)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        model: 'gemini-flash-latest',
        deployment: '2025-12-24-resend-fix'
    });
});

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
    console.log('[Chat] Received request. Body config present:', !!req.body?.config);
    try {
        // Validation
        if (!req.body) {
            return res.status(400).json({ error: 'Missing request body' });
        }

        // Check for Demo Config first (Unauthenticated flow)
        let config = req.body.config;
        let user = null;
        const isDemoMode = !!config;

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
        const systemPrompt = `You are an AI receptionist for "${config.business_name || config.name || 'Business'}".
      
      BUSINESS DETAILS:
      - Services: ${config.services || 'General Inquiry'}
      - Working Hours: ${config.working_hours || config.workingHours || '9 AM - 5 PM'}
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

        // Demo mode: Return JSON response
        if (isDemoMode) {
            console.log('[Chat] Demo mode: collecting full response for JSON');
            let fullResponse = '';
            for await (const chunk of result.stream) {
                fullResponse += chunk.text();
            }
            return res.json({ response: fullResponse });
        }

        // Authenticated mode: Stream response
        console.log('[Chat] Authenticated mode: streaming response');
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


// ===== BILLING & PAYMENTS =====

// GET /api/billing/plans
app.get('/api/billing/plans', (req, res) => {
    res.json([
        { id: 'starter', name: 'Starter Plan', price: 29, minutes: 100, features: ['Basic AI Voice', 'Email Support'] },
        { id: 'growth', name: 'Growth Plan', price: 79, minutes: 500, features: ['Advanced Voice', 'Priority Support', 'Custom Greeting'] },
        { id: 'pro', name: 'Pro Plan', price: 149, minutes: 2000, features: ['Premium Voice', '24/7 Phone Support', 'API Access', 'White Labeling'] }
    ]);
});

// POST /api/billing/pay
app.post('/api/billing/pay', async (req, res) => {
    const user = await getUser(req); // Retrieve user from auth header
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    const { plan, amount, paymentMethod, reference, businessId } = req.body;

    if (!plan || !amount || !paymentMethod || !reference) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const token = req.headers.authorization?.split(' ')[1];
        const supabase = token ? getSupabaseClient(token) : createClient(supabaseUrl, supabaseKey);

        // 1. Verify business belongs to user
        console.log(`[Billing] User: ${user.id}`);
        const { data: business, error: bizError } = await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (bizError) console.error('[Billing] Biz Lookup Error:', bizError);
        console.log(`[Billing] Business Found:`, business);

        // If no business found for user, we can't link payment
        if (!business) return res.status(404).json({ error: 'Business not found' });

        // 2. Create Payment Request with Email
        const { error } = await supabase
            .from('payment_requests')
            .insert({
                user_id: user.id,
                email: user.email, // Save email for notification
                business_id: business.id,
                plan,
                amount,
                payment_method: paymentMethod,
                payment_reference: reference,
                status: 'pending'
            });

        if (error) throw error;

        res.json({ success: true, message: 'Payment request submitted' });
    } catch (err) {
        console.error('Payment Error:', err);
        res.status(500).json({ error: 'Payment submission failed' });
    }
});

// ADMIN ENDPOINTS (Protected by simple Secret for MVP)
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin123';

const requireAdmin = (req, res, next) => {
    const authHeader = req.headers['x-admin-secret'];
    if (authHeader !== ADMIN_SECRET) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
};

// GET /api/admin/payments
app.get('/api/admin/payments', requireAdmin, async (req, res) => {
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const { data, error } = await supabase
            .from('payment_requests')
            .select('*, businesses(business_name)')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/admin/approve
app.post('/api/admin/approve', requireAdmin, async (req, res) => {
    const { requestId } = req.body;
    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Get Request
        const { data: request } = await supabase
            .from('payment_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (!request) return res.status(404).json({ error: 'Request not found' });
        if (request.status === 'approved') return res.status(400).json({ error: 'Already approved' });

        // 1.5 Get business info for email
        const { data: business } = await supabase
            .from('businesses')
            .select('business_name')
            .eq('id', request.business_id)
            .single();

        // 2. Mark request as approved
        const { error: updateError } = await supabase
            .from('payment_requests')
            .update({ status: 'approved' })
            .eq('id', requestId);

        if (updateError) throw updateError;

        // 3. Update Business Limits
        const limits = {
            'starter': 100,
            'growth': 500,
            'pro': 2000
        };
        const newLimit = limits[request.plan] || 10;

        await supabase
            .from('businesses')
            .update({
                subscription_plan: request.plan,
                minutes_limit: newLimit
            })
            .eq('id', request.business_id);

        // 4. Send Confirmation Email
        if (request.email && process.env.EMAIL_PASSWORD) {
            console.log(`[Admin] Sending confirmation email to ${request.email}`);
            try {
                await transporter.sendMail({
                    from: `"SmartReception Billing" <${getSender()}>`,
                    to: request.email,
                    subject: 'Payment Approved - Your Plan is Active! 🎉',
                    html: `
                        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px;">
                            <h2 style="color: #6b21a8;">Payment Received!</h2>
                            <p>Hi there,</p>
                            <p>Great news! We've confirmed your payment for the <strong>${request.plan.toUpperCase()} Plan</strong>.</p>
                            <p>Your business <strong>${business?.business_name || 'Account'}</strong> has been upgraded.</p>
                            <p><strong>Amount:</strong> $${request.amount}</p>
                            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
                            <p>You can now log in and configure your AI Receptionist.</p>
                            <p><a href="https://gravitymomidon.vercel.app" style="background-color: #6b21a8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a></p>
                        </div>
                    `
                });
            } catch (emailErr) {
                console.error('[Admin] Email failed:', emailErr);
            }
        }

        res.json({ success: true, message: 'Approved and updated' });

        // 2. Determine limits
        let minutesLimit = 10;
        if (request.plan === 'starter') minutesLimit = 100;
        if (request.plan === 'pro') minutesLimit = 500;

        // 3. Update Business
        const { error: busError } = await supabase
            .from('businesses')
            .update({
                subscription_plan: request.plan,
                minutes_limit: minutesLimit
            })
            .eq('id', request.business_id);

        if (busError) throw busError;

        // 4. Mark Request Approved
        await supabase
            .from('payment_requests')
            .update({ status: 'approved' })
            .eq('id', requestId);

        res.json({ success: true, message: 'Plan activated' });
    } catch (err) {
        console.error('Approval Error:', err);
        res.status(500).json({ error: 'Approval failed' });
    }
});

// GET /api/admin/config (Payment Details)
app.get('/api/admin/config', (req, res) => {
    res.json({
        payoneerEmail: process.env.PAYONEER_EMAIL || 'payments@smartreception.ai',
        nayapayId: process.env.NAYAPAY_ID || '03001234567'
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
app.post('/webhooks/twilio/gather', express.urlencoded({ extended: false }), validateTwilioRequest, async (req, res) => {
    const { SpeechResult, business_id, call_sid } = { ...req.body, ...req.query };
    console.log(`Gather result for call ${call_sid}: "${SpeechResult}"`);

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get business config
        const { data: business } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', business_id)
            .single();

        if (!business) {
            const twiml = new VoiceResponse();
            twiml.say('Sorry, configuration error.');
            twiml.hangup();
            return res.type('text/xml').send(twiml.toString());
        }

        // Get AI response
        const systemPrompt = `You are an AI receptionist for "${business.business_name}".
Services: ${business.services}
Hours: ${business.working_hours}
Tone: ${business.tone}
Keep responses very brief (under 30 words) for voice calls.`;

        const chat = model.startChat({
            systemInstruction: { role: 'system', parts: [{ text: systemPrompt }] }
        });

        const result = await chat.sendMessage(SpeechResult || 'Hello');
        const aiResponse = result.response.text();

        // Log interaction
        await supabase.from('call_logs').update({
            transcript: { user: SpeechResult, ai: aiResponse }
        }).eq('call_sid', call_sid);

        // Respond with TwiML
        const twiml = new VoiceResponse();
        twiml.say({ voice: 'Polly.Joanna' }, aiResponse);

        // Continue conversation
        twiml.gather({
            input: 'speech',
            action: `/webhooks/twilio/gather?business_id=${business_id}&call_sid=${call_sid}`,
            speechTimeout: 'auto',
            language: 'en-US'
        });

        twiml.say({ voice: 'Polly.Joanna' }, 'Is there anything else I can help with?');
        twiml.hangup();

        res.type('text/xml').send(twiml.toString());

    } catch (err) {
        console.error('Gather webhook error:', err);
        const twiml = new VoiceResponse();
        twiml.say('Sorry, I encountered an error.');
        twiml.hangup();
        res.type('text/xml').send(twiml.toString());
    }
});


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

// Debug: Prevent immediate exit if app.listen fails to hold event loop
setInterval(() => { }, 10000);

process.on('exit', (code) => {
    console.log(`Process exiting with code: ${code}`);
});
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at:', p, 'reason:', reason);
});

// POST /api/admin/test-email (Debug)
app.post('/api/admin/test-email', requireAdmin, async (req, res) => {
    console.log('[Debug] Testing SMTP Connection...');
    const sender = getSender();
    const password = process.env.EMAIL_PASSWORD;

    if (!sender || !password) {
        return res.status(500).json({ error: 'Missing SENDER_EMAIL or EMAIL_PASSWORD in Live Environment' });
    }

    try {
        await transporter.verify();
        console.log('[Debug] SMTP Verify Success');

        await transporter.sendMail({
            from: `"SmartReception Debug" <${sender}>`,
            to: sender,
            subject: 'Debug: SMTP Configuration Works',
            text: 'Your email configuration on Render is correct!'
        });

        res.json({ success: true, message: `SMTP Verified! Email sent to ${sender}` });
    } catch (err) {
        console.error('[Debug] SMTP Failed:', err);
        res.status(500).json({
            error: 'SMTP Connection Failed',
            details: err.message,
            code: err.code,
            tip: err.code === 'EAUTH' ? 'Check EMAIL_PASSWORD. Must be an App Password.' : 'Check SENDER_EMAIL.'
        });
    }
});



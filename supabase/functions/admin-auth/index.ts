
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface AdminAuthRequest {
  action: 'login' | 'logout' | 'verify';
  email?: string;
  password?: string;
  sessionToken?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('[ADMIN-AUTH] Request received:', req.method, req.url);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[ADMIN-AUTH] Handling CORS preflight');
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    console.log('[ADMIN-AUTH] Invalid method:', req.method);
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }

  try {
    const body: AdminAuthRequest = await req.json();
    console.log('[ADMIN-AUTH] Request body:', { action: body.action, email: body.email });

    // Validate required environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[ADMIN-AUTH] Missing environment variables');
      throw new Error('Server configuration error');
    }

    switch (body.action) {
      case 'login':
        if (!body.email || !body.password) {
          throw new Error('Email and password are required');
        }
        return await handleLogin(body.email, body.password, req);
      case 'logout':
        if (!body.sessionToken) {
          throw new Error('Session token is required');
        }
        return await handleLogout(body.sessionToken);
      case 'verify':
        if (!body.sessionToken) {
          throw new Error('Session token is required');
        }
        return await handleVerify(body.sessionToken);
      default:
        throw new Error('Invalid action');
    }
  } catch (error: any) {
    console.error('[ADMIN-AUTH] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: 'Failed to process admin authentication request'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  }
};

async function handleLogin(email: string, password: string, req: Request): Promise<Response> {
  console.log('[ADMIN-AUTH] Attempting login for:', email);

  try {
    // Verify admin credentials using the database function
    const { data: isValid, error: verifyError } = await supabase
      .rpc('verify_admin_password', {
        input_email: email,
        input_password: password
      });

    console.log('[ADMIN-AUTH] Password verification result:', { isValid, error: verifyError });

    if (verifyError) {
      console.error('[ADMIN-AUTH] Password verification error:', verifyError);
      throw new Error('Authentication failed');
    }

    if (!isValid) {
      console.log('[ADMIN-AUTH] Invalid credentials for:', email);
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { 
          status: 401, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      );
    }

    // Get admin user details
    const { data: adminUser, error: userError } = await supabase
      .from('admin_users')
      .select('id, email, full_name, is_active')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (userError || !adminUser) {
      console.error('[ADMIN-AUTH] User fetch error:', userError);
      throw new Error('User not found');
    }

    // Generate session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Create admin session
    const { error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        admin_id: adminUser.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString(),
        ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    if (sessionError) {
      console.error('[ADMIN-AUTH] Session creation error:', sessionError);
      throw new Error('Failed to create session');
    }

    // Update last login
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminUser.id);

    console.log('[ADMIN-AUTH] Login successful for:', email);

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          full_name: adminUser.full_name
        },
        sessionToken,
        expiresAt: expiresAt.toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  } catch (error: any) {
    console.error('[ADMIN-AUTH] Login error:', error);
    throw error;
  }
}

async function handleLogout(sessionToken: string): Promise<Response> {
  console.log('[ADMIN-AUTH] Handling logout');

  try {
    // Delete session
    const { error } = await supabase
      .from('admin_sessions')
      .delete()
      .eq('session_token', sessionToken);

    if (error) {
      console.error('[ADMIN-AUTH] Logout error:', error);
      throw new Error('Failed to logout');
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  } catch (error: any) {
    console.error('[ADMIN-AUTH] Logout error:', error);
    throw error;
  }
}

async function handleVerify(sessionToken: string): Promise<Response> {
  console.log('[ADMIN-AUTH] Verifying session');

  try {
    // Check if session exists and is valid
    const { data: session, error } = await supabase
      .from('admin_sessions')
      .select(`
        id,
        expires_at,
        admin_users (
          id,
          email,
          full_name,
          is_active
        )
      `)
      .eq('session_token', sessionToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !session) {
      console.log('[ADMIN-AUTH] Invalid or expired session:', error);
      return new Response(
        JSON.stringify({ valid: false }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      );
    }

    const adminUser = Array.isArray(session.admin_users) 
      ? session.admin_users[0] 
      : session.admin_users;

    if (!adminUser || !adminUser.is_active) {
      console.log('[ADMIN-AUTH] User not active');
      return new Response(
        JSON.stringify({ valid: false }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        user: {
          id: adminUser.id,
          email: adminUser.email,
          full_name: adminUser.full_name
        }
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      }
    );
  } catch (error: any) {
    console.error('[ADMIN-AUTH] Verify error:', error);
    throw error;
  }
}

serve(handler);

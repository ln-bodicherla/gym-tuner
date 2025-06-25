
import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req: Request) => {
  console.log('Admin Auth Function - Request received:', req.method);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const body = await req.json();
    console.log('Request body action:', body.action);

    switch (body.action) {
      case 'login':
        return await handleLogin(supabase, body, req);
      case 'logout':
        return await handleLogout(supabase, body);
      case 'verify':
        return await handleVerify(supabase, body);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Admin Auth Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function handleLogin(supabase: any, body: any, req: Request) {
  const { email, password } = body;
  
  if (!email || !password) {
    return new Response(
      JSON.stringify({ error: 'Email and password required', success: false }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  console.log('Attempting login for:', email);

  // Verify admin credentials
  const { data: isValid, error: verifyError } = await supabase
    .rpc('verify_admin_password', {
      input_email: email,
      input_password: password
    });

  if (verifyError || !isValid) {
    console.log('Invalid credentials for:', email);
    return new Response(
      JSON.stringify({ error: 'Invalid credentials', success: false }),
      { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
    console.error('User fetch error:', userError);
    return new Response(
      JSON.stringify({ error: 'User not found', success: false }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Generate session token
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  // Create session
  const { error: sessionError } = await supabase
    .from('admin_sessions')
    .insert({
      admin_id: adminUser.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      ip_address: req.headers.get('x-forwarded-for') || 'unknown',
      user_agent: req.headers.get('user-agent') || 'unknown'
    });

  if (sessionError) {
    console.error('Session creation error:', sessionError);
    return new Response(
      JSON.stringify({ error: 'Failed to create session', success: false }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  // Update last login
  await supabase
    .from('admin_users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', adminUser.id);

  console.log('Login successful for:', email);

  return new Response(
    JSON.stringify({
      success: true,
      sessionToken,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        full_name: adminUser.full_name
      }
    }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleLogout(supabase: any, body: any) {
  const { sessionToken } = body;
  
  if (!sessionToken) {
    return new Response(
      JSON.stringify({ error: 'Session token required', success: false }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  await supabase
    .from('admin_sessions')
    .delete()
    .eq('session_token', sessionToken);

  return new Response(
    JSON.stringify({ success: true }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

async function handleVerify(supabase: any, body: any) {
  const { sessionToken } = body;
  
  if (!sessionToken) {
    return new Response(
      JSON.stringify({ valid: false }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

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
    return new Response(
      JSON.stringify({ valid: false }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }

  const adminUser = Array.isArray(session.admin_users) 
    ? session.admin_users[0] 
    : session.admin_users;

  if (!adminUser || !adminUser.is_active) {
    return new Response(
      JSON.stringify({ valid: false }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  );
}

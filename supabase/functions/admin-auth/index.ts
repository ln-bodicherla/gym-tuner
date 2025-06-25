
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log(`[ADMIN-AUTH] ${req.method} request received`)
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[ADMIN-AUTH] Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const { action, email, password, session_token } = await req.json()
    console.log(`[ADMIN-AUTH] Action: ${action}`)

    if (action === 'login') {
      if (!email || !password) {
        return new Response(
          JSON.stringify({ success: false, error: 'Email and password required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      console.log(`[ADMIN-AUTH] Login attempt for: ${email}`)
      
      // Check if this is the correct admin credentials
      if (email !== 'admin@gymtuner.com' || password !== 'GymTuner2025!Admin') {
        console.log('[ADMIN-AUTH] Invalid credentials provided')
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Create session token
      const sessionToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      // Store session in simple table
      const { error: sessionError } = await supabase
        .from('admin_sessions')
        .insert({
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          admin_email: email,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        })

      if (sessionError) {
        console.error('[ADMIN-AUTH] Session creation failed:', sessionError)
        return new Response(
          JSON.stringify({ success: false, error: 'Session creation failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      console.log('[ADMIN-AUTH] Login successful')
      return new Response(
        JSON.stringify({
          success: true,
          session_token: sessionToken,
          admin: {
            email: 'admin@gymtuner.com',
            full_name: 'System Administrator'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'verify') {
      if (!session_token) {
        return new Response(
          JSON.stringify({ valid: false, error: 'No session token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      const { data: session, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('session_token', session_token)
        .single()

      if (error || !session) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      if (new Date(session.expires_at) < new Date()) {
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('session_token', session_token)

        return new Response(
          JSON.stringify({ valid: false, error: 'Session expired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      return new Response(
        JSON.stringify({
          valid: true,
          admin: {
            email: session.admin_email,
            full_name: 'System Administrator'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get_users') {
      if (!session_token) {
        return new Response(
          JSON.stringify({ error: 'No session token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Verify session
      const { data: session } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('session_token', session_token)
        .single()

      if (!session || new Date(session.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Invalid session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Get users using admin API
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch users' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      const users = authData?.users || []
      return new Response(
        JSON.stringify({ users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'analytics') {
      if (!session_token) {
        return new Response(
          JSON.stringify({ error: 'No session token' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Verify session
      const { data: session } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('session_token', session_token)
        .single()

      if (!session || new Date(session.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Invalid session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Get analytics data
      const { data: authData } = await supabase.auth.admin.listUsers()
      const totalUsers = authData?.users?.length || 0

      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const usersToday = authData?.users?.filter(user => 
        new Date(user.created_at) >= today
      ).length || 0

      const usersLast7Days = authData?.users?.filter(user => 
        new Date(user.created_at) >= sevenDaysAgo
      ).length || 0

      const usersLast30Days = authData?.users?.filter(user => 
        new Date(user.created_at) >= thirtyDaysAgo
      ).length || 0

      const analytics = {
        total_users: totalUsers,
        users_today: usersToday,
        users_last_7_days: usersLast7Days,
        users_last_30_days: usersLast30Days,
        active_subscribers: 0,
        inactive_subscribers: 0,
        total_sessions: 0,
        sessions_last_30_days: 0,
        total_page_views: 0,
        page_views_last_30_days: 0,
        total_workouts: 0,
        workouts_last_30_days: 0,
        total_workout_plans: 0,
        total_goals: 0,
        total_injuries: 0,
      }

      return new Response(
        JSON.stringify(analytics),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )

  } catch (error) {
    console.error('[ADMIN-AUTH] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

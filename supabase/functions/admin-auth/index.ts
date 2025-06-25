
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  console.log(`[ADMIN-AUTH] Request received: ${req.method} ${req.url}`)
  
  if (req.method === 'OPTIONS') {
    console.log('[ADMIN-AUTH] Handling CORS preflight')
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
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    let requestBody
    try {
      requestBody = await req.json()
      console.log('[ADMIN-AUTH] Request body received:', { 
        action: requestBody.action, 
        email: requestBody.email ? 'present' : 'missing' 
      })
    } catch (error) {
      console.error('[ADMIN-AUTH] Invalid JSON in request body:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    const { action, email, password, session_token } = requestBody
    console.log(`[ADMIN-AUTH] Processing action: ${action}`)

    if (action === 'login') {
      if (!email || !password) {
        console.log('[ADMIN-AUTH] Missing email or password')
        return new Response(
          JSON.stringify({ success: false, error: 'Email and password required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      console.log(`[ADMIN-AUTH] Login attempt for: ${email}`)
      
      // Check if admin user exists first
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('id, email, full_name, password_hash, is_active')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (adminError || !adminUser) {
        console.error('[ADMIN-AUTH] Admin user not found:', adminError)
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      console.log('[ADMIN-AUTH] Admin user found, verifying password')
      
      // Verify password using the database function
      const { data: isValid, error: verifyError } = await supabase.rpc('verify_admin_password', {
        input_email: email,
        input_password: password
      })

      if (verifyError) {
        console.error('[ADMIN-AUTH] Password verification error:', verifyError)
        return new Response(
          JSON.stringify({ success: false, error: 'Authentication failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      if (!isValid) {
        console.log('[ADMIN-AUTH] Invalid password for:', email)
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      console.log('[ADMIN-AUTH] Password verified successfully')

      // Create session
      const sessionToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour session

      const { error: sessionError } = await supabase
        .from('admin_sessions')
        .insert({
          admin_id: adminUser.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        })

      if (sessionError) {
        console.error('[ADMIN-AUTH] Session creation error:', sessionError)
        return new Response(
          JSON.stringify({ success: false, error: 'Session creation failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // Update last login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id)

      console.log(`[ADMIN-AUTH] Login successful for: ${email}`)

      return new Response(
        JSON.stringify({
          success: true,
          session_token: sessionToken,
          admin: {
            id: adminUser.id,
            email: adminUser.email,
            full_name: adminUser.full_name
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'verify') {
      if (!session_token) {
        return new Response(
          JSON.stringify({ valid: false, error: 'No session token provided' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Verify session
      const { data: session, error: sessionError } = await supabase
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
        .eq('session_token', session_token)
        .single()

      if (sessionError || !session) {
        console.log('[ADMIN-AUTH] Session lookup failed:', sessionError)
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Check if session is expired
      if (new Date(session.expires_at) < new Date()) {
        // Clean up expired session
        await supabase
          .from('admin_sessions')
          .delete()
          .eq('session_token', session_token)

        return new Response(
          JSON.stringify({ valid: false, error: 'Session expired' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Check if admin is still active
      if (!session.admin_users.is_active) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Admin account disabled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      return new Response(
        JSON.stringify({
          valid: true,
          admin: {
            id: session.admin_users.id,
            email: session.admin_users.email,
            full_name: session.admin_users.full_name
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'get_users') {
      if (!session_token) {
        return new Response(
          JSON.stringify({ error: 'No session token provided' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Verify admin session first
      const { data: session, error: sessionError } = await supabase
        .from('admin_sessions')
        .select('expires_at, admin_users!inner(is_active)')
        .eq('session_token', session_token)
        .single()

      if (sessionError || !session || new Date(session.expires_at) < new Date() || !session.admin_users.is_active) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      console.log('[ADMIN-AUTH] Fetching users with admin API...')

      // Get all users using the admin API (this is the correct way)
      const { data: authData, error: authError } = await supabase.auth.admin.listUsers()
      
      if (authError) {
        console.error('[ADMIN-AUTH] Error fetching auth users:', authError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch users' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      const authUsers = authData?.users || []
      console.log(`[ADMIN-AUTH] Found ${authUsers.length} auth users`)

      // Get subscription data
      const { data: subscribers, error: subError } = await supabase
        .from('subscribers')
        .select('user_id, subscribed, subscription_tier, subscription_end, trial_end')

      if (subError) {
        console.error('[ADMIN-AUTH] Error fetching subscribers:', subError)
      }

      // Get profile data
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')

      if (profileError) {
        console.error('[ADMIN-AUTH] Error fetching profiles:', profileError)
      }

      // Get activity counts
      const { data: workoutCounts, error: workoutError } = await supabase
        .from('workouts')
        .select('user_id')

      const { data: goalCounts, error: goalError } = await supabase
        .from('goals')
        .select('user_id')

      const { data: injuryCounts, error: injuryError } = await supabase
        .from('injuries')
        .select('user_id')

      // Create lookup maps for efficiency
      const subscriberMap = new Map()
      subscribers?.forEach(sub => subscriberMap.set(sub.user_id, sub))

      const profileMap = new Map()
      profiles?.forEach(profile => profileMap.set(profile.id, profile))

      const workoutCountMap = new Map()
      workoutCounts?.forEach(workout => {
        const count = workoutCountMap.get(workout.user_id) || 0
        workoutCountMap.set(workout.user_id, count + 1)
      })

      const goalCountMap = new Map()
      goalCounts?.forEach(goal => {
        const count = goalCountMap.get(goal.user_id) || 0
        goalCountMap.set(goal.user_id, count + 1)
      })

      const injuryCountMap = new Map()
      injuryCounts?.forEach(injury => {
        const count = injuryCountMap.get(injury.user_id) || 0
        injuryCountMap.set(injury.user_id, count + 1)
      })

      // Combine all user data
      const users = authUsers.map(user => {
        const subscription = subscriberMap.get(user.id) || {}
        const profile = profileMap.get(user.id) || {}
        
        return {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
          full_name: profile.full_name || user.user_metadata?.full_name,
          subscribed: subscription.subscribed || false,
          subscription_tier: subscription.subscription_tier,
          subscription_end: subscription.subscription_end,
          trial_end: subscription.trial_end,
          total_workouts: workoutCountMap.get(user.id) || 0,
          total_goals: goalCountMap.get(user.id) || 0,
          total_injuries: injuryCountMap.get(user.id) || 0,
        }
      })

      console.log(`[ADMIN-AUTH] Returning ${users.length} users with complete data`)

      return new Response(
        JSON.stringify({ users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'analytics') {
      if (!session_token) {
        return new Response(
          JSON.stringify({ error: 'No session token provided' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Verify admin session first
      const { data: session, error: sessionError } = await supabase
        .from('admin_sessions')
        .select('expires_at, admin_users!inner(is_active)')
        .eq('session_token', session_token)
        .single()

      if (sessionError || !session || new Date(session.expires_at) < new Date() || !session.admin_users.is_active) {
        return new Response(
          JSON.stringify({ error: 'Invalid or expired session' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Get analytics data using admin API
      const { data: authData } = await supabase.auth.admin.listUsers()
      const totalUsers = authData?.users?.length || 0

      // Get users from different time periods
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

      // Get subscription data with proper filtering
      const { data: subscribers } = await supabase
        .from('subscribers')
        .select('subscribed, subscription_tier')

      // Only count actual subscribed users, not all subscriber records
      const activeSubscribers = subscribers?.filter(s => s.subscribed === true).length || 0
      // Count users who have subscriber records but are not actively subscribed
      const inactiveSubscribers = subscribers?.filter(s => s.subscribed === false).length || 0

      // Get activity data
      const { data: workouts } = await supabase.from('workouts').select('id, created_at')
      const { data: workoutPlans } = await supabase.from('workout_plans').select('id')
      const { data: goals } = await supabase.from('goals').select('id')
      const { data: injuries } = await supabase.from('injuries').select('id')
      const { data: sessions } = await supabase.from('analytics_sessions').select('id, created_at')
      const { data: pageViews } = await supabase.from('analytics_events').select('id, created_at')

      const workoutsLast30Days = workouts?.filter(w => 
        new Date(w.created_at) >= thirtyDaysAgo
      ).length || 0

      const sessionsLast30Days = sessions?.filter(s => 
        new Date(s.created_at) >= thirtyDaysAgo
      ).length || 0

      const pageViewsLast30Days = pageViews?.filter(pv => 
        new Date(pv.created_at) >= thirtyDaysAgo
      ).length || 0

      const analytics = {
        total_users: totalUsers,
        users_today: usersToday,
        users_last_7_days: usersLast7Days,
        users_last_30_days: usersLast30Days,
        active_subscribers: activeSubscribers,
        inactive_subscribers: inactiveSubscribers,
        basic_subscribers: 0,
        premium_subscribers: 0,
        enterprise_subscribers: 0,
        total_sessions: sessions?.length || 0,
        sessions_last_30_days: sessionsLast30Days,
        total_page_views: pageViews?.length || 0,
        page_views_last_30_days: pageViewsLast30Days,
        total_workouts: workouts?.length || 0,
        workouts_last_30_days: workoutsLast30Days,
        total_workout_plans: workoutPlans?.length || 0,
        total_goals: goals?.length || 0,
        total_injuries: injuries?.length || 0,
      }

      console.log('[ADMIN-AUTH] Analytics data:', analytics)

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
    console.error('[ADMIN-AUTH] Server error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

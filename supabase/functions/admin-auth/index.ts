
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, email, password, session_token } = await req.json()

    if (action === 'login') {
      console.log('Login attempt for:', email)
      
      // Check if admin user exists and is active
      const { data: adminUser, error: adminError } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single()

      if (adminError) {
        console.error('Admin user lookup error:', adminError)
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      if (!adminUser) {
        console.log('Admin user not found or inactive')
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Verify password using crypt function
      const { data: passwordCheck, error: passwordError } = await supabaseClient
        .rpc('verify_admin_password', {
          input_email: email,
          input_password: password
        })

      if (passwordError) {
        console.error('Password verification error:', passwordError)
        // Fallback to direct password comparison using SQL
        const { data: directCheck, error: directError } = await supabaseClient
          .from('admin_users')
          .select('password_hash')
          .eq('email', email)
          .single()

        if (directError || !directCheck) {
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid credentials' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }

        // Use a simple verification as fallback
        const { data: cryptCheck } = await supabaseClient
          .rpc('verify_password', {
            password: password,
            hash: directCheck.password_hash
          }).single()

        if (!cryptCheck) {
          console.log('Password verification failed')
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid credentials' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          )
        }
      } else if (!passwordCheck) {
        console.log('Password check returned false')
        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      console.log('Password verified successfully')

      // Create admin session
      const sessionToken = crypto.randomUUID()
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      const { error: sessionError } = await supabaseClient
        .from('admin_sessions')
        .insert({
          admin_id: adminUser.id,
          session_token: sessionToken,
          expires_at: expiresAt.toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          user_agent: req.headers.get('user-agent') || 'unknown'
        })

      if (sessionError) {
        console.error('Session creation error:', sessionError)
        return new Response(
          JSON.stringify({ success: false, error: 'Session creation failed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // Update last login
      await supabaseClient
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', adminUser.id)

      console.log('Login successful for:', email)
      return new Response(
        JSON.stringify({ success: true, session_token: sessionToken }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'verify') {
      // Verify admin session
      const { data: session, error: sessionError } = await supabaseClient
        .from('admin_sessions')
        .select(`
          *,
          admin_users (
            id,
            email,
            full_name,
            is_active
          )
        `)
        .eq('session_token', session_token)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (sessionError || !session || !session.admin_users.is_active) {
        return new Response(
          JSON.stringify({ valid: false }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ valid: true, admin: session.admin_users }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'analytics') {
      // Verify admin session first
      const { data: session } = await supabaseClient
        .from('admin_sessions')
        .select('admin_users!inner(*)')
        .eq('session_token', session_token)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (!session) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }

      // Get analytics data
      const analytics = await getAnalyticsData(supabaseClient)

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
    console.error('Admin auth error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function getAnalyticsData(supabaseClient: any) {
  try {
    // Get user statistics
    const { count: totalUsers } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    const { count: usersLast30Days } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const { count: usersLast7Days } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const { count: usersToday } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date().toISOString().split('T')[0])

    // Get subscription statistics
    const { count: activeSubscribers } = await supabaseClient
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed', true)

    const { count: inactiveSubscribers } = await supabaseClient
      .from('subscribers')
      .select('*', { count: 'exact', head: true })
      .eq('subscribed', false)

    // Get analytics statistics
    const { data: sessions } = await supabaseClient
      .from('analytics_sessions')
      .select('session_id')

    const uniqueSessions = new Set(sessions?.map(s => s.session_id) || []).size

    const { count: totalPageViews } = await supabaseClient
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view')

    const { count: pageViewsLast30Days } = await supabaseClient
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    // Get activity statistics
    const { count: totalWorkouts } = await supabaseClient
      .from('workouts')
      .select('*', { count: 'exact', head: true })

    const { count: workoutsLast30Days } = await supabaseClient
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    const { count: totalWorkoutPlans } = await supabaseClient
      .from('workout_plans')
      .select('*', { count: 'exact', head: true })

    const { count: totalGoals } = await supabaseClient
      .from('goals')
      .select('*', { count: 'exact', head: true })

    const { count: totalInjuries } = await supabaseClient
      .from('injuries')
      .select('*', { count: 'exact', head: true })

    return {
      total_users: totalUsers || 0,
      users_last_30_days: usersLast30Days || 0,
      users_last_7_days: usersLast7Days || 0,
      users_today: usersToday || 0,
      active_subscribers: activeSubscribers || 0,
      inactive_subscribers: inactiveSubscribers || 0,
      basic_subscribers: 0,
      premium_subscribers: 0,
      enterprise_subscribers: 0,
      total_sessions: uniqueSessions,
      sessions_last_30_days: uniqueSessions, // Simplified for now
      total_page_views: totalPageViews || 0,
      page_views_last_30_days: pageViewsLast30Days || 0,
      total_workouts: totalWorkouts || 0,
      workouts_last_30_days: workoutsLast30Days || 0,
      total_workout_plans: totalWorkoutPlans || 0,
      total_goals: totalGoals || 0,
      total_injuries: totalInjuries || 0
    }
  } catch (error) {
    console.error('Analytics data error:', error)
    return {}
  }
}

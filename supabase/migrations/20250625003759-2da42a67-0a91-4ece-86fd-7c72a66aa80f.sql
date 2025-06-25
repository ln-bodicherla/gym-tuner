
-- Create a table to track page views and visitor analytics
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'session_start', 'button_click', etc.
  page_path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET,
  country TEXT,
  region TEXT,
  city TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id), -- null for anonymous users
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for better query performance
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_page_path ON public.analytics_events(page_path);

-- Create a table for session summaries (aggregated data)
CREATE TABLE public.analytics_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id), -- null for anonymous users
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  page_views INTEGER DEFAULT 0,
  ip_address INET,
  country TEXT,
  region TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer TEXT,
  landing_page TEXT,
  exit_page TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for session data
CREATE INDEX idx_analytics_sessions_session_id ON public.analytics_sessions(session_id);
CREATE INDEX idx_analytics_sessions_started_at ON public.analytics_sessions(started_at);
CREATE INDEX idx_analytics_sessions_country ON public.analytics_sessions(country);

-- Enable RLS (Row Level Security) - admin only access for now
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access (you can modify these based on your needs)
CREATE POLICY "Admin can view all analytics events" ON public.analytics_events FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'lnb1394@gmail.com' -- Replace with your admin email
  )
);

CREATE POLICY "Admin can view all analytics sessions" ON public.analytics_sessions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE auth.users.id = auth.uid() 
    AND auth.users.email = 'lnb1394@gmail.com' -- Replace with your admin email
  )
);

-- Allow anonymous inserts for tracking (but not reads)
CREATE POLICY "Allow anonymous analytics tracking" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous session tracking" ON public.analytics_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow session updates" ON public.analytics_sessions FOR UPDATE USING (true);

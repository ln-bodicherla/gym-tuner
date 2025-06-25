
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

// Generate a unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

// Get device type based on screen width
const getDeviceType = () => {
  if (typeof window === 'undefined') return 'unknown';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Parse user agent for browser and OS info
const parseUserAgent = (userAgent: string) => {
  const browser = userAgent.includes('Chrome') ? 'Chrome' :
                 userAgent.includes('Firefox') ? 'Firefox' :
                 userAgent.includes('Safari') ? 'Safari' :
                 userAgent.includes('Edge') ? 'Edge' : 'Unknown';
  
  const os = userAgent.includes('Windows') ? 'Windows' :
            userAgent.includes('Mac') ? 'macOS' :
            userAgent.includes('Linux') ? 'Linux' :
            userAgent.includes('Android') ? 'Android' :
            userAgent.includes('iOS') ? 'iOS' : 'Unknown';
  
  return { browser, os };
};

export const useAnalytics = () => {
  const location = useLocation();
  const { user } = useAuth();
  const sessionIdRef = useRef<string>(generateSessionId());
  const [isInitialized, setIsInitialized] = useState(false);
  const lastPageRef = useRef<string>('');

  // Initialize session on first load
  useEffect(() => {
    if (isInitialized) return;

    const initializeSession = async () => {
      try {
        const userAgent = navigator.userAgent;
        const { browser, os } = parseUserAgent(userAgent);
        
        // Create session record
        await supabase
          .from('analytics_sessions')
          .insert({
            session_id: sessionIdRef.current,
            user_id: user?.id || null,
            started_at: new Date().toISOString(),
            device_type: getDeviceType(),
            browser,
            os,
            referrer: document.referrer || null,
            landing_page: location.pathname,
            page_views: 1
          });

        // Track session start event
        await trackEvent('session_start', {
          landing_page: location.pathname,
          referrer: document.referrer
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing analytics session:', error);
      }
    };

    initializeSession();
  }, [user?.id, location.pathname, isInitialized]);

  // Track page views
  useEffect(() => {
    if (!isInitialized || lastPageRef.current === location.pathname) return;

    const trackPageView = async () => {
      try {
        // Track page view event
        await trackEvent('page_view', {
          previous_page: lastPageRef.current
        });

        // Update session with new page view
        await supabase
          .from('analytics_sessions')
          .update({
            updated_at: new Date().toISOString(),
            page_views: supabase.raw('page_views + 1'),
            exit_page: location.pathname
          })
          .eq('session_id', sessionIdRef.current);

        lastPageRef.current = location.pathname;
      } catch (error) {
        console.error('Error tracking page view:', error);
      }
    };

    trackPageView();
  }, [location.pathname, isInitialized]);

  // Track custom events
  const trackEvent = async (eventType: string, metadata: Record<string, any> = {}) => {
    if (!isInitialized && eventType !== 'session_start') return;

    try {
      const userAgent = navigator.userAgent;
      const { browser, os } = parseUserAgent(userAgent);

      await supabase
        .from('analytics_events')
        .insert({
          session_id: sessionIdRef.current,
          event_type: eventType,
          page_path: location.pathname,
          referrer: document.referrer || null,
          user_agent: userAgent,
          device_type: getDeviceType(),
          browser,
          os,
          user_id: user?.id || null,
          metadata
        });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  };

  // End session (call on page unload)
  const endSession = async () => {
    if (!isInitialized) return;

    try {
      const endTime = new Date().toISOString();
      
      // Get session start time to calculate duration
      const { data: session } = await supabase
        .from('analytics_sessions')
        .select('started_at')
        .eq('session_id', sessionIdRef.current)
        .single();

      if (session) {
        const duration = Math.floor(
          (new Date().getTime() - new Date(session.started_at).getTime()) / 1000
        );

        await supabase
          .from('analytics_sessions')
          .update({
            ended_at: endTime,
            duration_seconds: duration,
            updated_at: endTime
          })
          .eq('session_id', sessionIdRef.current);
      }

      await trackEvent('session_end');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  // Setup beforeunload listener
  useEffect(() => {
    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isInitialized]);

  return {
    trackEvent,
    sessionId: sessionIdRef.current,
    endSession
  };
};

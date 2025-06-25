
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-WORKOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    if (!geminiApiKey) {
      logStep("ERROR: GEMINI_API_KEY not found in environment variables");
      throw new Error("GEMINI_API_KEY is not set");
    }

    logStep("API key found");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    const { userData } = await req.json();
    logStep("Received user data", { 
      hasProfile: !!userData.profile,
      injuriesCount: userData.injuries?.length || 0,
      goalsCount: userData.goals?.length || 0,
      workoutsCount: userData.workouts?.length || 0
    });

    // Prepare user context for AI
    const userContext = {
      profile: userData.profile || {},
      injuries: userData.injuries || [],
      goals: userData.goals || [],
      recentWorkouts: userData.workouts || []
    };

    // Create detailed prompt for AI
    const prompt = `You are an expert fitness trainer and workout planner. Generate a personalized workout plan based on the following user data:

USER PROFILE:
${userContext.profile ? `
- Fitness Level: ${userContext.profile.fitness_level || 'beginner'}
- Age: ${userContext.profile.age || 'not specified'}
- Weight: ${userContext.profile.weight || 'not specified'}
- Height: ${userContext.profile.height || 'not specified'}
- Experience Years: ${userContext.profile.experience_years || 'not specified'}
- Max Workout Time: ${userContext.profile.max_workout_time || 45} minutes
- Min Workout Time: ${userContext.profile.min_workout_time || 15} minutes
- Weekly Goal: ${userContext.profile.weekly_goal || 3} sessions per week
- Preferred Workout Types: ${userContext.profile.preferred_workout_types || 'not specified'}
- Availability: ${userContext.profile.availability || 'not specified'}
- Limitations: ${userContext.profile.limitations || 'none'}
- Preferences: ${userContext.profile.preferences || 'none'}
` : 'No detailed profile available'}

ACTIVE INJURIES:
${userContext.injuries.filter(injury => injury.status === 'active').map(injury => 
  `- ${injury.name}: ${injury.notes || 'No details'}`
).join('\n') || 'No active injuries'}

FITNESS GOALS:
${userContext.goals.map(goal => 
  `- ${goal.title}: ${goal.description || 'No description'} (Status: ${goal.status})`
).join('\n') || 'No specific goals set'}

RECENT WORKOUT HISTORY (Last 30 days):
${userContext.recentWorkouts.map(workout => 
  `- ${workout.name} (${workout.duration_minutes}min) on ${workout.workout_date}`
).join('\n') || 'No recent workouts'}

Based on this information, create a personalized workout plan for today. The workout should:
1. Be appropriate for the user's fitness level and any injuries
2. Align with their fitness goals
3. Respect their time constraints
4. Consider their recent workout history to avoid overtraining
5. Include proper warm-up and cool-down if time allows

Respond with a JSON object in this exact format:
{
  "name": "Workout name (e.g., 'Upper Body Strength', 'HIIT Cardio Blast')",
  "description": "Brief description of the workout and why it's suitable for this user",
  "duration_minutes": 45,
  "difficulty_level": "beginner|intermediate|advanced",
  "exercises": [
    {
      "name": "Exercise name",
      "sets": 3,
      "reps": "8-12 or time duration",
      "rest": "60s",
      "completed": false
    }
  ]
}

Make sure the total estimated time for all exercises (including rest) fits within the duration_minutes. Include 4-8 exercises depending on the workout duration.`;

    logStep("Calling AI API");

    let workoutPlan;

    try {
      // Call AI API with retry logic
      const aiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`;
      
      const aiResponse = await fetch(aiApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          }
        })
      });

      if (!aiResponse.ok) {
        logStep("AI API error", { status: aiResponse.status, statusText: aiResponse.statusText });
        
        // If AI service is unavailable, use fallback
        if (aiResponse.status === 503 || aiResponse.status >= 500) {
          logStep("AI service unavailable, using fallback workout");
          workoutPlan = createFallbackWorkout(userContext);
        } else {
          throw new Error(`AI API error: ${aiResponse.status} ${aiResponse.statusText}`);
        }
      } else {
        const aiData = await aiResponse.json();
        logStep("AI response received", { hasResponse: !!aiData.candidates?.[0] });

        if (!aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
          throw new Error("No content generated by AI");
        }

        const generatedText = aiData.candidates[0].content.parts[0].text;
        logStep("Generated text length", { length: generatedText.length });

        // Extract JSON from the response
        try {
          const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            workoutPlan = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No JSON found in response");
          }
        } catch (parseError) {
          logStep("JSON parse error, using fallback", { error: parseError.message });
          workoutPlan = createFallbackWorkout(userContext);
        }
      }
    } catch (networkError) {
      logStep("Network error, using fallback", { error: networkError.message });
      workoutPlan = createFallbackWorkout(userContext);
    }

    // Validate the workout plan structure
    if (!workoutPlan.name || !workoutPlan.exercises || !Array.isArray(workoutPlan.exercises)) {
      logStep("Invalid workout plan structure, using fallback");
      workoutPlan = createFallbackWorkout(userContext);
    }

    logStep("Workout plan generated successfully", { 
      name: workoutPlan.name,
      exerciseCount: workoutPlan.exercises.length 
    });

    return new Response(JSON.stringify({ workoutPlan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in generate-workout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function createFallbackWorkout(userContext: any) {
  const profile = userContext.profile || {};
  const maxTime = profile.max_workout_time || 45;
  const fitnessLevel = profile.fitness_level || "beginner";
  const hasInjuries = userContext.injuries?.some((injury: any) => injury.status === 'active') || false;
  
  // Create exercises based on user profile
  let exercises;
  
  if (hasInjuries) {
    // Low-impact exercises for users with injuries
    exercises = [
      { name: "Gentle Warm-up Walk", sets: 1, reps: "5 minutes", rest: "30s", completed: false },
      { name: "Seated Arm Circles", sets: 2, reps: "10 each direction", rest: "30s", completed: false },
      { name: "Chair-assisted Squats", sets: 2, reps: "8-10", rest: "60s", completed: false },
      { name: "Wall Push-ups", sets: 2, reps: "8-12", rest: "60s", completed: false },
      { name: "Standing Calf Raises", sets: 2, reps: "12-15", rest: "45s", completed: false },
      { name: "Gentle Stretching", sets: 1, reps: "5 minutes", rest: "0s", completed: false }
    ];
  } else if (fitnessLevel === "beginner") {
    exercises = [
      { name: "Bodyweight Squats", sets: 3, reps: "8-12", rest: "60s", completed: false },
      { name: "Modified Push-ups", sets: 3, reps: "5-10", rest: "60s", completed: false },
      { name: "Plank Hold", sets: 2, reps: "20-30s", rest: "60s", completed: false },
      { name: "Lunges", sets: 2, reps: "6-8 each leg", rest: "60s", completed: false },
      { name: "Mountain Climbers", sets: 2, reps: "20s", rest: "60s", completed: false },
      { name: "Stretching Cool-down", sets: 1, reps: "5 minutes", rest: "0s", completed: false }
    ];
  } else if (fitnessLevel === "intermediate") {
    exercises = [
      { name: "Jump Squats", sets: 3, reps: "12-15", rest: "60s", completed: false },
      { name: "Push-ups", sets: 3, reps: "10-15", rest: "60s", completed: false },
      { name: "Plank Hold", sets: 3, reps: "45-60s", rest: "60s", completed: false },
      { name: "Reverse Lunges", sets: 3, reps: "10-12 each leg", rest: "60s", completed: false },
      { name: "Burpees", sets: 2, reps: "8-10", rest: "90s", completed: false },
      { name: "Russian Twists", sets: 2, reps: "20", rest: "45s", completed: false },
      { name: "Cool-down Stretches", sets: 1, reps: "5 minutes", rest: "0s", completed: false }
    ];
  } else {
    // Advanced level
    exercises = [
      { name: "Pistol Squats", sets: 3, reps: "5-8 each leg", rest: "90s", completed: false },
      { name: "Diamond Push-ups", sets: 3, reps: "12-15", rest: "60s", completed: false },
      { name: "Single-arm Plank", sets: 2, reps: "30s each arm", rest: "60s", completed: false },
      { name: "Bulgarian Split Squats", sets: 3, reps: "12-15 each leg", rest: "60s", completed: false },
      { name: "Burpee Box Jumps", sets: 3, reps: "8-10", rest: "90s", completed: false },
      { name: "Pike Push-ups", sets: 2, reps: "8-12", rest: "60s", completed: false },
      { name: "Hollow Body Hold", sets: 2, reps: "30-45s", rest: "60s", completed: false },
      { name: "Stretching Routine", sets: 1, reps: "5 minutes", rest: "0s", completed: false }
    ];
  }

  return {
    name: `${fitnessLevel.charAt(0).toUpperCase()}${fitnessLevel.slice(1)} Full Body Workout`,
    description: `A balanced full-body workout designed for your ${fitnessLevel} fitness level${hasInjuries ? ' with injury-friendly modifications' : ''}. This plan provides a complete workout experience while respecting your current capabilities.`,
    duration_minutes: maxTime,
    difficulty_level: fitnessLevel,
    exercises: exercises
  };
}

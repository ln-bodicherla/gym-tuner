
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

    const aiApiKey = Deno.env.get("AI_API_KEY");
    if (!aiApiKey) throw new Error("AI_API_KEY is not set");

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

    // Call AI API (using a generic endpoint that can be configured)
    const aiApiUrl = Deno.env.get("AI_API_URL") || `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${aiApiKey}`;
    
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
      throw new Error(`AI API error: ${aiResponse.status} ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    logStep("AI response received", { hasResponse: !!aiData.candidates?.[0] });

    if (!aiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error("No content generated by AI");
    }

    const generatedText = aiData.candidates[0].content.parts[0].text;
    logStep("Generated text length", { length: generatedText.length });

    // Extract JSON from the response
    let workoutPlan;
    try {
      // Try to find JSON in the response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        workoutPlan = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      logStep("JSON parse error, creating fallback", { error: parseError.message });
      // Fallback workout if JSON parsing fails
      workoutPlan = {
        name: "Full Body Workout",
        description: "A balanced full-body workout suitable for your fitness level",
        duration_minutes: userContext.profile?.max_workout_time || 45,
        difficulty_level: userContext.profile?.fitness_level || "beginner",
        exercises: [
          { name: "Bodyweight Squats", sets: 3, reps: "10-15", rest: "60s", completed: false },
          { name: "Push-ups", sets: 3, reps: "8-12", rest: "60s", completed: false },
          { name: "Plank Hold", sets: 2, reps: "30-45s", rest: "45s", completed: false },
          { name: "Lunges", sets: 2, reps: "10 each leg", rest: "60s", completed: false }
        ]
      };
    }

    // Validate the workout plan structure
    if (!workoutPlan.name || !workoutPlan.exercises || !Array.isArray(workoutPlan.exercises)) {
      throw new Error("Invalid workout plan structure from AI");
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

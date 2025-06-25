
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

    // Prepare user context for AI with enhanced workout history analysis
    const userContext = {
      profile: userData.profile || {},
      injuries: userData.injuries || [],
      goals: userData.goals || [],
      recentWorkouts: userData.workouts || []
    };

    // Analyze workout patterns for better personalization
    const workoutAnalysis = analyzeWorkoutHistory(userContext.recentWorkouts);
    
    // Create detailed prompt for AI with enhanced workout history context
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

WORKOUT HISTORY ANALYSIS:
${generateWorkoutHistoryContext(userContext.recentWorkouts, workoutAnalysis)}

Based on this comprehensive information, create a personalized workout plan for today. The workout should:
1. Be appropriate for the user's fitness level and any injuries
2. Align with their fitness goals
3. Respect their time constraints
4. Consider their workout history to avoid overtraining and ensure progressive overload
5. Vary from recent workouts to prevent plateaus and maintain engagement
6. Include proper warm-up and cool-down if time allows

Respond with a JSON object in this exact format:
{
  "name": "Workout name (e.g., 'Upper Body Strength', 'HIIT Cardio Blast')",
  "description": "Brief description of the workout and why it's suitable for this user based on their history",
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
          workoutPlan = createFallbackWorkout(userContext, workoutAnalysis);
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
          workoutPlan = createFallbackWorkout(userContext, workoutAnalysis);
        }
      }
    } catch (networkError) {
      logStep("Network error, using fallback", { error: networkError.message });
      workoutPlan = createFallbackWorkout(userContext, workoutAnalysis);
    }

    // Validate the workout plan structure
    if (!workoutPlan.name || !workoutPlan.exercises || !Array.isArray(workoutPlan.exercises)) {
      logStep("Invalid workout plan structure, using fallback");
      workoutPlan = createFallbackWorkout(userContext, workoutAnalysis);
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

function analyzeWorkoutHistory(workouts: any[]) {
  if (!workouts || workouts.length === 0) {
    return {
      frequentExercises: [],
      averageDuration: 45,
      lastWorkoutDays: 999,
      workoutTypes: [],
      totalWorkouts: 0
    };
  }

  // Calculate days since last workout
  const lastWorkout = workouts[0];
  const lastWorkoutDate = new Date(lastWorkout.workout_date);
  const today = new Date();
  const daysSinceLastWorkout = Math.floor((today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24));

  // Extract exercise patterns from workout names
  const workoutNames = workouts.map(w => w.name?.toLowerCase() || '').filter(Boolean);
  const exerciseKeywords = ['chest', 'back', 'legs', 'arms', 'shoulders', 'cardio', 'hiit', 'strength', 'core', 'abs'];
  const workoutTypes = exerciseKeywords.filter(keyword => 
    workoutNames.some(name => name.includes(keyword))
  );

  // Calculate average duration
  const durationsWithData = workouts.filter(w => w.duration_minutes && w.duration_minutes > 0);
  const averageDuration = durationsWithData.length > 0 
    ? Math.round(durationsWithData.reduce((sum, w) => sum + w.duration_minutes, 0) / durationsWithData.length)
    : 45;

  return {
    frequentExercises: workoutTypes,
    averageDuration,
    lastWorkoutDays: daysSinceLastWorkout,
    workoutTypes,
    totalWorkouts: workouts.length
  };
}

function generateWorkoutHistoryContext(workouts: any[], analysis: any) {
  if (!workouts || workouts.length === 0) {
    return "No previous workout history available - this is a fresh start!";
  }

  let context = `Total Workouts Completed: ${analysis.totalWorkouts}\n`;
  context += `Average Workout Duration: ${analysis.averageDuration} minutes\n`;
  context += `Days Since Last Workout: ${analysis.lastWorkoutDays}\n`;
  
  if (analysis.workoutTypes.length > 0) {
    context += `Previous Workout Focus Areas: ${analysis.workoutTypes.join(', ')}\n`;
  }

  // Add recent workout details for better context
  context += "\nRecent Workout History:\n";
  workouts.slice(0, 5).forEach((workout, index) => {
    const date = new Date(workout.workout_date).toLocaleDateString();
    context += `- ${workout.name || 'Workout'} (${workout.duration_minutes || 'Unknown'} min) on ${date}\n`;
  });

  // Add recommendations based on history
  if (analysis.lastWorkoutDays > 7) {
    context += "\nNote: It's been over a week since the last workout - consider a moderate intensity to ease back in.\n";
  } else if (analysis.lastWorkoutDays <= 1) {
    context += "\nNote: Recent workout detected - ensure adequate recovery and vary the focus area.\n";
  }

  return context;
}

function createFallbackWorkout(userContext: any, analysis: any) {
  const profile = userContext.profile || {};
  const maxTime = profile.max_workout_time || analysis.averageDuration || 45;
  const fitnessLevel = profile.fitness_level || "beginner";
  const hasInjuries = userContext.injuries?.some((injury: any) => injury.status === 'active') || false;
  
  // Create exercises based on user profile and workout history
  let exercises;
  let workoutName;
  let description;
  
  // Determine workout focus based on history to ensure variety
  const recentWorkoutTypes = analysis.workoutTypes || [];
  const shouldFocusCardio = !recentWorkoutTypes.includes('cardio') && recentWorkoutTypes.includes('strength');
  const shouldFocusUpperBody = !recentWorkoutTypes.includes('chest') && !recentWorkoutTypes.includes('arms');
  const shouldFocusLowerBody = !recentWorkoutTypes.includes('legs');
  
  if (hasInjuries) {
    // Low-impact exercises for users with injuries
    workoutName = "Gentle Recovery Workout";
    description = "A low-impact recovery session designed around your current injuries, focusing on movement and flexibility.";
    exercises = [
      { name: "Gentle Warm-up Walk", sets: 1, reps: "5 minutes", rest: "30s", completed: false },
      { name: "Seated Arm Circles", sets: 2, reps: "10 each direction", rest: "30s", completed: false },
      { name: "Chair-assisted Squats", sets: 2, reps: "8-10", rest: "60s", completed: false },
      { name: "Wall Push-ups", sets: 2, reps: "8-12", rest: "60s", completed: false },
      { name: "Standing Calf Raises", sets: 2, reps: "12-15", rest: "45s", completed: false },
      { name: "Gentle Stretching", sets: 1, reps: "5 minutes", rest: "0s", completed: false }
    ];
  } else if (shouldFocusCardio && fitnessLevel !== "beginner") {
    workoutName = "High Energy Cardio Blast";
    description = `A dynamic cardio session to complement your recent strength training, designed for your ${fitnessLevel} fitness level.`;
    exercises = [
      { name: "Dynamic Warm-up", sets: 1, reps: "3 minutes", rest: "30s", completed: false },
      { name: "Jumping Jacks", sets: 3, reps: "30s", rest: "30s", completed: false },
      { name: "High Knees", sets: 3, reps: "30s", rest: "30s", completed: false },
      { name: "Burpees", sets: 3, reps: "8-12", rest: "90s", completed: false },
      { name: "Mountain Climbers", sets: 3, reps: "45s", rest: "60s", completed: false },
      { name: "Jump Squats", sets: 3, reps: "12-15", rest: "60s", completed: false },
      { name: "Cool-down Stretches", sets: 1, reps: "5 minutes", rest: "0s", completed: false }
    ];
  } else if (shouldFocusUpperBody) {
    workoutName = "Upper Body Strength Focus";
    description = `An upper body strength session to balance your recent lower body work, tailored for ${fitnessLevel} level.`;
    exercises = fitnessLevel === "beginner" ? [
      { name: "Arm Circles Warm-up", sets: 1, reps: "2 minutes", rest: "30s", completed: false },
      { name: "Wall Push-ups", sets: 3, reps: "8-12", rest: "60s", completed: false },
      { name: "Incline Push-ups", sets: 2, reps: "6-10", rest: "60s", completed: false },
      { name: "Arm Raises", sets: 2, reps: "10-12", rest: "45s", completed: false },
      { name: "Modified Plank", sets: 2, reps: "20-30s", rest: "60s", completed: false },
      { name: "Upper Body Stretches", sets: 1, reps: "5 minutes", rest: "0s", completed: false }
    ] : [
      { name: "Dynamic Upper Body Warm-up", sets: 1, reps: "3 minutes", rest: "30s", completed: false },
      { name: "Push-ups", sets: 3, reps: "12-15", rest: "60s", completed: false },
      { name: "Pike Push-ups", sets: 3, reps: "8-12", rest: "60s", completed: false },
      { name: "Tricep Dips", sets: 3, reps: "10-15", rest: "60s", completed: false },
      { name: "Plank Hold", sets: 3, reps: "45-60s", rest: "60s", completed: false },
      { name: "Diamond Push-ups", sets: 2, reps: "6-10", rest: "90s", completed: false },
      { name: "Upper Body Cool-down", sets: 1, reps: "5 minutes", rest: "0s", completed: false }
    ];
  } else if (shouldFocusLowerBody) {
    workoutName = "Lower Body Power Session";
    description = `A lower body focused workout to complement your recent upper body training, designed for ${fitnessLevel} level.`;
    exercises = fitnessLevel === "beginner" ? [
      { name: "Leg Swing Warm-up", sets: 1, reps: "2 minutes", rest: "30s", completed: false },
      { name: "Bodyweight Squats", sets: 3, reps: "10-15", rest: "60s", completed: false },
      { name: "Static Lunges", sets: 2, reps: "8-10 each leg", rest: "60s", completed: false },
      { name: "Calf Raises", sets: 2, reps: "15-20", rest: "45s", completed: false },
      { name: "Glute Bridges", sets: 2, reps: "12-15", rest: "60s", completed: false },
      { name: "Lower Body Stretches", sets: 1, reps: "5 minutes", rest: "0s", completed: false }
    ] : [
      { name: "Dynamic Lower Body Warm-up", sets: 1, reps: "3 minutes", rest: "30s", completed: false },
      { name: "Jump Squats", sets: 3, reps: "12-15", rest: "60s", completed: false },
      { name: "Bulgarian Split Squats", sets: 3, reps: "10-12 each leg", rest: "60s", completed: false },
      { name: "Single-leg Glute Bridges", sets: 2, reps: "10-12 each leg", rest: "60s", completed: false },
      { name: "Walking Lunges", sets: 3, reps: "12-15 each leg", rest: "60s", completed: false },
      { name: "Calf Raise Variations", sets: 2, reps: "15-20", rest: "45s", completed: false },
      { name: "Lower Body Recovery", sets: 1, reps: "5 minutes", rest: "0s", completed: false }
    ];
  } else {
    // Full body workout as default
    workoutName = `${fitnessLevel.charAt(0).toUpperCase()}${fitnessLevel.slice(1)} Full Body Workout`;
    description = `A balanced full-body workout session building on your previous training experience, designed for your ${fitnessLevel} fitness level.`;
    exercises = fitnessLevel === "beginner" ? [
      { name: "Full Body Warm-up", sets: 1, reps: "3 minutes", rest: "30s", completed: false },
      { name: "Bodyweight Squats", sets: 3, reps: "8-12", rest: "60s", completed: false },
      { name: "Modified Push-ups", sets: 3, reps: "5-10", rest: "60s", completed: false },
      { name: "Plank Hold", sets: 2, reps: "20-30s", rest: "60s", completed: false },
      { name: "Lunges", sets: 2, reps: "6-8 each leg", rest: "60s", completed: false },
      { name: "Mountain Climbers", sets: 2, reps: "20s", rest: "60s", completed: false },
      { name: "Full Body Stretching", sets: 1, reps: "5 minutes", rest: "0s", completed: false }
    ] : [
      { name: "Dynamic Full Body Warm-up", sets: 1, reps: "4 minutes", rest: "30s", completed: false },
      { name: "Jump Squats", sets: 3, reps: "12-15", rest: "60s", completed: false },
      { name: "Push-ups", sets: 3, reps: "10-15", rest: "60s", completed: false },
      { name: "Plank Hold", sets: 3, reps: "45-60s", rest: "60s", completed: false },
      { name: "Reverse Lunges", sets: 3, reps: "10-12 each leg", rest: "60s", completed: false },
      { name: "Burpees", sets: 2, reps: "8-10", rest: "90s", completed: false },
      { name: "Russian Twists", sets: 2, reps: "20", rest: "45s", completed: false },
      { name: "Recovery Stretches", sets: 1, reps: "5 minutes", rest: "0s", completed: false }
    ];
  }

  return {
    name: workoutName,
    description: description,
    duration_minutes: maxTime,
    difficulty_level: fitnessLevel,
    exercises: exercises
  };
}

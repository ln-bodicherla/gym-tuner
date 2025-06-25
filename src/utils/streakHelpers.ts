
import { getCurrentDatePST, toPSTDate, formatPSTDate } from './timezoneHelpers';

interface WorkoutData {
  workout_date: string;
}

export const calculateWorkoutStreak = (
  workouts: WorkoutData[], 
  workoutSchedule: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
): number => {
  if (!workouts.length || !workoutSchedule.length) return 0;

  // Get unique workout dates and sort them descending (most recent first)
  const workoutDates = [...new Set(workouts.map(w => w.workout_date))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (workoutDates.length === 0) return 0;

  const currentDatePST = getCurrentDatePST();
  const today = new Date(currentDatePST + 'T00:00:00');
  
  // Convert workout schedule to day numbers (0 = Sunday, 1 = Monday, etc.)
  const workoutDayNumbers = workoutSchedule.map(day => {
    const dayMap: { [key: string]: number } = {
      'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3,
      'thursday': 4, 'friday': 5, 'saturday': 6
    };
    return dayMap[day.toLowerCase()];
  }).sort((a, b) => a - b);

  // Function to check if a date is a scheduled workout day
  const isWorkoutDay = (date: Date): boolean => {
    return workoutDayNumbers.includes(date.getDay());
  };

  // Function to get the previous workout day
  const getPreviousWorkoutDay = (date: Date): Date => {
    const prevDate = new Date(date);
    do {
      prevDate.setDate(prevDate.getDate() - 1);
    } while (!isWorkoutDay(prevDate));
    return prevDate;
  };

  // Convert workout dates to Date objects
  const workoutDateObjects = workoutDates.map(dateStr => new Date(dateStr + 'T00:00:00'));
  
  let streak = 0;
  let currentDate = new Date(today);
  
  // If today is not a workout day, start from the most recent workout day
  if (!isWorkoutDay(currentDate)) {
    // Find the most recent workout day before or on today
    while (currentDate >= new Date(workoutDateObjects[workoutDateObjects.length - 1]) && !isWorkoutDay(currentDate)) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
  }

  // Start checking from the current date (or most recent workout day)
  let checkDate = new Date(currentDate);
  
  // Count streak by going backwards through workout days
  while (isWorkoutDay(checkDate)) {
    const checkDateStr = formatPSTDate(checkDate, 'yyyy-MM-dd');
    
    // Check if user worked out on this scheduled day
    if (workoutDateObjects.some(workoutDate => 
      formatPSTDate(workoutDate, 'yyyy-MM-dd') === checkDateStr
    )) {
      streak++;
      checkDate = getPreviousWorkoutDay(checkDate);
    } else {
      // If user missed a scheduled workout day, streak breaks
      break;
    }
  }

  return streak;
};

export const getWorkoutDayOptions = () => [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' }
];

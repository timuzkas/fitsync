const EXERCISES = [
  { name: 'Bench Press', muscleGroups: ['chest', 'triceps', 'shoulders'] },
  { name: 'Squat', muscleGroups: ['quads', 'glutes', 'hamstrings'] },
  { name: 'Deadlift', muscleGroups: ['back', 'glutes', 'hamstrings'] },
  { name: 'Overhead Press', muscleGroups: ['shoulders', 'triceps'] },
  { name: 'Barbell Row', muscleGroups: ['back', 'biceps'] },
  { name: 'Pull-up', muscleGroups: ['back', 'biceps'] },
  { name: 'Lat Pulldown', muscleGroups: ['back', 'biceps'] },
  { name: 'Dumbbell Curl', muscleGroups: ['biceps'] },
  { name: 'Tricep Pushdown', muscleGroups: ['triceps'] },
  { name: 'Leg Press', muscleGroups: ['quads', 'glutes'] },
  { name: 'Romanian Deadlift', muscleGroups: ['hamstrings', 'glutes', 'back'] },
  { name: 'Lunges', muscleGroups: ['quads', 'glutes'] },
  { name: 'Cable Fly', muscleGroups: ['chest'] },
  { name: 'Lateral Raise', muscleGroups: ['shoulders'] },
  { name: 'Face Pull', muscleGroups: ['shoulders', 'back'] },
  { name: 'Leg Curl', muscleGroups: ['hamstrings'] },
  { name: 'Leg Extension', muscleGroups: ['quads'] },
  { name: 'Calf Raise', muscleGroups: ['calves'] },
  { name: 'Plank', muscleGroups: ['core'] },
  { name: 'Cable Crunch', muscleGroups: ['core'] },
  { name: 'Incline Bench Press', muscleGroups: ['chest', 'shoulders', 'triceps'] },
  { name: 'Decline Bench Press', muscleGroups: ['chest', 'triceps'] },
  { name: 'Close Grip Bench Press', muscleGroups: ['triceps', 'chest'] },
  { name: 'Front Squat', muscleGroups: ['quads', 'core'] },
  { name: 'Hip Thrust', muscleGroups: ['glutes', 'hamstrings'] },
  { name: 'T-Bar Row', muscleGroups: ['back', 'biceps'] },
  { name: 'Dumbbell Press', muscleGroups: ['chest', 'triceps'] },
  { name: 'Shoulder Press', muscleGroups: ['shoulders', 'triceps'] },
  { name: 'Dip', muscleGroups: ['chest', 'triceps', 'shoulders'] },
  { name: 'Preacher Curl', muscleGroups: ['biceps'] },
];

export async function GET(request: Request) {
  const query = request.headers.get('x-device-id');
  if (!query) {
    return new Response('Unauthorized', { status: 401 });
  }
  return Response.json(EXERCISES);
}

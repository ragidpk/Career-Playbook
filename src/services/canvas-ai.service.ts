import { supabase } from './supabase';

// Question labels for AI context
const QUESTION_LABELS = [
  'Who helps you succeed?',
  'What are the key activities in your role?',
  'What value do others gain from you?',
  'How do you interact with others?',
  'Who do you need to convince?',
  'What are your skills and interests?',
  'What motivates you?',
  'What sacrifices are you willing to make?',
  'What outcomes do you want?',
];

export async function getAISuggestion(
  questionNumber: number,
  currentRole: string,
  targetRole: string,
  previousAnswers?: Record<string, string>
): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You must be logged in to get AI suggestions');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  const response = await fetch(`${supabaseUrl}/functions/v1/canvas-ai-suggestion`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      questionNumber,
      questionText: QUESTION_LABELS[questionNumber - 1],
      currentRole,
      targetRole,
      previousAnswers,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to generate suggestion');
  }

  return data.suggestion;
}

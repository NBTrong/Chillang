import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.1'

type ListeningQuizQuestionInput = {
  prompt: string
  correct_option: string
  distractors: string[]
  hint: string | null
  reference_start_ms: number | null
  reference_end_ms: number | null
  explanation: string | null
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
  },
})

const generateListeningQuizWithGemini = async (
  transcript: string,
  segments: Array<{ subtitle: string; start: number; dur: number }>,
  existingQuestions: Array<{ prompt: string }>,
  apiKey: string,
): Promise<ListeningQuizQuestionInput[]> => {
  if (!transcript || transcript.trim().length === 0 || segments.length === 0) {
    return []
  }

  const transcriptSample = transcript.slice(0, 5000)
  
  // Create a map of text to timestamps for reference
  const segmentMap = segments.map((seg) => ({
    text: seg.subtitle,
    startMs: Math.round(seg.start * 1000),
    endMs: Math.round((seg.start + seg.dur) * 1000),
  }))

  // Get existing question prompts to avoid duplicates
  const existingPrompts = existingQuestions.map((q) => q.prompt).join('\n- ')

  const questionCount = existingQuestions.length === 0 ? 8 : 3
  const prompt = `Generate ${questionCount}-${questionCount + 4} ${existingQuestions.length === 0 ? 'listening comprehension quiz questions' : 'additional listening comprehension quiz questions'} from the following English transcript. ${existingQuestions.length > 0 ? 'These should be NEW questions that are different from the existing ones.' : ''}

${existingQuestions.length > 0 ? `Existing questions (avoid similar topics):\n- ${existingPrompts}` : 'This is the first set of questions for this video.'}

Transcript:
${transcriptSample}

Create NEW multiple-choice questions that test understanding of:
- Main ideas and key points (different from existing questions)
- Specific details mentioned
- Inferences and implications
- Speaker's attitude or purpose

Return a JSON array of objects, each with:
- "prompt": the question text (must be different from existing questions)
- "correct_option": the correct answer (exact text)
- "distractors": array of 3 incorrect but plausible answer options
- "hint": a brief hint that guides the listener (optional, can be null)
- "reference_text": a short quote from the transcript that contains the answer (for finding timestamp)
- "explanation": a brief explanation of why the correct answer is right (optional, can be null)

Important:
- Questions must be NEW and different from existing ones
- Questions should be answerable by listening carefully to the content
- Distractors should be plausible but clearly wrong
- Reference text should be an exact quote from the transcript to help locate the timestamp
- Return ONLY valid JSON array, no other text

Example format:
[
  {
    "prompt": "What is a different aspect discussed in the video?",
    "correct_option": "The importance of effective communication",
    "distractors": ["How to learn a new language", "Tips for public speaking", "The history of communication"],
    "hint": "Listen for the central theme mentioned at the beginning",
    "reference_text": "The importance of effective communication",
    "explanation": "The speaker emphasizes this as the main focus throughout the video"
  }
]`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      console.error('Gemini API error for quiz generation:', response.status, await response.text())
      return []
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string
          }>
        }
      }>
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    // Try to extract JSON from response (might have markdown code blocks)
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      try {
        const questions = JSON.parse(jsonMatch[0]) as Array<{
          prompt?: string
          correct_option?: string
          distractors?: string[]
          hint?: string | null
          reference_text?: string
          explanation?: string | null
        }>

        // Process questions and find timestamps
        const processedQuestions: ListeningQuizQuestionInput[] = []

        for (const q of questions) {
          if (!q.prompt || !q.correct_option || !q.distractors || q.distractors.length < 3) {
            continue
          }

          // Find timestamp for reference text
          let referenceStartMs: number | null = null
          let referenceEndMs: number | null = null

          if (q.reference_text) {
            // Try to find the segment containing this text
            const referenceLower = q.reference_text.toLowerCase().trim()
            for (const seg of segmentMap) {
              if (seg.text.toLowerCase().includes(referenceLower) || referenceLower.includes(seg.text.toLowerCase())) {
                referenceStartMs = seg.startMs
                referenceEndMs = seg.endMs
                break
              }
            }
          }

          processedQuestions.push({
            prompt: q.prompt.trim(),
            correct_option: q.correct_option.trim(),
            distractors: q.distractors.slice(0, 3).map((d) => d.trim()),
            hint: q.hint?.trim() || null,
            reference_start_ms: referenceStartMs,
            reference_end_ms: referenceEndMs,
            explanation: q.explanation?.trim() || null,
          })
        }

        return processedQuestions
      } catch (parseError) {
        console.warn('Failed to parse quiz JSON:', parseError)
      }
    }

    return []
  } catch (error) {
    console.error('Failed to generate listening quiz with Gemini:', error)
    return []
  }
}

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  })

serve(async (request) => {
  try {
    if (request.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' })
    }

    const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_API_KEY')
    if (!geminiApiKey) {
      return jsonResponse(500, { error: 'GOOGLE_GEMINI_API_KEY not configured' })
    }

    const authHeader = request.headers.get('Authorization') ?? ''
    const accessToken = authHeader.replace('Bearer ', '').trim()
    if (!accessToken) {
      return jsonResponse(401, { error: 'Unauthorized' })
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(accessToken)
    if (authError || !authData?.user) {
      console.error('Failed to verify user', authError)
      return jsonResponse(401, { error: 'Unauthorized' })
    }

    const { sessionId } = (await request.json().catch(() => ({}))) as { sessionId?: string }
    if (!sessionId) {
      return jsonResponse(400, { error: 'Missing sessionId' })
    }

    // Fetch session and verify ownership
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('study_sessions')
      .select('id, video_id, owner_id')
      .eq('id', sessionId)
      .eq('owner_id', authData.user.id)
      .single()

    if (sessionError || !session) {
      return jsonResponse(404, { error: 'Session not found' })
    }

    // Fetch existing quiz or create new one
    const { data: existingQuiz, error: quizFetchError } = await supabaseAdmin
      .from('listening_quizzes')
      .select('id, question_count')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (quizFetchError) {
      return jsonResponse(500, { error: 'Failed to fetch quiz' })
    }

    let quizData = existingQuiz

    // Create quiz if it doesn't exist
    if (!quizData) {
      const { data: newQuiz, error: createError } = await supabaseAdmin
        .from('listening_quizzes')
        .insert({
          session_id: sessionId,
          phase: 'quiz',
          question_count: 0,
          max_score: 100,
        })
        .select('id, question_count')
        .single()

      if (createError || !newQuiz) {
        return jsonResponse(500, { error: 'Failed to create quiz' })
      }

      quizData = newQuiz
    }

    // Fetch existing questions
    const { data: existingQuestions, error: questionsError } = await supabaseAdmin
      .from('listening_quiz_questions')
      .select('prompt')
      .eq('quiz_id', quizData.id)

    if (questionsError) {
      return jsonResponse(500, { error: 'Failed to fetch existing questions' })
    }

    // Fetch video transcript
    const { data: video, error: videoError } = await supabaseAdmin
      .from('videos')
      .select('transcript')
      .eq('id', session.video_id)
      .single()

    if (videoError || !video || !video.transcript) {
      return jsonResponse(404, { error: 'Video transcript not found' })
    }

    const transcript = video.transcript as {
      text?: string
      segments?: Array<{ subtitle: string; start: number; dur: number }>
    }

    if (!transcript.text || !transcript.segments || transcript.segments.length === 0) {
      return jsonResponse(404, { error: 'Transcript segments not found' })
    }

    // Generate new questions
    // If no existing questions, generate 8-12 questions, otherwise generate 3-5
    const targetCount = (existingQuestions?.length || 0) === 0 ? 10 : 4
    
    const newQuestions = await generateListeningQuizWithGemini(
      transcript.text,
      transcript.segments,
      existingQuestions || [],
      geminiApiKey,
    )

    if (newQuestions.length === 0) {
      return jsonResponse(500, { error: 'Failed to generate new questions' })
    }

    // Insert new questions
    const questionsPayload = newQuestions.map((q) => ({
      quiz_id: quizData.id,
      prompt: q.prompt,
      correct_option: q.correct_option,
      distractors: q.distractors,
      hint: q.hint,
      reference_start_ms: q.reference_start_ms,
      reference_end_ms: q.reference_end_ms,
      explanation: q.explanation,
    }))

    const { error: insertError } = await supabaseAdmin
      .from('listening_quiz_questions')
      .insert(questionsPayload)

    if (insertError) {
      console.error('Failed to insert new questions', insertError)
      return jsonResponse(500, { error: 'Failed to save new questions' })
    }

    // Update question count
    const { error: updateError } = await supabaseAdmin
      .from('listening_quizzes')
      .update({ question_count: (quizData.question_count || 0) + newQuestions.length })
      .eq('id', quizData.id)

    if (updateError) {
      console.error('Failed to update question count', updateError)
      // Don't fail, just log
    }

    return jsonResponse(200, {
      success: true,
      questionsAdded: newQuestions.length,
      totalQuestions: (quizData.question_count || 0) + newQuestions.length,
    })
  } catch (error) {
    console.error('generate-more-questions error', error)
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return jsonResponse(500, {
      error: 'Failed to generate more questions',
      details: message,
    })
  }
})


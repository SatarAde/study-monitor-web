// src/services/claude.ts
const MODEL = 'claude-sonnet-4-20250514';

async function call(system: string, user: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL, max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error.message);
  return d.content?.[0]?.text || '';
}

export async function generateQuestions(subject: string, topic: string, material: string) {
  try {
    const raw = await call(
      `You are a WAEC exam question generator for Nigerian SS1-SS3 students.
       Generate exactly 5 short-answer questions from the study material.
       Match real WAEC exam style — specific, clear, directly from the material.
       Return ONLY a valid JSON array. Each item: {"question":string,"keyPoints":string[]}.
       No markdown. No explanation. Just the raw JSON array.`,
      `Subject: ${subject}\nTopic: ${topic}\n\nMaterial:\n${material.slice(0, 4000)}`
    );
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return [
      { question: `Define ${topic} and explain its importance in ${subject}.`, keyPoints: ['accurate definition', 'importance stated'] },
      { question: `State and explain TWO key principles of ${topic}.`, keyPoints: ['two principles', 'explains each correctly'] },
      { question: `Give a real-life example of ${topic} and explain how it applies.`, keyPoints: ['valid example', 'clear link to topic'] },
      { question: `What are the main components or stages of ${topic}?`, keyPoints: ['at least two components', 'correctly described'] },
      { question: `How does ${topic} relate to other concepts in ${subject}?`, keyPoints: ['identifies a connection', 'explains clearly'] },
    ];
  }
}

export async function gradeAnswers(subject: string, topic: string, answers: any[]) {
  try {
    const raw = await call(
      `You are a strict but fair WAEC examiner. Grade each answer out of 20. Pass = 60/100.
       Return ONLY valid JSON: {"score":number,"passed":boolean,"feedback":string,"perQuestion":[{"score":number,"comment":string}]}.
       No markdown. Just JSON.`,
      `Subject: ${subject}, Topic: ${topic}\n\n${answers.map((a,i)=>
        `Q${i+1}: ${a.question}\nAnswer: ${a.answer||'[blank]'}\nExpected: ${(a.keyPoints||[]).join(', ')}`
      ).join('\n\n')}`
    );
    const g = JSON.parse(raw.replace(/```json|```/g,'').trim());
    if (g.perQuestion?.length === 5) {
      g.score = g.perQuestion.reduce((s:number,q:any)=>s+q.score,0);
      g.passed = g.score >= 60;
    }
    return g;
  } catch {
    return {
      score: 50, passed: false,
      feedback: 'Grading service unavailable. Estimated result. Please retry.',
      perQuestion: answers.map(()=>({score:10,comment:'Answer recorded.'})),
    };
  }
}

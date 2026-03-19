// src/services/claude.js

const MODEL = 'claude-sonnet-4-20250514';

async function call(system, user) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error.message);
  return d.content?.[0]?.text || '';
}

export async function generateQuestions(subject, topic, material) {
  try {
    const raw = await call(
      `You are a WAEC exam question generator for Nigerian SS1-SS3 students.
       Generate exactly 5 short-answer questions from the study material.
       Match real WAEC exam style — specific, clear, directly from the material.
       Return ONLY a valid JSON array. Each item: {"question": string, "keyPoints": string[]}.
       No markdown, no explanation, just the JSON array.`,
      `Subject: ${subject}\nTopic: ${topic}\n\nMaterial:\n${material.slice(0, 4000)}`
    );
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return [
      { question: `Define ${topic} and state its importance in ${subject}.`, keyPoints: ['accurate definition', 'states importance'] },
      { question: `State and explain TWO key principles related to ${topic}.`, keyPoints: ['two principles', 'explains each'] },
      { question: `Give a practical example of ${topic} in real life.`, keyPoints: ['real-world example', 'linked to topic'] },
      { question: `What are the main components or stages of ${topic}?`, keyPoints: ['lists components', 'brief descriptions'] },
      { question: `How does ${topic} relate to other topics in ${subject}?`, keyPoints: ['identifies connection', 'gives example'] },
    ];
  }
}

export async function gradeAnswers(subject, topic, answers) {
  try {
    const raw = await call(
      `You are a strict but fair WAEC examiner grading a Nigerian student.
       Grade each answer out of 20. Pass mark is 60/100.
       Return ONLY valid JSON: {"score":number,"passed":boolean,"feedback":string,"perQuestion":[{"score":number,"comment":string}]}.
       No markdown. Just JSON.`,
      `Subject: ${subject}, Topic: ${topic}\n\n${answers.map((a, i) =>
        `Q${i+1}: ${a.question}\nAnswer: ${a.answer || '[blank]'}\nExpected: ${(a.keyPoints||[]).join(', ')}`
      ).join('\n\n')}`
    );
    const g = JSON.parse(raw.replace(/```json|```/g, '').trim());
    if (g.perQuestion?.length === 5) {
      g.score = g.perQuestion.reduce((s, q) => s + q.score, 0);
      g.passed = g.score >= 60;
    }
    return g;
  } catch {
    return {
      score: 50, passed: false,
      feedback: 'Grading service unavailable. Estimated score. Review your material and retake.',
      perQuestion: answers.map(() => ({ score: 10, comment: 'Answer recorded.' })),
    };
  }
}

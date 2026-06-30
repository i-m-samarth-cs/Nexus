/**
 * Calculates a 0–100 risk score for a subject.
 * Higher = more urgent attention needed.
 */
export function calculateRiskScore(subject, deadlines, sessions) {
  const now = new Date();
  const upcoming = deadlines
    .filter(d => !d.isComplete && new Date(d.dueDate) > now)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  if (upcoming.length === 0) return 0;

  const next = upcoming[0];
  const daysRemaining = Math.max(
    (new Date(next.dueDate) - now) / (1000 * 60 * 60 * 24),
    0.01
  );

  // Exponential urgency: 30 days → ~0, 1 day → ~1
  const urgency = Math.min(1, Math.pow(30 / Math.max(daysRemaining, 0.5), 1.6) / 30);

  // Weight factor (0–100% → 0.2–1.0 multiplier)
  const weightFactor = 0.2 + (next.weight / 100) * 0.8;

  // Difficulty factor (1–5 → 0.6–1.4)
  const difficultyFactor = 0.6 + ((subject.difficulty - 1) / 4) * 0.8;

  // Study gap penalty
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const recentSessions = sessions.filter(s => new Date(s.startTime) >= weekAgo);
  const effectiveSessions = recentSessions.reduce((acc, s) => {
    const qualityMultiplier = (s.focusRating || 3) / 5;
    return acc + qualityMultiplier;
  }, 0);

  const weeklyTarget = subject.weeklyTarget || 3;
  const studyRatio = Math.min(effectiveSessions / weeklyTarget, 1);
  const studyGapMultiplier = 1 + (1 - studyRatio) * 0.4;

  const rawScore = urgency * weightFactor * difficultyFactor * studyGapMultiplier * 100;
  return Math.min(100, Math.round(rawScore));
}

export function riskLevel(score) {
  if (score >= 61) return 'critical';
  if (score >= 31) return 'elevated';
  return 'nominal';
}

export function riskColor(score) {
  const level = riskLevel(score);
  if (level === 'critical') return '#ff2d55';
  if (level === 'elevated') return '#ff9f0a';
  return '#30d158';
}

export function riskLabel(score) {
  const level = riskLevel(score);
  if (level === 'critical') return 'CRITICAL';
  if (level === 'elevated') return 'ELEVATED';
  return 'NOMINAL';
}

export function enrichSubjects(subjects) {
  return subjects.map(s => {
    const score = calculateRiskScore(s, s.deadlines || [], s.studySessions || []);
    return { ...s, riskScore: score, riskLevel: riskLevel(score), riskColor: riskColor(score) };
  }).sort((a, b) => b.riskScore - a.riskScore);
}

export function calculateHealthLabel(score) {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  if (score >= 70) return { label: 'Good', color: 'text-blue-700 bg-blue-50 border-blue-200' };
  if (score >= 40) return { label: 'Needs Attention', color: 'text-amber-700 bg-amber-50 border-amber-200' };
  return { label: 'Critical', color: 'text-rose-700 bg-rose-50 border-rose-200' };
}

export function calculateAchievementPercentage(achieved, assigned) {
  if (!assigned) return 0;
  return Math.round((achieved / assigned) * 100);
}

export function calculateHealthScore(achievementPercentage, activeLeads, activeProjects) {
  // Simple algorithm to calculate health score based on metrics
  const targetWeight = achievementPercentage * 0.7;
  const metricsWeight = Math.min((activeLeads * 1.5 + activeProjects * 2.0), 30);
  const rawScore = targetWeight + metricsWeight;
  return Math.min(Math.round(rawScore), 100);
}

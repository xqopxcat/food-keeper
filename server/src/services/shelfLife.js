import Rule from '../models/Rule.js';

function matchOne(condArr, value) {
  if (!condArr || condArr.length === 0) return true;
  return condArr.includes(value);
}

export async function evaluateShelfLife(facts) {
  // 粗篩（可再加更多條件）
  const candidates = await Rule.find({ enabled: true }).lean();

  const scored = candidates.map(r => {
    let score = 0;
    if (matchOne(r.conditions.itemKey, facts.itemKey)) score += 1;
    if (matchOne(r.conditions.storageMode, facts.storageMode)) score += 1;
    if (matchOne(r.conditions.state, facts.state)) score += 0.5;
    if (matchOne(r.conditions.container, facts.container)) score += 0.25;
    if (matchOne(r.conditions.season, facts.season)) score += 0.25;
    if (matchOne(r.conditions.locale, facts.locale)) score += 0.25;
    return { rule: r, score, rank: (r.priority || 0) + score };
  });

  if (!scored.length) return null;
  const best = scored.sort((a,b) => b.rank - a.rank)[0];
  if (!best || best.score <= 0) return null;

  // 簡單季節係數
  const kSeason = (facts.season === 'summer' && facts.storageMode === 'room') ? 0.85 : 1.0;
  const daysMin = Math.max(0, Math.round((best.rule.result.daysMin || 0) * kSeason));
  const daysMax = Math.max(daysMin, Math.round((best.rule.result.daysMax || daysMin) * kSeason));
  const confidence = Math.min(1, (best.rule.result.baseConfidence || 0.6) + best.score / 3);

  return {
    daysMin, daysMax, tips: best.rule.result.tips || '',
    confidence, ruleId: String(best.rule._id)
  };
}

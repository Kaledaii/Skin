const cueRules: Array<[RegExp, string]> = [
  [/\b(haldi doodh|turmeric milk)\b/i, "🥛"],
  [/\b(water|hydration|hydrate|dehydration|pani|पानी)\b/i, "💧"],
  [/\b(curd|dahi|mohi|probiotic|दही)\b/i, "🥣"],
  [/\b(dal|lentil|daal|दाल)\b/i, "🍲"],
  [/\b(spinach|saag|green|vegetable|greens|पालक|साग)\b/i, "🥬"],
  [/\b(milk|doodh|दूध)\b/i, "🥛"],
  [/\b(sun|uv|spf|sunscreen|sunscreen|घाम)\b/i, "☀️"],
  [/\b(rain|monsoon|umbrella|वर्षा|पानी पर्ने)\b/i, "🌧️"],
  [/\b(wind|storm|gust|धुलो|dust)\b/i, "🌬️"],
  [/\b(sleep|night|bed|निद्रा)\b/i, "🌙"],
  [/\b(stress|exam|breath|calm|तनाव)\b/i, "🧘"],
  [/\b(junk|fried|chips|samosa|pakoda|sel roti|fast food)\b/i, "🍟"],
  [/\b(makeup|cleanse|double cleanse|micellar)\b/i, "💄"],
  [/\b(acne|pimple|breakout|spot)\b/i, "🔴"],
  [/\b(heat|summer|sweat|hot|terai|घमौरी)\b/i, "🔥"],
  [/\b(phone|screen)\b/i, "📱"],
  [/\b(fruit|amla|vitamin c)\b/i, "🍊"]
];

export function visualCueForText(...values: Array<string | undefined | null>) {
  const text = values.filter(Boolean).join(" ");
  const match = cueRules.find(([pattern]) => pattern.test(text));
  return match?.[1] ?? "✨";
}

export function withVisualCue(text: string) {
  return `${visualCueForText(text)} ${text}`;
}

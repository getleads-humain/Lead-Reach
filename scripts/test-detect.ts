import { detectDomain } from '../src/lib/prospect-agent/domain-intelligence';

const tests = [
  'Kavya Shah',
  'Credora',
  'Kavya Shah Credora Healthcare FinTech',
  'Business Systems & AI-Focused Software Developer',
  'Healthcare & FinTech Systems',
  'AI-Focused Software Developer Enterprise Applications Founder Credora Healthcare FinTech Systems',
];

for (const t of tests) {
  const d = detectDomain(t);
  console.log(`"${t}" → ${d.domain} (${d.label})`);
}

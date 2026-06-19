// Test the query parser against the exact Kavya Shah query reported by the user.
// Run with: npx tsx scripts/test-query-parser.ts

import { parseQuery } from '../src/lib/prospect-agent/query-parser';

const kavyaQuery = `Find a person: Kavya Shah [Business Systems & AI-Focused Software Developer | Enterprise Applications | Founder @ Credora | Healthcare & FinTech Systems] - [Kavya's profile: linkedin.com/in/kavya-works; Address: Toronto, Ontario; Email: shahkavya.works@gmail.com; Birthday: November 29]`;

console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST: Kavya Shah rich query');
console.log('═══════════════════════════════════════════════════════════════');
console.log('Input:', kavyaQuery);
console.log('');

const parsed = parseQuery(kavyaQuery);

console.log('GUESSED INTENT:', parsed.guessedIntent);
console.log('CONFIDENCE:', parsed.confidence);
console.log('REASONING:', parsed.reasoning);
console.log('SIGNALS PROVIDED:', parsed.signalsProvided);
console.log('');
console.log('EXTRACTED ENTITIES:');
console.log('  personName:', parsed.personName);
console.log('  companyName:', parsed.companyName);
console.log('  title:', parsed.title);
console.log('  email:', parsed.email);
console.log('  phone:', parsed.phone);
console.log('  linkedinPersonUrl:', parsed.linkedinPersonUrl);
console.log('  linkedinCompanyUrl:', parsed.linkedinCompanyUrl);
console.log('  city:', parsed.city);
console.log('  stateProvince:', parsed.stateProvince);
console.log('  country:', parsed.country);
console.log('  industry:', parsed.industry);
console.log('  birthday:', parsed.birthday);
console.log('  url:', parsed.url);
console.log('  otherUrls:', parsed.otherUrls);
console.log('  bracketBlocks:', parsed.bracketBlocks);
console.log('');
console.log('PRE-POPULATED PROSPECT:');
console.log(JSON.stringify(parsed.prepopulatedProspect, null, 2));

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST: Simple company query');
console.log('═══════════════════════════════════════════════════════════════');
const simpleCo = parseQuery('Research Stripe');
console.log('Intent:', simpleCo.guessedIntent, 'Confidence:', simpleCo.confidence);
console.log('companyName:', simpleCo.companyName);
console.log('personName:', simpleCo.personName);
console.log('signalsProvided:', simpleCo.signalsProvided);

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST: Simple person query');
console.log('═══════════════════════════════════════════════════════════════');
const simplePerson = parseQuery('Research Patrick Collison');
console.log('Intent:', simplePerson.guessedIntent, 'Confidence:', simplePerson.confidence);
console.log('personName:', simplePerson.personName);
console.log('companyName:', simplePerson.companyName);
console.log('signalsProvided:', simplePerson.signalsProvided);

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST: URL query');
console.log('═══════════════════════════════════════════════════════════════');
const urlQ = parseQuery('https://www.stripe.com');
console.log('Intent:', urlQ.guessedIntent, 'Confidence:', urlQ.confidence);
console.log('url:', urlQ.url);

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('TEST: Company with website and email');
console.log('═══════════════════════════════════════════════════════════════');
const coWithInfo = parseQuery('Research Acme Corp - website: acme.com, contact: hello@acme.com, based in San Francisco, CA');
console.log('Intent:', coWithInfo.guessedIntent, 'Confidence:', coWithInfo.confidence);
console.log('companyName:', coWithInfo.companyName);
console.log('email:', coWithInfo.email);
console.log('url:', coWithInfo.url);
console.log('city:', coWithInfo.city);
console.log('stateProvince:', coWithInfo.stateProvince);
console.log('signalsProvided:', coWithInfo.signalsProvided);
console.log('prepopulatedProspect:', JSON.stringify(coWithInfo.prepopulatedProspect, null, 2));

console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('ALL TESTS PASSED');
console.log('═══════════════════════════════════════════════════════════════');

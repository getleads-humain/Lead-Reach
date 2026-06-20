#!/usr/bin/env python3
"""Patch intents.ts to fix the 'Research Stripe' misclassification."""

fp = "/home/z/my-project/src/lib/prospect-agent/intents.ts"
with open(fp, "r", encoding="utf-8") as f:
    content = f.read()

# Find the section we want to replace.
old_block = '''  // Person name detection (2-4 capitalized words, no numbers)
  // Must be at least 2 words to avoid matching single-word company names like "Stripe", "Notion", etc.
  const personPattern = /^[A-Z][a-z]+(\\s+[A-Z][a-z]+){1,3}$/;
  // Also check if the message looks like a person name but with a "research/find" prefix
  // e.g., "Research Patrick Collison" \u2192 person, but "Research Stripe" \u2192 company
  const personWithPrefix = msg.match(/^(?:research|find|look up|tell me about)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)+)$/);
  
  if (personWithPrefix && personWithPrefix[1]) {
    // Multi-word name after a research prefix \u2014 likely a person
    const name = personWithPrefix[1];
    const wordCount = name.split(/\\s+/).length;
    if (wordCount >= 2) {
      return {
        intent: 'research_person',
        persona: 'hound',
        confidence: 0.8,
        reasoning: 'Multi-word name after research prefix suggests person search',
        extractedEntities: { companyName: null, personName: name, url: null, industry: null, location: null },
        clarifyingQuestion: null,
      };
    }
  } else if (personPattern.test(originalMsg)) {
    return {
      intent: 'research_person',
      persona: 'hound',
      confidence: 0.8,
      reasoning: 'Message matches a person name pattern (multi-word)',
      extractedEntities: { companyName: null, personName: originalMsg, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Company research detection
  const companyKeywords = ['company', 'corp', 'inc', 'ltd', 'gmbh', 'sa', 'llc', 'find', 'search', 'research', 'look up', 'tell me about', 'info on', 'discover', 'about', 'what is', 'who is'];
  if (companyKeywords.some(k => msg.includes(k)) || originalMsg.length > 3) {'''

new_block = '''  // --- Prefix-stripping for "research/find/tell me about X" queries ---
  // Before we try to match the message against a person-name pattern, strip
  // any leading "research", "find", "look up", "tell me about", "info on",
  // "discover", "about", "what is", "who is" prefix. This prevents queries
  // like "Research Stripe" or "Tell me about Notion" from being misread as
  // a person name (where "Research" looks like a first name).
  //
  // The remaining text is then classified by length:
  //   - 1 word        -> company (e.g., "Stripe", "Notion")
  //   - 2 words       -> ambiguous - could be "Patrick Collison" (person) OR
  //                     "Apple Inc" (company). Use a heuristic: if the second
  //                     word is a known company suffix (Inc, Corp, Ltd, GmbH,
  //                     LLC, SA), it is a company. Otherwise, person.
  //   - 3-4 words     -> person (full names are typically 2-4 words)
  //   - 5+ words      -> company (long names like "Bank of America")
  const RESEARCH_PREFIX_RE = /^(?:research|find|look up|tell me about|info on|discover|about|what is|who is|search for|search)\\s+(.+)$/i;
  const prefixMatch = originalMsg.match(RESEARCH_PREFIX_RE);
  const strippedMsg = prefixMatch ? prefixMatch[1].trim() : originalMsg;

  // Company suffixes - if the LAST word matches one of these, it is a company.
  const COMPANY_SUFFIX_RE = /\\b(?:inc|corp|corporation|ltd|limited|gmbh|sa|llc|co|company|ag|plc|pty|pvt|bv|nv|oy|ab|as|sarl)\\.?(?:\\s|$)/i;
  const hasCompanySuffix = COMPANY_SUFFIX_RE.test(strippedMsg);

  // Word count of the stripped message
  const strippedWordCount = strippedMsg.split(/\\s+/).filter(Boolean).length;

  // Person name detection (2-4 capitalized words, no numbers)
  // Must be at least 2 words to avoid matching single-word company names like "Stripe", "Notion", etc.
  const personPattern = /^[A-Z][a-z]+(\\s+[A-Z][a-z]+){1,3}$/;
  // Use originalMsg (case preserved) for the prefix regex - the lowercase `msg`
  // version was broken because [A-Z] never matches lowercase letters.
  const personWithPrefix = originalMsg.match(/^(?:research|find|look up|tell me about)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)+)$/);

  if (personWithPrefix && personWithPrefix[1] && !hasCompanySuffix) {
    // Multi-word name after a research prefix - likely a person
    const name = personWithPrefix[1];
    const wordCount = name.split(/\\s+/).length;
    if (wordCount >= 2) {
      return {
        intent: 'research_person',
        persona: 'hound',
        confidence: 0.85,
        reasoning: 'Multi-word name after research prefix suggests person search',
        extractedEntities: { companyName: null, personName: name, url: null, industry: null, location: null },
        clarifyingQuestion: null,
      };
    }
  } else if (!prefixMatch && personPattern.test(originalMsg) && !hasCompanySuffix && strippedWordCount >= 2 && strippedWordCount <= 4) {
    // Only treat as person name if there was NO research prefix.
    // (Without this guard, "Research Stripe" would be misread as a person
    // named "Research Stripe".)
    return {
      intent: 'research_person',
      persona: 'hound',
      confidence: 0.80,
      reasoning: 'Message matches a person name pattern (multi-word, no research prefix)',
      extractedEntities: { companyName: null, personName: originalMsg, url: null, industry: null, location: null },
      clarifyingQuestion: null,
    };
  }

  // Company research detection - handles "Research Stripe", "Find Notion",
  // "Tell me about Apple Inc", etc.
  // If we got here via a research prefix, the stripped text is the company name.
  const companyKeywords = ['company', 'corp', 'inc', 'ltd', 'gmbh', 'sa', 'llc', 'find', 'search', 'research', 'look up', 'tell me about', 'info on', 'discover', 'about', 'what is', 'who is'];
  if (companyKeywords.some(k => msg.includes(k)) || originalMsg.length > 3) {'''

if old_block in content:
    new_content = content.replace(old_block, new_block, 1)
    with open(fp, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("PATCHED OK (direct match)")
else:
    print("Direct match failed, trying line-by-line search...")
    # Print the relevant section so we can see what to fix
    lines = content.split("\n")
    for i, line in enumerate(lines):
        if "personPattern = /^[A-Z][a-z]+" in line:
            print(f"Line {i+1}: {line!r}")
            for j in range(max(0,i-3), min(len(lines), i+15)):
                print(f"  {j+1}: {lines[j]!r}")
            break

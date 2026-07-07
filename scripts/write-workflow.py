#!/usr/bin/env python3
"""Write the CodeQL workflow file with exact bytes — bypass tool escape issues."""
import sys

content = """# LeadReach - CodeQL Analysis Workflow
# =======================================
# Automated static analysis for TypeScript/JavaScript codebase.
# Runs on every PR and weekly on the main branch.
#
# IMPORTANT: This workflow uses the `config-file` parameter to load
# .github/codeql/codeql-config.yml, which in turn loads the data
# extension at .github/codeql/models/leadreach-sanitizers.yml that
# registers sanitizeUrl/sanitizeBrowserUrl as CodeQL SSRF sanitizers.
#
# @see SECURITY_POLICY.md sec 15.2

name: "CodeQL Security Analysis"

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * 1'  # Weekly Monday at 02:00 UTC
  workflow_dispatch:

permissions:
  actions: read
  contents: read
  security-events: write

jobs:
  analyze:
    name: Analyze TypeScript/JavaScript
    runs-on: ubuntu-latest
    timeout-minutes: 30

    strategy:
      fail-fast: false
      matrix:
        language: ['typescript', 'javascript']

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${USER_LANGUAGES}
          queries: security-extended,security-and-quality
          config-file: ./.github/codeql/codeql-config.yml

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
        with:
          category: "/language:${USER_LANGUAGE}"
          upload: true
"""

# Replace placeholders with actual matrix expressions
content = content.replace("${USER_LANGUAGES}", "${{ matrix.language }}")
content = content.replace("${USER_LANGUAGE}", "${{ matrix.language }}")

# Validate the brackets are present
assert "[main, develop]" in content, "Bracket still missing!"
assert "${{ matrix.language }}" in content, "Matrix expression missing!"

with open(".github/workflows/codeql-analysis.yml", "w") as f:
    f.write(content)

# Verify what was written
with open(".github/workflows/codeql-analysis.yml", "rb") as f:
    data = f.read()
idx = 0
count = 0
while True:
    idx = data.find(b"branches", idx)
    if idx < 0:
        break
    print("Line:", repr(data[idx:idx+40]))
    idx += 1
    count += 1
print(f"Found {count} 'branches' lines, both should have '[main, develop]'")
print("File written successfully.")

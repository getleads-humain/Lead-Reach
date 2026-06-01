# Contributing to LeadReach AI

First off, thank you for considering contributing to LeadReach AI! It's people like you who make LeadReach a great tool for the B2B lead generation community. We welcome contributions from everyone, regardless of their level of experience.

This document provides guidelines and instructions for contributing to the LeadReach AI project. Please read it carefully before submitting any contributions.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Contributing Code](#contributing-code)
  - [Improving Documentation](#improving-documentation)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [License](#license)

---

## Code of Conduct

This project and everyone participating in it is governed by the [LeadReach AI Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@leadreach.ai](mailto:conduct@leadreach.ai).

---

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v20.0 or later
- **Bun** (recommended) or npm/yarn/pnpm
- **Git** v2.30 or later
- A code editor with TypeScript support (VS Code recommended)

### Fork and Clone

1. Fork the repository on GitHub: [https://github.com/getleads-humain/Lead-Reach](https://github.com/getleads-humain/Lead-Reach)
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Lead-Reach.git
   cd Lead-Reach
   ```
3. Add the upstream remote:
   ```bash
   git remote add upstream https://github.com/getleads-humain/Lead-Reach.git
   ```

### Install Dependencies

```bash
bun install
```

### Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
2. Fill in the required environment variables in `.env`. Refer to `.env.example` for descriptions of each variable.

### Run the Development Server

```bash
bun run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Database Setup

This project uses Prisma with Supabase PostgreSQL. Set up the database schema:

```bash
bun run db:generate
bun run db:push
```

---

## How Can I Contribute?

### Reporting Bugs

Bug reports help us improve the platform for everyone. Before submitting a bug report, please:

1. **Search existing issues** to avoid duplicates
2. **Test with the latest version** to ensure the bug hasn't already been fixed
3. **Gather information**: browser version, OS, steps to reproduce, error messages, and screenshots

When filing a bug report, use the **Bug Report** issue template and provide:

- A clear, descriptive title
- Steps to reproduce the issue (numbered list)
- Expected behavior vs. actual behavior
- Screenshots or screen recordings if applicable
- Browser console errors or server logs
- Your environment (browser, OS, Node.js version)

### Suggesting Enhancements

Feature requests are welcome! Before suggesting an enhancement:

1. **Check existing issues** to see if the feature has already been requested
2. **Consider the scope** — is this a small improvement or a major feature?
3. **Think about the use case** — who benefits and how?

When filing a feature request, use the **Feature Request** issue template and provide:

- A clear, descriptive title
- A detailed description of the proposed feature
- The problem it solves or the value it adds
- Any alternative solutions you've considered
- Mockups, diagrams, or examples if applicable

### Contributing Code

We follow a fork-and-pull workflow:

1. **Create a branch** from `main`:
   ```bash
   git checkout main
   git pull upstream main
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** following our coding standards
3. **Write or update tests** for your changes
4. **Commit your changes** following our commit guidelines
5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Open a Pull Request** against the `main` branch

#### Branch Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| Feature | `feature/description` | `feature/add-stripe-billing` |
| Bug fix | `fix/description` | `fix/agent-timeout-error` |
| Documentation | `docs/description` | `docs/update-api-reference` |
| Refactor | `refactor/description` | `refactor/simplify-icp-builder` |
| Performance | `perf/description` | `perf/optimize-lead-queries` |
| Chore | `chore/description` | `chore/update-dependencies` |

### Improving Documentation

Documentation improvements are always welcome! This includes:

- Fixing typos or unclear explanations
- Adding missing documentation for features
- Improving code comments and JSDoc annotations
- Updating the API reference
- Adding examples and tutorials

Documentation files are located in:
- `/docs` — General documentation pages (served at `/docs` route)
- `/README.md` — Project overview
- Inline JSDoc comments in source code
- `.github/` — Community health files

---

## Development Setup

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui |
| Database | Supabase PostgreSQL, Prisma ORM |
| Auth | NextAuth.js, Supabase Auth |
| AI | Zhipu AI GLM models (glm-4.6v-flash, glm-4.7-flash) |
| State | Zustand, React Query |
| Payments | Stripe |

### Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── (auth)/            # Auth-related pages
│   ├── api/               # API route handlers
│   ├── app/               # Main dashboard application
│   └── ...                # Marketing and legal pages
├── components/            # Reusable React components
│   ├── ui/                # shadcn/ui primitives
│   ├── marketing/         # Marketing page components
│   └── ...                # Domain-specific components
├── lib/                   # Shared utilities and business logic
│   ├── agent-infrastructure/  # AI agent system
│   └── ...                # Utility modules
├── hooks/                 # Custom React hooks
└── types/                 # TypeScript type definitions
```

### Key Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:push` | Push schema to database |
| `bun run db:migrate` | Run database migrations |
| `bun run db:seed` | Seed database with initial data |

---

## Coding Standards

### TypeScript

- Use **strict TypeScript** — no `any` types unless absolutely necessary and documented
- Prefer **interfaces** for object types, **type aliases** for unions and intersections
- Use **explicit return types** for exported functions and API route handlers
- Leverage **Zod schemas** for runtime validation of API inputs

### React

- Use **functional components** with hooks (no class components)
- Follow the **single responsibility principle** — one component per file, one purpose per component
- Use **named exports** as the default; use default exports only for page components
- Extract reusable logic into **custom hooks** (`use*` naming convention)
- Use **shadcn/ui** components as building blocks; extend them, don't duplicate them

### Styling

- Use **Tailwind CSS** utility classes exclusively (no custom CSS unless necessary)
- Follow the **mobile-first** responsive design approach
- Use the project's **design tokens** (emerald-500 accent, etc.) for consistency
- Maintain the **dark mode** design — all components must work in dark mode

### API Routes

- Follow **RESTful conventions** for API endpoint design
- Implement **proper error handling** with structured error responses
- Use **Zod schemas** for request body validation
- Return **appropriate HTTP status codes** (200, 201, 400, 401, 403, 404, 500)
- Document all endpoints with **JSDoc comments** in the route handler

### Database

- Use **Prisma** for all database operations (no raw SQL unless necessary)
- Follow the **existing schema patterns** and naming conventions
- Create **migrations** for any schema changes
- Never store **sensitive data** (API keys, passwords) in plaintext

### Security

- **Never commit** secrets, API keys, or credentials to the repository
- Use **environment variables** for all configuration and secrets
- Validate and **sanitize all user inputs** on the server side
- Follow the **principle of least privilege** for database access
- Report security vulnerabilities to [security@leadreach.ai](mailto:security@leadreach.ai) (see [SECURITY.md](SECURITY.md))

---

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) for clear and consistent commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Changes that do not affect code meaning (formatting, etc.) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, tooling, or auxiliary changes |
| `ci` | CI/CD configuration changes |
| `revert` | Reverting a previous commit |

### Examples

```
feat(agent): add web research agent with Jina Reader integration
fix(auth): resolve session expiration race condition on login
docs(api): update Prospect Discovery endpoint response schema
refactor(icp): simplify ICP builder validation logic
perf(leads): add database index for lead scoring queries
chore(deps): update Next.js to v16.1.1
```

### Rules

- Use the **imperative mood** in the subject line ("add feature" not "added feature")
- Capitalize the **first letter** of the description
- Do not end the subject line with a **period**
- Separate subject from body with a **blank line**
- Use the body to explain **what and why**, not how

---

## Pull Request Process

### Before Submitting

1. **Sync with upstream** to resolve any merge conflicts:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
2. **Run the linter** and fix any issues:
   ```bash
   bun run lint
   ```
3. **Build successfully** to ensure no compilation errors:
   ```bash
   bun run build
   ```
4. **Test your changes** thoroughly in the development environment
5. **Update documentation** if your changes affect the user-facing API or behavior

### Submitting a PR

1. Fill out the **Pull Request template** completely
2. Link any **related issues** (e.g., "Fixes #123" or "Resolves #456")
3. Add **screenshots or recordings** for UI changes
4. Request a **review** from a maintainer
5. Be responsive to **feedback** and address review comments promptly

### PR Review Criteria

Maintainers will evaluate your PR based on:

- **Correctness**: Does the change do what it claims?
- **Code quality**: Does it follow our coding standards?
- **Test coverage**: Are there adequate tests for the change?
- **Performance**: Does the change introduce any performance regressions?
- **Security**: Does the change introduce any security vulnerabilities?
- **Documentation**: Is the change properly documented?
- **Backward compatibility**: Does the change break existing functionality?

### After Approval

1. A maintainer will merge your PR
2. Your contribution will be reflected in the project's changelog
3. You'll be credited as a contributor

---

## License

By contributing to LeadReach AI, you agree that your contributions will be licensed under the same license that covers the project. If the project does not currently have a license file, please contact the maintainers before contributing.

---

## Questions?

If you have any questions about contributing, feel free to:

- Open a [GitHub Discussion](https://github.com/getleads-humain/Lead-Reach/discussions)
- Email us at [contributing@leadreach.ai](mailto:contributing@leadreach.ai)
- Join our community chat (link available in the README)

Thank you for contributing to LeadReach AI! Your efforts help make autonomous lead generation more accessible and effective for everyone.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio/landing page for Leonid Svyatov built with Next.js 16, TypeScript, and Tailwind CSS 4. Single-page static site deployed on Vercel.

## Commands

```bash
npm run dev      # Start development server (localhost:3000)
npm run build    # Production build (uses Turbopack by default)
npm run lint     # Run ESLint
```

No test suite is configured.

## Architecture

### App Router Structure (Next.js 16)

- `app/page.tsx` - Main landing page content
- `app/layout.tsx` - Root layout with metadata, fonts, and Vercel analytics
- `app/data/metadata.ts` - Centralized content constants (TITLE, DESCRIPTION, SHORT_TITLE)
- `app/manifest.ts` - PWA manifest generation

### Component Composition Pattern

Components are layered for reuse:
- `A.tsx` (base anchor) → `ExternalLink.tsx` (external link behavior) → `HeaderLink.tsx` (styled header link)

All component props use `Readonly<>` TypeScript types.

## Code Style

ESLint 9 flat config (`eslint.config.mjs`) enforces:
- Import ordering: builtin → external → parent → sibling → index (alphabetical within groups)
- JSX prop sorting: reserved first, shorthand first, callbacks last, alphabetical

Prettier configured with:
- 120 character line width
- Single quotes (double in JSX)
- Tailwind CSS plugin with clsx support

## Styling

Tailwind CSS 4 with CSS-first configuration in `app/globals.css` using `@theme` directive. Custom gradient utilities defined there. Dark theme with amber-200 accent color for interactive elements. Mobile-first responsive design using `sm:` breakpoint.

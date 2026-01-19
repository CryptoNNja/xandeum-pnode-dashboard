# Dependencies Strategy

This document explains the key dependency choices and version decisions for this project.

## Core Framework

### Next.js 16.0.7 (Canary/RC)

**Why Canary instead of Stable 15.x?**

We are intentionally using Next.js 16 (release candidate) for the following reasons:

1. **React 19 Optimization**: Next.js 16 is specifically optimized for React 19.x, which we use throughout the application
2. **Turbopack Improvements**: Better development experience with faster HMR and compilation
3. **Edge Runtime Enhancements**: Our API routes (`/api/chat`) use Edge runtime which has significant improvements in v16
4. **Future-Proofing**: We prefer staying ahead of the curve while the codebase is actively developed

**Risks Acknowledged**:
- ⚠️ API changes between RC versions (monitored via Next.js changelog)
- ⚠️ Potential compatibility issues with third-party libraries
- ⚠️ Documentation may reference stable v15 features

**Migration Plan**:
- Once Next.js 16 reaches stable (expected Q1 2026), we'll update to the stable release
- If critical issues arise, we can downgrade to `next@15.1.x` without major refactoring

**Testing**:
- ✅ All builds pass successfully
- ✅ Production deployment works on Vercel
- ✅ No runtime errors related to Next.js version

---

## Type Safety

### Zod v3.25.76 (Not v4.x)

**Why downgrade from v4 to v3?**

While Zod v4 has great new features, we use **v3.25.76** for critical compatibility:

1. **AI SDK Compatibility**: The Vercel AI SDK (`@ai-sdk/groq`, `ai@3.4.33`) explicitly requires `zod@^3.0.0`
2. **Schema Stability**: Zod v3 is battle-tested with Supabase, tRPC, and all our validation logic
3. **No Breaking Changes Needed**: All our schemas work perfectly with v3

**What we lose from v4**:
- Some new helper methods (not critical for our use case)
- Minor performance improvements (negligible impact)

**When to upgrade to v4**:
- ✅ When `@ai-sdk/*` packages officially support Zod v4
- ✅ When we can test all AI chat validation schemas thoroughly

**npm warnings resolved** ✅:
By using Zod v3, all peer dependency warnings with AI SDK packages are eliminated. The dependencies are now fully compatible.

---

## Visualization Libraries

### Leaflet + react-leaflet v5

**SSR Configuration**:
All map components are loaded with `next/dynamic` and `ssr: false` to prevent "window is not defined" errors:

```typescript
const NodesMap = dynamic(() => import("@/components/NodesMap"), {
  ssr: false,
  loading: () => <LoadingSpinner />
});
```

**Why this approach?**
- Leaflet requires browser APIs (window, document) not available during SSR
- Dynamic import with `ssr: false` ensures the component only renders client-side
- Loading state provides UX during hydration

---

## AI & LLM

### Groq via Vercel AI SDK

**Security**:
- ✅ All Groq API calls are server-side only (`app/api/chat/route.ts`)
- ✅ API key stored in environment variables, never exposed to client
- ✅ Rate limiting implemented: 20 requests/hour per IP
- ✅ Edge runtime for low latency

**Model Used**: `llama-3.3-70b-versatile`
- Fast inference thanks to Groq's LPU architecture
- Good balance of quality vs speed for dashboard queries

---

## Testing

### Vitest v1.6.1

**Current Coverage**:
- ✅ 77 tests passing (scoring, health, KPI, utils)
- ⏳ **TODO**: Add tests for `scripts/crawler.ts` and `scripts/backfill.js`

**Why these are critical**:
If the crawler breaks, the entire dashboard displays stale/incorrect data. Testing the crawler logic ensures data integrity.

**Planned**:
- Add `tests/crawler.test.ts` (validation, error handling, deduplication)
- Add `tests/backfill.test.ts` (idempotence, date ranges)

---

## Package Audit Status

Last audit: January 2026

**Known Vulnerabilities**: 8 (6 moderate, 1 high, 1 critical)

**Status**:
- Most are in dev dependencies (eslint, webpack, etc.)
- None affect production runtime
- We monitor via `npm audit` and apply fixes when safe

**Action Plan**:
```bash
# Review before applying (can break things)
npm audit fix --force
```

---

## Maintenance Strategy

### Dependency Updates

**Cadence**:
- **Major versions**: Manual review + testing before update
- **Minor/Patch**: Automated via Dependabot (when configured)
- **Security patches**: Immediate review and application

**Key Dependencies to Watch**:
1. `next` - Wait for v16 stable release
2. `zod` - Monitor AI SDK compatibility
3. `@supabase/supabase-js` - Critical for data layer
4. `ai` (Vercel AI SDK) - Updates often, test chat thoroughly

---

## Questions?

If you're new to the project and wondering about a dependency choice, check:
1. This document first
2. Package.json comments (if any)
3. Git history for the dependency change
4. Ask the team!

---

**Last Updated**: January 2026
**Maintained by**: Development Team

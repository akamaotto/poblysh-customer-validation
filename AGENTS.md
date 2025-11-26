<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Type Safety Guidelines

This project enforces **strict type safety** in the frontend using Rust-inspired patterns via `oxide.ts`.

## Core Principles

### ✅ ALWAYS Use Type-Safe Patterns

1. **Result Types for Operations That Can Fail**
   - Use `Result<T, E>` from `oxide.ts` for API calls, validation, parsing, etc.
   - Never use `try-catch` for expected errors
   - Pattern match with `match()` for exhaustive error handling

2. **Option Types for Nullable Values**
   - Use `Option<T>` from `oxide.ts` for nullable/optional data
   - Never use `null` or `undefined` directly in business logic
   - Use `fromNullable()` to convert from nullable values

3. **Explicit Error Handling**
   - All error cases must be handled explicitly
   - Use `match()` for pattern matching on Result/Option types
   - Both branches of `match()` must return the same type

### ❌ NEVER Use Unsafe Types

The following are **BANNED** in this codebase:

- `any` - Use `unknown` with proper type guards or specific types
- `as any` - Use proper type assertions or refactor
- `@ts-ignore` or `@ts-expect-error` - Fix the underlying issue
- Non-null assertions (`!`) - Use proper null checks or Option types
- Implicit `undefined` - Use Option types explicitly

## Code Examples

### ✅ Good: API Call with Result Type
```typescript
import { match } from 'oxide.ts';
import { apiWithResults } from '@/lib/api-with-results';

const result = await apiWithResults.getStartups();

match(result, {
  Ok: (data) => setStartups(data),
  Err: (error) => {
    if (error.type === 'HTTP_ERROR' && error.status === 401) {
      redirectToLogin();
    } else {
      showError(formatFetchError(error));
    }
  },
});
```

### ✅ Good: Nullable Data with Option Type
```typescript
import { match } from 'oxide.ts';
import { fromNullable } from '@/lib/result-utils';

const website = fromNullable(startup.website);

match(website, {
  Some: (url) => <a href={url}>{url}</a>,
  None: () => <span>No website</span>,
});
```

### ✅ Good: Form Validation with Result Type
```typescript
import { match } from 'oxide.ts';
import { validateStartupForm } from '@/lib/validation';

const validationResult = validateStartupForm(formData);

match(validationResult, {
  Ok: async (validData) => {
    const createResult = await apiWithResults.createStartup(validData);
    // Handle create result...
  },
  Err: async (errors) => {
    // Both branches must return same type (Promise<void>)
    setFieldErrors(errors);
  },
});
```

### ❌ Bad: Using try-catch for Expected Errors
```typescript
// DON'T DO THIS
try {
  const response = await fetch('/api/startups');
  const data = await response.json();
  setStartups(data);
} catch (error) {
  console.error(error);
}
```

### ❌ Bad: Using any or non-null assertions
```typescript
// DON'T DO THIS
const data: any = await fetchData();
const value = data.field!;
```

## Important Type Rules

1. **Match Branch Type Consistency**: When using `match()`, all branches must return the same type. If one branch is async, all must be async.

2. **No Implicit Any**: TypeScript's `strict` mode is enabled. All values must have explicit types.

3. **Exhaustive Pattern Matching**: All cases in `match()` must be handled (Ok/Err, Some/None).

4. **Error Type Safety**: Use typed error types (e.g., `FetchError`, `ValidationError[]`) instead of generic Error objects.

## Utility Functions

Available in `@/lib/result-utils.ts`:
- `safeFetch<T>()` - Type-safe fetch wrapper returning Result
- `fromNullable<T>()` - Convert nullable to Option
- `validateEmail()`, `validateRequired()`, `validateUrl()` - Validation helpers
- `formatFetchError()` - User-friendly error messages

Available in `@/lib/validation.ts`:
- `validateStartupForm()` - Returns `ValidationResult<T>`
- `validateContactForm()` - Returns `ValidationResult<T>`
- `getFieldError()`, `hasFieldError()` - Error helpers

## Linting Enforcement

ESLint is configured to **error** on:
- Use of `any` type
- Non-null assertions (`!`)
- `@ts-ignore` comments
- Unsafe type assertions

Run `npm run lint` to check for violations.
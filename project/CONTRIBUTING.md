# Contributing to ColorHunt Backend

## Development Standards

### Code Style

We use **ESLint** and **Prettier** for code consistency.

```bash
# Check code style
npm run lint

# Auto-format code
npm run format

# Both together
npm run lint && npm run format
```

### Commit Messages

Follow conventional commits:
```
feat: Add new feature
fix: Fix a bug
docs: Documentation changes
test: Test additions/updates
refactor: Code refactoring
chore: Tool/dependency updates
```

### File Structure

- Services go in `src/services/`
- Routes go in `src/routes/`
- Utilities go in `src/utils/`
- Database logic goes in `src/database/`
- Tests go in `tests/` with `.test.ts` suffix

### TypeScript Standards

- Always define types/interfaces
- Use strict mode (enabled in tsconfig.json)
- Add return type annotations to functions
- Document complex logic with comments

Example service:
```typescript
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for [feature]
 * Implements Phase [X]: [phase name]
 */
export class MyService {
  /**
   * Describe what this does
   */
  static async myMethod(param: string): Promise<string> {
    // implementation
  }
}
```

## Feature Development

### Process

1. Create a feature branch: `git checkout -b feat/my-feature`
2. Implement the feature following the standards above
3. Write tests: `npm run test`
4. Verify no lint errors: `npm run lint`
5. Commit with conventional message
6. Push and create PR

### Testing

Write tests for new services and utilities:

```typescript
describe('MyService', () => {
  it('should do something', async () => {
    const result = await MyService.method();
    expect(result).toBe(expected);
  });
});
```

Run tests:
```bash
npm test                    # All tests
npm test -- --watch        # Watch mode
npm test -- --coverage     # Coverage report
```

## Adding New Features

### New Route

1. Create route file in `src/routes/`
2. Import in `src/index.ts`
3. Add to Express app: `app.use('/api/path', routeImport)`
4. Add tests in `tests/`

Example route:
```typescript
import { Router, Request, Response } from 'express';
import { sendSuccess, sendError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /path
 * Description of endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // implementation
    sendSuccess(res, data);
  } catch (error) {
    sendError(res, (error as Error).message, 500);
  }
});

export default router;
```

### New Service

1. Create service file in `src/services/`
2. Implement static methods
3. Document with JSDoc comments
4. Add tests in `tests/`

Example service:
```typescript
import { query } from '../database/connection';

export class MyService {
  /**
   * Get something from database
   * @param id - The identifier
   */
  static async get(id: string) {
    const result = await query('SELECT * FROM table WHERE id = $1', [id]);
    return result.rows[0];
  }
}
```

### Database Changes

1. Update schema in `src/database/migrations.ts`
2. Create migration following existing pattern
3. Test: `npm run migrate`
4. Document changes in migration comments

## Code Review Checklist

Before opening a PR, ensure:

- [ ] Code follows style guide (`npm run lint`)
- [ ] Tests written and passing (`npm test`)
- [ ] No console.logs (use logging service)
- [ ] Error handling with try/catch
- [ ] Types defined for all parameters
- [ ] Database queries parameterized (no SQL injection)
- [ ] Comments for complex logic
- [ ] Commit messages are clear

## Performance Guidelines

- Use indexes for frequently queried columns
- Limit API responses with pagination
- Cache with Redis when appropriate
- Profile before optimizing
- Document performance assumptions

## Security Checklist

- Validate all inputs
- Use parameterized queries
- Don't log sensitive data
- Sanitize error messages in responses
- Implement rate limiting if needed
- Use HTTPS in production
- Keep dependencies updated: `npm outdated`

## Documentation

Update docs when:
- Adding new endpoints
- Changing API behavior
- Adding configuration options
- Performance improvements

Comment style:
```typescript
/**
 * Brief description
 * @param name - Description
 * @returns Description of return value
 */
```

## Questions?

- Check existing code for patterns
- Review phase descriptions in plan.md
- Ask in pull request discussions

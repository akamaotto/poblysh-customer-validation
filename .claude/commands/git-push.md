---
name: Git Push Ritual
description: Complete git workflow: add, commit, and push changes to remote repository for Validation customer tracking app.
category: Git
tags: [git, push, commit, workflow, validation]
---
<!-- OPENSPEC:START -->
**Guardrails**
- Always check git status before making changes to understand current state
- Review staged changes before committing to ensure only intended files are included
- Use descriptive commit messages that follow the project's commit message conventions
- Ensure working directory is clean before pushing
- Verify changes don't break customer validation pipeline or database integrity
- Consider impact on startup tracking workflows before pushing
- **CRITICAL**: Never commit .env, .env.local, or .env.production files - only .env.example files should be tracked
- Always use `.gitignore` to prevent sensitive environment files from being committed

**Steps**
1. **Status Check**:
   - Run `git status` to review current changes and working directory state
   - Identify which files need to be added or committed
   - Check for any untracked files that should be handled
   - **Validation Context**: Verify changes don't expose sensitive customer data

2. **Add Changes**:
   - Stage all relevant changes using `git add .` or specific files with `git add <file>`
   - Review what will be staged before proceeding with `git diff --cached`
   - **CRITICAL**: Verify no .env, .env.local, or .env.production files are staged
   - Ensure only .env.example files are included for environment configuration
   - Ensure sensitive files or temporary changes are not accidentally staged
   - **Validation Context**: Check that customer data integrity is maintained

3. **Commit Changes**:
   - Create a descriptive commit message following project conventions
   - Use conventional commit format: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`
   - Include relevant OpenSpec change ID: `feat(CAP-001): add customer outreach tracking`
   - Execute `git commit -m "<commit message>"`
   - **Validation Context**: Mention affected validation pipeline stages

4. **Push to Remote**:
   - Push changes to the appropriate remote branch: `git push` or `git push origin <branch>`
   - For feature branches: `git push origin <feature-branch>`
   - For main branches: `git push origin main`
   - Handle any push conflicts or authentication issues if they arise
   - **Validation Context**: Ensure deployment pipeline respects data relationships

5. **Verification**:
   - Confirm remote repository reflects the changes: `git log --oneline -3`
   - Check CI/CD pipeline status if applicable
   - Verify working directory is clean after push: `git status`
   - **Validation Context**: Monitor for any deployment alerts affecting customer data

6. **Data Integrity Check**:
   - Verify no accidental changes to database schema or relationships
   - Check that foreign key relationships are intact in all affected entities
   - Ensure no cross-customer data exposure in API responses
   - Validate that validation pipeline transitions remain functional

**Reference**
- Use `git diff --cached` to review staged changes before committing
- Use `git log --oneline -5` to review recent commit history and OpenSpec references
- Use `git remote -v` to verify remote repository configuration
- Use `git status --ignored` to check if .env files are properly ignored
- Consider using `git pull --rebase` before pushing if working with others on shared code
- Review `openspec/project.md` for technical constraints before pushing architectural changes
- Check deployment readiness with validation pipeline testing before pushing to main
- Verify `.gitignore` contains: `.env`, `.env.local`, `.env.production`, `*.key`, `*.pem`

**Validation-Specific Considerations**
- Before pushing to main: ensure all OpenSpec proposals are reviewed and approved
- Verify database migrations maintain data integrity (run migrations in test environment)
- Check that API changes don't break existing customer tracking workflows
- Monitor deployment for any issues affecting startup validation operations
- Ensure changes don't impact customer data privacy or compliance

**Commit Message Examples for Validation**
```
feat(CAP-003): add interview insight tracking with JTBD framework
- Implement RESTful APIs for interview insights and job-to-be-done tracking
- Add structured data capture for customer validation interviews
- Include weekly synthesis aggregation for validation insights

fix(CAP-002): resolve status transition error in validation pipeline
- Fix kanban board status updates for startup progression
- Ensure database transaction integrity during status changes
- Add proper error handling for invalid transitions

refactor: optimize startup listing performance for large datasets
- Implement database query optimization for startup filters
- Add caching layer for frequently accessed validation data
- Improve UI responsiveness for pipeline management

docs: update API documentation for outreach logging system
- Add examples of startup_id parameter usage
- Document authentication and authorization patterns
- Include error response format specifications
```
<!-- OPENSPEC:END -->
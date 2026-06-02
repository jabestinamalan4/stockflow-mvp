# Suggested commit plan (for assessment tracking)

Use small commits to show clear progress.

## Recommended sequence

1. chore(prisma): define org/user/product/setting schema and migration
2. feat(auth): add signup endpoint with organization creation and JWT token
3. feat(auth): add login and protected profile endpoint
4. feat(api): add JWT auth middleware and protect private routes
5. feat(products): add product CRUD with tenant scoping and SKU-per-org uniqueness
6. feat(dashboard): add inventory summary and low-stock endpoint logic
7. feat(settings): add default low-stock-threshold endpoints
8. feat(app): register API routes and static frontend serving
9. feat(frontend): add auth + dashboard + products + settings single-page UI
10. docs: add README, deployment guide, and submission instructions

## Optional quality commits

- fix(express): replace wildcard fallback with Express 5-safe middleware fallback
- refactor(validation): normalize and simplify request validation messages

## Push pattern

After each commit:

```bash
git push origin main
```

This ensures your timeline is visible continuously, as requested in the assessment.

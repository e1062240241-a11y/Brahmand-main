1. **Add ARIA attributes to the checkbox in `frontend/app/auth/entry-animation.tsx`**
   - The checkbox `TouchableOpacity` should have `accessibilityRole="checkbox"`, `accessibilityState={{ checked: agreed }}`, and `accessibilityLabel="Agree to Terms of Condition and Privacy Policy"`.

2. **Run tests and linters**
   - Execute `cd frontend && pnpm lint && npx tsc --noEmit` to verify type safety and ESLint constraints.

3. **Complete pre-commit steps:**
   - Complete pre-commit steps to make sure proper testing, verifications, reviews and reflections are done.

4. **Submit the changes**
   - Submit with title `🎨 Palette: Add accessibility attributes to terms checkbox`.

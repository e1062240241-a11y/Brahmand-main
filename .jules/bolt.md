## 2024-10-26 - [Avoid formatting files on PRs]
**Learning:** Automatically running `npx prettier --write` on files after making changes can introduce massive unrelated changes throughout the file, burying the actual fix in noise and violating rules about not modifying unrelated code.
**Action:** Do not use `prettier` or similar auto-formatters unless specifically instructed to clean up the entire file. Manually format only the specific lines changed.

## 2024-10-26 - [React Fragments vs Views inside map]
**Learning:** When refactoring React Native `.map()` renders (like replacing an IIFE), using a `<View>` wrapper can alter the component tree and affect flexbox sibling layouts.
**Action:** Always use React Fragments (`<>...</>`) or directly return the map expression if possible to avoid altering the UI hierarchy.

💡 What
Added a visual character count indicator to the title input in `HelpRequestForm.tsx`.

🎯 Why
The title input had a hardcoded `maxLength={100}` property, but no visual feedback to tell users they were approaching the limit. This degrades UX as users might continue typing after hitting the limit, finding their keystrokes ignored.

📸 Before/After
Before: The title input field showed no indication of the 100 character limit.
After: A small, subtle indicator (`{count}/100`) displays below the right side of the input field.

♿ Accessibility
This improves cognitive accessibility by giving users clear, immediate feedback on system constraints, preventing frustration during form entry.

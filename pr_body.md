## What
Added a visual character count indicator to the "Additional comments" text input in the Report Modal.

## Why
The input had a hard limit (`maxLength={200}`) but no visual indication of this limit for the user. Adding the character count improves usability by providing immediate feedback on how many characters are left.

## Before/After
**Before:** The text input accepted up to 200 characters but provided no feedback on length.
**After:** A subtle `0/200` character count appears below the text input, updating as the user types.

## Accessibility
Improves predictability and cognitive accessibility by clearly communicating input constraints to the user before they hit the limit unexpectedly.

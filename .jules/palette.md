## 2024-05-24 - Accessibility labels with i18n
**Learning:** Hardcoded translation labels using conditional logic (e.g. `t('language') === 'hi' ? '...' : '...'`) inside component tags is an i18n anti-pattern.
**Action:** Always add proper translation keys to the corresponding language dictionaries in `frontend/src/utils/i18n.ts` and use `t('keyName')`. When adding ARIA labels to React Native, standard i18n dictionary lookup guarantees the label correctly adapts to the user's language preference.

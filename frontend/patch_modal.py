import re

with open('src/components/UploadPostModal.tsx', 'r') as f:
    text = f.read()

# fix the hook
text = text.replace(
"""const useSafeVideoPlayer = (source: string | null, setup: (player: any) => void) => {
  if (!ExpoVideoModule?.useVideoPlayer) return null;
  return ExpoVideoModule.useVideoPlayer(source, setup);
};""",
"""const useSafeVideoPlayer = (source: string | null, setup: (player: any) => void) => {
  if (!ExpoVideoModule?.useVideoPlayer) return null;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return ExpoVideoModule.useVideoPlayer(source, setup);
};""")

# remove unused imports
text = text.replace("import { LinearGradient } from 'expo-linear-gradient';\n", "")
text = text.replace("import { BlurView } from 'expo-blur';\n", "")

with open('src/components/UploadPostModal.tsx', 'w') as f:
    f.write(text)


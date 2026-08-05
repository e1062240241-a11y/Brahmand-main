with open('frontend/src/components/PostFeedCard.tsx', 'r') as f:
    content = f.read()

# Interface prop
interface_old = "interface PostFeedCardProps {"
interface_new = """interface PostFeedCardProps {
  distanceFromActive?: number;"""
if interface_old in content and "distanceFromActive?: number;" not in content:
    content = content.replace(interface_old, interface_new)

# Default prop
props_old = "  isFocused = true,"
props_new = """  isFocused = true,
  distanceFromActive = 0,"""
if props_old in content and "distanceFromActive = 0" not in content:
    content = content.replace(props_old, props_new)

# Effect logic
effect_old = """  useEffect(() => {
    if (isActive && isFocused && !hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
      setShouldLoadVideo(true);
    }
  }, [isActive, isFocused]);"""

effect_new = """  useEffect(() => {
    if (isActive && isFocused && !hasLoadedOnceRef.current) {
      hasLoadedOnceRef.current = true;
      setShouldLoadVideo(true);
    }

    // Unmount if scrolled far away
    if (distanceFromActive > 3) {
      setShouldLoadVideo(false);
      setIsVideoReady(false);
      hasLoadedOnceRef.current = false; // Reset so it reloads if scrolled back
    }
  }, [isActive, isFocused, distanceFromActive]);"""

if effect_old in content and "distanceFromActive > 3" not in content:
    content = content.replace(effect_old, effect_new)

with open('frontend/src/components/PostFeedCard.tsx', 'w') as f:
    f.write(content)

import re

with open("frontend/app/sos.tsx", "r") as f:
    content = f.read()

# 1. Update the useEffect to setStage('active') when existingSOS is found
old_use_effect = """  useEffect(() => {
    (async () => {
      try {
        const res = await getMySOSAlert();
        if (res.data) setExistingSOS(res.data);
      } catch (_) {}
    })();
  }, []);"""

new_use_effect = """  useEffect(() => {
    (async () => {
      try {
        const res = await getMySOSAlert();
        if (res.data) {
          setExistingSOS(res.data);
          setStage('active');
        }
      } catch (_) {}
    })();
  }, []);"""

content = content.replace(old_use_effect, new_use_effect)

# 2. Remove the existingSOS ternary wrapper
# We need to find {existingSOS ? (... ) : (<>
# and remove it, and the closing </>)} at the end of the KeyboardAvoidingView.

pattern = re.compile(r"\{existingSOS \? \([\s\S]*?\) : \(<>\s*", re.MULTILINE)
content = pattern.sub("", content)

# 3. Fix the closing tag
content = content.replace("        </>)}\n      </KeyboardAvoidingView>", "      </KeyboardAvoidingView>")

with open("frontend/app/sos.tsx", "w") as f:
    f.write(content)

print("Fixed sos.tsx")

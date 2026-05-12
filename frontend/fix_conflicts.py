import sys

with open("app/(tabs)/messages.tsx", "r") as f:
    lines = f.readlines()

out_lines = []
state = "NORMAL"

for line in lines:
    if line.startswith("<<<<<<< HEAD"):
        state = "IN_HEAD"
        continue
    elif line.startswith("======="):
        state = "IN_INCOMING"
        continue
    elif line.startswith(">>>>>>>"):
        state = "NORMAL"
        continue
        
    if state == "NORMAL":
        out_lines.append(line)
    elif state == "IN_HEAD":
        out_lines.append(line)
    elif state == "IN_INCOMING":
        # we skip incoming for now to see if it fixes it
        pass

with open("app/(tabs)/messages.tsx", "w") as f:
    f.writelines(out_lines)

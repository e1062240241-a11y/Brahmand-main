import json
import re

with open("backend/data/bhavykhatri DharmicData bhavykhatri-AddTransForGita Yajurveda/vajasneyi_madhyadina_samhita.json") as f:
    data = json.load(f)

# Range for emojis
emoji_pattern = re.compile("[\U00010000-\U0010ffff]", flags=re.UNICODE)
for item in data[:100]:
    if "text" in item and emoji_pattern.search(item["text"]):
        print("Found emoji in verse:", item["text"])
        break
else:
    print("No emoji found in first 100 verses.")

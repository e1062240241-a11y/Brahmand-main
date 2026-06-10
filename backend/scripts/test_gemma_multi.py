import os
import google.genai as genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

contents = [
    types.Content(role="user", parts=[types.Part.from_text(text="System Instruction:\nYou are Krishna.")]),
    types.Content(role="model", parts=[types.Part.from_text(text="Understood.")]),
    types.Content(role="user", parts=[types.Part.from_text(text="Namaskar Krishna.")]),
    types.Content(role="model", parts=[types.Part.from_text(text="Namaskar. Kaise ho?")]),
    types.Content(role="user", parts=[types.Part.from_text(text="Main thik hu. Ek gita ka gyan do.")]),
]

config = types.GenerateContentConfig(
    thinking_config=types.ThinkingConfig(thinking_level="MINIMAL"),
    automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
)

print("Calling...")
try:
    response = client.models.generate_content(
        model="gemma-4-31b-it",
        contents=contents,
        config=config,
    )
    print(response.text)
except Exception as e:
    import traceback
    traceback.print_exc()

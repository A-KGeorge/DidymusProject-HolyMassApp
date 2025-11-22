// src/translationService.ts

export async function translateMalayalamToEnglish(text: string): Promise<string> {
  const response = await fetch("https://libretranslate.de/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      source: "ml",   // Malayalam
      target: "en",   // English
      format: "text",
    }),
  });

  if (!response.ok) {
    throw new Error("Translation failed");
  }

  const data = await response.json();
  return data.translatedText;
}

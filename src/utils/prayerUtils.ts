import React from "react";
import type { PrayersType, Prayer } from "../types/prayers";

/**
 * @brief Helper function to split a long text into chunks not exceeding maxLen, breaking at word boundaries.
 * @param text The input text to split
 * @param maxLen The maximum length of each chunk
 * @returns An array of text chunks
 */

function splitTextIntoChunks(text: string, maxLen: number): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    if (!word) continue;

    const candidate = (current ? current + " " : "") + word;

    if (candidate.length > maxLen) {
      if (current.trim()) {
        chunks.push(current.trim());
      }
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

/**
 * @brief Helper function to translate Malayalam text to English using MyMemory API, handling long texts by chunking.
 * @param text The Malayalam text to translate
 * @returns The translated English text as a Promise
 */

export async function translateMalayalamToEnglish(
  text: string
): Promise<string> {
  const maxLen = 400;
  const chunks = splitTextIntoChunks(text, maxLen);

  console.log("🌐 Starting translation. Total length:", text.length);
  console.log("🌐 Number of chunks:", chunks.length);

  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    // place in try catch block
    console.log("🌐 Translating chunk (length):", chunk.length);
    const url =
      "https://api.mymemory.translated.net/get?" +
      "q=" +
      encodeURIComponent(chunk) +
      "&langpair=ml|en";

    const response = await fetch(url);

    if (!response.ok) {
      console.error(
        "❌ Translation HTTP error:",
        response.status,
        response.statusText
      );
      throw new Error("Translation failed for a chunk: " + response.statusText);
    }

    const data = await response.json();
    const translated = data?.responseData?.translatedText;

    console.log("✅ Chunk translated:", translated);

    if (!translated) {
      throw new Error("No translation returned for a chunk");
    }

    translatedChunks.push(translated);
  }

  const full = translatedChunks.join(" ");
  console.log("✅ Full translated text:", full);
  return full;
}

/**
 * @brief Helper function to parse prayers from the JSON data into an array of Prayer objects.
 * @param data The prayers JSON data
 * @returns An array of Prayer objects
 */
export function parsePrayers(data: PrayersType): Prayer[] {
  // Cast to a record so we can index with string keys safely
  const prayersObj = data.mass["preface-announcement"] as Record<string, any>;
  const prayers: Prayer[] = [];

  for (const key in prayersObj) {
    const prayer = prayersObj[key];

    prayers.push({
      id: key,
      title: prayer.title?.malayalam,
      malayalamText: prayer.malayalam?.text || "",
      englishText: undefined,
    });
  }

  return prayers;
}

/**
 * @brief Helper function to scroll to a specific prayer using the virtualizer.
 * @param prayers The array of prayers
 * @param virtualizer The virtualizer instance
 * @param prayerId The ID of the prayer to scroll to
 */
export function scrollToPrayer(
  prayers: Prayer[],
  virtualizer: any,
  prayerId: string
) {
  const index = prayers.findIndex((p) => p.id === prayerId);
  if (index !== -1) {
    virtualizer.scrollToIndex(index, { align: "start" });
  }
}

/**
 * @brief Helper function to update prayers state and ref.
 * @param setPrayers The setState function for prayers
 * @param prayersRef The ref to prayers
 * @param updater The updater function
 */
export function updatePrayers(
  setPrayers: React.Dispatch<React.SetStateAction<Prayer[]>>,
  prayersRef: React.MutableRefObject<Prayer[]>,
  updater: (prev: Prayer[]) => Prayer[]
) {
  setPrayers((prev) => {
    const updated = updater(prev);
    prayersRef.current = updated;
    return updated;
  });
}

/**
 * @brief Helper to calculate similarity between two strings using character n-grams
 * @param str1 First string
 * @param n Length of n-grams
 * @returns Set of n-grams
 */
function getNGrams(str: string, n: number): Set<string> {
  const ngrams = new Set<string>();
  const cleaned = str.replace(/\s+/g, " ").trim();
  for (let i = 0; i <= cleaned.length - n; i++) {
    ngrams.add(cleaned.substring(i, i + n));
  }
  return ngrams;
}

/**
 * @brief Helper to compute Jaccard similarity between two sets
 * @param set1 Set of strings
 * @param set2 Set of strings
 * @returns Jaccard similarity coefficient
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * @brief Helper to find best matching prayer using fuzzy n-gram matching
 * @param transcript The recognized Malayalam transcript
 * @param prayers The array of prayers to match against
 * @returns The best matching Prayer or null if none found
 */
export function findBestMatchingPrayer(
  transcript: string,
  prayers: Prayer[]
): Prayer | null {
  if (!transcript.trim()) return null;

  const transcriptNGrams = getNGrams(transcript.toLowerCase(), 3);

  let bestPrayer: Prayer | null = null;
  let bestScore = 0;
  const MIN_THRESHOLD = 0.05; // Minimum similarity threshold

  for (const prayer of prayers) {
    const prayerNGrams = getNGrams(prayer.malayalamText.toLowerCase(), 3);
    const similarity = jaccardSimilarity(transcriptNGrams, prayerNGrams);

    // Also check for substring containment (if transcript words appear in prayer)
    const words = transcript.split(/\s+/).filter((w) => w.length > 2);
    let substringBonus = 0;
    for (const word of words) {
      if (prayer.malayalamText.includes(word)) {
        substringBonus += 0.1;
      }
    }

    const totalScore = similarity + Math.min(substringBonus, 0.3);

    console.log(
      `Prayer ${prayer.id}: similarity=${similarity.toFixed(
        3
      )}, bonus=${substringBonus.toFixed(3)}, total=${totalScore.toFixed(3)}`
    );

    if (totalScore > bestScore && totalScore >= MIN_THRESHOLD) {
      bestScore = totalScore;
      bestPrayer = prayer;
    }
  }

  console.log(
    `Best match: ${bestPrayer?.id || "none"} with score ${bestScore.toFixed(3)}`
  );

  return bestPrayer;
}

/**
 * @brief Helper function to calculate the size of a prayer item for virtualization.
 * @param prayer The prayer object
 * @returns The calculated size in pixels
 */
export const calculateSize = (prayer: Prayer) => {
  let size = 40;
  if (prayer.title) size += 40;
  size += prayer.malayalamText.length * 0.6;
  if (prayer.englishText) size += prayer.englishText.length * 0.6 + 40;
  return Math.max(size, 100);
};


import React, { useEffect, useRef, useState } from "react";
import prayersJson from "../assets/prayers1.json";

interface Prayer {
  id: string;
  title?: string;
  malayalamText: string;
  englishText?: string;
}


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


async function translateMalayalamToEnglish(text: string): Promise<string> {
  const maxLen = 400;
  const chunks = splitTextIntoChunks(text, maxLen);

  console.log("🌐 Starting translation. Total length:", text.length);
  console.log("🌐 Number of chunks:", chunks.length);

  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
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

// Parse JSON into flat list of prayers
function parsePrayers(data: any): Prayer[] {
  const prayersObj = data.mass["preface-announcement"];
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


function findBestMatchingPrayer(
  transcript: string,
  prayers: Prayer[]
): Prayer | null {
  const words = transcript
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  if (words.length === 0) return null;

  let bestPrayer: Prayer | null = null;
  let bestScore = 0;

  for (const prayer of prayers) {
    let score = 0;
    for (const w of words) {
      if (prayer.malayalamText.includes(w)) {
        score++;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestPrayer = prayer;
    }
  }

  if (bestScore === 0) return null;
  return bestPrayer;
}

// Simple helper for smooth scrolling
function scrollToElement(el: HTMLDivElement | null) {
  if (!el) return;
  el.scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
}

// ---------- Component ----------

const PrayerList: React.FC = () => {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [lastSpokenText, setLastSpokenText] = useState<string>("");

  const prayerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const recognitionRef = useRef<any>(null);
  const prayersRef = useRef<Prayer[]>([]);
  const hasStartedRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const parsed = parsePrayers(prayersJson);
    setPrayers(parsed);
    prayersRef.current = parsed;
  }, []);


  const updatePrayers = (updater: (prev: Prayer[]) => Prayer[]) => {
    setPrayers((prev) => {
      const updated = updater(prev);
      prayersRef.current = updated;
      return updated;
    });
  };


  const handleTranscript = async (transcript: string) => {
    setError(null);
    const clean = transcript.trim();
    console.log(
      "%c🎧 Processing transcript: " + clean,
      "color: lightblue; font-size: 13px;"
    );

    if (!clean) {
      console.log("Empty/unclear transcript.");
      setError("Could not understand speech clearly.");
      return;
    }

    const currentPrayers = prayersRef.current;
    const bestPrayer = findBestMatchingPrayer(clean, currentPrayers);

    if (!bestPrayer) {
      console.log(
        "%c❓ No prayer matched for transcript: " + clean,
        "color: red;"
      );
      setError("No matching prayer found for the spoken words.");
      return;
    }

    console.log(
      "%c Matched prayer: " +
        bestPrayer.id +
        " (" +
        (bestPrayer.title || "No Title") +
        ")",
      "color: green; font-weight:bold;"
    );

    // Highlight & scroll to matched prayer
    setActiveId(bestPrayer.id);
    const el = prayerRefs.current[bestPrayer.id];
    scrollToElement(el);

    // Translate immediately on first match
    if (!bestPrayer.englishText && !loadingId) {
      console.log(
        "%c🌐 Translating full paragraph for prayer: " + bestPrayer.id,
        "color: cyan; font-size: 14px;"
      );

      // Save index of current prayer to know "next"
      const currentIndex = currentPrayers.findIndex(
        (p) => p.id === bestPrayer.id
      );

      try {
        setLoadingId(bestPrayer.id);
        const translated = await translateMalayalamToEnglish(
          bestPrayer.malayalamText
        );

        updatePrayers((prev) =>
          prev.map((p) =>
            p.id === bestPrayer.id ? { ...p, englishText: translated } : p
          )
        );

        // Scroll once more to ensure translated text is visible
        const elAfter = prayerRefs.current[bestPrayer.id];
        scrollToElement(elAfter);

        // Auto-scroll to NEXT prayer after translation finishes
        const nextPrayer = currentPrayers[currentIndex + 1];
        if (nextPrayer) {
          console.log(
            "%c Auto-scrolling to next prayer: " + nextPrayer.id,
            "color: magenta;"
          );
          setActiveId(nextPrayer.id);
          const nextEl = prayerRefs.current[nextPrayer.id];
          scrollToElement(nextEl);
        } else {
          console.log("%c⏹ No next prayer to scroll to.", "color: gray;");
        }
      } catch (err: any) {
        console.error(" Translation error:", err);
        setError("Translation failed: " + (err?.message || "Unknown error"));
      } finally {
        setLoadingId(null);
      }
    } else {
      console.log(" Skipping translation (already translated or loading).");
    }
  };

  // Setup speech recognition once
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ml-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      console.log(
        "%c🎤 Speech recognition STARTED",
        "color: lightgreen; font-size:14px"
      );
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log(
        "%c Speech recognition ENDED",
        "color: orange; font-size:14px"
      );

      if (hasStartedRef.current) {
        console.log(
          "%c Waiting 10 seconds before next listening...",
          "color: yellow;"
        );
        if (restartTimeoutRef.current) {
          window.clearTimeout(restartTimeoutRef.current);
        }
        restartTimeoutRef.current = window.setTimeout(() => {
          console.log(
            "%c Starting NEXT listening cycle...",
            "color: cyan; font-size:14px"
          );
          try {
            recognition.start();
          } catch (err) {
            console.warn("Restart recognition failed:", err);
          }
        }, 10000);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("%c Speech recognition error:", "color:red;", event.error);
      setError("Speech recognition error: " + event.error);
      setIsListening(false);
    };

    recognition.onresult = async (event: any) => {
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0].transcript;

        if (!res.isFinal) {
          console.log("%c Interim heard: " + text, "color: gray;");
        } else {
          console.log(
            "%c FINAL HEARD: " + text,
            "color: white; background:black; font-size:16px; padding:2px 4px;"
          );
          setLastSpokenText(text);
          await handleTranscript(text);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // User tap arms the system: first listen starts AFTER 10 seconds
  const handleUserTap = () => {
    if (!recognitionRef.current) return;
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      console.log(
        "%c Mic armed. First listening will start in 10 seconds.",
        "color: lightgreen;"
      );

      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
      }
      restartTimeoutRef.current = window.setTimeout(() => {
        try {
          console.log(
            "%c⏯ Starting initial listening after 10 seconds...",
            "color: cyan;"
          );
          recognitionRef.current.start();
        } catch (err) {
          console.warn("Could not start speech recognition:", err);
        }
      }, 10000);
    }
  };

  return (
    <div
      style={{ padding: "20px", color: "#ffffff" }}
      onClick={handleUserTap}
    >
      <h1>Holy Mass Prayers</h1>

      
      <div style={{ marginBottom: "10px", fontSize: "0.95rem" }}>
        <p>
          Mic status:{" "}
          <strong>
            {isListening ? "Listening for Malayalam…" : "Not listening"}
          </strong>
        </p>
        {lastSpokenText && (
          <p>
            Last heard: <i>{lastSpokenText}</i>
          </p>
        )}
        {loadingId && <p>Translating selected prayer…</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {!hasStartedRef.current && !error && (
          <p style={{ fontStyle: "italic" }}>
            Tap anywhere once to arm the microphone. It will start after 10
            seconds, listen, then wait 10 seconds between cycles.
          </p>
        )}
      </div>

      {prayers.map((prayer) => (
        <div
          key={prayer.id}
          ref={(el) => {
            prayerRefs.current[prayer.id] = el;
          }}
          style={{
            marginBottom: "20px",
            padding: "10px",
            border:
              activeId === prayer.id ? "2px solid #007bff" : "1px solid #ddd",
            borderRadius: "8px",
            textAlign: "left",
            backgroundColor: activeId === prayer.id ? "#eef5ff" : "white",
            color: "#000000",
          }}
        >
          {prayer.title && <h2>{prayer.title}</h2>}
          <p style={{ whiteSpace: "pre-wrap" }}>{prayer.malayalamText}</p>
          {prayer.englishText && (
            <p>
              <i>{prayer.englishText}</i>
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default PrayerList;

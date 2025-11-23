import { useEffect, useRef, useState, useCallback } from "react";
import prayersJson from "../assets/prayers1.json";
import {
  parsePrayers,
  translateMalayalamToEnglish,
  updatePrayers,
  findBestMatchingPrayer,
  calculateSize,
} from "../utils/prayerUtils";
import type { Prayer } from "../types/prayers";
import { useVirtualizer } from "@tanstack/react-virtual";
import MicControl, { type MicStatus } from "./MicControl";
import EnglishTranslation from "./EnglishTranslation";

const LISTEN_INTERVAL = 10; // seconds between listening cycles

const PrayerList: React.FC = () => {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [lastSpokenText, setLastSpokenText] = useState<string>("");

  // Mic control state
  const [micEnabled, setMicEnabled] = useState<boolean>(false);
  const [micStatus, setMicStatus] = useState<MicStatus>("idle");
  const [countdown, setCountdown] = useState<number>(LISTEN_INTERVAL);

  const prayerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const recognitionRef = useRef<any>(null);
  const prayersRef = useRef<Prayer[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizerRef = useRef<any>(null);
  const loadingIdRef = useRef<string | null>(null);
  const handleTranscriptRef = useRef<
    ((transcript: string) => Promise<void>) | null
  >(null);
  // Timing refs
  const restartTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const micEnabledRef = useRef<boolean>(false);

  useEffect(() => {
    const parsed = parsePrayers(prayersJson);
    setPrayers(parsed);
    prayersRef.current = parsed;
  }, []);

  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  const virtualizer = useVirtualizer({
    count: prayers.length,
    getScrollElement: () => scrollElement || document.body,
    estimateSize: (index) => calculateSize(prayers[index]),
    measureElement: (el) => el?.getBoundingClientRect().height ?? 0,
  });

  useEffect(() => {
    virtualizerRef.current = virtualizer;
  }, [virtualizer]);

  // Keep refs in sync
  useEffect(() => {
    loadingIdRef.current = loadingId;
  }, [loadingId]);

  useEffect(() => {
    micEnabledRef.current = micEnabled;
  }, [micEnabled]);

  const clearTimers = useCallback(() => {
    if (restartTimeoutRef.current) {
      window.clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      window.clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const startCountdown = useCallback((onComplete: () => void) => {
    setCountdown(LISTEN_INTERVAL);
    setMicStatus("waiting");

    let remaining = LISTEN_INTERVAL;

    countdownIntervalRef.current = window.setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        if (countdownIntervalRef.current) {
          window.clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        onComplete();
      }
    }, 1000);
  }, []);

  const scrollToPrayerById = useCallback((prayerId: string) => {
    const currentPrayers = prayersRef.current;
    const currentVirtualizer = virtualizerRef.current;

    if (!currentVirtualizer) {
      console.warn("Virtualizer not ready");
      return;
    }

    const index = currentPrayers.findIndex((p) => p.id === prayerId);
    if (index !== -1) {
      console.log(`📜 Scrolling to prayer index ${index} (${prayerId})`);
      currentVirtualizer.scrollToIndex(index, { align: "start" });
    } else {
      console.warn(`Prayer ${prayerId} not found in list`);
    }
  }, []);

  const handleTranscript = useCallback(
    async (transcript: string) => {
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
          "%c❌ No prayer matched for transcript: " + clean,
          "color: red;"
        );
        setError("No matching prayer found for the spoken words.");
        return;
      }

      console.log(
        "%c✅ Matched prayer: " +
          bestPrayer.id +
          " (" +
          (bestPrayer.title || "No Title") +
          ")",
        "color: green; font-weight:bold;"
      );

      setActiveId(bestPrayer.id);

      setTimeout(() => {
        scrollToPrayerById(bestPrayer.id);
      }, 0);

      if (!bestPrayer.englishText && !loadingIdRef.current) {
        console.log(
          "%c🌐 Translating full paragraph for prayer: " + bestPrayer.id,
          "color: cyan; font-size: 14px;"
        );

        const currentIndex = currentPrayers.findIndex(
          (p) => p.id === bestPrayer.id
        );

        try {
          setLoadingId(bestPrayer.id);
          loadingIdRef.current = bestPrayer.id;

          const translated = await translateMalayalamToEnglish(
            bestPrayer.malayalamText
          );

          updatePrayers(setPrayers, prayersRef, (prev) =>
            prev.map((p) =>
              p.id === bestPrayer.id ? { ...p, englishText: translated } : p
            )
          );

          requestAnimationFrame(() => {
            virtualizerRef.current?.measure();
          });

          setTimeout(() => {
            scrollToPrayerById(bestPrayer.id);

            const nextPrayer = prayersRef.current[currentIndex + 1];
            if (nextPrayer) {
              console.log(
                "%c➡️ Auto-scrolling to next prayer: " + nextPrayer.id,
                "color: magenta;"
              );
              setTimeout(() => {
                setActiveId(nextPrayer.id);
                scrollToPrayerById(nextPrayer.id);
              }, 500);
            } else {
              console.log("%cℹ️ No next prayer to scroll to.", "color: gray;");
            }
          }, 100);
        } catch (err: any) {
          console.error("❌ Translation error:", err);
          setError("Translation failed: " + (err?.message || "Unknown error"));
        } finally {
          setLoadingId(null);
          loadingIdRef.current = null;
        }
      } else {
        console.log("⏭️ Skipping translation (already translated or loading).");
      }
    },
    [scrollToPrayerById]
  );

  useEffect(() => {
    handleTranscriptRef.current = handleTranscript;
  }, [handleTranscript]);

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
      setMicStatus("listening");
      console.log(
        "%c🎤 Speech recognition STARTED",
        "color: lightgreen; font-size:14px"
      );
    };

    recognition.onend = () => {
      console.log(
        "%c⏹️ Speech recognition ENDED",
        "color: orange; font-size:14px"
      );

      // Only restart if mic is still enabled
      if (micEnabledRef.current) {
        console.log(
          "%c⏳ Starting countdown to next listen...",
          "color: yellow;"
        );
        startCountdown(() => {
          if (micEnabledRef.current && recognitionRef.current) {
            try {
              console.log(
                "%c🔄 Starting NEXT listening cycle...",
                "color: cyan; font-size:14px"
              );
              recognitionRef.current.start();
            } catch (err) {
              console.warn("Restart recognition failed:", err);
            }
          }
        });
      } else {
        setMicStatus("idle");
      }
    };

    recognition.onerror = (event: any) => {
      console.error(
        "%c❌ Speech recognition error:",
        "color:red;",
        event.error
      );
      setError("Speech recognition error: " + event.error);
      setMicStatus("idle");
    };

    recognition.onresult = (event: any) => {
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res[0].transcript;

        if (!res.isFinal) {
          console.log("%c🔊 Interim heard: " + text, "color: gray;");
        } else {
          console.log(
            "%c✅ FINAL HEARD: " + text,
            "color: white; background:black; font-size:16px; padding:2px 4px;"
          );
          setLastSpokenText(text);
          handleTranscriptRef.current?.(text);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      clearTimers();
    };
  }, [startCountdown, clearTimers]);

  const handleMicToggle = useCallback(() => {
    if (!recognitionRef.current) return;

    if (micEnabled) {
      // Stop mic
      console.log("%c🛑 Stopping mic", "color: red;");
      setMicEnabled(false);
      micEnabledRef.current = false;
      clearTimers();
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn("Stop failed:", err);
      }
      setMicStatus("idle");
      setCountdown(LISTEN_INTERVAL);
    } else {
      // Start mic with countdown
      console.log("%c🎯 Starting mic with countdown", "color: lightgreen;");
      setMicEnabled(true);
      micEnabledRef.current = true;
      setError(null);

      startCountdown(() => {
        if (micEnabledRef.current && recognitionRef.current) {
          try {
            console.log("%c▶️ Starting initial listening...", "color: cyan;");
            recognitionRef.current.start();
          } catch (err) {
            console.warn("Could not start speech recognition:", err);
          }
        }
      });
    }
  }, [micEnabled, clearTimers, startCountdown]);

  return (
    <div style={{ padding: "20px", color: "#ffffff" }}>
      <h1>Holy Mass Prayers</h1>

      <MicControl
        status={micStatus}
        isEnabled={micEnabled}
        countdown={countdown}
        intervalDuration={LISTEN_INTERVAL}
        onToggle={handleMicToggle}
        error={error}
      />

      {lastSpokenText && (
        <div style={{ marginBottom: "10px", fontSize: "0.95rem" }}>
          <p>
            Last heard: <i>{lastSpokenText}</i>
          </p>
        </div>
      )}

      <div
        ref={(el) => {
          parentRef.current = el;
          if (el) setScrollElement(el);
        }}
        style={{
          height: "400px",
          overflow: "auto",
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const prayer = prayers[virtualItem.index];
            const isActive = activeId === prayer.id;
            const isLoading = loadingId === prayer.id;

            return (
              <div
                key={prayer.id}
                ref={(el) => {
                  prayerRefs.current[prayer.id] = el;
                }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  minHeight: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  marginBottom: "20px",
                  padding: "15px",
                  border: isActive ? "2px solid #007bff" : "1px solid #ddd",
                  borderRadius: "8px",
                  textAlign: "left",
                  backgroundColor: isActive ? "#eef5ff" : "white",
                  color: "#000000",
                  boxSizing: "border-box",
                }}
              >
                {prayer.title && (
                  <h2 style={{ marginTop: 0 }}>{prayer.title}</h2>
                )}
                <p style={{ whiteSpace: "pre-wrap" }}>{prayer.malayalamText}</p>

                <EnglishTranslation
                  text={prayer.englishText}
                  isLoading={isLoading}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PrayerList;

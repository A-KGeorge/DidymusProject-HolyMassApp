import { useEffect, useRef, useState } from "react";
import type { FC } from "react";
import { useMutation } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import prayersJson from "../assets/prayers1.json";
import {
  translateMalayalamToEnglish,
  parsePrayers,
  calculateSize,
  scrollToPrayer,
  startCountdown,
  processTranscript,
} from "../utils/prayerUtils";
import type { Prayer } from "../types/prayers";
import MicControl from "./MicControl";
import PrayerList from "./PrayerList";

const WAITING_INTERVAL = 10;

const VoicePrayerNavigator: FC = () => {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [lastSpokenText, setLastSpokenText] = useState<string>("");
  const [showEnglish, setShowEnglish] = useState<boolean>(true);
  const [countdown, setCountdown] = useState<number>(0);

  const parentRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const prayersRef = useRef<Prayer[]>([]);
  const hasStartedRef = useRef<boolean>(false);
  const restartTimeoutRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const isRecognitionActiveRef = useRef<boolean>(false);

  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  const virtualizer = useVirtualizer({
    count: prayers.length,
    getScrollElement: () => scrollElement || document.body,
    estimateSize: (index) => calculateSize(prayers[index]),
    overscan: 5,
  });

  // Handles the quey via tanstack/react-query for translation
  const translationMutation = useMutation({
    mutationFn: async (prayer: Prayer) => {
      const translated = await translateMalayalamToEnglish(
        prayer.malayalamText
      );
      return { prayerId: prayer.id, translated };
    },
    onSuccess: (data) => {
      setPrayers((prev) =>
        prev.map((p) =>
          p.id === data.prayerId ? { ...p, englishText: data.translated } : p
        )
      );
      prayersRef.current = prayersRef.current.map((p) =>
        p.id === data.prayerId ? { ...p, englishText: data.translated } : p
      );

      // Scroll to the prayer again after translation to account for height change
      setTimeout(() => {
        scrollToPrayer(prayersRef.current, virtualizer, data.prayerId);
      }, 100);

      // // Auto-scroll to next prayer after translation
      // const currentIndex = prayersRef.current.findIndex(
      //   (p) => p.id === data.prayerId
      // );
      // const nextPrayer = prayersRef.current[currentIndex + 1];
      // if (nextPrayer) {
      //   console.log(
      //     "%c⏭️ Auto-scrolling to next prayer: " + nextPrayer.id,
      //     "color: magenta;"
      //   );
      //   setTimeout(() => {
      //     setActiveId(nextPrayer.id);
      //     scrollToPrayer(prayersRef.current, virtualizer, nextPrayer.id);
      //   }, 500);
      // } else {
      //   console.log("%c⏹️ No next prayer to scroll to.", "color: gray;");
      // }
    },
    onError: (err: any) => {
      setError("Translation failed: " + (err?.message || "Unknown error"));
    },
  });

  useEffect(() => {
    const parsed = parsePrayers(prayersJson);
    setPrayers(parsed);
    prayersRef.current = parsed;
  }, []);

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
    recognition.continuous = false;

    recognition.onstart = () => {
      console.log(
        "%c🎤 Speech recognition STARTED",
        "color: lightgreen; font-size:14px"
      );
      setIsListening(true);
      setCountdown(0);
      isRecognitionActiveRef.current = true;
    };

    recognition.onend = () => {
      console.log(
        "%c🛑 Speech recognition ENDED",
        "color: orange; font-size:14px"
      );
      setIsListening(false);
      isRecognitionActiveRef.current = false;

      if (hasStartedRef.current) {
        console.log(
          `%c⏱️ Waiting ${WAITING_INTERVAL} seconds before next listening...`,
          "color: yellow;"
        );
        startCountdown(
          WAITING_INTERVAL,
          setCountdown,
          countdownIntervalRef,
          () => {
            setTimeout(() => {
              if (!isRecognitionActiveRef.current && hasStartedRef.current) {
                console.log(
                  "%c▶️ Starting NEXT listening cycle...",
                  "color: cyan; font-size:14px"
                );
                try {
                  recognition.start();
                } catch (err) {
                  console.warn("⚠️ Restart recognition failed:", err);
                }
              }
            }, 100);
          }
        );
      }
    };

    recognition.onerror = (event: any) => {
      console.error(
        "%c❌ Speech recognition error:",
        "color:red;",
        event.error
      );

      // Don't show error for "no-speech" - it's expected
      if (event.error !== "no-speech") {
        setError("Speech recognition error: " + event.error);
      }

      setIsListening(false);
      isRecognitionActiveRef.current = false;
    };

    recognition.onresult = async (event: any) => {
      for (let i = 0; i < event.results.length; i++) {
        const res = event.results[i];
        const text: string = res[0].transcript;

        if (!res.isFinal) {
          console.log("%c🔊 Interim heard: " + text, "color: gray;");
        } else {
          console.log(
            "%c✅ FINAL HEARD: " + text,
            "color: white; background:black; font-size:16px; padding:2px 4px;"
          );
          setLastSpokenText(text);
          await processTranscript(
            text,
            prayersRef,
            virtualizer,
            setActiveId,
            setError,
            translationMutation
          );
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (isRecognitionActiveRef.current) {
        recognition.stop();
      }
      if (restartTimeoutRef.current) {
        window.clearTimeout(restartTimeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        window.clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (!hasStartedRef.current) {
      // Start the system
      hasStartedRef.current = true;
      console.log(
        `%c🔧 Mic armed. First listening will start in ${WAITING_INTERVAL} seconds.`,
        "color: lightgreen;"
      );

      startCountdown(
        WAITING_INTERVAL,
        setCountdown,
        countdownIntervalRef,
        () => {
          setTimeout(() => {
            if (!isRecognitionActiveRef.current && hasStartedRef.current) {
              try {
                console.log(
                  `%c⏯️ Starting initial listening after ${WAITING_INTERVAL} seconds...`,
                  "color: cyan;"
                );
                recognitionRef.current.start();
              } catch (err) {
                console.warn("⚠️ Could not start speech recognition:", err);
              }
            }
          }, 100);
        }
      );
    } else {
      // Stop the system
      console.log("%c🛑 Stopping mic system...", "color: red;");
      hasStartedRef.current = false;
      setCountdown(0);

      if (countdownIntervalRef.current) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }

      if (isRecognitionActiveRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const progressPercentage =
    countdown > 0
      ? ((WAITING_INTERVAL - countdown) / WAITING_INTERVAL) * 100
      : 0;

  return (
    <div className="flex gap-6 p-4 pb-0! sm:p-6 lg:p-8 flex-col md:flex-row">
      {/* Left Sidebar - Mic Interface */}
      <div className="w-full md:w-80 shrink-0">
        <MicControl
          toggleListening={toggleListening}
          isListening={isListening}
          hasStartedRef={hasStartedRef}
          countdown={countdown}
          progressPercentage={progressPercentage}
          showEnglish={showEnglish}
          setShowEnglish={setShowEnglish}
          lastSpokenText={lastSpokenText}
          translationMutation={translationMutation}
          error={error}
        />
      </div>

      {/* Right Side - Prayer List */}
      <div className="flex-1 min-w-0 overflow-x-hidden">
        {/* Virtualized Prayer List */}
        <PrayerList
          parentRef={parentRef}
          setScrollElement={setScrollElement}
          virtualizer={virtualizer}
          prayers={prayers}
          activeId={activeId}
          showEnglish={showEnglish}
        />
      </div>
    </div>
  );
};

export default VoicePrayerNavigator;

import type { RefObject, FC, Dispatch, SetStateAction } from "react";
import { Mic, MicOff, Volume2, Languages } from "lucide-react";
import type { UseMutationResult } from "@tanstack/react-query";
import type { Prayer } from "../types/prayers";

export type MicStatus = "idle" | "listening" | "waiting";

interface MicControlProps {
  toggleListening: () => void;
  isListening: boolean;
  hasStartedRef: RefObject<boolean>;
  countdown: number;
  progressPercentage: number;
  showEnglish: boolean;
  setShowEnglish: Dispatch<SetStateAction<boolean>>;
  lastSpokenText: string;
  translationMutation: UseMutationResult<
    { prayerId: string; translated: string },
    any,
    Prayer,
    unknown
  >;
  error: string | null;
}

const MicControl: FC<MicControlProps> = ({
  toggleListening,
  isListening,
  hasStartedRef,
  countdown,
  progressPercentage,
  showEnglish,
  setShowEnglish,
  lastSpokenText,
  translationMutation,
  error,
}) => {
  return (
    <div className="sticky top-6">
      <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-purple-100">
        <h2 className="text-2xl font-bold bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
          Controls
        </h2>

        {/* Mic Control Button */}
        <button
          onClick={toggleListening}
          className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all transform hover:scale-105 mb-4 ${
            isListening
              ? "bg-red-500 text-white shadow-lg shadow-red-200"
              : hasStartedRef.current
              ? "bg-yellow-500 text-white shadow-lg shadow-yellow-200"
              : "bg-linear-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-200"
          }`}
        >
          {isListening ? (
            <>
              <Mic className="w-6 h-6 animate-pulse" />
              <span className="text-lg">Listening...</span>
            </>
          ) : hasStartedRef.current ? (
            <>
              <Volume2 className="w-6 h-6" />
              <span className="text-lg">Waiting...</span>
            </>
          ) : (
            <>
              <MicOff className="w-6 h-6" />
              <span className="text-lg">Start Listening</span>
            </>
          )}
        </button>

        {/* Countdown Display */}
        {countdown > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Starting in {countdown}s
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-linear-to-r from-purple-500 to-pink-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Language Toggle */}
        <button
          onClick={() => setShowEnglish(!showEnglish)}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium bg-linear-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-200 transition-all transform hover:scale-105 mb-6"
        >
          <Languages className="w-5 h-5" />
          {showEnglish ? "Hide" : "Show"} English
        </button>

        {/* Status Info */}
        <div className="space-y-3 pt-4 border-t border-purple-100">
          <div className="text-sm font-semibold text-gray-700 mb-2">Status</div>

          {lastSpokenText && (
            <div className="flex items-start gap-2 text-sm bg-purple-50 p-3 rounded-lg">
              <Volume2 className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
              <div>
                <div className="font-medium text-gray-700 mb-1">
                  Last heard:
                </div>
                <div className="text-gray-600 italic">{lastSpokenText}</div>
              </div>
            </div>
          )}

          {translationMutation.isPending && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-3 rounded-lg">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
              <span>Translating prayer...</span>
            </div>
          )}

          {/* Loading Progress Bar */}
          {translationMutation.isPending && (
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-linear-to-r from-indigo-500 to-purple-500 animate-pulse rounded-full w-full" />
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          {!hasStartedRef.current && !error && (
            <div className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg">
              Click "Start Listening" to begin. The microphone will activate
              after 10 seconds.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MicControl;

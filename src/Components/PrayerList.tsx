import type { RefObject, FC, Dispatch, SetStateAction } from "react";
import type { Virtualizer } from "@tanstack/react-virtual";
import type { Prayer } from "../types/prayers";
import EnglishTranslation from "./EnglishTranslation";

interface PrayerListProps {
  parentRef: RefObject<HTMLDivElement | null>;
  setScrollElement: Dispatch<SetStateAction<HTMLElement | null>>;
  virtualizer: Virtualizer<HTMLElement, Element>;
  prayers: Prayer[];
  activeId: string | null;
  showEnglish: boolean;
}

const PrayerList: FC<PrayerListProps> = ({
  parentRef,
  setScrollElement,
  virtualizer,
  prayers,
  activeId,
  showEnglish,
}) => {
  return (
    <div
      ref={(el) => {
        parentRef.current = el;
        if (el) setScrollElement(el);
      }}
      className="h-[calc(100vh-200px)] overflow-y-auto overflow-x-hidden grid place-items-center"
      style={{
        contain: "strict",
      }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "95%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const prayer = prayers[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                width: "100%",
                transform: `translateX(-50%) translateY(${virtualItem.start}px)`,
              }}
            >
              <div
                className={`bg-white/90 backdrop-blur rounded-2xl shadow-lg p-6 mb-4 transition-all duration-300 border-2 ${
                  activeId === prayer.id
                    ? "border-purple-500 shadow-2xl shadow-purple-200 scale-[1.02]"
                    : "border-transparent hover:border-purple-200 hover:shadow-xl"
                }`}
              >
                {prayer.title && (
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-linear-to-r from-purple-500 to-pink-500"></span>
                    {prayer.title}
                  </h2>
                )}

                <div className="space-y-4">
                  {/* Malayalam Text */}
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap font-medium wrap-break-word">
                      {prayer.malayalamText}
                    </p>
                  </div>

                  {/* English Translation */}
                  {showEnglish && prayer.englishText && (
                    <EnglishTranslation prayer={prayer} />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PrayerList;

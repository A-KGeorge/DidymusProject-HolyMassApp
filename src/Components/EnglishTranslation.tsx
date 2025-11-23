import type { FC } from "react";
import { Languages } from "lucide-react";
import type { Prayer } from "../types/prayers";
interface EnglishTranslationProps {
  prayer: Prayer;
}

const EnglishTranslation: FC<EnglishTranslationProps> = ({ prayer }) => {
  return (
    <div className="pt-4 border-t border-purple-100">
      <div className="flex items-center gap-2 mb-2">
        <Languages className="w-4 h-4 text-indigo-500" />
        <span className="text-sm font-medium text-indigo-600">
          English Translation
        </span>
      </div>
      <p className="text-gray-600 italic leading-relaxed whitespace-pre-wrap">
        {prayer.englishText}
      </p>
    </div>
  );
};

export default EnglishTranslation;

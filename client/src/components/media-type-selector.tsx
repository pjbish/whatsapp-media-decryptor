import { Music, Video, Image, Mic, FileText } from "lucide-react";

interface MediaTypeSelectorProps {
  selectedType: string;
  onTypeSelect: (type: string) => void;
}

const mediaTypes = [
  { value: 'audio', label: 'Audio', icon: Music },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'image', label: 'Image', icon: Image },
  { value: 'voice', label: 'Voice', icon: Mic },
  { value: 'document', label: 'Document', icon: FileText },
];

export function MediaTypeSelector({ selectedType, onTypeSelect }: MediaTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {mediaTypes.map(({ value, label, icon: Icon }) => (
        <label key={value} className="relative cursor-pointer">
          <input
            type="radio"
            name="mediaType"
            value={value}
            checked={selectedType === value}
            onChange={(e) => onTypeSelect(e.target.value)}
            className="sr-only peer"
          />
          <div className={`flex flex-col items-center p-4 border-2 rounded-lg transition-colors ${
            selectedType === value
              ? 'border-primary bg-blue-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}>
            <Icon className={`w-8 h-8 mb-2 ${
              selectedType === value ? 'text-primary' : 'text-gray-400'
            }`} />
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
        </label>
      ))}
    </div>
  );
}

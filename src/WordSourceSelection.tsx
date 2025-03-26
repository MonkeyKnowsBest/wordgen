import React from 'react';
import { WordSource } from './wordFilter';

interface WordSourceSelectionProps {
  sources: WordSource[];
  selectedSources: string[];
  onChange: (selectedSources: string[]) => void;
}

const WordSourceSelection: React.FC<WordSourceSelectionProps> = ({
  sources,
  selectedSources,
  onChange
}) => {
  // Handle toggle of an individual source
  const handleSourceToggle = (sourceId: string) => {
    if (selectedSources.includes(sourceId)) {
      // Remove source if already selected
      onChange(selectedSources.filter(id => id !== sourceId));
    } else {
      // Add source if not selected
      onChange([...selectedSources, sourceId]);
    }
  };

  // Handle "Select All" functionality
  const handleSelectAll = () => {
    onChange(sources.map(source => source.id));
  };

  // Handle "Clear All" functionality
  const handleClearAll = () => {
    onChange([]);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Word Sources
        </label>
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-indigo-600 hover:text-indigo-800"
          >
            Clear All
          </button>
        </div>
      </div>
      
      <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {sources.map((source) => (
            <div key={source.id} className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id={`source-${source.id}`}
                  type="checkbox"
                  checked={selectedSources.includes(source.id)}
                  onChange={() => handleSourceToggle(source.id)}
                  className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor={`source-${source.id}`} className="font-medium text-gray-700">
                  {source.name}
                </label>
                <p className="text-gray-500">{source.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WordSourceSelection;

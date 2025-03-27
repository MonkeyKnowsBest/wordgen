import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface SourceErrorIndicatorProps {
  failedSources: string[];
  sources: Array<{ id: string; name: string }>;
}

const SourceErrorIndicator: React.FC<SourceErrorIndicatorProps> = ({ failedSources, sources }) => {
  if (failedSources.length === 0) {
    return null;
  }

  const failedSourceNames = failedSources.map(id => {
    const source = sources.find(s => s.id === id);
    return source ? source.name : id;
  });

  return (
    <div className="mt-2 flex items-start p-2 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
      <AlertTriangle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
      <div>
        <p className="font-medium">Warning: Some sources failed to load</p>
        <p>
          {failedSourceNames.length > 1 
            ? `The following sources couldn't be loaded: ${failedSourceNames.join(', ')}.` 
            : `The source "${failedSourceNames[0]}" couldn't be loaded.`}
        </p>
        <p>Other selected sources will still be used. Try again later or select different sources.</p>
      </div>
    </div>
  );
};

export default SourceErrorIndicator;

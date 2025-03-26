import React, { useState } from 'react';
import { Copy, CheckCircle2, List } from 'lucide-react';

interface WordOutputProps {
  words: string[];
  prefix?: string;
  separator?: string;
}

const WordOutput: React.FC<WordOutputProps> = ({ 
  words, 
  prefix = 'import React, { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

interface WordOutputProps {
  words: string[];
  prefix?: string;
  separator?: string;
}

const WordOutput: React.FC<WordOutputProps> = ({ 
  words, 
  prefix = '$', 
  separator = '\t' 
}) => {
  const [copied, setCopied] = useState(false);
  
  // Format words with prefix and separator
  const formattedOutput = words.map(word => `${prefix}${word}`).join(separator);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(formattedOutput).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Generated Words ({words.length})
        </label>
        <button
          onClick={handleCopy}
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy to Clipboard
            </>
          )}
        </button>
      </div>
      <div className="relative overflow-x-auto bg-gray-50 rounded-md p-4 font-mono text-sm whitespace-nowrap border border-gray-200">
        <div className="min-w-max">
          {formattedOutput}
        </div>
      </div>
    </div>
  );
}

export default WordOutput;, 
  separator = '\t' 
}) => {
  const [copied, setCopied] = useState(false);
  const [displayMode, setDisplayMode] = useState<'scroll' | 'grid'>('scroll');
  
  // Format words with prefix and separator
  const formattedOutput = words.map(word => `${prefix}${word}`).join(separator);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(formattedOutput).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  const toggleDisplayMode = () => {
    setDisplayMode(displayMode === 'scroll' ? 'grid' : 'scroll');
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Generated Words ({words.length})
        </label>
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDisplayMode}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
            title={displayMode === 'scroll' ? 'Switch to grid view' : 'Switch to scroll view'}
          >
            <List className="h-4 w-4 mr-1" />
            {displayMode === 'scroll' ? 'Grid View' : 'Scroll View'}
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-1" />
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      </div>
      
      {displayMode === 'scroll' ? (
        // Scroll view - horizontal scrolling
        <div className="relative overflow-x-auto bg-gray-50 rounded-md p-4 font-mono text-sm whitespace-nowrap border border-gray-200">
          <div className="min-w-max">
            {formattedOutput}
          </div>
        </div>
      ) : (
        // Grid view - words arranged in a grid
        <div className="bg-gray-50 rounded-md p-4 border border-gray-200">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {words.map((word, index) => (
              <div key={index} className="font-mono text-sm p-2 bg-white border border-gray-100 rounded">
                {prefix}{word}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default WordOutput;import React, { useState } from 'react';
import { Copy, CheckCircle2 } from 'lucide-react';

interface WordOutputProps {
  words: string[];
  prefix?: string;
  separator?: string;
}

const WordOutput: React.FC<WordOutputProps> = ({ 
  words, 
  prefix = '$', 
  separator = '\t' 
}) => {
  const [copied, setCopied] = useState(false);
  
  // Format words with prefix and separator
  const formattedOutput = words.map(word => `${prefix}${word}`).join(separator);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(formattedOutput).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      (err) => {
        console.error('Could not copy text: ', err);
      }
    );
  };

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Generated Words ({words.length})
        </label>
        <button
          onClick={handleCopy}
          className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800"
        >
          {copied ? (
            <>
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-1" />
              Copy to Clipboard
            </>
          )}
        </button>
      </div>
      <div className="relative overflow-x-auto bg-gray-50 rounded-md p-4 font-mono text-sm whitespace-nowrap border border-gray-200">
        <div className="min-w-max">
          {formattedOutput}
        </div>
      </div>
    </div>
  );
}

export default WordOutput;

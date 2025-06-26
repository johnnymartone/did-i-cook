'use client';

import { useState } from 'react';
import Image from 'next/image';

interface AnalysisResult {
  is_improvement: boolean;
  reasoning: string;
  necessary_changes: string[];
  suggestions: string[];
}

export default function Home() {
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [streamingContent, setStreamingContent] = useState<string>('');

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const base64 = await convertToBase64(file);
        if (type === 'before') {
          setBeforeImage(base64);
        } else {
          setAfterImage(base64);
        }
      } catch (error) {
        setError('Failed to process image');
      }
    }
  };

  const analyzeDesign = async () => {
    if (!beforeImage || !afterImage) {
      setError('Please upload both before and after images');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setStatusMessage('');
    setStreamingContent('');

    try {
      const response = await fetch('/api/did-i-cook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beforeImage,
          afterImage,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze design');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'status') {
                setStatusMessage(data.message);
              } else if (data.type === 'content') {
                setStreamingContent(prev => prev + data.content);
              } else if (data.type === 'result') {
                setResult(data.data);
              } else if (data.type === 'error') {
                setError(data.message);
                break;
              } else if (data.type === 'done') {
                setStatusMessage('Analysis complete!');
                break;
              }
            } catch (parseError) {
              console.error('Error parsing JSON:', parseError);
            }
          }
        }
      }
    } catch (error) {
      setError('Failed to analyze design. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setBeforeImage(null);
    setAfterImage(null);
    setResult(null);
    setError(null);
    setStatusMessage('');
    setStreamingContent('');
  };

  return (
    <div className="min-h-screen bg-black p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center py-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Did I Cook? 🍳
          </h1>
          <p className="text-lg text-gray-300">
            Check if your design is cooked or not.
          </p>
        </header>

        <div className="bg-black border border-gray-700 rounded-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                Before (Original Design)
              </h3>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                {beforeImage ? (
                  <div className="space-y-2">
                    <Image
                      src={beforeImage}
                      alt="Before design"
                      width={300}
                      height={200}
                      className="mx-auto rounded-lg object-cover"
                    />
                    <button
                      onClick={() => setBeforeImage(null)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'before')}
                      className="hidden"
                      id="before-upload"
                    />
                    <label
                      htmlFor="before-upload"
                      className="cursor-pointer inline-flex flex-col items-center"
                    >
                      <svg
                        className="w-8 h-8 text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-sm text-gray-400">
                        Click to upload before image
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                After (Redesigned)
              </h3>
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                {afterImage ? (
                  <div className="space-y-2">
                    <Image
                      src={afterImage}
                      alt="After design"
                      width={300}
                      height={200}
                      className="mx-auto rounded-lg object-cover"
                    />
                    <button
                      onClick={() => setAfterImage(null)}
                      className="text-sm text-red-400 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'after')}
                      className="hidden"
                      id="after-upload"
                    />
                    <label
                      htmlFor="after-upload"
                      className="cursor-pointer inline-flex flex-col items-center"
                    >
                      <svg
                        className="w-8 h-8 text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span className="text-sm text-gray-400">
                        Click to upload after image
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={analyzeDesign}
              disabled={!beforeImage || !afterImage || isLoading}
              className="bg-white hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 text-black font-medium py-2 px-6 rounded-lg transition-colors"
            >
              {isLoading ? 'Analyzing...' : 'Analyze Design'}
            </button>
            <button
              onClick={resetForm}
              className="bg-black border border-white hover:bg-gray-900 text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Reset
            </button>
          </div>

          {isLoading && (
            <div className="mt-6 relative">
              <div 
                className="relative bg-gradient-to-b from-gray-900 to-black rounded-3xl shadow-2xl"
                style={{
                  background: 'linear-gradient(145deg, #1a1a1a, #0d0d0d)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.5)',
                }}
              >
                <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                    <div>
                      <div className="text-gray-300 font-medium">
                        {streamingContent ? 'Analyzing' : 'Thinking'}...
                      </div>
                    </div>
                  </div>
                </div>

                {streamingContent && (
                  <div className="p-6">
                    <div 
                      className="relative overflow-hidden"
                      style={{ height: '120px' }}
                    >
                      <div 
                        className="absolute w-full transition-transform duration-300 ease-out"
                        style={{
                          transform: `translateY(${Math.max(0, (streamingContent.split('\n').length - 6) * -20)}px)`,
                        }}
                      >
                        <div 
                          className="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap"
                          style={{
                            filter: 'blur(0.3px)',
                            textShadow: '0 0 1px rgba(255,255,255,0.1)',
                            lineHeight: '20px',
                          }}
                        >
                          {streamingContent.split('\n').slice(-6).join('\n')}
                          <span className="animate-pulse text-gray-300">▌</span>
                        </div>
                      </div>
                      
                      <div 
                        className="absolute top-0 left-0 right-0 h-4 pointer-events-none"
                        style={{
                          background: 'linear-gradient(to bottom, rgba(26,26,26,1), rgba(26,26,26,0))'
                        }}
                      />
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-4 pointer-events-none"
                        style={{
                          background: 'linear-gradient(to top, rgba(26,26,26,1), rgba(26,26,26,0))'
                        }}
                      />
                    </div>
                  </div>
                )}

                {!streamingContent && statusMessage && (
                  <div className="p-6">
                    <div className="text-gray-400 text-sm">
                      {statusMessage}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-black border border-red-400 text-red-400 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {result && (
          <div className="bg-black border border-gray-700 rounded-xl p-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Verdict
            </h2>
            
            <div className={`p-4 rounded-lg mb-6 ${
              result.is_improvement 
                ? 'border border-yellow-400 text-yellow-400' 
                : 'border border-red-400 text-red-400'
            }`}>
              <div className="flex items-center">
                <span className="text-2xl mr-2">
                  {result.is_improvement ? '🍳' : '❌'}
                </span>
                <span className="font-semibold">
                  {result.is_improvement ? 'Cooked!' : 'You got cooked!'}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Reasoning
              </h3>
              <p className="text-gray-300 leading-relaxed">
                {result.reasoning}
              </p>
            </div>

            {result.necessary_changes && result.necessary_changes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-red-400 mb-2">
                  Issues
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {result.necessary_changes.map((change, index) => (
                    <li key={index} className="text-gray-300">
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.suggestions && result.suggestions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">
                  💡 Suggestions for Improvement
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {result.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-gray-300">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

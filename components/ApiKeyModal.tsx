
import React from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="apiKeyModalTitle"
    >
      <div
        className="bg-gray-800 border border-amber-500/50 rounded-lg shadow-2xl p-6 sm:p-8 max-w-md w-full text-gray-300 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="apiKeyModalTitle" className="text-2xl font-bold text-amber-300 mb-4">
          API Key Security
        </h2>
        <div className="space-y-4 text-sm text-gray-400">
          <p>
            This app runs entirely in your browser. Your API key is never stored on a server.
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Your key is held in browser memory and sent <strong className="text-amber-300">directly to Google's API</strong>.
            </li>
            <li>
              Storing keys client-side can be risky if your browser or device is compromised.
            </li>
          </ul>

          <p className="font-semibold text-gray-300 pt-2">Best Practices:</p>
           <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Use a <strong className="text-amber-300">dedicated API key</strong> for this app.
            </li>
            <li>
               Set usage limits on your key in your Google AI Studio dashboard.
            </li>
            <li>
              <strong className="text-amber-300">Delete the key</strong> when you're finished.
            </li>
          </ul>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-xl font-bold text-sky-300 mb-3">
            For Local Development
          </h3>
          <div className="space-y-3 text-gray-400">
             <p>
              For better security, load your key from a local environment file instead of pasting it.
            </p>
            <ol className="list-decimal list-inside space-y-3 pl-2">
                <li>
                  Create a file named <code className="bg-gray-700 text-amber-300 px-1 py-0.5 rounded-sm">.env.local</code> in the project root.
                </li>
                <li>
                  Add your API key to this file:
                    <pre className="bg-gray-900/70 p-2 rounded-md mt-2 text-sm text-gray-300">
                        <code>GEMINI_API_KEY=YOUR_API_KEY_HERE</code>
                    </pre>
                </li>
                <li>
                  Save, then restart your development server. The "Use provided environment key" option will now be functional.
                </li>
            </ol>
          </div>
        </div>
        <div className="mt-8 text-right">
          <button
            onClick={onClose}
            className="bg-amber-600 text-white font-bold py-2 px-6 rounded-md hover:bg-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-400"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;

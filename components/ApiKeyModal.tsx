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
        className="bg-gray-800 border border-amber-500/50 rounded-lg shadow-2xl p-6 sm:p-8 max-w-lg w-full text-gray-300"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="apiKeyModalTitle" className="text-2xl font-bold text-amber-300 mb-4">
          API Key Security Notice
        </h2>
        <div className="space-y-4 text-gray-400">
          <p>
            You are in control of your API key. This application is designed to run entirely in your browser.
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Your API key is <strong className="text-amber-300">stored in your browser's memory</strong> for the duration of this session and is never saved on a server by us.
            </li>
            <li>
              It is sent directly from your browser to the Google Gemini API to generate maps.
            </li>
          </ul>
          <p className="font-semibold text-gray-300">Potential Risks of Client-Side Keys:</p>
          <p>
            While we've taken steps to keep things secure on our end, storing keys in a browser can be risky if your computer or browser is compromised by malicious extensions or scripts.
          </p>
          <p className="font-semibold text-gray-300">Our Recommendations:</p>
           <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              Use an API key specifically generated for this application.
            </li>
            <li>
               Consider setting usage limits on your key through your Google AI Studio dashboard.
            </li>
            <li>
              Revoke or delete the key when you are finished using the application for maximum security.
            </li>
          </ul>
        </div>
        <div className="mt-8 text-right">
          <button
            onClick={onClose}
            className="bg-amber-600 text-white font-bold py-2 px-6 rounded-md hover:bg-amber-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-amber-400"
          >
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;

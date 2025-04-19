import React,{ useState } from "react";

function Map() {
  const [iframeKey, setIframeKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const resetIframe = () => {
    setLoading(true);
    setError(null);
    setIframeKey((prev) => prev + 1);
  };

  return (
    // <div className="max-w-4xl mx-auto p-4">
    //   <div className="bg-white rounded-xl shadow-md overflow-hidden">

        <div className="relative w-full aspect-video bg-gray-50">
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
              <div className="text-red-600 mb-4">
                <svg
                  className="w-12 h-12 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinecap="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <p className="mt-2 text-center">{error}</p>
              </div>
              <button
                onClick={resetIframe}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Reload Content
              </button>
            </div>
          )}

          {loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <svg
                  className="w-10 h-10 text-gray-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span className="mt-2 text-gray-500">Loading content...</span>
              </div>
            </div>
          )}
          <iframe
            key={iframeKey}
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d21731.2845873809!2d80.19527369484112!3d13.085116298541877!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a526402be882bef%3A0xad2f3f45016d6710!2sVR%20Chennai!5e0!3m2!1sen!2sin!4v1745067324840!5m2!1sen!2sin"
            title="Embedded Content"
            className={`w-full h-full ${error ? "opacity-0" : "opacity-100"}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onLoad={() => setLoading(false)}
            onError={() => {
              setError("Failed to load content. Please try again.");
              setLoading(false);
            }}
            referrerpolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
    //   {/* </div>
    // </div> */}
  );
}

export default Map;

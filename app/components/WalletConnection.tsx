'use client';

interface WalletConnectionProps {
  onConnect: () => void;
  loading: boolean;
  account: string | null;
  currentNetwork: string;
  getNetworkName: (chainId: string) => string;
}

export default function WalletConnection({
  onConnect,
  loading,
  account,
  currentNetwork,
  getNetworkName
}: WalletConnectionProps) {
  return (
    <div className="text-center">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        <div className="mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 1: Connect Wallet</h2>
          <p className="text-gray-600">Connect your MetaMask wallet to continue</p>
        </div>
        
        <button
          onClick={onConnect}
          disabled={loading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-sm mx-auto"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Connecting...
            </span>
          ) : (
            'Connect MetaMask Wallet'
          )}
        </button>
      </div>
      
      {/* Installation help */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          Don't have MetaMask? 
          <a 
            href="https://metamask.io" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ml-1 font-semibold underline hover:text-blue-900"
          >
            Install it here
          </a>
        </p>
      </div>
    </div>
  );
}


'use client';

interface ContractConnectionProps {
  account: string;
  currentNetwork: string;
  contractAddress: string;
  onConnect: () => void;
  onDisconnect: () => void;
  onSwitchNetwork: () => void;
  contractLoading: boolean;
  loading: boolean;
  getNetworkName: (chainId: string) => string;
}

export default function ContractConnection({
  account,
  currentNetwork,
  contractAddress,
  onConnect,
  onDisconnect,
  onSwitchNetwork,
  contractLoading,
  loading,
  getNetworkName
}: ContractConnectionProps) {
  return (
    <div className="text-center">
      <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
        {/* Wallet Connected Badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Wallet Connected
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Connected Account</p>
          <p className="font-mono text-sm font-semibold text-gray-800">
            {account}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Network: {getNetworkName(currentNetwork)}
          </p>
        </div>

        <div className="mb-6">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📝</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 2: Connect to Contract</h2>
          <p className="text-gray-600">Load the voting contract to see proposals</p>
        </div>
        
        {/* Network Switch Button (if not on Sepolia) */}
        {currentNetwork !== '11155111' && (
          <button
            onClick={onSwitchNetwork}
            disabled={loading}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-sm mx-auto mb-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Switching...
              </span>
            ) : (
              '⚠️ Switch to Sepolia Network'
            )}
          </button>
        )}

        {/* Load Contract Button */}
        <button
          onClick={onConnect}
          disabled={contractLoading || currentNetwork !== '11155111'}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg transform transition hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed w-full max-w-sm mx-auto mb-4"
        >
          {contractLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading Contract...
            </span>
          ) : currentNetwork !== '11155111' ? (
            '🔒 Switch to Sepolia First'
          ) : (
            'Load Voting Contract'
          )}
        </button>

        <button
          onClick={onDisconnect}
          className="text-sm text-gray-600 hover:text-gray-800 underline"
        >
          Disconnect Wallet
        </button>
      </div>

      {/* Contract Info */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600 mb-1">Contract Address:</p>
        <p className="text-xs font-mono text-gray-800 break-all">
          {contractAddress}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Required Network: Sepolia (11155111)
        </p>
      </div>
    </div>
  );
}


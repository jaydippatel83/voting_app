'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '../lib/contractAbi';

interface ContractExplorerProps {
  contract: ethers.Contract | null;
  account: string;
}

interface FunctionResult {
  functionName: string;
  result: any;
  error?: string;
  timestamp: Date;
}

export default function ContractExplorer({ contract, account }: ContractExplorerProps) {
  const [results, setResults] = useState<FunctionResult[]>([]);
  const [loading, setLoading] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<{ [key: string]: string }>({});

  // Extract all functions from ABI
  const functions = CONTRACT_ABI.filter(
    (item: any) => item.type === 'function' && item.stateMutability !== 'nonpayable'
  ) as Array<{
    name: string;
    inputs?: Array<{ name: string; type: string; internalType?: string }>;
    outputs?: Array<{ name: string; type: string; internalType?: string }>;
    stateMutability: string;
  }>;

  const writeFunctions = CONTRACT_ABI.filter(
    (item: any) => item.type === 'function' && item.stateMutability === 'nonpayable'
  ) as Array<{
    name: string;
    inputs?: Array<{ name: string; type: string; internalType?: string }>;
    outputs?: Array<{ name: string; type: string; internalType?: string }>;
    stateMutability: string;
  }>;

  const callFunction = async (func: any) => {
    if (!contract) {
      alert('Contract not connected');
      return;
    }

    setLoading(func.name);
    try {
      const inputs = func.inputs || [];
      const params: any[] = [];

      // Collect input parameters
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const key = `${func.name}_${i}`;
        let value = inputValues[key] || '';

        // Handle empty values based on type
        if (input.type === 'address') {
          if (!value) {
            throw new Error(`Address parameter "${input.name || `param${i}`}" is required`);
          }
          params.push(value);
        } else if (input.type === 'uint256' || input.type.includes('uint')) {
          params.push(value ? BigInt(value) : BigInt(0));
        } else if (input.type === 'string') {
          params.push(value || '');
        } else {
          params.push(value || '');
        }
      }

      // Call the function
      let result;
      if (func.stateMutability === 'view' || func.stateMutability === 'pure') {
        result = await contract[func.name](...params);
      } else {
        // For write functions, send transaction
        const tx = await contract[func.name](...params);
        const explorerUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;
        result = { 
          transactionHash: tx.hash, 
          status: 'pending',
          explorerUrl: explorerUrl
        };
        await tx.wait();
        result = { 
          transactionHash: tx.hash, 
          status: 'confirmed',
          explorerUrl: explorerUrl
        };
      }

      // Format result
      let formattedResult: any;
      if (Array.isArray(result)) {
        formattedResult = result.map((r, idx) => {
          const output = func.outputs?.[idx];
          if (output) {
            return {
              name: output.name || `output${idx}`,
              value: r.toString ? r.toString() : r,
              type: output.type
            };
          }
          return r.toString ? r.toString() : r;
        });
      } else if (result && typeof result === 'object' && 'toString' in result) {
        formattedResult = result.toString();
      } else {
        formattedResult = result;
      }

      setResults([
        {
          functionName: func.name,
          result: formattedResult,
          timestamp: new Date()
        },
        ...results
      ]);
    } catch (err: any) {
      setResults([
        {
          functionName: func.name,
          result: null,
          error: err.message || 'Unknown error',
          timestamp: new Date()
        },
        ...results
      ]);
    } finally {
      setLoading(null);
    }
  };

  const handleInputChange = (funcName: string, inputIndex: number, value: string) => {
    const key = `${funcName}_${inputIndex}`;
    setInputValues({ ...inputValues, [key]: value });
  };

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Contract Explorer</h2>
      <p className="text-gray-600 mb-6">Click on any function to call it and see the results</p>

      {/* Read Functions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📖 Read Functions (View/Pure)</h3>
        <div className="space-y-3">
          {functions.map((func) => (
            <div
              key={func.name}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-400 transition"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{func.name}</h4>
                  <p className="text-xs text-gray-500 mb-2">
                    State: {func.stateMutability} | Returns: {func.outputs?.map(o => o.type).join(', ') || 'void'}
                  </p>
                  
                  {/* Input fields */}
                  {func.inputs && func.inputs.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {func.inputs.map((input, idx) => (
                        <div key={idx}>
                          <label className="text-xs text-gray-600 block mb-1">
                            {input.name || `param${idx}`} ({input.type})
                          </label>
                          <input
                            type="text"
                            placeholder={`Enter ${input.type}`}
                            value={inputValues[`${func.name}_${idx}`] || ''}
                            onChange={(e) => handleInputChange(func.name, idx, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                          />
                          {input.name === 'voter' && account && (
                            <button
                              onClick={() => handleInputChange(func.name, idx, account)}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              Use my address
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => callFunction(func)}
                  disabled={loading === func.name || !contract}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading === func.name ? 'Calling...' : 'Call'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Write Functions */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">✍️ Write Functions (Requires Transaction)</h3>
        <div className="space-y-3">
          {writeFunctions.map((func) => (
            <div
              key={func.name}
              className="border border-gray-200 rounded-lg p-4 hover:border-orange-400 transition"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{func.name}</h4>
                  <p className="text-xs text-gray-500 mb-2">
                    State: {func.stateMutability} | Requires transaction
                  </p>
                  
                  {/* Input fields */}
                  {func.inputs && func.inputs.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {func.inputs.map((input, idx) => (
                        <div key={idx}>
                          <label className="text-xs text-gray-600 block mb-1">
                            {input.name || `param${idx}`} ({input.type})
                          </label>
                          <input
                            type="text"
                            placeholder={`Enter ${input.type}`}
                            value={inputValues[`${func.name}_${idx}`] || ''}
                            onChange={(e) => handleInputChange(func.name, idx, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-gray-400"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => callFunction(func)}
                  disabled={loading === func.name || !contract}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {loading === func.name ? 'Sending...' : 'Send Tx'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Results Display */}
      {results.length > 0 && (
        <div className="mt-8 border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">📊 Function Results</h3>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {results.map((result, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 ${
                  result.error ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-900">{result.functionName}</h4>
                    <p className="text-xs text-gray-500">
                      {result.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {result.error ? (
                    <span className="text-red-600 text-sm">❌ Error</span>
                  ) : (
                    <span className="text-green-600 text-sm">✅ Success</span>
                  )}
                </div>
                {result.error ? (
                  <div className="mt-2">
                    <p className="text-sm text-red-800 font-mono">{result.error}</p>
                  </div>
                ) : (
                  <div className="mt-2">
                    <pre className="text-xs bg-white p-3 rounded border overflow-x-auto text-gray-900">
                      {formatValue(result.result)}
                    </pre>
                    {result.result && typeof result.result === 'object' && result.result.explorerUrl && (
                      <a
                        href={result.result.explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        🔗 View on Etherscan
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={() => setResults([])}
            className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm"
          >
            Clear Results
          </button>
        </div>
      )}
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ABI } from '../lib/contractAbi';
import { CONTRACT_ADDRESS as contractAddress } from '../lib/contractAbi';
import WalletConnection from './WalletConnection';
import ContractConnection from './ContractConnection';
import ProposalsList from './ProposalsList';
import ContractExplorer from './ContractExplorer';

interface Proposal {
  id: number;
  description: string;
  voteCount: number;
}

interface Winner {
  id: number;
  description: string;
  voteCount: number;
}

export default function VotingApp() {
  const [account, setAccount] = useState<string>('');
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [contractLoading, setContractLoading] = useState<boolean>(false);
  const [votingProposalId, setVotingProposalId] = useState<number | null>(null);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [isContractConnected, setIsContractConnected] = useState<boolean>(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>('');

  // STEP 1: Connect Wallet Only (No Contract Interaction)
  const connectWallet = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Check if MetaMask is installed
      if (!window.ethereum) {
        setError('Please install MetaMask! Visit https://metamask.io');
        setLoading(false);
        return;
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[];

      if (!accounts || accounts.length === 0) {
        setError('No accounts found. Please unlock MetaMask.');
        setLoading(false);
        return;
      }

      const userAccount = accounts[0];

      // Create provider
      const web3Provider = new ethers.BrowserProvider(window.ethereum);

      // Get network info
      const network = await web3Provider.getNetwork();
      setCurrentNetwork(network.chainId.toString());

      // Get signer
      const web3Signer = await web3Provider.getSigner();
      const signerAddress = await web3Signer.getAddress();

      // Set all wallet state
      setAccount(userAccount);
      setProvider(web3Provider);
      setSigner(web3Signer);
      setIsWalletConnected(true);

      setSuccess(`Wallet connected! Address: ${userAccount.slice(0, 6)}...${userAccount.slice(-4)}`);

    } catch (err: any) {

      // Reset wallet state
      setAccount('');
      setProvider(null);
      setSigner(null);
      setIsWalletConnected(false);

      if (err.code === 4001) {
        setError('Connection rejected. Please approve the connection in MetaMask.');
      } else if (err.code === -32002) {
        setError('Connection request already pending. Please check MetaMask.');
      } else if (err.message?.includes('user rejected') || err.message?.includes('User rejected')) {
        setError('Connection rejected by user.');
      } else {
        const errorMsg = err.message || err.reason || 'Unknown error';
        setError(`Wallet connection failed: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Switch to Sepolia Network
  const switchToSepolia = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask not found');
        return;
      }

      setLoading(true);
      setError('');
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // 11155111 in hex
      });
      
      setSuccess('Switched to Sepolia! Click "Load Voting Contract" to continue.');
      setCurrentNetwork('11155111');
      
      // Update provider after network switch
      if (provider) {
        const network = await provider.getNetwork();
        setCurrentNetwork(network.chainId.toString());
      }
      
    } catch (err: any) {
      // If Sepolia is not added to MetaMask, add it
      if (err.code === 4902) {
        try {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Test Network',
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18
              },
              rpcUrls: ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });
          setSuccess('Sepolia network added! Click "Load Voting Contract" to continue.');
          setCurrentNetwork('11155111');
        } catch (addErr: any) {
          setError('Failed to add Sepolia network: ' + addErr.message);
        }
      } else if (err.code === 4001) {
        setError('Network switch rejected by user');
      } else {
        setError('Failed to switch network: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Connect to Contract (Separate from Wallet)
  const connectContract = async () => {
    console.log('=== STEP 2: Connecting to Contract ===');
    setContractLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!signer) {
        setError('Please connect wallet first!');
        setContractLoading(false);
        return;
      }

      if (!contractAddress || contractAddress.length !== 42 || !contractAddress.startsWith('0x')) {
        setError('Contract address not configured! Please update CONTRACT_ADDRESS in contractAbi.ts');
        setContractLoading(false);
        return;
      }

      // Get network info first
      if (!provider) {
        setError('Provider not available. Please reconnect wallet.');
        setContractLoading(false);
        return;
      }

      const network = await provider.getNetwork();
      const networkId = network.chainId.toString();
      setCurrentNetwork(networkId);

      // Check if on Sepolia
      if (network.chainId !== BigInt(11155111)) {
        setError(`You're on network ${networkId}. The contract is deployed on Sepolia (11155111). Please switch networks.`);
        setContractLoading(false);
        return;
      }

      // Check if contract code exists at the address
      const code = await provider.getCode(contractAddress);

      if (code === '0x' || code.length <= 2) {
        setError(`No contract found at address ${contractAddress} on network ${networkId}. Please verify the contract address and network.`);
        setContractLoading(false);
        return;
      }

      // Create contract instance
      const votingContract = new ethers.Contract(
        contractAddress,
        CONTRACT_ABI,
        signer
      );

      // Test contract connection by calling a simple read function
      try {
        await votingContract.getProposalCount();
      } catch (callErr: any) {
        if (callErr.message?.includes('could not decode result data') || callErr.message?.includes('BAD_DATA')) {
          throw new Error(`Contract exists but function call failed. The contract at ${contractAddress} may not be the voting contract, or it's on a different network. Current network: ${networkId}`);
        }
        throw callErr;
      }

      setContract(votingContract);
      setIsContractConnected(true);

      // Now load all data
      await loadProposals(votingContract, account);
      await loadWinner(votingContract);

      setSuccess('Contract connected! Proposals loaded successfully. ✅');

    } catch (err: any) {
      
      // Reset contract state but keep wallet connected
      setContract(null);
      setIsContractConnected(false);
      setProposals([]);
      setWinner(null);

      const errorMsg = err.message || err.reason || 'Unknown error';
      
      if (err.message?.includes('could not detect network')) {
        setError('Network error. Please check your MetaMask connection.');
      } else if (err.message?.includes('invalid address')) {
        setError('Invalid contract address. Please check CONTRACT_ADDRESS in contractAbi.ts');
      } else if (err.message?.includes('could not decode result data') || err.message?.includes('BAD_DATA')) {
        setError('Contract call returned invalid data. The contract may not exist at this address on the current network.');
      } else if (err.message?.includes('No contract found')) {
        setError(err.message);
      } else if (err.message?.includes('Contract exists but function call failed')) {
        setError(err.message);
      } else if (err.message?.includes('call revert')) {
        setError('Contract call reverted. Make sure the contract is deployed on the current network.');
      } else {
        setError(`Contract connection failed: ${errorMsg}`);
      }
    } finally {
      setContractLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount('');
    setProvider(null);
    setSigner(null);
    setContract(null);
    setProposals([]);
    setHasVoted(false);
    setWinner(null);
    setError('');
    setIsWalletConnected(false);
    setIsContractConnected(false);
    setCurrentNetwork('');
    setVotingProposalId(null);
    setSuccess('Wallet disconnected');
    setTimeout(() => setSuccess(''), 2000);
  };

  // Load all proposals
  const loadProposals = async (contractInstance: ethers.Contract, userAddress: string) => {
    try {
      const count = await contractInstance.getProposalCount();

      const proposalList: Proposal[] = [];

      for (let i = 0; i < count; i++) {
        const proposal = await contractInstance.getProposal(i);
        proposalList.push({
          id: i,
          description: proposal.description,
          voteCount: Number(proposal.voteCount)
        });
      }

      setProposals(proposalList);

      // Check if user has voted
      const voted = await contractInstance.hasVoted(userAddress);
      setHasVoted(voted);

    } catch (err: any) {
      throw err; // Re-throw to be caught by connectContract
    }
  };

  // Load winner
  const loadWinner = async (contractInstance: ethers.Contract) => {
    try {
      const result = await contractInstance.getWinner();
      const [winningId, winningDesc, winningVotes] = result;
      
      const winnerData = {
        id: Number(winningId),
        description: winningDesc,
        voteCount: Number(winningVotes)
      };
      
      setWinner(winnerData);
    } catch (err: any) {
      // Don't throw - winner might not exist yet
    }
  };

  // Vote for a proposal
  const vote = async (proposalId: number) => {
    if (!contract) {
      setError('Contract not initialized. Please connect to contract first.');
      return;
    }

    // Set the specific proposal as loading
    setVotingProposalId(proposalId);
      setError('');
      setSuccess('');

    try {
      // Send transaction
      const tx = await contract.vote(proposalId);
      const explorerUrl = `https://sepolia.etherscan.io/tx/${tx.hash}`;
      
      setSuccess(`Transaction sent! Hash: ${tx.hash.slice(0, 10)}... Waiting for confirmation...`);
      
      // Wait for confirmation
      await tx.wait();

      // Reload data
      await loadProposals(contract, account);
      await loadWinner(contract);

      setSuccess(`Vote submitted successfully! 🎉 Transaction Hash: ${tx.hash}`);
      setTimeout(() => setSuccess(''), 10000);

    } catch (err: any) {
      
      if (err.message?.includes('already voted')) {
        setError('You have already voted!');
      } else if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setError('Transaction rejected by user.');
      } else if (err.message?.includes('insufficient funds')) {
        setError('Insufficient funds for gas fees. Please get some Sepolia ETH from a faucet.');
      } else {
        setError(`Failed to vote: ${err.message || err.reason || 'Unknown error'}`);
      }
    } finally {
      // Clear the loading state for this specific proposal
      setVotingProposalId(null);
    }
  };

  // Listen for account and network changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (accounts[0] !== account) {
          setAccount(accounts[0]);
          if (contract) {
            loadProposals(contract, accounts[0]);
          }
      }
    };

    const handleChainChanged = (chainId: string) => {
      // Convert hex chainId to decimal
      const decimalChainId = parseInt(chainId, 16).toString();
      setCurrentNetwork(decimalChainId);
      
      // Reset contract connection on network change
          setContract(null);
      setIsContractConnected(false);
      setProposals([]);
      setWinner(null);
      
      setSuccess(`Network changed to ${decimalChainId}. Please reconnect to contract.`);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [account, contract]);

  // Helper to get network name
  const getNetworkName = (chainId: string): string => {
    switch (chainId) {
      case '1': return 'Ethereum Mainnet';
      case '11155111': return 'Sepolia Testnet';
      case '5': return 'Goerli Testnet';
      case '137': return 'Polygon Mainnet';
      case '80001': return 'Polygon Mumbai';
      default: return `Network ${chainId}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🗳️ Decentralized Voting
          </h1>
          <p className="text-xl text-gray-600">
            Cast your vote on the blockchain
          </p>
          {currentNetwork && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
              <div className={`w-2 h-2 rounded-full ${currentNetwork === '11155111' ? 'bg-green-500' : 'bg-orange-500'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {getNetworkName(currentNetwork)}
              </span>
            </div>
          )}
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl mb-8">
            <div className="flex items-center gap-2 flex-wrap">
              <span>✓</span>
              <span className="flex-1">{success}</span>
              {success.includes('Transaction Hash:') && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${success.match(/Transaction Hash: (0x[a-fA-F0-9]+)/i)?.[1] || ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:text-blue-800 underline text-sm font-semibold whitespace-nowrap"
                >
                  🔗 View on Etherscan
                </a>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl mb-8">
            <div className="flex items-start gap-2">
              <span className="text-xl">⚠️</span>
              <div className="flex-1">
                <p className="font-semibold">Error</p>
                <p className="text-sm mt-1">{error}</p>
                
                {/* Show switch button if it's a network error */}
                {error.includes('network') && currentNetwork !== '11155111' && (
                  <button
                    onClick={switchToSepolia}
                    disabled={loading}
                    className="mt-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-4 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Switching...' : 'Switch to Sepolia Now'}
                  </button>
                )}
              </div>
              <button
                onClick={() => setError('')}
                className="text-red-600 hover:text-red-800 font-bold"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* STEP 1: Connect Wallet */}
        {!isWalletConnected ? (
          <WalletConnection
            onConnect={connectWallet}
            loading={loading}
            account={account}
            currentNetwork={currentNetwork}
            getNetworkName={getNetworkName}
          />
        ) : !isContractConnected ? (
          /* STEP 2: Connect to Contract */
          <ContractConnection
            account={account}
            currentNetwork={currentNetwork}
            contractAddress={contractAddress}
            onConnect={connectContract}
            onDisconnect={disconnectWallet}
            onSwitchNetwork={switchToSepolia}
            contractLoading={contractLoading}
            loading={loading}
            getNetworkName={getNetworkName}
          />
        ) : (
          /* STEP 3: Main App (Both Connected) */
          <div>
            {/* Status Bar */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="text-sm font-semibold text-gray-900">Connected & Ready</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">Account</p>
                  <p className="font-mono text-sm font-semibold text-gray-800">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {getNetworkName(currentNetwork)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  hasVoted 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {hasVoted ? '✓ Already Voted' : '⏳ Not Voted Yet'}
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-full hover:bg-gray-200 transition"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>

            {/* Winner Card */}
            {winner && winner.voteCount > 0 && (
              <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-xl shadow-lg p-6 mb-8 text-white">
                <h2 className="text-2xl font-bold mb-2">🏆 Current Leader</h2>
                <p className="text-lg mb-1">{winner.description}</p>
                <p className="text-xl font-bold">{winner.voteCount} votes</p>
              </div>
            )}

            {/* Proposals */}
            <ProposalsList
              proposals={proposals}
              hasVoted={hasVoted}
              votingProposalId={votingProposalId}
              onVote={vote}
            />

            {/* Contract Explorer */}
            <ContractExplorer
              contract={contract}
              account={account}
            />

            {/* Instructions */}
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="font-bold text-gray-900 mb-3 text-lg">📖 How to Vote:</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Make sure you're connected to the Sepolia test network ✅</li>
                <li>Click the "Vote" button on your preferred proposal</li>
                <li>Confirm the transaction in MetaMask</li>
                <li>Wait for the transaction to be confirmed (~15 seconds)</li>
                <li>You can only vote once per address</li>
              </ol>
              
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-900">
                  <strong>Need test ETH?</strong> Get free Sepolia ETH from: 
                  <a 
                    href="https://sepoliafaucet.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="ml-1 underline hover:text-blue-700"
                  >
                    sepoliafaucet.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
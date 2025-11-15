'use client';

interface Proposal {
  id: number;
  description: string;
  voteCount: number;
}

interface ProposalsListProps {
  proposals: Proposal[];
  hasVoted: boolean;
  votingProposalId: number | null;
  onVote: (proposalId: number) => void;
}

export default function ProposalsList({
  proposals,
  hasVoted,
  votingProposalId,
  onVote
}: ProposalsListProps) {
  if (proposals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading proposals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-6">Proposals</h2>
      
      {proposals.map((proposal) => (
        <div
          key={proposal.id}
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {proposal.description}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Votes:</span>
                <span className="font-bold text-2xl text-indigo-600">
                  {proposal.voteCount}
                </span>
              </div>
            </div>
            <button
              onClick={() => onVote(proposal.id)}
              disabled={hasVoted || votingProposalId !== null}
              className={`px-8 py-3 rounded-lg font-semibold transition-all ${
                hasVoted || votingProposalId !== null
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transform hover:scale-105 shadow-md'
              }`}
            >
              {votingProposalId === proposal.id ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Voting...
                </span>
              ) : (
                'Vote'
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}


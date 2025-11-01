'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface SubmissionDetail {
  id: string;
  status: string;
  gameTitle: string;
  gameSlug: string;
  gameDescription: string;
  gameType: string;
  creatorName: string;
  creatorEmail: string;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  liveUrl: string | null;
  generatedCode: string | null;
  heroSvg: string | null;
  reviewNotes: string | null;
  difficulty?: Record<string, unknown>;
  visualStyle?: Record<string, unknown>;
  controls?: Record<string, unknown>;
  elements?: Record<string, unknown>;
}

const STATUS_COLORS: Record<string, { bg: string; text: string; badge: string }> = {
  PENDING: { bg: 'bg-gray-100', text: 'text-gray-800', badge: '⏳' },
  BUILDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', badge: '🏗️' },
  REVIEW: { bg: 'bg-blue-100', text: 'text-blue-800', badge: '👀' },
  APPROVED: { bg: 'bg-green-100', text: 'text-green-800', badge: '✅' },
  REJECTED: { bg: 'bg-red-100', text: 'text-red-800', badge: '❌' },
  LIVE: { bg: 'bg-purple-100', text: 'text-purple-800', badge: '🚀' },
};

interface GameSubmissionDetailProps {
  submissionId: string;
}

export default function GameSubmissionDetail({ submissionId }: GameSubmissionDetailProps) {
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [deploymentData, setDeploymentData] = useState<{
    instructions: {
      local?: string;
      manual?: string[];
    };
    gameData: {
      slug: string;
      code: string;
      gameEntry: {
        slug: string;
        title: string;
        tags: string[];
        description: string;
        description_it: string;
        hero: string;
        screenshots: string[];
        demoPath: string;
        gameType: string;
        engine: string;
        version: string;
        status: string;
        submissionId: string;
      };
    };
  } | null>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/admin/games/${submissionId}`);
        if (!response.ok) throw new Error('Failed to fetch submission');

        const data = await response.json();
        setSubmission(data.submission);
        setReviewNotes(data.submission.reviewNotes || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load submission');
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [submissionId]);

  const handleApprove = async () => {
    if (!submission) return;
    setActionLoading(true);
    setActionMessage('');

    try {
      const response = await fetch(`/api/admin/games/${submissionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes }),
      });

      if (!response.ok) throw new Error('Failed to approve');

      const data = await response.json();
      setSubmission(data.submission);
      setActionMessage('✅ Game approved successfully!');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage('❌ ' + (err instanceof Error ? err.message : 'Approval failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!submission || !reviewNotes.trim()) {
      setActionMessage('❌ Review notes are required for rejection');
      return;
    }

    setActionLoading(true);
    setActionMessage('');

    try {
      const response = await fetch(`/api/admin/games/${submissionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNotes }),
      });

      if (!response.ok) throw new Error('Failed to reject');

      const data = await response.json();
      setSubmission(data.submission);
      setActionMessage('❌ Game rejected');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage('❌ ' + (err instanceof Error ? err.message : 'Rejection failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeploy = async () => {
    if (!submission) return;
    setActionLoading(true);
    setActionMessage('');

    try {
      const response = await fetch(`/api/admin/games/${submissionId}/deploy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle serverless deployment error with instructions
        if (data.error === 'File system deployment not available in serverless environment' && data.instructions) {
          setDeploymentData({
            instructions: data.instructions,
            gameData: data.gameData,
          });
          
          const instructions = data.instructions;
          const gameData = data.gameData;
          
          // Create a detailed error message with instructions
          let errorMsg = `⚠️ ${data.error}\n\n📝 ${data.details}\n\n`;
          
          if (instructions.local) {
            errorMsg += `💻 Local Deployment:\n${instructions.local}\n\n`;
          }
          
          if (instructions.manual) {
            errorMsg += `📋 Manual Deployment Steps:\n${instructions.manual.map((step: string) => `  ${step}`).join('\n')}\n\n`;
          }
          
          if (gameData) {
            errorMsg += `💡 Game Information:\n  Slug: ${gameData.slug}\n  Title: ${gameData.gameEntry.title}\n  Code available below ↓\n`;
          }
          
          setActionMessage(errorMsg);
          setTimeout(() => setActionMessage(''), 20000); // Show longer for instructions
          return;
        }
        
        throw new Error(data.error || data.details || 'Failed to deploy');
      }

      setSubmission(data.submission);
      setActionMessage('🚀 Game deployed successfully! Commit changes to git.');
      setTimeout(() => setActionMessage(''), 5000);
    } catch (err) {
      setActionMessage('❌ ' + (err instanceof Error ? err.message : 'Deployment failed'));
    } finally {
      setActionLoading(false);
    }
  };

  const copyCode = async () => {
    if (submission?.generatedCode) {
      try {
        await navigator.clipboard.writeText(submission.generatedCode);
        setActionMessage('✅ Code copied to clipboard');
        setTimeout(() => setActionMessage(''), 2000);
      } catch {
        setActionMessage('❌ Failed to copy code');
      }
    }
  };

  const downloadGameFiles = () => {
    if (!deploymentData?.gameData) return;
    
    const { gameData } = deploymentData;
    
    // Download HTML file
    const htmlBlob = new Blob([gameData.code], { type: 'text/html' });
    const htmlUrl = URL.createObjectURL(htmlBlob);
    const htmlLink = document.createElement('a');
    htmlLink.href = htmlUrl;
    htmlLink.download = `${gameData.slug}-index.html`;
    htmlLink.click();
    URL.revokeObjectURL(htmlUrl);
    
    // Download game entry JSON
    const jsonBlob = new Blob([JSON.stringify(gameData.gameEntry, null, 2)], { type: 'application/json' });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = `${gameData.slug}-game-entry.json`;
    jsonLink.click();
    URL.revokeObjectURL(jsonUrl);
    
    setActionMessage('✅ Game files downloaded! Check your downloads folder.');
    setTimeout(() => setActionMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading submission...</div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            <p className="font-medium mb-2">Error Loading Submission</p>
            <p>{error}</p>
            <Link href="/admin/game-submissions" className="text-red-600 hover:text-red-800 mt-4 inline-block">
              ← Back to Submissions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const colors = STATUS_COLORS[submission.status] || STATUS_COLORS.PENDING;
  const canApprove = ['REVIEW', 'BUILDING', 'PENDING'].includes(submission.status);
  const canReject = !['REJECTED', 'LIVE'].includes(submission.status);
  const canDeploy = submission.status === 'APPROVED' && submission.generatedCode;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href="/admin/game-submissions" className="text-blue-600 hover:text-blue-900 text-sm mb-4 inline-block">
            ← Back to Submissions
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{submission.gameTitle}</h1>
              <p className="text-sm text-gray-600 mt-1">ID: {submission.id}</p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${colors.bg} ${colors.text}`}>
              {colors.badge} {submission.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {actionMessage && (
          <div className={`p-4 rounded-lg mb-6 ${
            actionMessage.startsWith('✅') || actionMessage.startsWith('🚀') ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-900'
          }`}>
            {actionMessage.includes('serverless') || actionMessage.includes('Local Deployment') ? (
              <div className="space-y-3">
                <div className="whitespace-pre-line text-sm">
                  {actionMessage}
                </div>
                {deploymentData && (
                  <div className="mt-4 pt-4 border-t border-yellow-300">
                    <p className="text-sm font-semibold mb-2">📦 Quick Deployment:</p>
                    <button
                      onClick={downloadGameFiles}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    >
                      Download Game Files
                    </button>
                    <p className="text-xs text-yellow-800 mt-2">
                      Downloads HTML file and game entry JSON. Place HTML in <code className="bg-yellow-200 px-1 rounded">public/demos/{deploymentData.gameData.slug}/index.html</code> and add JSON entry to <code className="bg-yellow-200 px-1 rounded">src/data/games.json</code>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div>{actionMessage}</div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Game Preview */}
            {submission.generatedCode && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">Game Preview</h2>
                <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                  <iframe
                    srcDoc={submission.generatedCode}
                    title="Game Preview"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              </div>
            )}

            {/* Game Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Game Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Game Type</label>
                  <p className="text-sm text-gray-900 mt-1">{submission.gameType}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Game Slug</label>
                  <p className="text-sm text-gray-900 mt-1">{submission.gameSlug}</p>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase">Description</label>
                  <p className="text-sm text-gray-900 mt-1">{submission.gameDescription}</p>
                </div>
                {submission.difficulty && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Difficulty</label>
                    <p className="text-sm text-gray-900 mt-1">{String((submission.difficulty as Record<string, unknown>).overall)}/5</p>
                  </div>
                )}
                {submission.visualStyle && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Visual Style</label>
                    <p className="text-sm text-gray-900 mt-1">
                      {String((submission.visualStyle as Record<string, unknown>).artStyle)} / {String((submission.visualStyle as Record<string, unknown>).colors)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Creator Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Creator Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Name</label>
                  <p className="text-sm text-gray-900">{submission.creatorName}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Email</label>
                  <p className="text-sm text-gray-900">{submission.creatorEmail}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Submitted</label>
                  <p className="text-sm text-gray-900">{new Date(submission.createdAt).toLocaleString()}</p>
                </div>
                {submission.approvedAt && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Approved</label>
                    <p className="text-sm text-gray-900">{new Date(submission.approvedAt).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Generated Code */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Generated HTML Code</h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowCode(!showCode)}
                >
                  {showCode ? 'Hide' : 'Show'} Code
                </Button>
              </div>

              {showCode && submission.generatedCode && (
                <div className="space-y-2">
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs leading-6 max-h-96 overflow-y-auto">
                    {submission.generatedCode.substring(0, 2000)}...
                  </pre>
                  <Button
                    size="sm"
                    onClick={copyCode}
                    className="w-full"
                  >
                    Copy Full Code
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Review Notes */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Review Notes</h2>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add review notes, feedback, or rejection reasons..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Actions</h2>
              <div className="space-y-3">
                {canApprove && (
                  <Button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {actionLoading ? 'Approving...' : '✅ Approve'}
                  </Button>
                )}

                {canReject && (
                  <Button
                    onClick={handleReject}
                    disabled={actionLoading}
                    variant="destructive"
                    className="w-full"
                  >
                    {actionLoading ? 'Rejecting...' : '❌ Reject'}
                  </Button>
                )}

                {canDeploy && (
                  <Button
                    onClick={handleDeploy}
                    disabled={actionLoading}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {actionLoading ? 'Deploying...' : '🚀 Deploy to Production'}
                  </Button>
                )}

                {submission.liveUrl && (
                  <Link
                    href={submission.liveUrl}
                    target="_blank"
                    className="block w-full"
                  >
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      👀 View Live Game
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Status Timeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Timeline</h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start">
                  <span className="text-blue-600 mr-2">📝</span>
                  <div>
                    <p className="font-medium text-gray-900">Submitted</p>
                    <p className="text-gray-500 text-xs">{new Date(submission.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                {submission.status === 'BUILDING' && (
                  <div className="flex items-start">
                    <span className="text-yellow-600 mr-2">🏗️</span>
                    <div>
                      <p className="font-medium text-gray-900">Building</p>
                      <p className="text-gray-500 text-xs">AI is generating game code...</p>
                    </div>
                  </div>
                )}
                {['REVIEW', 'APPROVED', 'REJECTED', 'LIVE'].includes(submission.status) && (
                  <div className="flex items-start">
                    <span className="text-blue-600 mr-2">👀</span>
                    <div>
                      <p className="font-medium text-gray-900">In Review</p>
                      <p className="text-gray-500 text-xs">{new Date(submission.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {['APPROVED', 'LIVE'].includes(submission.status) && submission.approvedAt && (
                  <div className="flex items-start">
                    <span className="text-green-600 mr-2">✅</span>
                    <div>
                      <p className="font-medium text-gray-900">Approved</p>
                      <p className="text-gray-500 text-xs">{new Date(submission.approvedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {submission.status === 'LIVE' && submission.liveUrl && (
                  <div className="flex items-start">
                    <span className="text-purple-600 mr-2">🚀</span>
                    <div>
                      <p className="font-medium text-gray-900">Deployed</p>
                      <p className="text-gray-500 text-xs">Live on production</p>
                    </div>
                  </div>
                )}
                {submission.status === 'REJECTED' && (
                  <div className="flex items-start">
                    <span className="text-red-600 mr-2">❌</span>
                    <div>
                      <p className="font-medium text-gray-900">Rejected</p>
                      <p className="text-gray-500 text-xs">{new Date(submission.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

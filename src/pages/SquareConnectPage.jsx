/**
 * PrecisionPrices – Square Connect Settings
 * One-time OAuth setup: Connect Square → enables catalog push + webhook loop
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ArrowLeft, CheckCircle, AlertCircle, ExternalLink, Loader2, Zap, RefreshCw } from 'lucide-react';

const BACKEND = import.meta.env.VITE_BACKEND_URL || '';

export default function SquareConnectPage() {
  const { currentUser } = useAuth();
  const navigate        = useNavigate();
  const [params]        = useSearchParams();

  const [squareInfo, setSquareInfo]   = useState(null);  // stored connection
  const [loading, setLoading]         = useState(true);
  const [connecting, setConnecting]   = useState(false);
  const [status, setStatus]           = useState(null);  // 'success' | 'error'
  const [statusMsg, setStatusMsg]     = useState('');

  // ── Load existing connection from Firestore ──
  useEffect(() => {
    if (!currentUser) return;
    (async () => {
      try {
        const ref  = doc(db, 'users', currentUser.uid, 'integrations', 'square');
        const snap = await getDoc(ref);
        if (snap.exists()) setSquareInfo(snap.data());
      } catch (_) {}
      finally { setLoading(false); }
    })();
  }, [currentUser]);

  // ── Handle OAuth callback redirect ──
  useEffect(() => {
    const connected    = params.get('connected');
    const error        = params.get('error');
    const token        = params.get('token');
    const refresh      = params.get('refresh');
    const merchantId   = params.get('merchantId');
    const locationId   = params.get('locationId');

    if (error) {
      setStatus('error');
      setStatusMsg('Could not connect Square. Try again or check your Square account.');
      return;
    }

    if (connected && token && currentUser) {
      // Persist to Firestore
      (async () => {
        try {
          const ref = doc(db, 'users', currentUser.uid, 'integrations', 'square');
          const data = {
            accessToken:  token,
            refreshToken: refresh || '',
            merchantId,
            locationId,
            connectedAt:  serverTimestamp(),
            status:       'connected',
          };
          await setDoc(ref, data);
          setSquareInfo(data);
          setStatus('success');
          setStatusMsg('Square connected! You can now push items directly to your Square catalog.');
          // Clean URL
          window.history.replaceState({}, '', '/app/settings/square');
        } catch (err) {
          setStatus('error');
          setStatusMsg('Connected to Square but could not save — try again.');
        }
      })();
    }
  }, [params, currentUser]);

  const handleConnect = async () => {
    if (!currentUser) return;
    setConnecting(true);
    try {
      const res  = await fetch(`${BACKEND}/api/square/auth-url?userId=${currentUser.uid}`);
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setStatus('error');
        setStatusMsg(data.error || 'Square is not configured on the server yet.');
        setConnecting(false);
      }
    } catch (err) {
      setStatus('error');
      setStatusMsg('Could not reach server. Check your connection.');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!currentUser) return;
    try {
      const ref = doc(db, 'users', currentUser.uid, 'integrations', 'square');
      await setDoc(ref, { status: 'disconnected', disconnectedAt: serverTimestamp() });
      setSquareInfo(null);
      setStatus(null);
    } catch (_) {}
  };

  const isConnected = squareInfo?.status === 'connected';

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex items-center gap-3 p-4 border-b border-gray-800">
        <button onClick={() => navigate('/app')} className="text-gray-400 hover:text-white">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-xl font-bold">Connect Square</h1>
          <p className="text-gray-400 text-sm">Enable automatic sale data tracking</p>
        </div>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-5">
        {/* Status banner */}
        {status === 'success' && (
          <div className="bg-green-900/60 border border-green-600 rounded-xl px-4 py-3 flex items-center gap-3">
            <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
            <p className="text-green-200 text-sm">{statusMsg}</p>
          </div>
        )}
        {status === 'error' && (
          <div className="bg-red-900/60 border border-red-700 rounded-xl px-4 py-3 flex items-center gap-3">
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <p className="text-red-200 text-sm">{statusMsg}</p>
          </div>
        )}

        {/* How it works */}
        <div className="bg-gray-800 rounded-2xl p-5 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" /> How the automation works
          </h2>
          <div className="space-y-3 text-sm">
            {[
              ['📸', 'Snap photos', 'AI prices every item automatically'],
              ['🏷️', 'Print labels', 'Barcode on each label = unique PP item ID'],
              ['💳', 'Sell with Square', 'Scan barcodes at checkout as normal'],
              ['🔄', 'Auto data return', 'Square webhook sends sold prices back — no manual entry'],
              ['🧠', 'AI improves', 'Every sale makes pricing more accurate'],
            ].map(([icon, title, desc]) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold text-white">{title}</p>
                  <p className="text-gray-400">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connection state */}
        {isConnected ? (
          <div className="bg-gray-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-green-400 flex-shrink-0" />
              <span className="font-semibold text-green-400">Square Connected</span>
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              {squareInfo.merchantId && <p>Merchant ID: <span className="text-gray-300 font-mono">{squareInfo.merchantId}</span></p>}
              {squareInfo.locationId && <p>Location ID: <span className="text-gray-300 font-mono">{squareInfo.locationId}</span></p>}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleConnect} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold">
                <RefreshCw size={16} /> Reconnect
              </button>
              <button onClick={handleDisconnect} className="flex-1 bg-red-900/60 hover:bg-red-800 text-red-300 py-3 rounded-xl text-sm font-semibold">
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleConnect}
              disabled={connecting}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xl py-5 rounded-2xl flex items-center justify-center gap-3 transition-colors"
            >
              {connecting ? (
                <><Loader2 size={24} className="animate-spin" /> Connecting…</>
              ) : (
                <>Connect Square Account</>
              )}
            </button>
            <p className="text-center text-gray-500 text-xs">
              You'll be redirected to Square to authorize access. Free to connect — no charges.
            </p>
            <button
              onClick={() => window.open('https://squareup.com/signup', '_blank')}
              className="w-full text-gray-500 text-sm flex items-center justify-center gap-1 py-2"
            >
              Don't have Square? Sign up free <ExternalLink size={12} />
            </button>
          </div>
        )}

        {/* Webhook URL for manual setup */}
        <div className="bg-gray-800 rounded-xl p-4">
          <p className="text-gray-400 text-xs font-semibold uppercase mb-1">Webhook URL (for manual setup)</p>
          <p className="font-mono text-xs text-gray-300 break-all">
            {(import.meta.env.VITE_BACKEND_URL || 'https://your-backend.railway.app')}/api/webhooks/square
          </p>
          <p className="text-gray-500 text-xs mt-1">Add this in Square Developer → Webhooks → Subscribe to <code>order.completed</code></p>
        </div>
      </div>
    </div>
  );
}

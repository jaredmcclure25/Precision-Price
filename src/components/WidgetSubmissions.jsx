// src/components/WidgetSubmissions.jsx
// Copyright © 2025 PrecisionPrices.Com. All Rights Reserved.

import React, { useState, useEffect } from 'react';
import { Code, DollarSign, Clock, Mail, Package, ExternalLink } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';

export default function WidgetSubmissions() {
  const { currentUser } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      if (!currentUser?.uid) return;

      try {
        const q = query(
          collection(db, 'widgetSubmissions'),
          where('businessId', '==', currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubmissions(data);
      } catch (error) {
        // Collection may not exist yet — that's OK
        console.log('No widget submissions yet:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Widget Submissions</h2>
            <p className="text-gray-600">Estimates requested through your embedded widget</p>
          </div>
          <a
            href={`/widget/${currentUser?.uid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            View Widget
          </a>
        </div>

        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <Code className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Submissions Yet</h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              Once you add the widget to your website, customer estimates will appear here.
            </p>
            <p className="text-sm text-gray-400">
              Set up your widget in Account Settings &rarr; Website Widget
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((sub) => (
              <div key={sub.id} className="border border-gray-200 rounded-xl p-5 hover:border-emerald-200 transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{sub.itemName || 'Unknown Item'}</h4>
                      <p className="text-sm text-gray-500 capitalize">
                        {sub.condition || 'good'} condition
                        {sub.location && ` · ${sub.location}`}
                      </p>
                      {sub.email && (
                        <p className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                          <Mail className="w-3.5 h-3.5" />
                          {sub.email}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {sub.prices ? (
                      <div>
                        <p className="text-lg font-bold text-emerald-600">
                          ${sub.prices.target?.toLocaleString() || '—'}
                        </p>
                        <p className="text-xs text-gray-500">
                          ${sub.prices.min?.toLocaleString()} — ${sub.prices.max?.toLocaleString()}
                        </p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No pricing</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  {sub.timestamp ? new Date(sub.timestamp).toLocaleString() : 'Unknown date'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

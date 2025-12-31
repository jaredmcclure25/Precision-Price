import { useState } from 'react';
import { FuzzTests, FuzzGenerators } from './fuzz-tests';
import { Play, CheckCircle, AlertCircle, XCircle, Download } from 'lucide-react';

export default function TestRunner({ appFunctions }) {
  const [testResults, setTestResults] = useState(null);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');

  const runTests = async () => {
    setRunning(true);
    setProgress('Starting tests...');

    try {
      const results = await FuzzTests.runAllTests(appFunctions);
      setTestResults(results);
      setProgress('Tests complete!');
    } catch (error) {
      setProgress(`Error: ${error.message}`);
    } finally {
      setRunning(false);
    }
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fuzz-test-results-${Date.now()}.json`;
    link.click();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'needs-sanitization': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const countIssues = () => {
    if (!testResults) return { total: 0, warnings: 0, passed: 0 };

    let warnings = 0;
    let passed = 0;
    let total = 0;

    Object.values(testResults.tests).forEach(testGroup => {
      testGroup.forEach(result => {
        total++;
        if (result.status === 'needs-sanitization') warnings++;
        if (result.status === 'rejected' || result.status === 'accepted') passed++;
      });
    });

    return { total, warnings, passed };
  };

  const stats = countIssues();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Security Testing Suite</h2>
            <p className="text-gray-600">Fuzzing & Input Validation Tests</p>
          </div>
          <button
            onClick={runTests}
            disabled={running}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Play className="w-5 h-5" />
            {running ? 'Running Tests...' : 'Run All Tests'}
          </button>
        </div>

        {running && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <p className="text-blue-800 font-medium">{progress}</p>
            </div>
          </div>
        )}

        {testResults && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-green-700">{stats.passed}</div>
                <div className="text-sm text-green-600">Tests Executed</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-yellow-700">{stats.warnings}</div>
                <div className="text-sm text-yellow-600">Needs Attention</div>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-700">{stats.total}</div>
                <div className="text-sm text-blue-600">Total Tests</div>
              </div>
            </div>

            {/* Download Button */}
            <button
              onClick={downloadResults}
              className="mb-6 flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              <Download className="w-4 h-4" />
              Download Full Results
            </button>

            {/* Test Results */}
            <div className="space-y-6">
              {Object.entries(testResults.tests).map(([category, results]) => (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-bold text-gray-900 capitalize">{category.replace(/([A-Z])/g, ' $1').trim()}</h3>
                    <p className="text-sm text-gray-600">{results.length} tests</p>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {results.map((result, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                          {getStatusIcon(result.status)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm text-gray-900">{result.test}</div>
                            {result.payload && (
                              <div className="text-xs text-gray-600 font-mono mt-1 truncate">
                                Payload: {typeof result.payload === 'string'
                                  ? result.payload.substring(0, 100)
                                  : JSON.stringify(result.payload).substring(0, 100)}
                              </div>
                            )}
                            {result.note && (
                              <div className="text-xs text-blue-600 mt-1">{result.note}</div>
                            )}
                            {result.error && (
                              <div className="text-xs text-red-600 mt-1">Error: {result.error}</div>
                            )}
                          </div>
                          <div className={`text-xs px-2 py-1 rounded ${
                            result.status === 'needs-sanitization' ? 'bg-yellow-100 text-yellow-800' :
                            result.status === 'rejected' ? 'bg-green-100 text-green-800' :
                            result.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {result.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Security Recommendations */}
            {stats.warnings > 0 && (
              <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-yellow-900 mb-2">Security Recommendations</h4>
                    <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                      <li>Implement input sanitization for all user-provided data</li>
                      <li>Add server-side validation for all inputs</li>
                      <li>Consider implementing Content Security Policy (CSP) headers</li>
                      <li>Use parameterized queries if storing data in database</li>
                      <li>Implement rate limiting for API endpoints</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Test Information */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3">What This Tests</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-semibold mb-2">Attack Vectors:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>XSS (Cross-Site Scripting)</li>
                <li>SQL Injection</li>
                <li>Command Injection</li>
                <li>Path Traversal</li>
                <li>Buffer Overflow</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Input Validation:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Type Coercion</li>
                <li>Oversized Inputs</li>
                <li>Malicious File Names</li>
                <li>Unicode/Encoding Attacks</li>
                <li>Price Manipulation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Console Output Info */}
        <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
          <p className="font-medium mb-1">💡 Developer Tip:</p>
          <p>Open your browser's Developer Console (F12) to see detailed test execution logs and results.</p>
        </div>
      </div>
    </div>
  );
}

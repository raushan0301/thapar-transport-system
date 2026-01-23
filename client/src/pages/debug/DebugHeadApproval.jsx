import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../services/supabase';
import DashboardLayout from '../../components/layout/DashboardLayout';

/**
 * Debug component to test head approval functionality
 * This helps identify exactly where the approval process is failing
 */
const DebugHeadApproval = () => {
    const { user } = useAuth();
    const [debugInfo, setDebugInfo] = useState({});
    const [testResults, setTestResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            runDiagnostics();
        }
    }, [user]);

    const addTestResult = (test, passed, details) => {
        setTestResults(prev => [...prev, { test, passed, details, timestamp: new Date().toISOString() }]);
    };

    const runDiagnostics = async () => {
        setLoading(true);
        setTestResults([]);

        try {
            // Test 1: Check current user info
            addTestResult('User Authentication', true, {
                userId: user.id,
                userEmail: user.email,
                authRole: user.role
            });

            // Test 2: Fetch user from database
            const { data: dbUser, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (userError) {
                addTestResult('Database User Fetch', false, { error: userError.message });
            } else {
                addTestResult('Database User Fetch', true, {
                    role: dbUser.role,
                    email: dbUser.email,
                    fullName: dbUser.full_name
                });
                setDebugInfo(prev => ({ ...prev, dbUser }));
            }

            // Test 3: Check for pending requests assigned to this head
            const { data: requests, error: requestsError } = await supabase
                .from('transport_requests')
                .select('*')
                .eq('custom_head_email', user.email)
                .eq('current_status', 'pending_head');

            if (requestsError) {
                addTestResult('Fetch Pending Requests', false, { error: requestsError.message });
            } else {
                addTestResult('Fetch Pending Requests', true, {
                    count: requests.length,
                    requests: requests.map(r => ({ id: r.id, requestNumber: r.request_number }))
                });
                setDebugInfo(prev => ({ ...prev, pendingRequests: requests }));
            }

            // Test 4: Test is_head() function
            const { data: isHeadResult, error: isHeadError } = await supabase
                .rpc('is_head');

            if (isHeadError) {
                addTestResult('is_head() Function', false, { error: isHeadError.message });
            } else {
                addTestResult('is_head() Function', isHeadResult, { result: isHeadResult });
            }

            // Test 5: Check existing approvals
            const { data: approvals, error: approvalsError } = await supabase
                .from('approvals')
                .select('*')
                .eq('approver_id', user.id);

            if (approvalsError) {
                addTestResult('Fetch Existing Approvals', false, { error: approvalsError.message });
            } else {
                addTestResult('Fetch Existing Approvals', true, { count: approvals.length });
            }

        } catch (err) {
            addTestResult('Diagnostics', false, { error: err.message });
        } finally {
            setLoading(false);
        }
    };

    const testApprovalInsertion = async () => {
        if (!debugInfo.pendingRequests || debugInfo.pendingRequests.length === 0) {
            addTestResult('Test Approval Insert', false, { error: 'No pending requests found' });
            return;
        }

        const testRequest = debugInfo.pendingRequests[0];

        try {
            // Attempt to insert an approval
            const { data, error } = await supabase
                .from('approvals')
                .insert([{
                    request_id: testRequest.id,
                    approver_id: user.id,
                    approver_role: 'head',
                    action: 'approved',
                    comment: 'TEST APPROVAL - DELETE THIS',
                    approved_at: new Date().toISOString(),
                }])
                .select();

            if (error) {
                addTestResult('Test Approval Insert', false, {
                    error: error.message,
                    code: error.code,
                    details: error.details,
                    hint: error.hint,
                    requestId: testRequest.id
                });
            } else {
                addTestResult('Test Approval Insert', true, {
                    approvalId: data[0]?.id,
                    requestId: testRequest.id,
                    message: 'SUCCESS! Approval was created. You can now delete this test approval.'
                });
            }
        } catch (err) {
            addTestResult('Test Approval Insert', false, { error: err.message });
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto p-6">
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">🔍 Head Approval Debug Tool</h1>
                    <p className="text-gray-600 mb-4">
                        This page helps diagnose why the approval button might not be working.
                    </p>

                    <div className="flex space-x-4">
                        <button
                            onClick={runDiagnostics}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Running...' : 'Run Diagnostics'}
                        </button>

                        <button
                            onClick={testApprovalInsertion}
                            disabled={loading || !debugInfo.pendingRequests?.length}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                            Test Approval Insert
                        </button>
                    </div>
                </div>

                {/* Test Results */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Test Results</h2>

                    {testResults.length === 0 ? (
                        <p className="text-gray-500">No tests run yet. Click "Run Diagnostics" to start.</p>
                    ) : (
                        <div className="space-y-4">
                            {testResults.map((result, index) => (
                                <div
                                    key={index}
                                    className={`border-l-4 p-4 rounded ${result.passed ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="font-semibold text-gray-900">
                                            {result.passed ? '✅' : '❌'} {result.test}
                                        </h3>
                                        <span className="text-xs text-gray-500">
                                            {new Date(result.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>

                                    <pre className="text-sm bg-gray-100 p-3 rounded overflow-x-auto">
                                        {JSON.stringify(result.details, null, 2)}
                                    </pre>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Instructions */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-6">
                    <h3 className="font-bold text-amber-900 mb-2">📋 How to Use This Tool:</h3>
                    <ol className="list-decimal list-inside space-y-2 text-amber-800">
                        <li>Click "Run Diagnostics" to check your user role and pending requests</li>
                        <li>Review the test results to see what's working and what's failing</li>
                        <li>If diagnostics pass, click "Test Approval Insert" to try creating an approval</li>
                        <li>Check the error message if the test fails - it will tell you exactly what's wrong</li>
                        <li>Common issues:
                            <ul className="list-disc list-inside ml-6 mt-1">
                                <li>User role is not set to 'head' in database</li>
                                <li>Request is not assigned to your email</li>
                                <li>RLS policy is blocking the insert</li>
                                <li>Missing required fields in the approval</li>
                            </ul>
                        </li>
                    </ol>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default DebugHeadApproval;

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { toast } from 'react-toastify';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Show specific error messages for known issues
        if (error.message.includes('The last element of the message must be 0')) {
            toast.error('🔐 Encryption Error: Unable to decrypt balance. This usually happens when no encrypted data exists yet.', {
                position: 'top-right',
                autoClose: 8000,
                hideProgressBar: false,
            });
        } else if (error.message.includes('poseidonDecrypt')) {
            toast.error('🔐 Decryption Error: There was an issue with the encryption system. Please try refreshing the page.', {
                position: 'top-right',
                autoClose: 8000,
                hideProgressBar: false,
            });
        } else {
            toast.error('❌ An unexpected error occurred. Please try refreshing the page.', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
            });
        }
    }

    public render() {
        if (this.state.hasError) {
            return this.props.fallback || (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-8">
                    <div className="text-center">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-red-300 mb-3">Encryption System Error</h3>
                        <p className="text-gray-300 mb-4">
                            There was an issue with the encryption system. This usually happens when:
                        </p>
                        <ul className="text-gray-300 text-sm space-y-1 text-left max-w-md mx-auto mb-4">
                            <li>• No encrypted data exists yet (normal for new users)</li>
                            <li>• The wallet is not properly registered</li>
                            <li>• There's a temporary network issue</li>
                        </ul>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
                        >
                            🔄 Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

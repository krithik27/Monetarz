"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle } from "lucide-react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream text-brand-ink font-serif p-6">
                    <div className="max-w-md w-full bg-white/50 backdrop-blur-sm p-8 rounded-2xl border border-red-100 shadow-sm text-center">
                        <AlertCircle className="w-12 h-12 text-red-800/60 mx-auto mb-4" />
                        <h2 className="text-2xl font-medium mb-2">Something went wrong</h2>
                        <p className="text-brand-sage mb-6">
                            We encountered an unexpected error. Ideally, this shouldn't happen.
                        </p>
                        <div className="bg-red-50 p-4 rounded-lg text-left text-sm font-mono text-red-900/70 overflow-auto max-h-40 mb-6">
                            {this.state.error?.message}
                        </div>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null })}
                            className="px-6 py-2 bg-brand-moss text-white rounded-full hover:bg-brand-moss/90 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

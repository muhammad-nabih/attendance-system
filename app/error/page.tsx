import React, { Component, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(_: Error): State {
        return { hasError: true };
    }

    public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex justify-center items-center min-h-screen bg-gray-100">
                    <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">
                            Something went wrong.
                        </h1>
                        <p className="text-gray-700">
                            We're sorry for the inconvenience. Please try again later.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

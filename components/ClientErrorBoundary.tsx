"use client";

import type { ReactNode } from "react";
import React from "react";

type FallbackRender = (args: {
    error: Error;
    reset: () => void;
}) => ReactNode;

export default class ClientErrorBoundary extends React.Component<
    {
        children: ReactNode;
        fallback: ReactNode | FallbackRender;
    },
    { error: Error | null; resetCount: number }
> {
    state = { error: null as Error | null, resetCount: 0 };

    static getDerivedStateFromError(error: Error) {
        return { error };
    }

    reset = () => {
        this.setState((prev) => ({ error: null, resetCount: prev.resetCount + 1 }));
    };

    render() {
        const { error, resetCount } = this.state;
        const { fallback } = this.props;

        if (error) {
            return typeof fallback === "function"
                ? (fallback as FallbackRender)({ error, reset: this.reset })
                : fallback;
        }

        return <React.Fragment key={resetCount}>{this.props.children}</React.Fragment>;
    }
}

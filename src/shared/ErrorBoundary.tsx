import React, { Component, PropsWithChildren, ReactNode } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { themeColors } from "./theme";

interface ErrorBoundaryProps extends PropsWithChildren {
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  screenName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary: Catches component render errors and displays recovery UI
 * Prevents app crash from individual screen failures
 * Used on: home.tsx, progress.tsx, products.tsx, learn.tsx
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.screenName ? ` - ${this.props.screenName}` : ""}] Caught error:`, error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    // Reset error boundary if resetKeys change
    if (prevProps.resetKeys !== this.props.resetKeys && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default error UI
      return (
        <View style={{
          flex: 1,
          backgroundColor: themeColors.light.background,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 40
        }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }} showsVerticalScrollIndicator={false}>
            <Text style={{
              fontSize: 32,
              fontWeight: "bold",
              color: themeColors.light.primary,
              marginBottom: 12,
              textAlign: "center"
            }}>
              ⚠️ Oops!
            </Text>
            <Text style={{
              fontSize: 16,
              color: themeColors.light.secondary,
              marginBottom: 20,
              textAlign: "center",
              lineHeight: 24
            }}>
              {this.props.screenName ? `Something went wrong on the ${this.props.screenName} screen.` : "Something went wrong."}
            </Text>
            
            {process.env.NODE_ENV === "development" && (
              <View style={{
                backgroundColor: "#f5f5f5",
                borderRadius: 8,
                padding: 12,
                marginBottom: 20,
                marginHorizontal: 0,
                maxWidth: "100%"
              }}>
                <Text style={{ fontSize: 12, color: "#666", fontFamily: "monospace", marginBottom: 8 }}>
                  Error Details (Dev Only):
                </Text>
                <Text style={{ fontSize: 10, color: "#999", fontFamily: "monospace" }}>
                  {this.state.error.message}
                </Text>
              </View>
            )}

            <TouchableOpacity
              onPress={this.resetError}
              style={{
                backgroundColor: themeColors.light.primary,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 24,
                marginBottom: 12,
                width: "100%"
              }}
            >
              <Text style={{ color: "white", fontWeight: "600", textAlign: "center", fontSize: 14 }}>
                Try Again
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                this.resetError();
                // Navigate to home screen (would need router context in real app)
              }}
              style={{
                backgroundColor: themeColors.light.border,
                borderRadius: 8,
                paddingVertical: 12,
                paddingHorizontal: 24,
                width: "100%"
              }}
            >
              <Text style={{ color: themeColors.light.secondary, fontWeight: "600", textAlign: "center", fontSize: 14 }}>
                Go to Home
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional error handler hook for non-render errors
 * (Can be used in effects, event handlers, etc.)
 */
export function useErrorHandler() {
  return (error: Error, context?: string) => {
    console.error(`[Error Handler${context ? ` - ${context}` : ""}]`, error);
    // Could integrate with Sentry or other error tracking here
  };
}

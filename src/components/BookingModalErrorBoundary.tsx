import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, X } from 'lucide-react';

interface Props {
  children: ReactNode;
  onClose?: () => void;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class BookingModalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('BookingModal error handled gracefully by boundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      // إزالة شاشة التوقف في حال وجود واجهة افتراضية وعرض المواعيد فوراً بالبيانات البديلة
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#0e1117] border border-neutral-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {this.props.onClose && (
              <button
                type="button"
                onClick={this.props.onClose}
                className="absolute top-4 left-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">حدث خطأ أثناء تحميل نافذة الحجز</h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                نعتذر عن هذا الخطأ المؤقت. بياناتك بأمان ويمكنك المحاولة مرة أخرى فوراً.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>

              {this.props.onClose && (
                <button
                  type="button"
                  onClick={this.props.onClose}
                  className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-neutral-700"
                >
                  إغلاق النافذة
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

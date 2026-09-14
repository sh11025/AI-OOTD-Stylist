import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    (this as any).state = {
      hasError: false,
      error: null,
      copied: false,
    };
  }

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
  };

  // 손상된 로컬 데이터 초기화 후 안전 복구
  private handleClearDataAndReload = () => {
    if (window.confirm('로컬 캐시를 초기화하고 기본 상태로 복구하시겠습니까? (손상된 데이터로 인한 오류 해결)')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  // 에러 내용 클립보드 복사
  private handleCopyError = () => {
    const currentState = (this as any).state as State;
    if (currentState?.error) {
      navigator.clipboard.writeText(currentState.error.stack || currentState.error.message);
      (this as any).setState({ copied: true });
      setTimeout(() => (this as any).setState({ copied: false }), 2000);
    }
  };

  public render() {
    const { hasError, error, copied } = ((this as any).state || {}) as State;
    if (hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-6 text-[#212529] font-sans">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-[#E9ECEF] p-6 sm:p-8 text-center space-y-4">
            
            {/* 경고 아이콘 */}
            <div className="w-14 h-14 bg-[#E2725B]/10 text-[#E2725B] rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-[#212529]">
                일시적인 문제가 발생했습니다
              </h2>
              <p className="text-xs text-[#868E96] mt-1 leading-relaxed">
                화면을 렌더링하는 도중 예기치 못한 오류가 감지되었습니다.<br />
                아래 옵션을 통해 다시 시도하거나 안전하게 복구해 보세요.
              </p>
            </div>

            {/* 에러 상세 내용 */}
            {error && (
              <div className="relative p-3 bg-[#F8F9FA] rounded border border-[#CED4DA] text-left text-xs text-[#212529] overflow-auto max-h-28">
                <div className="flex justify-between items-center pb-1 mb-1 border-b border-[#E9ECEF] text-[10px] text-[#868E96]">
                  <span>Error Details</span>
                  <button 
                    type="button"
                    onClick={this.handleCopyError}
                    className="flex items-center gap-1 text-[#E2725B] hover:underline cursor-pointer"
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? '복사됨' : '복사'}
                  </button>
                </div>
                <div className="break-all">{error.message}</div>
              </div>
            )}

            {/* 액션 버튼 그룹 */}
            <div className="space-y-2 pt-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="flex-1 min-h-[42px] py-2 px-3 text-xs font-semibold text-[#212529] bg-[#F8F9FA] hover:bg-white rounded border border-[#CED4DA] transition-colors cursor-pointer"
                >
                  다시 시도
                </button>
                <button
                  type="button"
                  onClick={this.handleReload}
                  className="flex-1 min-h-[42px] py-2 px-3 text-xs font-semibold text-white bg-[#E2725B] hover:bg-[#cb5e48] rounded shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  새로고침
                </button>
              </div>

              {/* 비상 데이터 초기화 복구 버튼 */}
              <button
                type="button"
                onClick={this.handleClearDataAndReload}
                className="w-full min-h-[38px] py-1.5 px-3 text-xs font-medium text-[#868E96] hover:text-[#E2725B] hover:bg-[#E2725B]/5 rounded border border-transparent transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>데이터 오류 지속 시 캐시 초기화 후 복구</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return ((this as any).props as Props).children;
  }
}

"use client";

interface ErrorMessageProps {
  error: string | null | undefined;
  className?: string;
  onDismiss?: () => void;
}

export function ErrorMessage({ error, className = "", onDismiss }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className={`rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-medium mb-1">Error</div>
          <div className="whitespace-pre-line">{error}</div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 shrink-0 ml-2"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface SuccessMessageProps {
  message: string | null | undefined;
  className?: string;
  onDismiss?: () => void;
}

export function SuccessMessage({ message, className = "", onDismiss }: SuccessMessageProps) {
  if (!message) return null;

  return (
    <div className={`rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-medium mb-1">Success</div>
          <div className="whitespace-pre-line">{message}</div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-green-600 hover:text-green-800 shrink-0 ml-2"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

interface InfoMessageProps {
  message: string | null | undefined;
  className?: string;
  onDismiss?: () => void;
}

export function InfoMessage({ message, className = "", onDismiss }: InfoMessageProps) {
  if (!message) return null;

  return (
    <div className={`rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800 ${className}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="font-medium mb-1">Info</div>
          <div className="whitespace-pre-line">{message}</div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-blue-600 hover:text-blue-800 shrink-0 ml-2"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

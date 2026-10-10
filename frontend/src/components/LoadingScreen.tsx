interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      <div className="ops-spinner" aria-hidden="true" />
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', letterSpacing: '0.02em', margin: 0 }}>
        {message}
      </p>
    </div>
  );
}

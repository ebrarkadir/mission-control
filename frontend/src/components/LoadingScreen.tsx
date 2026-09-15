interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      <div className="loading-spinner" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

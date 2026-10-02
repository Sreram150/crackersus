export default function Loading({ full = false, text = 'Loading...' }) {
  return (
    <div className={`loading ${full ? 'full' : ''}`}>
      <div className="spinner" />
      <p>{text}</p>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="alert error">
      <span>{message}</span>
      {onRetry && <button className="btn btn-sm btn-outline" onClick={onRetry}>Retry</button>}
    </div>
  );
}

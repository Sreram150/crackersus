import { Link } from 'react-router-dom';

export default function NotFound({ title = 'Page not found', text = "The page you're looking for doesn't exist or was moved." }) {
  return (
    <div className="container empty">
      <div className="big">💥</div>
      <h1>{title}</h1>
      <p>{text}</p>
      <Link to="/" className="btn btn-primary">Back to Home</Link>
    </div>
  );
}

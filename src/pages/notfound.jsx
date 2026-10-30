import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="not-found">
      <img src="/images/404.svg" alt="404 Page not found" />
      <h1>Page not found</h1>
      <p></p>
      <Link to="/">Back to home</Link>
    </div>
  );
}
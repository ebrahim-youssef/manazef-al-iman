import { Link } from 'react-router-dom';
import './CategoryCard.css';

const icons = {
  sparkle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3z"/><path d="M19 15l.9 2.1 2.1.9-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z"/></svg>
  ),
  bottle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6v3l1 1v11a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3V7l1-1V3z"/><path d="M9 6h6"/></svg>
  ),
  factory: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V9l6 4V9l6 4V3h4v18H3z"/><path d="M7 17h2M11 17h2M15 17h2"/></svg>
  ),
  basket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9h16l-1.5 9.5a2 2 0 0 1-2 1.5H7.5a2 2 0 0 1-2-1.5L4 9z"/><path d="M8 9l2-5M16 9l-2-5M9 13v3M12 13v3M15 13v3"/></svg>
  ),
  box: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8l-9 5-9-5 9-5 9 5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/></svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13l-7 7-10-10V3h7l10 10z"/><circle cx="7.5" cy="7.5" r="1"/></svg>
  ),
};

export default function CategoryCard({ category }) {
  return (
    <Link to={`/category/${category.slug}`} className="category-card">
      <div className="category-card-icon">{icons[category.icon] || icons.box}</div>
      <div className="category-card-body">
        <h3>{category.name}</h3>
        <p>{category.description}</p>
      </div>
      <span className="category-card-arrow" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6"/></svg>
      </span>
    </Link>
  );
}

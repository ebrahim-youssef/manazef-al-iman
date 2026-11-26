import { Link } from '@tanstack/react-router';
import './CategoryCard.css';

export default function CategoryCard({ category, productCount }) {
  return (
    <Link to={`/category/${category.slug}`} className="category-card">
      <div className="category-card-image">
        <img src={category.image} alt="" loading="lazy" />
      </div>
      <div className="category-card-body">
        <h3>{category.name}</h3>
        <span>{productCount} منتج</span>
      </div>
    </Link>
  );
}

import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatEGP } from '../utils/format';
import { getDiscountPercent } from '../data/offers';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const { addItem } = useCart();
  const discount = getDiscountPercent(product);

  return (
    <article className="product-card">
      <Link to={`/product/${product.id}`} className="product-card-image-wrap">
        <img src={product.image} alt={product.name} className="product-card-image" loading="lazy" />
        {discount > 0 && <span className="badge badge-discount product-card-badge">خصم {discount}%</span>}
        {!product.available && <span className="badge badge-out product-card-badge">غير متوفر</span>}
      </Link>
      <div className="product-card-body">
        <p className="product-card-brand">{product.brand}</p>
        <Link to={`/product/${product.id}`} className="product-card-name">
          <h3>{product.name}</h3>
        </Link>
        <div className="product-card-pricing">
          <span className="product-card-price">{formatEGP(product.price)}</span>
          {product.originalPrice ? (
            <span className="product-card-old">{formatEGP(product.originalPrice)}</span>
          ) : null}
        </div>
        <p className="product-card-unit">
          {product.unitType === 'wholesale' ? `السعر / ${product.unit}` : `السعر / ${product.unit}`}
        </p>
        <div className="product-card-meta">
          <span className={product.available ? 'status-available' : 'status-out'}>
            {product.available ? 'متوفر' : 'غير متوفر حاليًا'}
          </span>
        </div>
        <button
          type="button"
          className="btn btn-primary product-card-btn"
          onClick={() => addItem(product, 1)}
          disabled={!product.available}
        >
          {product.available ? 'أضف إلى السلة' : 'غير متوفر'}
        </button>
      </div>
    </article>
  );
}

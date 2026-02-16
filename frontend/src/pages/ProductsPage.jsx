import { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { GET_ALL_PRODUCTS } from '../graphql/queries/productQueries';
import PageHeader from '../components/layout/PageHeader';
import { SkeletonCards } from '../components/common/Skeleton';
import ErrorAlert from '../components/common/ErrorAlert';

export default function ProductsPage() {
  const { data, loading, error } = useQuery(GET_ALL_PRODUCTS);
  const [activeCategory, setActiveCategory] = useState('All');

  if (loading) return (
    <div>
      <PageHeader title="Products" subtitle="Loading products..." />
      <SkeletonCards count={6} />
    </div>
  );
  if (error) return <ErrorAlert message={error.message} />;

  const products = data.products;
  const categories = ['All', ...new Set(products.map((p) => p.category).filter(Boolean))];
  const filtered =
    activeCategory === 'All'
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={`${products.length} products from Product-Service`}
      />

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <span className="text-lg font-bold text-indigo-600">
                ₹{parseFloat(product.price).toFixed(2)}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
              {product.description || 'No description'}
            </p>
            <div className="flex items-center justify-between text-xs">
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded">
                {product.category || 'Uncategorized'}
              </span>
              <span
                className={`font-medium ${
                  product.stockQuantity > 0 ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {product.stockQuantity > 0
                  ? `${product.stockQuantity} in stock`
                  : 'Out of stock'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          No products in this category
        </div>
      )}
    </div>
  );
}

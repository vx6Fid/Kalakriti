"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Category, Product } from "@/utils/types";

export default function CategoryDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const url = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!url) {
      setError("API base URL not defined");
      return;
    }

    const fetchCategoryAndProducts = async () => {
      try {
        setLoading(true);

        // Fetch category info
        const catRes = await fetch(`${url}/api/categories`);
        if (!catRes.ok) throw new Error("Failed to fetch categories");
        const categories: Category[] = await catRes.json();
        const matched = categories.find((c) => c.id === id);
        if (!matched) throw new Error("Category not found");
        setCategory(matched);

        // Fetch products in category
        const prodRes = await fetch(`${url}/api/category/${id}/products`);
        if (!prodRes.ok) throw new Error("Failed to fetch products");
        const data = await prodRes.json();
        const fetchedProducts = Array.isArray(data.products)
          ? data.products
          : data;
        setProducts(fetchedProducts);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [id]);

  if (loading) return <LoadingSkeleton />;
  if (error) return <ErrorDisplay message={error} />;
  if (!category) return <ErrorDisplay message="No category found" />;

  return (
    <div className="bg-background text-text min-h-screen">
      <div className="container mx-auto px-4 py-8">
        {/* Category Header */}
        <div className="mb-10">
          <div className="flex flex-col md:flex-row gap-6 items-center bg-accent p-6 rounded-xl">
            {category.image && (
              <div className="relative w-full md:w-1/3 h-64 rounded-xl overflow-hidden border-2 border-secondary">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  priority
                />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {category.name}
              </h1>
              <div className="flex items-center gap-2">
                <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-medium">
                  {products.length} {products.length === 1 ? "product" : "products"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 border-b border-secondary pb-2">
            Featured Products
          </h2>
          
          {products.length === 0 ? (
            <div className="text-center py-12 bg-accent rounded-xl">
              <div className="text-primary mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
              </div>
              <p className="text-lg">
                No products available in this category yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  return (
    <div className="group relative bg-background rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-secondary">
      <div className="aspect-square relative">
        <Image
          src={product.images?.[0] ?? "/fallback.jpg"}
          alt={product.name}
          fill
          className="object-cover group-hover:opacity-90 transition-opacity"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1 line-clamp-1">
          {product.name}
        </h3>
        <p className="text-sm text-text/80 mb-3 line-clamp-2">
          {product.description}
        </p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-primary">
            ₹{product.price.toLocaleString()}
          </span>
          <button className="text-sm font-medium text-white bg-primary hover:bg-primary/90 px-3 py-1 rounded-full transition-colors">
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="bg-background text-text min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-10">
          <div className="flex flex-col md:flex-row gap-6 items-center bg-accent p-6 rounded-xl">
            <div className="w-full md:w-1/3 h-64 rounded-xl bg-secondary/20 animate-pulse"></div>
            <div className="flex-1 space-y-4">
              <div className="h-10 w-3/4 rounded bg-secondary/20 animate-pulse"></div>
              <div className="h-6 w-1/2 rounded bg-secondary/20 animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-6 border-b border-secondary pb-2">
          <div className="h-8 w-1/3 rounded bg-secondary/20 animate-pulse"></div>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-square rounded-xl bg-secondary/20 animate-pulse"></div>
              <div className="h-6 w-3/4 rounded bg-secondary/20 animate-pulse"></div>
              <div className="h-4 w-full rounded bg-secondary/20 animate-pulse"></div>
              <div className="h-4 w-full rounded bg-secondary/20 animate-pulse"></div>
              <div className="h-8 w-1/2 rounded bg-secondary/20 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="bg-background text-text min-h-screen flex items-center justify-center">
      <div className="max-w-md mx-auto text-center bg-accent p-6 rounded-xl border border-secondary">
        <div className="text-primary mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium mb-2">Error</h3>
        <p className="mb-4">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export interface ProductCardProps {
  id: number;
  name: string;
  price: number;
  original?: number;
  icon?: string;
  imageUrl?: string;
  featured?: boolean;
  className?: string;
}

export function ProductCard({
  id,
  name,
  price,
  original,
  icon,
  imageUrl,
  featured = false,
  className = "",
}: ProductCardProps) {
  const displayImage = imageUrl || icon || "📦";
  const isImageUrl =
    imageUrl && (imageUrl.startsWith("http") || imageUrl.startsWith("/"));

  return (
    <Link
      href={`/product/${id}`}
      className={`shrink-0 w-44 sm:w-48 md:w-56 lg:w-64 block ${className}`}
    >
      <Card
        className={`cursor-pointer hover:shadow-lg transition-shadow h-full border-gray-200`}
      >
        <CardContent className="flex flex-col justify-between h-full p-0">
          <div>
            <div className="bg-gray-100 h-28 sm:h-32 md:h-40 flex rounded-t-xl items-center justify-center overflow-hidden">
              {isImageUrl ? (
                <Image
                  src={imageUrl}
                  alt={name}
                  width={224}
                  height={160}
                  className="w-full h-full object-cover border-b"
                />
              ) : (
                <div className="text-3xl sm:text-4xl">{displayImage}</div>
              )}
            </div>
            <h3 className="font-medium text-xs sm:text-sm md:text-base line-clamp-2 px-4 pt-3 pb-2">
              {name}
            </h3>
          </div>
          <div className="flex gap-2 shadow-md px-4 rounded-b-xl pb-3">
            <div className="text-base sm:text-lg md:text-xl font-semibold">
              {price.toLocaleString()}₮
            </div>
            {original && original > price && (
              <div className="text-xs sm:text-sm text-muted-foreground line-through">
                {original.toLocaleString()}₮
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

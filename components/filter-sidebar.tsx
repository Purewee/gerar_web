"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCategories, type Category } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  DollarSign,
  Package,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  className?: string;
  productsCount?: number;
  isLoading?: boolean;
}

// Build category tree from flat list
function buildCategoryTree(categories: Category[]): Category[] {
  const categoryMap = new Map<number, Category & { children: Category[] }>();
  const rootCategories: Category[] = [];

  // First pass: create map
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Second pass: build tree
  categories.forEach((cat) => {
    const category = categoryMap.get(cat.id)!;
    if (cat.parentId === null) {
      rootCategories.push(category);
    } else {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(category);
      }
    }
  });

  return rootCategories;
}

function CategoryTreeItem({
  category,
  selectedCategories,
  onToggleCategory,
  level = 0,
  isLast = false,
  parentPath = [],
}: {
  category: Category & { children?: Category[] };
  selectedCategories: number[];
  onToggleCategory: (id: number) => void;
  level?: number;
  isLast?: boolean;
  parentPath?: boolean[];
}) {
  // Initialize with false to ensure consistent SSR/client render, then set to true for level 0 after mount
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategories.includes(category.id);
  const isParent = level === 0;
  const isSubcategory = level > 0;

  // Initialize expanded state only on client to avoid hydration mismatch
  useEffect(() => {
    if (level === 0) {
      setIsExpanded(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return (
    <div className="relative">
      <div
        className={cn(
          "relative flex items-center gap-2.5 py-2.5 px-3 rounded-lg cursor-pointer transition-all duration-200 group",
          isParent
            ? cn(
                "mb-1",
                isSelected
                  ? "bg-primary/10 border-2 border-primary/30 shadow-sm"
                  : "bg-gray-50/50 border border-gray-200 hover:bg-gray-100 hover:border-gray-300"
              )
            : cn(
                "ml-8 mb-0.5 relative",
                isSelected
                  ? "bg-primary/5 border border-primary/20 shadow-sm"
                  : "bg-white border border-gray-100 hover:bg-gray-50 hover:border-gray-200"
              )
        )}
        style={{
          paddingLeft: isSubcategory ? "2.75rem" : "0.75rem",
        }}
      >
        {/* Tree connector line for subcategories */}
        {isSubcategory && (
          <>
            {/* Horizontal line */}
            <div
              className={cn(
                "absolute left-0 top-1/2 w-6 h-0.5 -translate-y-1/2",
                isSelected ? "bg-primary/30" : "bg-gray-300"
              )}
            />
            {/* Vertical line (if not last) */}
            {!isLast && (
              <div
                className={cn(
                  "absolute left-0 top-1/2 w-0.5 h-full",
                  isSelected ? "bg-primary/20" : "bg-gray-200"
                )}
                style={{ height: "calc(100% + 0.125rem)" }}
              />
            )}
          </>
        )}
        {/* Expand/Collapse button */}
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={cn(
              "p-1 rounded transition-all duration-200 flex-shrink-0",
              isParent
                ? "hover:bg-primary/20 text-primary"
                : "hover:bg-gray-200 text-gray-600"
            )}
          >
            {isExpanded ? (
              <ChevronDown className={cn("w-4 h-4", isParent && "w-5 h-5")} />
            ) : (
              <ChevronRight className={cn("w-4 h-4", isParent && "w-5 h-5")} />
            )}
          </button>
        ) : (
          <div className="w-6 flex-shrink-0 flex items-center justify-center">
            {isSubcategory && (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover:bg-primary/40 transition-colors" />
            )}
          </div>
        )}

        {/* Checkbox */}
        <div className="flex-shrink-0">
          <Checkbox
            id={`category-${category.id}`}
            checked={isSelected}
            onChange={() => onToggleCategory(category.id)}
          />
        </div>

        {/* Category name */}
        <label
          htmlFor={`category-${category.id}`}
          className={cn(
            "flex-1 cursor-pointer select-none transition-colors",
            isParent
              ? cn(
                  "text-sm font-semibold",
                  isSelected ? "text-primary" : "text-gray-900"
                )
              : cn(
                  "text-sm",
                  isSelected
                    ? "font-medium text-primary"
                    : "text-gray-700 group-hover:text-gray-900"
                )
          )}
        >
          {category.name}
        </label>

        {/* Children count badge for parent categories */}
        {hasChildren && isParent && (
          <span
            className={cn(
              "px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0",
              isSelected
                ? "bg-primary/20 text-primary"
                : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
            )}
          >
            {category.children!.length}
          </span>
        )}
      </div>

      {/* Subcategories container with visual connection */}
      {hasChildren && isExpanded && (
        <div className="relative">
          {/* Vertical line connecting parent to children */}
          {isParent && (
            <div className="absolute left-[1.125rem] top-0 bottom-0 w-0.5 bg-gray-200" />
          )}
          
          {/* Subcategories list */}
          <div className={cn("space-y-0.5", isParent && "mt-1 ml-0", isSubcategory && "ml-8")}>
            {category.children!.map((child, index) => {
              const isLastChild = index === category.children!.length - 1;
              return (
                <CategoryTreeItem
                  key={child.id}
                  category={child}
                  selectedCategories={selectedCategories}
                  onToggleCategory={onToggleCategory}
                  level={level + 1}
                  isLast={isLastChild}
                  parentPath={[...parentPath, isLast]}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterSidebar({ className, productsCount, isLoading }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: categoriesResponse } = useCategories();
  const allCategories = categoriesResponse?.data || [];
  const [isMounted, setIsMounted] = useState(false);

  // Ensure component is mounted to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Get current filter values from URL
  const selectedCategoryIds = useMemo(() => {
    const categoryIds = searchParams.get("categoryIds");
    if (categoryIds) {
      return categoryIds.split(",").map((id) => parseInt(id.trim(), 10)).filter((id) => !isNaN(id));
    }
    const categoryId = searchParams.get("categoryId");
    if (categoryId) {
      const id = parseInt(categoryId, 10);
      return !isNaN(id) ? [id] : [];
    }
    return [];
  }, [searchParams]);

  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const inStock = searchParams.get("inStock");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  // Build category tree
  const categoryTree = useMemo(() => buildCategoryTree(allCategories), [allCategories]);

  // Update URL with new params
  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Reset to page 1 when filters change
    params.delete("page");
    
    router.push(`/products?${params.toString()}`);
  };

  const handleCategoryToggle = (categoryId: number) => {
    const newSelected = selectedCategoryIds.includes(categoryId)
      ? selectedCategoryIds.filter((id) => id !== categoryId)
      : [...selectedCategoryIds, categoryId];

    if (newSelected.length === 0) {
      updateFilters({ categoryIds: null, categoryId: null });
    } else if (newSelected.length === 1) {
      updateFilters({ categoryId: newSelected[0].toString(), categoryIds: null });
    } else {
      updateFilters({ categoryIds: newSelected.join(","), categoryId: null });
    }
  };

  const handlePriceChange = (type: "min" | "max", value: string) => {
    if (type === "min") {
      updateFilters({ minPrice: value || null });
    } else {
      updateFilters({ maxPrice: value || null });
    }
  };

  const handleStockChange = (checked: boolean) => {
    updateFilters({ inStock: checked ? "true" : null });
  };

  const handleSortChange = (newSortBy: string, newSortOrder: string) => {
    updateFilters({ sortBy: newSortBy, sortOrder: newSortOrder });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    const search = searchParams.get("search");
    if (search) {
      params.set("search", search);
    }
    router.push(`/products?${params.toString()}`);
  };

  const hasActiveFilters = selectedCategoryIds.length > 0 || minPrice || maxPrice || inStock === "true";

  return (
    <div
      className={cn(
        "space-y-5 sticky top-24 backdrop-blur-md bg-white/80 rounded-2xl p-4 shadow-lg",
        className
      )}
    >
      {/* Header */}
      <div className="space-y-3 pb-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Шүүлт</h2>
          </div>
    
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs h-8 px-3 hover:bg-red-50 hover:text-red-600"
            >
              <X className="w-3.5 h-3.5 mr-1.5" />
              Цэвэрлэх
            </Button>
          )}
        </div>
        
        {/* Products Count */}
        {productsCount !== undefined && !isLoading && (
          <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex-1">
              <p className="text-xs text-gray-600 font-medium">Олдсон бараа</p>
              <p className="text-lg font-bold text-primary">
                {productsCount} <span className="text-sm font-normal text-gray-600">бараа</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
          </div>
        )}
        {isLoading && (
          <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-xs text-gray-500">Ачааллаж байна...</p>
          </div>
        )}
      </div>
  
      {/* Categories */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <Package className="w-4 h-4 text-primary" />
            </div>
            Ангилал
          </CardTitle>
        </CardHeader>
  
        <CardContent className="pt-4">
          <div className="max-h-[400px] overflow-y-auto pr-2 space-y-1">
            {categoryTree.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                {isMounted ? "Ангилал олдсонгүй" : "Ачааллаж байна..."}
              </p>
            ) : (
              categoryTree.map((category, index) => (
                <CategoryTreeItem
                  key={category.id}
                  category={category}
                  selectedCategories={selectedCategoryIds}
                  onToggleCategory={handleCategoryToggle}
                  isLast={index === categoryTree.length - 1}
                  parentPath={[]}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
  
      {/* Price */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            Үнэ
          </CardTitle>
        </CardHeader>
  
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              placeholder="Хамгийн бага"
              value={minPrice}
              min="0"
              onChange={(e) => handlePriceChange("min", e.target.value)}
            />
            <span className="text-gray-400">-</span>
            <Input
              type="number"
              placeholder="Хамгийн их"
              value={maxPrice}
              min="0"
              onChange={(e) => handlePriceChange("max", e.target.value)}
            />
          </div>
  
          <Button
            size="sm"
            className="w-full"
            onClick={() =>
              updateFilters({
                minPrice: minPrice || null,
                maxPrice: maxPrice || null,
              })
            }
          >
            Үнэ шүүх
          </Button>
        </CardContent>
      </Card>
  
      {/* Stock */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="text-base font-semibold">
            Барааны нөөц
          </CardTitle>
        </CardHeader>
  
        <CardContent className="pt-4">
          <Button
            variant={inStock === "true" ? "default" : "outline"}
            className="w-full justify-start gap-2"
            onClick={() => handleStockChange(inStock !== "true")}
          >
            <div
              className={cn(
                "w-2.5 h-2.5 rounded-full",
                inStock === "true" ? "bg-green-400" : "bg-gray-300"
              )}
            />
            Зөвхөн нөөцтэй бараа
          </Button>
        </CardContent>
      </Card>
  
      {/* Sort */}
      <Card className="rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
        <CardHeader className="pb-3 border-b border-gray-100">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <div className="p-1.5 bg-primary/10 rounded-md">
              <ArrowUpDown className="w-4 h-4 text-primary" />
            </div>
            Эрэмбэлэх
          </CardTitle>
        </CardHeader>
  
        <CardContent className="pt-4">
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split("-");
              handleSortChange(sb, so);
            }}
            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary"
          >
            <optgroup label="Огноо">
              <option value="createdAt-desc">Шинэ эхэнд</option>
              <option value="createdAt-asc">Хуучин эхэнд</option>
            </optgroup>
            <optgroup label="Үнэ">
              <option value="price-asc">Хямд → Үнэтэй</option>
              <option value="price-desc">Үнэтэй → Хямд</option>
            </optgroup>
            <optgroup label="Нэр">
              <option value="name-asc">А → Я</option>
              <option value="name-desc">Я → А</option>
            </optgroup>
          </select>
        </CardContent>
      </Card>
  
      {/* Active Filters */}
      {hasActiveFilters && (
        <Card className="rounded-2xl border-2 border-primary/30 bg-primary/5 shadow-md">
          <CardContent className="pt-4">
            <p className="text-xs font-semibold text-primary mb-3">
              Идэвхтэй шүүлтүүд
            </p>
  
            <div className="flex flex-wrap gap-2">
              {selectedCategoryIds.length > 0 && (
                <span
                  onClick={() =>
                    updateFilters({ categoryIds: null, categoryId: null })
                  }
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-primary/20 text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition"
                >
                  <Package className="w-3 h-3" />
                  {selectedCategoryIds.length} ангилал
                  <X className="w-3 h-3" />
                </span>
              )}
  
              {(minPrice || maxPrice) && (
                <span
                  onClick={() =>
                    updateFilters({ minPrice: null, maxPrice: null })
                  }
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-primary/20 text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition"
                >
                  <DollarSign className="w-3 h-3" />
                  {minPrice || "0"} – {maxPrice || "∞"}
                  <X className="w-3 h-3" />
                </span>
              )}
  
              {inStock === "true" && (
                <span
                  onClick={() => updateFilters({ inStock: null })}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-primary/20 text-xs font-semibold hover:bg-red-50 hover:text-red-600 transition"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Нөөцтэй
                  <X className="w-3 h-3" />
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
  
}

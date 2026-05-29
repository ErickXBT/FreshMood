import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { 
  useListMenuItems, 
  getListMenuItemsQueryKey,
  useListCategories,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { formatRupiah } from "@/lib/format";
import { useCart } from "@/hooks/use-cart";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Loader2, Search, ShoppingBag, Plus, Minus, Star, Utensils, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CustomerMenu() {
  const searchParams = new URLSearchParams(useSearch());
  const tableParam = searchParams.get("table");
  const [tableNumber, setTableNumber] = useState<string | null>(tableParam);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [, setLocation] = useLocation();
  const { items, addItem, updateQuantity, removeItem, subtotal, totalItems } = useCart();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (tableParam) {
      setTableNumber(tableParam);
      sessionStorage.setItem("freshmood-table", tableParam);
    } else {
      const stored = sessionStorage.getItem("freshmood-table");
      if (stored) setTableNumber(stored);
    }
  }, [tableParam]);

  const { data: categories, isLoading: isLoadingCats } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const { data: menuItems, isLoading: isLoadingItems } = useListMenuItems(
    { available: true }, 
    { query: { queryKey: getListMenuItemsQueryKey({ available: true }) } }
  );

  const safeMenuItems = Array.isArray(menuItems) ? menuItems : [];
  const safeCategories = Array.isArray(categories) ? categories : [];

  const filteredItems = safeMenuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === null || item.categoryId === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getItemQuantity = (id: number) => {
    const item = items.find(i => i.menuItem.id === id);
    return item?.quantity || 0;
  };

  if (isLoadingCats || isLoadingItems) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground animate-pulse">Loading menu...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <img src="/images/logo.png" alt="FreshMood" className="h-9 w-9 object-contain" />
              <h1 className="text-2xl font-bold text-foreground">FreshMood</h1>
            </div>
            {tableNumber && (
              <p className="text-sm text-primary font-medium">Table {tableNumber}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search..." 
                className="pl-9 w-32 md:w-48 h-9 rounded-full bg-muted/50 border-none focus-visible:ring-1"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="w-9 h-9 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center transition-colors shrink-0"
              aria-label="Toggle theme"
            >
              <AnimatePresence mode="wait" initial={false}>
                {theme === "dark" ? (
                  <motion.span
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Sun className="w-4 h-4 text-primary" />
                  </motion.span>
                ) : (
                  <motion.span
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Moon className="w-4 h-4 text-foreground" />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Categories */}
        <ScrollArea className="w-full whitespace-nowrap border-t border-border/50">
          <div className="flex w-max space-x-2 p-4">
            <Button
              variant={activeCategory === null ? "default" : "secondary"}
              className={`rounded-full px-6 transition-all ${activeCategory === null ? 'shadow-md' : 'opacity-80'}`}
              onClick={() => setActiveCategory(null)}
            >
              All Items
            </Button>
            {safeCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "secondary"}
                className={`rounded-full px-6 transition-all ${activeCategory === cat.id ? 'shadow-md' : 'opacity-80'}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="hidden" />
        </ScrollArea>
      </header>

      {/* Menu Grid */}
      <main className="px-4 py-6 max-w-4xl mx-auto">
        {activeCategory === null && !searchTerm && (
          <div className="mb-8">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Star className="text-primary fill-primary" /> 
              Our Best Sellers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {safeMenuItems.filter(i => i.isBestSeller).slice(0, 4).map(item => (
                // Reusing the same card logic below
                <ItemCard 
                  key={item.id} 
                  item={item} 
                  quantity={getItemQuantity(item.id)}
                  onAdd={() => addItem(item)}
                  onUpdate={(q) => updateQuantity(item.id, q)}
                />
              ))}
            </div>
          </div>
        )}

        <h2 className="text-xl font-bold mb-4">{activeCategory ? safeCategories.find(c => c.id === activeCategory)?.name : 'Menu'}</h2>
        
        {filteredItems.length === 0 ? (
          <div className="text-center py-20">
            <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-lg text-muted-foreground">No items found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <ItemCard 
                key={item.id} 
                item={item} 
                quantity={getItemQuantity(item.id)}
                onAdd={() => addItem(item)}
                onUpdate={(q) => updateQuantity(item.id, q)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Sticky Cart Bar */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] z-50"
          >
            <Button 
              className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-between px-6 text-lg"
              onClick={() => setLocation("/checkout")}
            >
              <div className="flex items-center gap-3">
                <div className="bg-primary-foreground/20 rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                  {totalItems}
                </div>
                <span>View Order</span>
              </div>
              <span className="font-bold">{formatRupiah(subtotal)}</span>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ItemCard({ item, quantity, onAdd, onUpdate }: any) {
  return (
    <div className="flex gap-4 p-4 bg-card rounded-2xl border border-border shadow-sm overflow-hidden relative">
      {item.isBestSeller && (
        <div className="absolute top-0 left-0 w-12 h-12 overflow-hidden">
          <div className="bg-primary text-primary-foreground text-[10px] font-bold py-1 w-20 text-center -rotate-45 -translate-x-6 mt-2 shadow-sm">
            BEST
          </div>
        </div>
      )}
      
      <div className="w-28 h-28 shrink-0 rounded-xl bg-muted overflow-hidden relative shadow-inner">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <Utensils className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <h3 className="font-bold text-lg leading-tight truncate">{item.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1 leading-snug">
          {item.description || "A delicious choice"}
        </p>
        
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-bold text-primary">{formatRupiah(item.price)}</span>
          
          {quantity > 0 ? (
            <div className="flex items-center gap-3 bg-secondary rounded-full px-2 py-1 shadow-inner">
              <button 
                onClick={() => onUpdate(quantity - 1)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-background shadow-sm hover:bg-muted active:scale-95 transition-transform"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-bold text-sm w-4 text-center">{quantity}</span>
              <button 
                onClick={() => onUpdate(quantity + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-90 active:scale-95 transition-transform"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <Button 
              size="sm" 
              className="rounded-full px-4 h-9 shadow-sm active:scale-95 transition-transform"
              onClick={onAdd}
            >
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

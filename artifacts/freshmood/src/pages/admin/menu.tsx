import { useState, useRef } from "react";
import AdminLayout from "@/components/admin-layout";
import { 
  useListMenuItems, 
  getListMenuItemsQueryKey,
  useListCategories,
  getListCategoriesQueryKey,
  useUpdateMenuItem,
  useCreateMenuItem,
  useDeleteMenuItem,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  Category,
  MenuItem
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { formatRupiah } from "@/lib/format";
import { Loader2, Plus, Search, Star, Edit, Trash2, Upload, X, ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminMenu() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [catName, setCatName] = useState("");
  const [catSort, setCatSort] = useState("0");

  const { data: categories, isLoading: isLoadingCats } = useListCategories({
    query: { queryKey: getListCategoriesQueryKey() }
  });

  const { data: menuItems, isLoading: isLoadingItems } = useListMenuItems({}, {
    query: { queryKey: getListMenuItemsQueryKey({}) }
  });

  const createMenuItemMutation = useCreateMenuItem();
  const updateMenuItemMutation = useUpdateMenuItem();
  const deleteMenuItemMutation = useDeleteMenuItem();

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload/menu-image", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      setItemImage(url);
    } catch {
      toast({ title: "Upload failed", description: "Could not upload image. Try a URL instead.", variant: "destructive" });
    } finally {
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openItemDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemName(item.name);
      setItemDesc(item.description || "");
      setItemPrice(item.price.toString());
      setItemCategory(item.categoryId.toString());
      setItemImage(item.imageUrl || "");
    } else {
      setEditingItem(null);
      setItemName("");
      setItemDesc("");
      setItemPrice("");
      setItemCategory(categories?.[0]?.id.toString() || "");
      setItemImage("");
    }
    setIsItemDialogOpen(true);
  };

  const openCategoryDialog = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      setCatName(cat.name);
      setCatSort(cat.sortOrder.toString());
    } else {
      setEditingCategory(null);
      setCatName("");
      setCatSort("0");
    }
    setIsCategoryDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemName || !itemPrice || !itemCategory) {
      toast({ title: "Error", description: "Name, price, and category are required", variant: "destructive" });
      return;
    }
    try {
      if (editingItem) {
        await updateMenuItemMutation.mutateAsync({
          id: editingItem.id,
          data: { name: itemName, description: itemDesc, price: Number(itemPrice), categoryId: Number(itemCategory), imageUrl: itemImage }
        });
        toast({ title: "Success", description: "Item updated" });
      } else {
        await createMenuItemMutation.mutateAsync({
          data: { name: itemName, description: itemDesc, price: Number(itemPrice), categoryId: Number(itemCategory), imageUrl: itemImage, available: true, isBestSeller: false }
        });
        toast({ title: "Success", description: "Item created" });
      }
      queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey({}) });
      setIsItemDialogOpen(false);
    } catch (e) {
      toast({ title: "Error", description: "Failed to save item", variant: "destructive" });
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteMenuItemMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey({}) });
        toast({ title: "Success", description: "Item deleted" });
      } catch (e) {
        toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
      }
    }
  };

  const handleSaveCategory = async () => {
    if (!catName) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }
    try {
      if (editingCategory) {
        await updateCategoryMutation.mutateAsync({ id: editingCategory.id, data: { name: catName, sortOrder: Number(catSort) } });
        toast({ title: "Success", description: "Category updated" });
      } else {
        await createCategoryMutation.mutateAsync({ data: { name: catName, sortOrder: Number(catSort) } });
        toast({ title: "Success", description: "Category created" });
      }
      queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      setIsCategoryDialogOpen(false);
    } catch (e) {
      toast({ title: "Error", description: "Failed to save category", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategoryMutation.mutateAsync({ id });
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        toast({ title: "Success", description: "Category deleted" });
      } catch (e) {
        toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
      }
    }
  };

  const toggleAvailability = async (id: number, currentAvailable: boolean) => {
    try {
      await updateMenuItemMutation.mutateAsync({ id, data: { available: !currentAvailable } });
      queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey({}) });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    }
  };

  const toggleBestSeller = async (id: number, currentBestSeller: boolean) => {
    try {
      await updateMenuItemMutation.mutateAsync({ id, data: { isBestSeller: !currentBestSeller } });
      queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey({}) });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    }
  };

  if (isLoadingCats || isLoadingItems) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const filteredItems = menuItems?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <AdminLayout>
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage your categories and menu items</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => openCategoryDialog()}>
              <Plus className="w-4 h-4 mr-1" /> Category
            </Button>
            <Button size="sm" onClick={() => openItemDialog()}>
              <Plus className="w-4 h-4 mr-1" /> Add Item
            </Button>
          </div>
        </div>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="mb-4 md:mb-6">
            <TabsTrigger value="items">Menu Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="items">
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search items..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {filteredItems.map(item => (
                <Card key={item.id} className={!item.available ? "opacity-60" : ""}>
                  <CardContent className="p-3 md:p-4 flex gap-3">
                    {item.imageUrl ? (
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-md bg-muted shrink-0 overflow-hidden">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold truncate">{item.name}</h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge variant="secondary" className="font-normal text-xs">{item.categoryName}</Badge>
                            {item.isBestSeller && (
                              <Badge className="bg-primary text-primary-foreground font-normal text-xs px-1">
                                <Star className="w-3 h-3 mr-0.5 fill-current" /> Best
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="font-bold text-sm shrink-0">{formatRupiah(item.price)}</div>
                      </div>
                      
                      <div className="mt-3 flex items-center justify-between border-t pt-2">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={item.available} 
                              onCheckedChange={() => toggleAvailability(item.id, item.available)}
                            />
                            <span className="text-xs font-medium">{item.available ? 'Available' : 'Sold Out'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={item.isBestSeller} 
                              onCheckedChange={() => toggleBestSeller(item.id, item.isBestSeller)}
                            />
                            <span className="text-xs font-medium">Best Seller</span>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openItemDialog(item)} className="h-9 w-9 text-muted-foreground">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="h-9 w-9 text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredItems.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                  No items found matching your search.
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="categories">
            <div className="space-y-3">
              {categories?.map(cat => (
                <Card key={cat.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold">{cat.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Sort Order: {cat.sortOrder}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openCategoryDialog(cat)}>
                        <Edit className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden md:inline">Edit</span>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(cat.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden md:inline">Delete</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={itemName} onChange={e => setItemName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={itemCategory} onValueChange={setItemCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price (Rp)</Label>
              <Input type="number" value={itemPrice} onChange={e => setItemPrice(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Foto Menu</Label>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageFileChange}
              />
              {/* Image preview */}
              {itemImage ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={itemImage} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setItemImage("")}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="w-full h-40 rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground font-medium">Klik untuk pilih foto</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG, WebP — maks 5 MB</p>
                </div>
              )}
              {/* Upload button + URL fallback */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  disabled={imageUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {imageUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {imageUploading ? "Uploading..." : "Upload Foto"}
                </Button>
                <Input
                  value={itemImage}
                  onChange={e => setItemImage(e.target.value)}
                  placeholder="atau paste URL gambar..."
                  className="text-xs"
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSaveItem} disabled={createMenuItemMutation.isPending || updateMenuItemMutation.isPending} className="w-full sm:w-auto">
              {createMenuItemMutation.isPending || updateMenuItemMutation.isPending ? "Saving..." : "Save Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={catName} onChange={e => setCatName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={catSort} onChange={e => setCatSort(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)} className="w-full sm:w-auto">Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending} className="w-full sm:w-auto">
              {createCategoryMutation.isPending || updateCategoryMutation.isPending ? "Saving..." : "Save Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

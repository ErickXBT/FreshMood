import { useState } from "react";
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
import { Loader2, Plus, Search, Star, Edit, Trash2 } from "lucide-react";
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

  // Form states for item
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [itemImage, setItemImage] = useState("");

  // Form states for category
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
          data: {
            name: itemName,
            description: itemDesc,
            price: Number(itemPrice),
            categoryId: Number(itemCategory),
            imageUrl: itemImage
          }
        });
        toast({ title: "Success", description: "Item updated" });
      } else {
        await createMenuItemMutation.mutateAsync({
          data: {
            name: itemName,
            description: itemDesc,
            price: Number(itemPrice),
            categoryId: Number(itemCategory),
            imageUrl: itemImage,
            available: true,
            isBestSeller: false
          }
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
        await updateCategoryMutation.mutateAsync({
          id: editingCategory.id,
          data: { name: catName, sortOrder: Number(catSort) }
        });
        toast({ title: "Success", description: "Category updated" });
      } else {
        await createCategoryMutation.mutateAsync({
          data: { name: catName, sortOrder: Number(catSort) }
        });
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
      await updateMenuItemMutation.mutateAsync({
        id,
        data: { available: !currentAvailable }
      });
      queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey({}) });
      toast({ title: "Updated", description: "Item availability updated" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    }
  };

  const toggleBestSeller = async (id: number, currentBestSeller: boolean) => {
    try {
      await updateMenuItemMutation.mutateAsync({
        id,
        data: { isBestSeller: !currentBestSeller }
      });
      queryClient.invalidateQueries({ queryKey: getListMenuItemsQueryKey({}) });
      toast({ title: "Updated", description: "Best seller status updated" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    }
  };

  if (isLoadingCats || isLoadingItems) {
    return (
      <AdminLayout>
        <div className="flex h-full items-center justify-center">
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
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Menu Management</h1>
            <p className="text-muted-foreground mt-1">Manage your categories and menu items</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => openCategoryDialog()}><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
            <Button onClick={() => openItemDialog()}><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
          </div>
        </div>

        <Tabs defaultValue="items" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="items">Menu Items</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          
          <TabsContent value="items">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Search items..." 
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map(item => (
                <Card key={item.id} className={!item.available ? "opacity-60" : ""}>
                  <CardContent className="p-4 flex gap-4">
                    {item.imageUrl ? (
                      <div className="w-24 h-24 rounded-md object-cover bg-muted shrink-0 overflow-hidden">
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <span className="text-xs text-muted-foreground">No image</span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-lg truncate">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="font-normal text-xs">{item.categoryName}</Badge>
                            {item.isBestSeller && (
                              <Badge className="bg-primary text-primary-foreground font-normal text-xs px-1">
                                <Star className="w-3 h-3 mr-1 fill-current" /> Best Seller
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="font-bold">{formatRupiah(item.price)}</div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between border-t pt-3">
                        <div className="flex items-center gap-4">
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
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openItemDialog(item)} className="h-8 w-8 text-muted-foreground"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
            <div className="space-y-4">
              {categories?.map(cat => (
                <Card key={cat.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{cat.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">Sort Order: {cat.sortOrder}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openCategoryDialog(cat)}><Edit className="h-4 w-4 mr-2" /> Edit</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteCategory(cat.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Item" : "Add Menu Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
              <Textarea value={itemDesc} onChange={e => setItemDesc(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input value={itemImage} onChange={e => setItemImage(e.target.value)} placeholder="/images/espresso.png" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveItem} disabled={createMenuItemMutation.isPending || updateMenuItemMutation.isPending}>
              {createMenuItemMutation.isPending || updateMenuItemMutation.isPending ? "Saving..." : "Save Item"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={catName} onChange={e => setCatName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input type="number" value={catSort} onChange={e => setCatSort(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCategoryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory} disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
              {createCategoryMutation.isPending || updateCategoryMutation.isPending ? "Saving..." : "Save Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

import React from "react";
import { Plus, Search, Trash2, Check, HelpCircle, Package, User, ShoppingBag, ThumbsUp, Link, Globe, ShoppingCart } from "lucide-react";
import { SupplyItem } from "../types";

interface SupplyItemTableProps {
  items: SupplyItem[];
  currentUser: string;
  onAddItem: (item: { name: string; category: string; estimatedCost: number; actualCost: number; addedBy: string; storeUrl?: string }) => void;
  onUpdateItem: (item: SupplyItem) => void;
  onDeleteItem: (id: string) => void;
}

const CATEGORIES = [
  "Technology & Devices",
  "Apparel & Uniforms",
  "Core Supplies",
  "Fees & Subscriptions",
  "Other / Misc"
];

export const SupplyItemTable: React.FC<SupplyItemTableProps> = ({
  items,
  currentUser,
  onAddItem,
  onUpdateItem,
  onDeleteItem
}) => {
  const [search, setSearch] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  
  // New Item State Form
  const [newItemName, setNewItemName] = React.useState("");
  const [newItemCategory, setNewItemCategory] = React.useState("Core Supplies");
  const [newItemEstCost, setNewItemEstCost] = React.useState("");
  const [newItemActualCost, setNewItemActualCost] = React.useState("");
  const [newItemStoreUrl, setNewItemStoreUrl] = React.useState("");

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    onAddItem({
      name: newItemName.trim(),
      category: newItemCategory,
      estimatedCost: parseFloat(newItemEstCost) || 0,
      actualCost: parseFloat(newItemActualCost) || parseFloat(newItemEstCost) || 0,
      addedBy: currentUser || "Anonymous",
      storeUrl: newItemStoreUrl.trim()
    });

    // Reset Form
    setNewItemName("");
    setNewItemEstCost("");
    setNewItemActualCost("");
    setNewItemStoreUrl("");
  };

  const handleTogglePurchased = (item: SupplyItem) => {
    onUpdateItem({
      ...item,
      purchased: !item.purchased,
      actualCost: item.actualCost || item.estimatedCost // Fallback to estimated cost as base
    });
  };

  const handleToggleApproval = (item: SupplyItem) => {
    const list = item.approvals || [];
    let updated: string[];
    if (list.includes(currentUser)) {
      updated = list.filter((m) => m !== currentUser);
    } else {
      updated = [...list, currentUser];
    }
    onUpdateItem({
      ...item,
      approvals: updated
    });
  };

  const handleUpdatePrice = (item: SupplyItem, field: "estimatedCost" | "actualCost", val: string) => {
    const num = parseFloat(val) || 0;
    onUpdateItem({
      ...item,
      [field]: num
    });
  };

  // Filter logic
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div id="supply-items-section" className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-50 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-indigo-600" />
            Supply & Expenses Register
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Real-time collaborative items list</p>
        </div>
        
        {/* Filters and search box */}
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search supply..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-48 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:bg-white"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-400 focus:bg-white text-slate-700 font-medium"
          >
            <option value="All">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Inline Form to Add Item */}
      <form onSubmit={handleCreateItem} className="bg-indigo-50/40 p-4 rounded-xl mb-6 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4">
            <input
              id="add-item-name-input"
              type="text"
              required
              placeholder="Add supply name (e.g., Backpack, Sharpies)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500 text-slate-600"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Est. Cost ($)"
              value={newItemEstCost}
              onChange={(e) => setNewItemEstCost(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Actual Spent ($)"
              value={newItemActualCost}
              onChange={(e) => setNewItemActualCost(e.target.value)}
              className="w-full text-sm bg-white border border-slate-200 px-3 py-2 rounded-xl outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-1">
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 pt-1 border-t border-indigo-100/50">
          <span className="text-xs font-bold text-indigo-700 flex items-center gap-1.5 shrink-0">
            <Link className="h-3.5 w-3.5" /> Direct Store Link (Optional):
          </span>
          <input
            type="url"
            placeholder="Paste specific vendor link here (e.g. https://www.target.com/... or staples.com/...)"
            value={newItemStoreUrl}
            onChange={(e) => setNewItemStoreUrl(e.target.value)}
            className="w-full text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-xl outline-none focus:border-indigo-500 text-slate-700"
          />
        </div>
      </form>

      {/* Items List */}
      <div className="overflow-x-auto">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl">
            <Package className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">No school supplies listed in this view</p>
            <p className="text-slate-400 text-xs mt-1">Add items above or generate a checklist below using Gemini AI!</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-150 text-slate-400 text-xs font-semibold uppercase">
                <th className="pb-3 w-8">Bought</th>
                <th className="pb-3 px-3">Item Name & Category</th>
                <th className="pb-3 px-3">Approval Poll</th>
                <th className="pb-3 px-3">Creator</th>
                <th className="pb-3 px-3 text-right">Est. Cost</th>
                <th className="pb-3 px-3 text-right">Actual Cost</th>
                <th className="pb-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item) => (
                <tr key={item.id} className={`hover:bg-slate-50/50 transition-colors ${item.purchased ? "bg-emerald-50/10" : ""}`}>
                  <td className="py-4">
                    <button
                      type="button"
                      onClick={() => handleTogglePurchased(item)}
                      className={`h-5 w-5 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                        item.purchased
                          ? "bg-emerald-500 border-emerald-500 text-white"
                          : "border-slate-300 bg-white hover:border-indigo-500"
                      }`}
                    >
                      {item.purchased && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                    </button>
                  </td>
                  <td className="py-4 px-3 max-w-xs md:max-w-md">
                    <div className="flex flex-col space-y-2">
                      <div>
                        <span className={`text-sm font-semibold block leading-tight ${item.purchased ? "line-through text-slate-400" : "text-slate-800"}`}>
                          {item.name}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      
                      {/* Shopping & direct store redirection links */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Shop & compare:</span>
                        
                        {/* Custom save / edit button */}
                        {item.storeUrl ? (
                          <div className="flex items-center gap-1 bg-white">
                            <a
                              href={item.storeUrl.startsWith("http") ? item.storeUrl : `https://${item.storeUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1 hover:underline transition-colors leading-[14px]"
                              title="Go to saved custom link"
                            >
                              <Globe className="h-3 w-3 text-emerald-600" />
                              <span>Custom Link</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                const newUrl = prompt(`Enter store/product link for ${item.name}:`, item.storeUrl);
                                if (newUrl !== null) {
                                  onUpdateItem({ ...item, storeUrl: newUrl.trim() });
                                }
                              }}
                              className="text-[10px] text-slate-400 hover:text-slate-600 px-1 py-0.5 hover:bg-slate-100 rounded cursor-pointer border border-transparent hover:border-slate-200 bg-white"
                              title="Edit url link"
                            >
                              Edit
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const newUrl = prompt(`Enter product link for ${item.name}:`, "");
                              if (newUrl !== null) {
                                onUpdateItem({ ...item, storeUrl: newUrl.trim() });
                              }
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 bg-white hover:bg-indigo-50/50 px-1.5 py-0.5 rounded transition-all cursor-pointer leading-[14px]"
                            title="Add direct product URL"
                          >
                            + Custom Link
                          </button>
                        )}

                        {/* Automated marketplace query helpers */}
                        <a
                          href={`https://www.target.com/s?searchTerm=${encodeURIComponent(item.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] hover:underline bg-white border border-slate-200 hover:border-rose-200 hover:bg-rose-50/30 text-slate-600 hover:text-rose-700 font-medium px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors leading-[14px]"
                          title={`Look up "${item.name}" on Target`}
                        >
                          <span className="text-[11px]">🎯</span> Target
                        </a>

                        <a
                          href={`https://www.amazon.com/s?k=${encodeURIComponent(item.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] hover:underline bg-white border border-slate-200 hover:border-amber-200 hover:bg-amber-50/30 text-slate-600 hover:text-amber-700 font-medium px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors leading-[14px]"
                          title={`Look up "${item.name}" on Amazon`}
                        >
                          <span className="text-[11px]">📦</span> Amazon
                        </a>

                        <a
                          href={`https://www.staples.com/search?q=${encodeURIComponent(item.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] hover:underline bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50/30 text-slate-600 hover:text-red-700 font-medium px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors leading-[14px]"
                          title={`Look up "${item.name}" on Staples`}
                        >
                          <span className="text-[11px]">📎</span> Staples
                        </a>

                        <a
                          href={`https://www.walmart.com/search?q=${encodeURIComponent(item.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] hover:underline bg-white border border-slate-200 hover:border-blue-200 hover:bg-blue-50/30 text-slate-600 hover:text-blue-700 font-medium px-1.5 py-0.5 rounded flex items-center gap-1 transition-colors leading-[14px]"
                          title={`Look up "${item.name}" on Walmart`}
                        >
                          <span className="text-[11px]">🛒</span> Walmart
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <button
                        type="button"
                        onClick={() => handleToggleApproval(item)}
                        className={`p-1.5 rounded-lg flex items-center gap-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                          (item.approvals || []).includes(currentUser)
                            ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                            : "bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border-slate-200"
                        }`}
                        title={(item.approvals || []).length > 0 ? "Approved by: " + (item.approvals || []).join(", ") : "Vote/Approve design item"}
                      >
                        <ThumbsUp className="h-3.5 w-3.5" />
                        <span className="font-mono text-xs">{(item.approvals || []).length}</span>
                      </button>
                      
                      {(item.approvals || []).length > 0 && (
                        <div className="hidden sm:flex -space-x-1 overflow-hidden" title={(item.approvals || []).join(", ")}>
                          {(item.approvals || []).slice(0, 3).map((voter) => (
                            <span
                              key={voter}
                              className="inline-block h-4 w-4 rounded-full bg-slate-100 text-slate-600 border border-white text-[9px] font-bold text-center leading-[14px]"
                              title={voter}
                            >
                              {voter.charAt(0).toUpperCase()}
                            </span>
                          ))}
                          {(item.approvals || []).length > 3 && (
                            <span className="inline-block h-4 w-4 rounded-full bg-indigo-100 text-indigo-700 border border-white text-[8px] font-bold text-center leading-[14px]">
                              +{(item.approvals || []).length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-full w-fit font-medium">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>{item.addedBy}</span>
                    </div>
                  </td>
                  <td className="py-4 px-3 text-right text-sm">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.estimatedCost}
                        onChange={(e) => handleUpdatePrice(item, "estimatedCost", e.target.value)}
                        className="w-16 text-right text-sm font-mono bg-transparent border-b border-transparent focus:border-slate-200 outline-none text-slate-600 focus:bg-slate-50 rounded px-1"
                      />
                    </div>
                  </td>
                  <td className="py-4 px-3 text-right text-sm">
                    <div className="flex items-center justify-end gap-1">
                      <span className="text-xs text-slate-400 font-mono">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.actualCost ?? item.estimatedCost}
                        onChange={(e) => handleUpdatePrice(item, "actualCost", e.target.value)}
                        className="w-16 text-right text-sm font-mono bg-transparent border-b border-transparent focus:border-slate-200 outline-none text-slate-850 focus:bg-slate-50 rounded px-1 font-semibold"
                      />
                    </div>
                  </td>
                  <td className="py-4 pl-3 text-right">
                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Delete supply"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

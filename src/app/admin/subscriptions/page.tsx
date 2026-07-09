"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  CreditCard,
  ShieldCheck,
  ShieldAlert,
  Ban,
  DollarSign,
  Search,
  Eye,
  Calendar,
  Edit2,
  Trash2,
  RefreshCw,
  X,
  AlertTriangle,
  Settings
} from "lucide-react";

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalActive: 0, expiringSoon: 0, expired: 0, mrr: 0 });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProductFilter, setSelectedProductFilter] = useState("all");
  const [selectedPlanFilter, setSelectedPlanFilter] = useState("all");

  // Modal States
  const [activeModal, setActiveModal] = useState<"view" | "extend" | "edit" | "delete" | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  
  // Action Form States
  const [extendDays, setExtendDays] = useState<number>(30);
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [editPlanName, setEditPlanName] = useState<string>("Professional");
  const [editProductType, setEditProductType] = useState<string>("DentalOS");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/subscriptions");
      const data = await res.json();
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        setStats(data.stats || { totalActive: 0, expiringSoon: 0, expired: 0, mrr: 0 });
      } else {
        throw new Error(data.message || "Failed to load subscriptions");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading subscription list");
    } finally {
      setLoading(false);
    }
  }

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.slug.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesProduct = selectedProductFilter === "all" || sub.productType === selectedProductFilter;
    const matchesPlan = selectedPlanFilter === "all" || sub.subscriptionPlan.toLowerCase().includes(selectedPlanFilter.toLowerCase());

    return matchesSearch && matchesProduct && matchesPlan;
  });

  // Suspend/Activate subscription action
  async function handleToggleStatus(sub: any) {
    const newActiveState = !sub.isActive;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${sub._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: newActiveState,
          subscriptionStatus: newActiveState ? "active" : "suspended"
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(newActiveState ? "Subscription activated" : "Subscription suspended");
        fetchSubscriptions();
      } else {
        throw new Error(data.message || "Failed to update status");
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating subscription state");
    } finally {
      setActionLoading(false);
    }
  }

  // Extend subscription endDate
  async function handleExtendSubscription(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTenant) return;

    setActionLoading(true);
    try {
      let finalEndDate = new Date(selectedTenant.subscriptionEndDate);
      if (customEndDate) {
        finalEndDate = new Date(customEndDate);
      } else {
        finalEndDate.setDate(finalEndDate.getDate() + Number(extendDays));
      }

      const res = await fetch(`/api/admin/subscriptions/${selectedTenant._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionEndDate: finalEndDate.toISOString() }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Subscription extension successful");
        setActiveModal(null);
        fetchSubscriptions();
      } else {
        throw new Error(data.message || "Failed to extend subscription");
      }
    } catch (error: any) {
      toast.error(error.message || "Error extending subscription");
    } finally {
      setActionLoading(false);
    }
  }

  // Edit plan / product type
  async function handleEditPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedTenant) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${selectedTenant._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionPlan: editPlanName,
          productType: editProductType
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Subscription settings updated");
        setActiveModal(null);
        fetchSubscriptions();
      } else {
        throw new Error(data.message || "Failed to update plan settings");
      }
    } catch (error: any) {
      toast.error(error.message || "Error updating plan");
    } finally {
      setActionLoading(false);
    }
  }

  // Delete Tenant/Subscription
  async function handleDeleteSubscription() {
    if (!selectedTenant) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/subscriptions/${selectedTenant._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Tenant deleted successfully");
        setActiveModal(null);
        fetchSubscriptions();
      } else {
        throw new Error(data.message || "Failed to delete tenant");
      }
    } catch (error: any) {
      toast.error(error.message || "Error deleting tenant");
    } finally {
      setActionLoading(false);
    }
  }

  const openExtendModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setCustomEndDate("");
    setExtendDays(30);
    setActiveModal("extend");
  };

  const openEditModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setEditPlanName(tenant.subscriptionPlan);
    setEditProductType(tenant.productType);
    setActiveModal("edit");
  };

  const openDeleteModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setActiveModal("delete");
  };

  const openViewModal = (tenant: any) => {
    setSelectedTenant(tenant);
    setActiveModal("view");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#5f22e6]" />
            SaaS Subscription Management
          </h1>
          <p className="text-slate-500 text-xs font-semibold mt-1">
            Monitor, extend, edit, and suspend multi-product client tenant subscriptions.
          </p>
        </div>
        <button
          onClick={fetchSubscriptions}
          className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm text-slate-600 transition-all cursor-pointer focus:outline-none"
          title="Refresh List"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-slate-400" : ""}`} />
        </button>
      </div>

      {/* 4 Glassmorphism Statistic Cards (Part 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Cards */}
        <div className="bg-white/85 backdrop-blur-md border border-slate-100/50 shadow-xl rounded-2xl p-4 flex items-center space-x-4 hover:scale-[1.01] transition-transform duration-200">
          <div className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100/40">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Active Subscriptions</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">{loading ? "..." : stats.totalActive}</span>
          </div>
        </div>

        {/* Expiring Soon Card */}
        <div className="bg-white/85 backdrop-blur-md border border-slate-100/50 shadow-xl rounded-2xl p-4 flex items-center space-x-4 hover:scale-[1.01] transition-transform duration-200">
          <div className="h-10 w-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100/40">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Expiring soon (≤7d)</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">{loading ? "..." : stats.expiringSoon}</span>
          </div>
        </div>

        {/* Expired Card */}
        <div className="bg-white/85 backdrop-blur-md border border-slate-100/50 shadow-xl rounded-2xl p-4 flex items-center space-x-4 hover:scale-[1.01] transition-transform duration-200">
          <div className="h-10 w-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100/40">
            <Ban className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Expired Plans</span>
            <span className="text-xl font-black text-slate-800 mt-1 block">{loading ? "..." : stats.expired}</span>
          </div>
        </div>

        {/* MRR Card */}
        <div className="bg-white/85 backdrop-blur-md border border-slate-100/50 shadow-xl rounded-2xl p-4 flex items-center space-x-4 hover:scale-[1.01] transition-transform duration-200">
          <div className="h-10 w-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center border border-indigo-100/40">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Monthly Revenue (MRR)</span>
            <span className="text-xl font-black text-indigo-750 mt-1 block">${loading ? "..." : stats.mrr}</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-slate-100 shadow-md rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tenant name, owner, slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 focus:border-slate-800 text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-100 transition-all font-semibold text-slate-700"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <select
            value={selectedProductFilter}
            onChange={(e) => setSelectedProductFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none cursor-pointer"
          >
            <option value="all">All Products</option>
            <option value="DentalOS">DentalOS</option>
            <option value="SchoolOS">SchoolOS</option>
            <option value="CafeOS">CafeOS</option>
          </select>

          <select
            value={selectedPlanFilter}
            onChange={(e) => setSelectedPlanFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none cursor-pointer"
          >
            <option value="all">All Plans</option>
            <option value="Trial">Trial</option>
            <option value="Professional">Professional</option>
            <option value="Enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Main Tenant Subscriptions Table (Part 3) */}
      <div className="bg-white border border-slate-100 shadow-xl rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-650" />
            <p className="text-slate-400 text-xs font-semibold">Loading tenant subscriptions...</p>
          </div>
        ) : filteredSubscriptions.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <p className="text-slate-400 text-sm font-semibold">No subscriptions match your filters.</p>
            <p className="text-slate-400 text-xs font-medium">Try clearing search query or changing active plan filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-black text-slate-450 uppercase tracking-widest">
                  <th className="py-3.5 px-5">Tenant Name</th>
                  <th className="py-3.5 px-4">Owner</th>
                  <th className="py-3.5 px-4">Product</th>
                  <th className="py-3.5 px-4">Plan</th>
                  <th className="py-3.5 px-4">Subscription Period</th>
                  <th className="py-3.5 px-4 text-center">Remaining</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[11.5px] font-semibold text-slate-700">
                {filteredSubscriptions.map((sub) => {
                  let statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-100";
                  let statusLabel = "Active";

                  if (sub.subscriptionStatus === "suspended" || !sub.isActive) {
                    statusBadge = "bg-slate-100 text-slate-700 border-slate-200";
                    statusLabel = "Suspended";
                  } else if (sub.daysLeft <= 0) {
                    statusBadge = "bg-rose-50 text-rose-700 border-rose-100";
                    statusLabel = "Expired";
                  } else if (sub.daysLeft <= 7) {
                    statusBadge = "bg-amber-50 text-amber-700 border-amber-100";
                    statusLabel = "Expiring Soon";
                  }

                  return (
                    <tr key={sub._id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Name / Slug */}
                      <td className="py-4 px-5">
                        <div className="font-extrabold text-slate-900">{sub.name}</div>
                        <div className="text-[9.5px] text-slate-400 font-mono mt-0.5">{sub.slug}.dental.launchstack.in</div>
                      </td>
                      {/* Owner */}
                      <td className="py-4 px-4">
                        <div className="text-slate-850 font-bold">{sub.ownerName}</div>
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{sub.ownerEmail}</div>
                      </td>
                      {/* Product */}
                      <td className="py-4 px-4">
                        <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[9.5px] uppercase">
                          {sub.productType}
                        </span>
                      </td>
                      {/* Plan */}
                      <td className="py-4 px-4">
                        <span className="font-bold text-[#5f22e6] bg-indigo-50/50 border border-indigo-100/50 px-2.5 py-0.5 rounded-lg text-[9.5px] uppercase">
                          {sub.subscriptionPlan}
                        </span>
                      </td>
                      {/* Start / End */}
                      <td className="py-4 px-4 text-slate-500 font-medium leading-normal">
                        <div>S: {new Date(sub.subscriptionStartDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                        <div>E: {new Date(sub.subscriptionEndDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                      </td>
                      {/* Days Remaining */}
                      <td className="py-4 px-4 text-center font-bold text-slate-850">
                        {sub.daysLeft} Days
                      </td>
                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9.5px] font-black uppercase tracking-wider ${statusBadge}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {statusLabel}
                        </span>
                      </td>
                      {/* Actions */}
                      <td className="py-4 px-5 text-right space-x-1.5 shrink-0">
                        <button
                          onClick={() => openViewModal(sub)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition-colors cursor-pointer focus:outline-none"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openExtendModal(sub)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-650 transition-colors cursor-pointer focus:outline-none"
                          title="Extend Subscription"
                        >
                          <Calendar className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(sub)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-600 transition-colors cursor-pointer focus:outline-none"
                          title="Edit Plan"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(sub)}
                          disabled={actionLoading}
                          className={`p-1 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer focus:outline-none ${
                            sub.isActive
                              ? "text-slate-400 hover:text-rose-600"
                              : "text-rose-400 hover:text-emerald-600"
                          }`}
                          title={sub.isActive ? "Suspend Subscription" : "Activate Subscription"}
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(sub)}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-700 transition-colors cursor-pointer focus:outline-none"
                          title="Delete Subscription"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {activeModal === "view" && selectedTenant && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl relative font-sans space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
            <div>
              <h3 className="text-[13px] font-black text-slate-850 uppercase tracking-widest">Tenant Details</h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Tenant ID: {selectedTenant._id}</p>
            </div>
            
            <div className="divide-y divide-slate-50 space-y-2 text-[11px] font-semibold">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Clinic Name</span>
                <span className="text-slate-800 font-bold">{selectedTenant.name}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Slug / Subdomain</span>
                <span className="text-slate-800 font-mono">{selectedTenant.slug}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Email Address</span>
                <span className="text-slate-800">{selectedTenant.email}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Owner Name</span>
                <span className="text-slate-800 font-bold">{selectedTenant.ownerName}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Owner Email</span>
                <span className="text-slate-800">{selectedTenant.ownerEmail}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Product Line</span>
                <span className="text-slate-800 font-bold uppercase">{selectedTenant.productType}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Subscription Plan</span>
                <span className="text-slate-800 font-bold uppercase">{selectedTenant.subscriptionPlan}</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Remaining Period</span>
                <span className="text-slate-800 font-bold">{selectedTenant.daysLeft} Days</span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-400">Status</span>
                <span className="text-slate-800 capitalize font-bold">{selectedTenant.subscriptionStatus}</span>
              </div>
            </div>
            
            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer border-0"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* EXTEND SUBSCRIPTION MODAL */}
      {activeModal === "extend" && selectedTenant && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleExtendSubscription}
            className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl relative font-sans space-y-5 animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div>
              <h3 className="text-[13px] font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#5f22e6]" />
                Extend Subscription
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Tenant: {selectedTenant.name}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Choose Extension Period
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 90, 365].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => {
                        setExtendDays(days);
                        setCustomEndDate("");
                      }}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                        extendDays === days && !customEndDate
                          ? "bg-indigo-50 border-indigo-300 text-[#5f22e6]"
                          : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
                      }`}
                    >
                      +{days} Days
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Or Set Specific Custom End Date
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setExtendDays(0);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-800 transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer border-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2 bg-[#5f22e6] hover:bg-[#4b18c0] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center border-0"
              >
                {actionLoading ? "Processing..." : "Confirm Extension"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {activeModal === "edit" && selectedTenant && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleEditPlan}
            className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl relative font-sans space-y-5 animate-in fade-in zoom-in-95 duration-200"
          >
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div>
              <h3 className="text-[13px] font-black text-slate-850 uppercase tracking-widest flex items-center gap-1.5">
                <Settings className="h-4 w-4 text-[#5f22e6]" />
                Modify Subscription Settings
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">Tenant: {selectedTenant.name}</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Select Subscription Plan
                </label>
                <select
                  value={editPlanName}
                  onChange={(e) => setEditPlanName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-800 transition-colors"
                >
                  <option value="Trial">Trial</option>
                  <option value="Professional">Professional</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  Product Type Mapping
                </label>
                <select
                  value={editProductType}
                  onChange={(e) => setEditProductType(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-slate-800 transition-colors"
                >
                  <option value="DentalOS">DentalOS</option>
                  <option value="SchoolOS">SchoolOS</option>
                  <option value="CafeOS">CafeOS</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer border-0"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 py-2 bg-[#5f22e6] hover:bg-[#4b18c0] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center border-0"
              >
                {actionLoading ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* DELETE WARNING MODAL */}
      {activeModal === "delete" && selectedTenant && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl relative font-sans space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveModal(null)}
              className="absolute right-4 top-4 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center h-12 w-12 bg-rose-50 text-rose-600 rounded-full border border-rose-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-850 uppercase tracking-wide">
                  Permanently Delete Tenant?
                </h3>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">Tenant: {selectedTenant.name}</p>
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-100/40 rounded-xl p-3.5 text-[11.5px] leading-relaxed text-rose-800 font-medium">
              <strong>Warning:</strong> This action will permanently remove the tenant record, all linked clinical data (appointments, patients, records), and associated user owner accounts. <strong>This action cannot be undone.</strong>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer border-0"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSubscription}
                disabled={actionLoading}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center border-0"
              >
                {actionLoading ? "Deleting..." : "Delete Tenant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

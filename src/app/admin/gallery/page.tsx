"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Check,
  Star,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function GalleryManagerPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [alt, setAlt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("Clinic & Operatory");
  const [isFeatured, setIsFeatured] = useState(true);

  useEffect(() => {
    fetchGallery();
  }, []);

  async function fetchGallery() {
    try {
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load gallery items");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddPhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) {
      toast.error("Title and Image URL are required");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          alt: alt.trim() || title.trim(),
          imageUrl: imageUrl.trim(),
          category,
          isFeatured,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Photograph added to gallery!");
        setTitle("");
        setAlt("");
        setImageUrl("");
        fetchGallery();
      } else {
        throw new Error(data.message || "Failed to add photo");
      }
    } catch (err: any) {
      toast.error(err.message || "Error adding photo");
    } finally {
      setCreating(false);
    }
  }

  async function toggleFeatured(id: string, current: boolean) {
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !current }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Homepage feature ${!current ? "enabled" : "disabled"}`);
        setItems(items.map((i) => (i._id === id ? { ...i, isFeatured: !current } : i)));
      }
    } catch (err) {
      toast.error("Failed to update feature status");
    }
  }

  async function handleDelete(id: string, itemTitle: string) {
    if (!confirm(`Are you sure you want to delete "${itemTitle}"?`)) return;

    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Photo deleted successfully");
        setItems(items.filter((i) => i._id !== id));
      } else {
        throw new Error(data.message || "Failed to delete");
      }
    } catch (err: any) {
      toast.error(err.message || "Error deleting photo");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#102C46] text-white p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#16A6A1] bg-white/10 px-3 py-1 rounded-full">
            Visual Assets
          </span>
          <h1 className="text-xl font-black mt-2 tracking-tight">
            Clinic Gallery & Photography Manager
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Upload genuine clinic photographs, operatory images, and sterilization facilities.
          </p>
        </div>

        <a
          href="/gallery"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-white/15 transition"
        >
          <span>View Public Gallery</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form: Add New Photo */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleAddPhoto}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4"
          >
            <h3 className="text-base font-bold text-[#102C46] flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus className="w-4 h-4 text-[#16A6A1]" />
              <span>Add Clinic Photograph</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Photo Caption / Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Ergonomic Patient Dental Chair"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Image Web URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... image URL"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Direct URL to photo (e.g., Unsplash, Cloudinary, or uploaded asset).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Alt Text (for SEO & Accessibility)
              </label>
              <input
                type="text"
                value={alt}
                onChange={(e) => setAlt(e.target.value)}
                placeholder="Descriptive text for visually impaired and search engines"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#102C46] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#16A6A1]"
              >
                <option value="Clinic & Operatory">Clinic & Operatory</option>
                <option value="Sterilization & Safety">Sterilization & Safety</option>
                <option value="Dental Procedures">Dental Procedures</option>
                <option value="Patient Smiles">Patient Smiles</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFeaturedCheck"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded text-[#16A6A1] focus:ring-[#16A6A1] h-4 w-4"
              />
              <label htmlFor="isFeaturedCheck" className="text-xs font-bold text-[#102C46] cursor-pointer">
                Feature in Homepage Gallery Preview
              </label>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#16A6A1] hover:bg-[#128884] text-white text-xs font-bold py-3 rounded-xl shadow-xs transition disabled:opacity-60"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Photograph...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add to Clinic Gallery</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Gallery Grid */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-[#102C46]">
                Published Photos ({items.length})
              </h3>
              <span className="text-xs text-slate-400">
                Sorted by newest
              </span>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#16A6A1] mx-auto mb-2" />
                <p className="text-xs text-slate-400">Loading gallery...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No photographs added yet. Use the form on the left to add your first clinic photo.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="rounded-2xl border border-slate-200 overflow-hidden bg-[#F8FAFC] flex flex-col justify-between"
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                      <img
                        src={item.imageUrl}
                        alt={item.alt}
                        className="w-full h-full object-cover"
                      />
                      {item.isFeatured && (
                        <span className="absolute top-2 left-2 bg-[#102C46]/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-xs">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>Homepage</span>
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 space-y-2">
                      <div>
                        <span className="text-[10px] font-bold text-[#16A6A1] uppercase tracking-wider">
                          {item.category}
                        </span>
                        <p className="text-xs font-bold text-[#102C46] line-clamp-1 mt-0.5">
                          {item.title}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
                        <button
                          type="button"
                          onClick={() => toggleFeatured(item._id, item.isFeatured)}
                          className={`text-[11px] font-semibold px-2 py-1 rounded transition ${
                            item.isFeatured
                              ? "text-amber-700 bg-amber-50 hover:bg-amber-100"
                              : "text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          {item.isFeatured ? "★ Featured" : "☆ Make Featured"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item._id, item.title)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded transition"
                          title="Delete photo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


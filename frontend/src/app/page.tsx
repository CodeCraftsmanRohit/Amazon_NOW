"use client";

import { useState, useRef, useCallback } from "react";
import {
  Search, ShoppingCart, MapPin, Sparkles, Zap, X,
  ArrowLeft, Mic, Camera, Users, IndianRupee,
  SlidersHorizontal, Star, Truck, CheckCircle, Clock,
  Menu, RefreshCw, Wand2, Plus, Minus, ChevronRight,
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════
const toINR   = (usd: number) => Math.round(usd * 83.5);
const fmtINR  = (usd: number) => `₹${toINR(usd).toLocaleString("en-IN")}`;
const fmtINRv = (inr: number) => `₹${Math.round(inr).toLocaleString("en-IN")}`;

// ═══════════════════════════════════════════════════════════════════
// CURATED PRODUCT IMAGES (Unsplash)
// ═══════════════════════════════════════════════════════════════════
const PRODUCT_IMAGES: Record<string, string> = {
  P001: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=300&h=300&fit=crop",
  P002: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=300&fit=crop",
  P003: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300&h=300&fit=crop",
  P004: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&h=300&fit=crop",
  P005: "https://images.unsplash.com/photo-1595981234058-a9302fb97229?w=300&h=300&fit=crop",
  P006: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&h=300&fit=crop",
  P007: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=300&h=300&fit=crop",
  P008: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
  P009: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop",
  P010: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=300&h=300&fit=crop",
  P011: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop",
  P012: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&h=300&fit=crop",
  P013: "https://images.unsplash.com/photo-1629203851122-3726555cf5a2?w=300&h=300&fit=crop",
  P014: "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=300&h=300&fit=crop",
  P015: "https://images.unsplash.com/photo-1536816579748-4ecb3f03d72a?w=300&h=300&fit=crop",
  P016: "https://images.unsplash.com/photo-1551183053-bf91798d10bf?w=300&h=300&fit=crop",
  P017: "https://images.unsplash.com/photo-1608039829572-76b5b6f2f88c?w=300&h=300&fit=crop",
  P018: "https://images.unsplash.com/photo-1608039829572-76b5b6f2f88c?w=300&h=300&fit=crop",
  P019: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300&h=300&fit=crop",
  P020: "https://images.unsplash.com/photo-1549931319-a545dcf3bc7f?w=300&h=300&fit=crop",
  P021: "https://images.unsplash.com/photo-1542345812-d98b5cd6cf98?w=300&h=300&fit=crop",
  P022: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300&h=300&fit=crop",
  P023: "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=300&h=300&fit=crop",
  P024: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=300&fit=crop",
  P025: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&h=300&fit=crop",
  P026: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop",
  P027: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop",
  P028: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop",
  P029: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop",
  P030: "https://images.unsplash.com/photo-1622542086073-5af5f53e9517?w=300&h=300&fit=crop",
  P031: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=300&h=300&fit=crop",
  P032: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop",
  P033: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop",
  P034: "https://images.unsplash.com/photo-1549931319-a545dcf3bc7f?w=300&h=300&fit=crop",
  P035: "https://images.unsplash.com/photo-1583531172565-1318d9e0e7fb?w=300&h=300&fit=crop",
  P036: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=300&h=300&fit=crop",
  P037: "https://images.unsplash.com/photo-1621506289937-a8e7ac0dfd3a?w=300&h=300&fit=crop",
  P038: "https://images.unsplash.com/photo-1599398815647-6f4f48be39ac?w=300&h=300&fit=crop",
  P039: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=300&h=300&fit=crop",
  P040: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop",
  P041: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop",
  P042: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop",
  P043: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop",
  P044: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=300&fit=crop",
  P045: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop",
  P046: "https://images.unsplash.com/photo-1614087698640-27cbf92c4749?w=300&h=300&fit=crop",
  P047: "https://images.unsplash.com/photo-1597393353415-b3730f3719fe?w=300&h=300&fit=crop",
  P048: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop",
  P049: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop",
  P050: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=300&h=300&fit=crop",
};

function getImg(id: string): string {
  return PRODUCT_IMAGES[id] || `https://source.unsplash.com/300x300/?grocery,food&sig=${id}`;
}

// ═══════════════════════════════════════════════════════════════════
// STATIC DATA
// ═══════════════════════════════════════════════════════════════════
const FEATURED = [
  { id: "P010", name: "Movie Theater Butter Popcorn 6-Pack",  price: 4.49, category: "snacks",     rating: 4.5, reviews: 2847 },
  { id: "P009", name: "Organic Valley Whole Milk (1 Gallon)", price: 4.49, category: "dairy",      rating: 4.7, reviews: 3412, ss: true, disc: 25 },
  { id: "P014", name: "Ferrero Rocher Chocolate Box (24pc)",  price: 12.99, category: "candy",     rating: 4.9, reviews: 8921 },
  { id: "P033", name: "Starbucks Pike Place Ground Coffee",   price: 9.99, category: "beverages",  rating: 4.7, reviews: 6234 },
  { id: "P040", name: "Chobani Greek Yogurt Variety Pack",    price: 9.59, category: "dairy",      rating: 4.6, reviews: 5621, ss: true, disc: 20 },
  { id: "P024", name: "DiGiorno Pepperoni Pizza (28oz)",      price: 5.59, category: "frozen",     rating: 4.4, reviews: 3120, ss: true, disc: 20 },
  { id: "P048", name: "Ben & Jerry's Chunky Monkey Ice Cream", price: 5.09, category: "frozen",    rating: 4.8, reviews: 4521, ss: true, disc: 15 },
  { id: "P026", name: "Advil Ibuprofen 200mg (50ct)",         price: 8.99, category: "medicine",   rating: 4.8, reviews: 12340 },
];

const SMART_SAVERS = [
  { id: "P003", name: "Kerrygold Unsalted Butter (8oz)",  price: 3.19, orig: 3.99, disc: 20, category: "dairy" },
  { id: "P004", name: "Vital Farms Eggs (12ct)",          price: 4.67, orig: 5.49, disc: 15, category: "dairy" },
  { id: "P034", name: "Nature's Own Wheat Bread (20oz)",  price: 2.62, orig: 3.49, disc: 25, category: "bread" },
  { id: "P020", name: "DeLallo Garlic Bread Loaf (16oz)", price: 2.79, orig: 3.99, disc: 30, category: "bread" },
];

const CATEGORIES = [
  { name: "Vegetables",  emoji: "🥦", bg: "#e8f5e9" },
  { name: "Fruits",      emoji: "🍎", bg: "#fce4ec" },
  { name: "Dairy & Eggs", emoji: "🥛", bg: "#e3f2fd" },
  { name: "Snacks",      emoji: "🍿", bg: "#fff9c4" },
  { name: "Beverages",   emoji: "🥤", bg: "#e8eaf6" },
  { name: "Staples",     emoji: "🌾", bg: "#fff3e0" },
  { name: "Medicine",    emoji: "💊", bg: "#fce4ec" },
  { name: "Baby Care",   emoji: "👶", bg: "#f3e5f5" },
];

const SCENARIOS = [
  { emoji: "🎂", label: "Bake a chocolate cake",     query: "I need to bake a chocolate cake right now" },
  { emoji: "🍿", label: "Movie night for 4",          query: "Hosting a movie night for 4 people" },
  { emoji: "🤒", label: "I have a fever",             query: "I have a fever and need medicine and comfort items" },
  { emoji: "🍝", label: "Last-minute Italian dinner", query: "I'm hosting an Italian dinner for 6 people tonight" },
  { emoji: "🎉", label: "Party for 10",               query: "Hosting a party for 10 people, need snacks and drinks" },
  { emoji: "👶", label: "New parent essentials",      query: "I'm a new parent and need baby essentials" },
  { emoji: "☕", label: "Morning breakfast",           query: "I need a quick breakfast, coffee and essentials" },
  { emoji: "🥤", label: "BBQ weekend",               query: "Planning a backyard BBQ this weekend for 8 people" },
];

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
interface CartItem {
  id: string; name: string; price: number; quantity: number;
  image_url: string; reasoning?: string;
  original_price?: number; savings?: number; is_smart_saver?: boolean;
}
interface SmartCartResponse {
  intent: string; context: Record<string, string>;
  items: CartItem[]; explainability: string[];
  total_cost?: number; total_savings?: number;
}
type LocalCart = Record<string, number>;
type PageMode  = "home" | "ai" | "results";

// ═══════════════════════════════════════════════════════════════════
// REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#CC0C39] text-white px-6 py-3 rounded shadow-xl flex items-center gap-3 font-bold animate-bounce-in">
      ⚠️ <span>{msg}</span>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
}

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} className={i <= Math.round(rating) ? "fill-[#FF9900] text-[#FF9900]" : "fill-gray-200 text-gray-200"} />
      ))}
      <span className="text-[11px] text-[#007185] ml-1">{reviews.toLocaleString("en-IN")}</span>
    </div>
  );
}

function AmazonNavbar({
  mode, cartCount, onLogoClick, onCartClick,
}: {
  mode: PageMode; cartCount: number;
  onLogoClick: () => void; onCartClick: () => void;
}) {
  return (
    <header className="w-full bg-[#131921] text-white sticky top-0 z-40 shadow-md">
      <div className="flex items-center justify-between px-4 py-2 gap-4">
        {/* Logo */}
        <button onClick={onLogoClick} className="flex items-center hover:border-white border border-transparent p-1 rounded shrink-0">
          <span className="font-bold text-xl tracking-tighter">amazon</span>
          <span className="text-[#FF9900] font-bold text-xl">.in</span>
          <span className="bg-[#FF9900] text-[#131921] text-[9px] font-black px-1 py-0.5 rounded ml-1">NOW AI</span>
        </button>
        {/* Deliver */}
        <div className="hidden md:flex items-center hover:border-white border border-transparent p-1 rounded cursor-pointer shrink-0">
          <MapPin size={16} className="mr-1 text-gray-300" />
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-300 leading-3">Deliver to</span>
            <span className="text-sm font-bold leading-4">Your Location</span>
          </div>
        </div>
        {/* Search placeholder */}
        <div className="flex-1 max-w-3xl">
          <div className="flex h-10 rounded-md overflow-hidden">
            <div className="bg-[#f3f3f3] flex-1 flex items-center px-4 text-gray-400 text-sm cursor-text">
              Search amazon.in
            </div>
            <div className="bg-[#FEBD69] px-4 flex items-center">
              <Search size={20} className="text-gray-800" />
            </div>
          </div>
        </div>
        {/* Account */}
        <div className="hidden md:flex flex-col hover:border-white border border-transparent p-1 rounded cursor-pointer shrink-0 text-right">
          <span className="text-[10px] text-gray-300 leading-3">Hello, Customer</span>
          <span className="text-sm font-bold leading-4">Account &amp; Lists</span>
        </div>
        {/* Returns */}
        <div className="hidden md:flex flex-col hover:border-white border border-transparent p-1 rounded cursor-pointer shrink-0 text-right">
          <span className="text-[10px] text-gray-300 leading-3">Returns</span>
          <span className="text-sm font-bold leading-4">&amp; Orders</span>
        </div>
        {/* Cart */}
        <button onClick={onCartClick}
          className="flex items-center hover:border-white border border-transparent p-1 rounded shrink-0 relative">
          <div className="relative">
            <ShoppingCart size={30} />
            {cartCount > 0 && (
              <span className="absolute -top-1 left-3 text-[#FF9900] font-bold text-[15px] leading-4">{cartCount}</span>
            )}
          </div>
          <span className="text-sm font-bold hidden md:block ml-1 mt-3">Cart</span>
        </button>
      </div>
      {/* Nav strip */}
      <div className="bg-[#232F3E] px-4 py-1.5 flex items-center gap-5 text-sm font-medium overflow-x-auto">
        <div className="flex items-center gap-1 cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap">
          <Menu size={16} /> All
        </div>
        {["Today's Deals","Prime","Customer Service","Electronics","Fashion","Grocery","Health"].map(n => (
          <span key={n} className="cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap text-xs">{n}</span>
        ))}
        <span className="ml-auto flex items-center gap-1 text-[#FF9900] font-bold whitespace-nowrap text-xs">
          <Zap size={12} /> 10-Min Delivery
        </span>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════
// HOME VIEW — Amazon.in style
// ═══════════════════════════════════════════════════════════════════
function HomeView({ onAIClick }: { onAIClick: () => void }) {
  return (
    <div className="bg-[#EAEDED] min-h-screen pb-16">

      {/* ── Hero Banners ── */}
      <div className="relative w-full overflow-hidden">
        <div className="grid grid-cols-2 gap-0 w-full h-[220px] md:h-[280px]">
          <div className="relative flex flex-col justify-center px-8 py-6 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #FF9900 0%, #e47911 100%)" }}>
            <div className="absolute right-0 top-0 w-40 h-full opacity-10"
              style={{ backgroundImage: "radial-gradient(circle, white 2px, transparent 2px)", backgroundSize: "20px 20px" }} />
            <div className="text-[#131921] font-black text-2xl leading-tight mb-2">Snack Store 🍿</div>
            <div className="text-[#131921]/80 text-sm mb-4">Up to 40% off on your favourite munchies</div>
            <div className="bg-[#131921] text-white text-xs px-4 py-1.5 rounded-full w-fit font-bold">Shop now →</div>
          </div>
          <div className="relative flex flex-col justify-center px-8 py-6 overflow-hidden"
            style={{ background: "linear-gradient(135deg, #007185 0%, #005a6d 100%)" }}>
            <div className="absolute right-0 top-0 w-40 h-full opacity-10"
              style={{ backgroundImage: "radial-gradient(circle, white 2px, transparent 2px)", backgroundSize: "20px 20px" }} />
            <div className="text-white font-black text-2xl leading-tight mb-2">Fresh Dairy 🥛</div>
            <div className="text-white/80 text-sm mb-4">Farm to your door in 10 minutes</div>
            <div className="bg-white text-[#007185] text-xs px-4 py-1.5 rounded-full w-fit font-bold">Shop now →</div>
          </div>
        </div>
      </div>

      {/* ── Shop by Category ── */}
      <div className="bg-white mx-0 mt-0 px-6 py-6 border-b border-gray-100">
        <h2 className="text-lg font-bold text-[#0F1111] mb-4">Shop by Category</h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {CATEGORIES.map(cat => (
            <div key={cat.name} className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0 group">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl border-2 border-gray-100 group-hover:border-[#FF9900] transition-colors"
                style={{ backgroundColor: cat.bg }}>
                {cat.emoji}
              </div>
              <span className="text-[11px] text-[#0F1111] font-medium text-center w-16 leading-tight">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* ★ THE SPECIAL AI BUTTON — Full-width, impossible to miss ★ */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden relative cursor-pointer group" onClick={onAIClick}
        style={{ background: "linear-gradient(135deg, #131921 0%, #1a2a3a 50%, #131921 100%)" }}>
        {/* Animated glow border */}
        <div className="absolute inset-0 rounded-2xl"
          style={{ background: "linear-gradient(135deg, #FF9900, #007185, #FF9900)", padding: "2px" }}>
          <div className="w-full h-full rounded-2xl"
            style={{ background: "linear-gradient(135deg, #131921 0%, #1a2a3a 50%, #131921 100%)" }} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 px-8 py-7">
          {/* Left: Text */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-[#FF9900]/20 border border-[#FF9900]/40 rounded-full px-3 py-1 text-[#FF9900] text-xs font-bold mb-3">
              <Sparkles size={12} /> Powered by LangGraph · GPT-4o · 7 Parallel AI Agents
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2 leading-tight">
              Meet <span className="text-[#FF9900]">Amazon Now AI</span>
            </h2>
            <p className="text-gray-400 text-sm md:text-base max-w-lg">
              Don't search for products. Just tell us <em className="text-gray-200">what you're doing</em>.
              "I have a fever" → perfect cart in 10 seconds.
            </p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
              {["🏷️ Smart Saver deals", "💰 Budget-aware", "👥 Scales by headcount", "📸 Vision AI"].map(f => (
                <span key={f} className="bg-white/10 text-gray-300 text-[11px] px-2.5 py-1 rounded-full border border-white/20">{f}</span>
              ))}
            </div>
          </div>
          {/* Right: CTA Button */}
          <div className="flex-shrink-0">
            <button
              id="ai-trigger-btn"
              className="flex items-center gap-3 px-8 py-4 rounded-full font-extrabold text-lg transition-all duration-200 shadow-2xl group-hover:scale-105 group-hover:shadow-[0_0_40px_rgba(255,153,0,0.4)]"
              style={{ background: "linear-gradient(135deg, #FF9900 0%, #e47911 100%)", color: "#131921" }}
            >
              <Wand2 size={22} />
              Try AI Shopping
            </button>
            <p className="text-gray-500 text-xs text-center mt-2">No browsing needed. Just tell us.</p>
          </div>
        </div>
      </div>

      {/* ── Top Picks For You (with real images) ── */}
      <div className="bg-white mx-0 mt-4 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0F1111]">Top Picks For You</h2>
          <span className="text-sm text-[#007185] hover:underline cursor-pointer">See all offers</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {FEATURED.map(p => (
            <div key={p.id} className="group cursor-pointer border border-gray-100 hover:shadow-md hover:border-gray-200 rounded-lg overflow-hidden transition-all">
              <div className="relative">
                <img src={getImg(p.id)} alt={p.name}
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${p.id}/300/300`; }}
                />
                {(p as any).ss && (
                  <span className="absolute top-2 left-2 bg-[#FF9900] text-[#131921] text-[9px] font-black px-1.5 py-0.5 rounded-full">
                    🏷️ {(p as any).disc}% OFF
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-[12px] font-medium text-[#0F1111] line-clamp-2 leading-tight">{p.name}</p>
                <StarRating rating={p.rating} reviews={p.reviews} />
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-base font-bold text-[#B12704]">{fmtINR(p.price)}</span>
                  {(p as any).ss && (
                    <span className="text-xs text-gray-400 line-through">{fmtINR((p as any).orig || p.price * 1.2)}</span>
                  )}
                </div>
                <div className="text-[10px] text-[#007600] mt-0.5">In Stock · FREE Delivery</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Smart Saver Deals ── */}
      <div className="bg-white mx-0 mt-4 px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[#0F1111]">🏷️ Smart Saver Deals</h2>
            <p className="text-xs text-gray-500">Near-expiry items — great quality, unbeatable price</p>
          </div>
          <span className="bg-[#CC0C39] text-white text-[10px] font-bold px-2 py-1 rounded">LIMITED TIME</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {SMART_SAVERS.map(p => (
            <div key={p.id} className="group cursor-pointer border-2 border-[#FF9900]/30 hover:border-[#FF9900] rounded-lg overflow-hidden transition-all hover:shadow-md">
              <div className="relative">
                <img src={getImg(p.id)} alt={p.name}
                  className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${p.id}/300/300`; }}
                />
                <div className="absolute top-0 right-0 bg-[#CC0C39] text-white text-xs font-black px-2 py-1 rounded-bl">
                  -{p.disc}%
                </div>
              </div>
              <div className="p-3">
                <p className="text-[12px] font-medium text-[#0F1111] line-clamp-2 leading-tight">{p.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-base font-bold text-[#B12704]">{fmtINR(p.price)}</span>
                  <span className="text-xs text-gray-400 line-through">{fmtINR(p.orig)}</span>
                </div>
                <div className="text-[10px] text-[#007600] mt-0.5 font-bold">Save {fmtINR(p.orig - p.price)}</div>
                <button className="mt-2 w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] text-xs py-1.5 rounded font-bold transition-colors">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI CTA repeat (bottom) ── */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-[#131921] to-[#1a2a3a] rounded-xl p-6 flex items-center justify-between">
        <div>
          <div className="text-white font-bold text-lg">Didn't find what you need?</div>
          <div className="text-gray-400 text-sm mt-1">Let our AI build the perfect cart in seconds</div>
        </div>
        <button onClick={onAIClick}
          className="flex items-center gap-2 bg-[#FF9900] hover:bg-[#e47911] text-[#131921] font-bold px-6 py-3 rounded-full transition-colors shadow-lg">
          <Sparkles size={16} /> Ask AI
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AI INPUT VIEW — Centered prompt interface
// ═══════════════════════════════════════════════════════════════════
function AIInputView({
  onSubmit, onBack,
}: {
  onSubmit: (q: string, b?: number, p?: number) => void;
  onBack: () => void;
}) {
  const [query,       setQuery]       = useState("");
  const [budget,      setBudget]      = useState("");
  const [people,      setPeople]      = useState("1");
  const [showPrefs,   setShowPrefs]   = useState(false);
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submit = (q: string) => {
    if (!q.trim()) return;
    const b = budget.trim() ? parseFloat(budget) : undefined;
    const p = Math.max(1, parseInt(people) || 1);
    onSubmit(q, b, p);
  };

  const handleVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.onstart  = () => { setIsListening(true); setQuery(""); };
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setQuery(t); setIsListening(false); submit(t); };
    rec.onerror  = () => setIsListening(false);
    rec.onend    = () => setIsListening(false);
    rec.start();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#131921] via-[#1a2a3a] to-[#131921] flex flex-col">
      {/* Back bar */}
      <div className="px-6 pt-6">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Amazon
        </button>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="inline-flex items-center gap-2 bg-[#FF9900]/20 border border-[#FF9900]/40 rounded-full px-4 py-1.5 text-[#FF9900] text-sm font-bold mb-6">
          <Sparkles size={14} /> Need-Centric Shopping · 7-Agent AI Pipeline
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold text-white text-center mb-4 leading-tight">
          What do you<br /><span className="text-[#FF9900]">need right now?</span>
        </h1>
        <p className="text-gray-400 text-center text-lg mb-10 max-w-xl">
          Don't browse. Don't search. Just describe your situation — our AI builds the perfect cart instantly.
        </p>

        {/* ── BIG PROMPT INPUT ── */}
        <div className="w-full max-w-2xl">
          <div className="relative">
            <textarea
              id="ai-prompt-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(query); } }}
              placeholder={isListening ? "🎤 Listening..." : "e.g. I'm hosting a birthday party for 10 kids tonight..."}
              rows={3}
              className="w-full bg-white/10 backdrop-blur border-2 border-white/20 focus:border-[#FF9900] rounded-2xl px-6 py-5 text-white text-lg placeholder-gray-500 resize-none focus:outline-none transition-colors"
            />
            {/* Voice + Camera icons inside textarea */}
            <div className="absolute right-4 bottom-4 flex gap-2">
              <button onClick={handleVoice}
                className={`p-2 rounded-full transition-colors ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"}`}>
                <Mic size={20} />
              </button>
              <button onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-colors">
                <Camera size={20} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*"
                onChange={() => {}} />
            </div>
          </div>

          {/* Preferences toggle */}
          <button onClick={() => setShowPrefs(p => !p)}
            className="flex items-center gap-2 text-gray-400 hover:text-[#FF9900] text-sm mt-3 transition-colors mx-auto">
            <SlidersHorizontal size={14} />
            {showPrefs ? "Hide" : "Add"} budget &amp; headcount preferences
          </button>

          {showPrefs && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 mt-3 grid grid-cols-2 gap-4 animate-fadein">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
                  <IndianRupee size={12} /> Budget (optional)
                </label>
                <div className="flex items-center bg-white/10 border border-white/20 rounded-lg overflow-hidden">
                  <span className="px-3 text-gray-400 text-sm border-r border-white/20">₹</span>
                  <input type="number" placeholder="No limit" value={budget} onChange={e => setBudget(e.target.value)}
                    className="bg-transparent text-white text-sm py-2 px-3 flex-1 focus:outline-none placeholder-gray-600" />
                </div>
                {budget && <p className="text-[#FF9900] text-xs mt-1 font-bold">Max ₹{parseFloat(budget).toLocaleString("en-IN")}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
                  <Users size={12} /> Number of people
                </label>
                <div className="flex items-center bg-white/10 border border-white/20 rounded-lg overflow-hidden">
                  <input type="number" min="1" max="50" value={people} onChange={e => setPeople(e.target.value)}
                    className="bg-transparent text-white text-sm py-2 px-3 w-16 text-center focus:outline-none" />
                  <span className="px-3 text-gray-400 text-sm border-l border-white/20">people</span>
                </div>
                {parseInt(people) > 1 && <p className="text-[#FF9900] text-xs mt-1 font-bold">Quantities will scale ×{people}</p>}
              </div>
            </div>
          )}

          {/* Submit button */}
          <button
            id="build-cart-btn"
            onClick={() => submit(query)}
            disabled={!query.trim()}
            className="w-full mt-5 py-4 rounded-2xl font-extrabold text-xl transition-all duration-200 shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: query.trim() ? "linear-gradient(135deg, #FF9900 0%, #e47911 100%)" : "#555", color: "#131921" }}
          >
            🤖 Build My Cart
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 w-full max-w-2xl my-8">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-600 text-sm">or try a quick scenario</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        {/* Scenario cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl">
          {SCENARIOS.map(s => (
            <button key={s.query}
              id={`scenario-${s.label.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => submit(s.query)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FF9900]/50 rounded-xl p-4 flex flex-col items-center gap-2 transition-all hover:-translate-y-0.5 cursor-pointer group">
              <span className="text-3xl group-hover:scale-110 transition-transform">{s.emoji}</span>
              <span className="text-xs text-gray-300 text-center leading-tight">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RESULTS VIEW — Products with real images + per-item Add to Cart
// ═══════════════════════════════════════════════════════════════════
function ResultsView({
  cart, localCart, onAdd, onInc, onDec, onCheckout, onReset, budget, people,
}: {
  cart: SmartCartResponse;
  localCart: LocalCart;
  onAdd: (id: string) => void;
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onCheckout: () => void;
  onReset:    () => void;
  budget:     number | undefined;
  people:     number;
}) {
  const cartItems  = cart.items.filter(i => (localCart[i.id] ?? 0) > 0);
  const totalQty   = Object.values(localCart).reduce((a, b) => a + b, 0);
  const totalPrice = cartItems.reduce((a, i) => a + toINR(i.price) * (localCart[i.id] ?? 0), 0);
  const totalSave  = cartItems.reduce((a, i) => a + toINR(i.savings ?? 0) * (localCart[i.id] ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#EAEDED] pb-40">
      {/* Result header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={onReset} className="text-[#007185] text-sm hover:underline flex items-center gap-1 mr-2">
              <ArrowLeft size={14} /> Back
            </button>
            <h2 className="text-xl font-bold text-[#0F1111]">AI-Built Cart</h2>
            <span className="text-sm bg-[#007185]/10 text-[#007185] font-bold px-2 py-0.5 rounded border border-[#007185]/30">
              {cart.intent.replace(/_/g, " ").toUpperCase()}
            </span>
            {budget && (
              <span className="text-sm bg-[#E8F5E9] text-[#007600] font-bold px-2 py-0.5 rounded border border-[#C8E6C9]">
                💰 Budget ₹{budget.toLocaleString("en-IN")}
              </span>
            )}
            {people > 1 && (
              <span className="text-sm bg-[#FFF8E1] text-[#E65100] font-bold px-2 py-0.5 rounded border border-[#FFE082]">
                👥 {people} people
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Tap <strong>Add</strong> on items you want, then checkout →
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pt-6">
        {/* AI Pipeline Trace (compact) */}
        <div className="bg-[#131921] rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="bg-[#FF9900] text-[#131921] text-[10px] font-black px-2 py-0.5 rounded">LANGGRAPH</span>
            <span className="text-white text-xs font-bold">AI Reasoning</span>
          </div>
          <div className="flex-1 space-y-1.5">
            {cart.explainability.map((e, i) => (
              <div key={i} className="text-xs text-gray-400 flex gap-2">
                <ChevronRight size={12} className="text-[#FF9900] mt-0.5 shrink-0" />
                <span>{e}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Products grid with REAL IMAGES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {cart.items.map((item, idx) => {
            const qty = localCart[item.id] ?? 0;
            const imgUrl = getImg(item.id);

            return (
              <div key={item.id}
                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-200 border-2 ${qty > 0 ? "border-[#007600]" : item.is_smart_saver ? "border-[#FF9900]/40" : "border-transparent"}`}
                style={{ animationDelay: `${idx * 60}ms` }}>

                {/* Image — PROMINENT, LARGE */}
                <div className="relative overflow-hidden">
                  <img
                    src={imgUrl}
                    alt={item.name}
                    className="w-full h-52 object-cover hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.id}17/400/300`; }}
                  />
                  {item.is_smart_saver && (
                    <div className="absolute top-3 left-3 bg-[#FF9900] text-[#131921] text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      🏷️ Smart Saver
                    </div>
                  )}
                  {qty > 0 && (
                    <div className="absolute top-3 right-3 bg-[#007600] text-white text-[10px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                      ✓ In Cart ×{qty}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-[#0F1111] text-sm leading-snug mb-2 line-clamp-2">{item.name}</h3>

                  {/* Price row */}
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xl font-bold text-[#B12704]">{fmtINR(item.price)}</span>
                    {item.original_price && item.original_price > item.price && (
                      <span className="text-sm text-gray-400 line-through">{fmtINR(item.original_price)}</span>
                    )}
                  </div>

                  {item.is_smart_saver && item.savings && item.savings > 0 && (
                    <div className="text-xs text-[#007600] font-bold bg-[#E8F5E9] px-2 py-0.5 rounded mb-2 inline-block">
                      Save {fmtINR(item.savings)}/unit
                    </div>
                  )}

                  <div className="text-[11px] text-[#007600] mb-3">✓ In Stock &nbsp;·&nbsp; FREE 10-min delivery</div>

                  {/* AI reasoning */}
                  {item.reasoning && (
                    <div className="bg-[#F0F8FF] border border-[#A6C8FF] rounded-lg px-3 py-2 mb-4">
                      <div className="text-[11px] text-[#007185] flex gap-1.5 items-start">
                        <span className="shrink-0 font-bold">🤖 AI:</span>
                        <span className="leading-snug">{item.reasoning}</span>
                      </div>
                    </div>
                  )}

                  {/* Add to Cart control */}
                  {qty === 0 ? (
                    <button onClick={() => onAdd(item.id)}
                      id={`add-${item.id}`}
                      className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] py-2.5 rounded-lg font-bold transition-colors text-sm">
                      Add to Cart
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-[#FFD814] border border-[#FCD200] rounded-lg overflow-hidden">
                      <button onClick={() => onDec(item.id)} className="px-4 py-2.5 hover:bg-[#F7CA00] transition-colors font-bold text-lg">−</button>
                      <span className="font-bold text-base">{qty}</span>
                      <button onClick={() => onInc(item.id)} className="px-4 py-2.5 hover:bg-[#F7CA00] transition-colors font-bold text-lg">+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky checkout bar */}
      {totalQty > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-[#FF9900] px-6 py-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[#0F1111] font-bold">{totalQty} item{totalQty !== 1 ? "s" : ""} in cart</span>
              <span className="text-[#B12704] font-bold text-xl ml-3">{fmtINRv(totalPrice)}</span>
            </div>
            {totalSave > 0 && (
              <span className="text-[#007600] text-sm font-bold bg-[#E8F5E9] px-3 py-1 rounded-full border border-[#C8E6C9]">
                🏷️ Saving {fmtINRv(totalSave)}
              </span>
            )}
          </div>
          <button id="proceed-checkout-btn" onClick={onCheckout}
            className="bg-[#FF9900] hover:bg-[#e47911] text-white font-extrabold px-8 py-3 rounded-full shadow-lg transition-colors flex items-center gap-2">
            <ShoppingCart size={18} />
            Proceed to Checkout →
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CHECKOUT MODAL (Amazon Pay → redirects to Amazon.in)
// ═══════════════════════════════════════════════════════════════════
function CheckoutModal({ total, savings, itemCount, onClose }: {
  total: number; savings: number; itemCount: number; onClose: () => void;
}) {
  const [payMethod, setPayMethod] = useState<"upi"|"card"|"cod">("upi");
  const [upiId, setUpiId]         = useState("9876543210@okaxis");
  const [step, setStep]           = useState<"pay"|"processing"|"redirect">("pay");

  const handlePay = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("redirect");
      setTimeout(() => {
        window.open("https://www.amazon.in/gp/cart/view.html?ref_=nav_cart", "_blank");
        onClose();
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#131921] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-xl">amazon</span>
            <span className="bg-[#FF9900] text-[#131921] text-[10px] font-black px-2 py-0.5 rounded tracking-wide">Pay</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>

        {step === "pay" && (
          <div className="p-6">
            {/* Order summary */}
            <div className="bg-[#F7F7F7] border border-gray-200 rounded-lg p-4 mb-5">
              <div className="text-sm font-bold text-[#0F1111] mb-3">Order Summary</div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Items ({itemCount})</span>
                  <span className="font-medium">{fmtINRv(total + savings)}</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-[#007600]">
                    <span>🏷️ Smart Saver discount</span>
                    <span className="font-bold">−{fmtINRv(savings)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery</span>
                  <span className="text-[#007600] font-bold">FREE</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-base">
                  <span>Order Total</span>
                  <span className="text-[#B12704]">{fmtINRv(total)}</span>
                </div>
              </div>
            </div>

            {/* Payment methods */}
            <p className="text-sm font-bold text-[#0F1111] mb-3">Choose payment method</p>
            <div className="space-y-2 mb-4">
              {[
                { key: "upi",  icon: "📱", label: "UPI / Amazon Pay UPI", sub: "Instant, no extra charges" },
                { key: "card", icon: "💳", label: "Credit / Debit Card",  sub: "Visa, Mastercard, Rupay" },
                { key: "cod",  icon: "💵", label: "Cash on Delivery",     sub: "Pay when delivered" },
              ].map(m => (
                <label key={m.key} className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${payMethod === m.key ? "border-[#FF9900] bg-[#FFFBF0]" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="pay" checked={payMethod === m.key as any} onChange={() => setPayMethod(m.key as any)} className="w-4 h-4 accent-[#FF9900]" />
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <div className="text-sm font-semibold">{m.label}</div>
                    <div className="text-xs text-gray-400">{m.sub}</div>
                  </div>
                </label>
              ))}
            </div>

            {payMethod === "upi" && (
              <div className="mb-4">
                <label className="text-xs text-gray-600 block mb-1 font-medium">Your UPI ID</label>
                <input className="w-full border-2 border-gray-200 focus:border-[#FF9900] rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors"
                  value={upiId} onChange={e => setUpiId(e.target.value)} />
              </div>
            )}

            <button onClick={handlePay}
              className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] py-3.5 rounded-xl font-bold text-base shadow transition-colors">
              🔒 Pay {fmtINRv(total)} Securely
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-3">
              Secured by Amazon Pay · 256-bit SSL Encryption
            </p>
          </div>
        )}

        {step === "processing" && (
          <div className="p-12 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#FF9900] border-t-transparent rounded-full animate-spin mb-5" />
            <div className="text-xl font-bold text-[#0F1111] mb-2">Processing Payment…</div>
            <div className="text-gray-500 text-sm">Securing your transaction with Amazon Pay</div>
          </div>
        )}

        {step === "redirect" && (
          <div className="p-12 flex flex-col items-center">
            <div className="text-5xl mb-4">✅</div>
            <div className="text-xl font-bold text-[#007600] mb-2">Payment Successful!</div>
            <div className="text-gray-500 text-sm text-center">Redirecting you to Amazon checkout to confirm your order…</div>
            <div className="mt-4 flex gap-1">
              {[1,2,3].map(i => (
                <div key={i} className="w-2 h-2 bg-[#FF9900] rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════
export default function Home() {
  const [mode,       setMode]       = useState<PageMode>("home");
  const [isLoading,  setIsLoading]  = useState(false);
  const [cart,       setCart]       = useState<SmartCartResponse | null>(null);
  const [localCart,  setLocalCart]  = useState<LocalCart>({});
  const [toast,      setToast]      = useState<string | null>(null);
  const [showPay,    setShowPay]    = useState(false);
  // Budget/people stored at root for display in ResultsView
  const [activeBudget, setActiveBudget] = useState<number | undefined>();
  const [activePeople, setActivePeople] = useState(1);

  const fetchCart = useCallback(async (query: string, budget?: number, people = 1) => {
    setActiveBudget(budget);
    setActivePeople(people);
    setIsLoading(true);
    setCart(null);
    setLocalCart({});
    setMode("results");
    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, budget: budget ?? null, people_count: people }),
      });
      if (!res.ok) throw new Error();
      const data: SmartCartResponse = await res.json();
      setCart(data);
      const init: LocalCart = {};
      data.items.forEach(i => { init[i.id] = i.quantity; });
      setLocalCart(init);
    } catch {
      setToast("AI is warming up — please try again.");
      setMode("ai");
    } finally { setIsLoading(false); }
  }, []);

  const addItem = (id: string) => setLocalCart(p => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  const incItem = (id: string) => setLocalCart(p => ({ ...p, [id]: p[id] + 1 }));
  const decItem = (id: string) => setLocalCart(p => {
    const n = { ...p, [id]: p[id] - 1 };
    if (n[id] <= 0) delete n[id];
    return n;
  });

  const totalQty = Object.values(localCart).reduce((a, b) => a + b, 0);
  const cartItemsInCart = cart?.items.filter(i => (localCart[i.id] ?? 0) > 0) ?? [];
  const totalPrice = cartItemsInCart.reduce((a, i) => a + toINR(i.price) * (localCart[i.id] ?? 0), 0);
  const totalSave  = cartItemsInCart.reduce((a, i) => a + toINR(i.savings ?? 0) * (localCart[i.id] ?? 0), 0);

  const handleReset = () => { setCart(null); setMode("home"); setLocalCart({}); };

  return (
    <main className="min-h-screen font-sans">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      {showPay && (
        <CheckoutModal
          total={totalPrice} savings={totalSave} itemCount={totalQty}
          onClose={() => setShowPay(false)}
        />
      )}

      {/* Navbar always visible */}
      <AmazonNavbar
        mode={mode}
        cartCount={totalQty}
        onLogoClick={() => setMode("home")}
        onCartClick={() => totalQty > 0 && setShowPay(true)}
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 bg-[#131921]/80 backdrop-blur-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#FF9900] border-t-transparent rounded-full animate-spin mb-6" />
          <div className="text-white font-bold text-xl mb-2">AI Building Your Cart…</div>
          <div className="text-gray-400 text-sm">7 agents running in parallel — intent, context, consumption, inventory, graph, cart, explainability</div>
          <div className="flex gap-2 mt-4">
            {["Intent","Context","Consumption","Inventory","Graph","Cart","Explain"].map((a, i) => (
              <div key={a} className="text-[10px] text-[#FF9900] font-bold bg-[#FF9900]/10 px-2 py-1 rounded border border-[#FF9900]/30 animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}>{a}</div>
            ))}
          </div>
        </div>
      )}

      {/* Mode rendering */}
      {mode === "home" && <HomeView onAIClick={() => setMode("ai")} />}

      {mode === "ai" && (
        <AIInputView
          onSubmit={(q, b, p) => fetchCart(q, b, p)}
          onBack={() => setMode("home")}
        />
      )}

      {mode === "results" && cart && !isLoading && (
        <ResultsView
          cart={cart}
          localCart={localCart}
          onAdd={addItem} onInc={incItem} onDec={decItem}
          onCheckout={() => setShowPay(true)}
          onReset={handleReset}
          budget={activeBudget}
          people={activePeople}
        />
      )}

      {/* Footer */}
      {mode === "home" && (
        <footer className="bg-[#232F3E] text-white py-8 flex flex-col items-center">
          <div className="flex gap-8 text-sm font-medium mb-4 flex-wrap justify-center px-4">
            <span className="hover:underline cursor-pointer">Conditions of Use</span>
            <span className="hover:underline cursor-pointer">Privacy Notice</span>
            <span className="hover:underline cursor-pointer">Interest-Based Ads</span>
          </div>
          <div className="text-xs text-gray-400">
            Amazon Now AI — HackOn Season 6 · Reimagining Urgent Shopping
          </div>
          <div className="text-xs text-gray-600 mt-1">© 1996-2026, Amazon.com, Inc. or its affiliates</div>
        </footer>
      )}
    </main>
  );
}

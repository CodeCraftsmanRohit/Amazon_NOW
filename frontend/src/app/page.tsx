"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, Search, ShoppingCart, MapPin, Menu, ChevronRight, Mic, Sparkles, Zap, RefreshCw, X } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  reasoning?: string;
}

interface SmartCartResponse {
  intent: string;
  context: Record<string, string>;
  items: CartItem[];
  explainability: string[];
}

// ─── Quick-Scenario Presets ─────────────────────────────────────────────────

const SCENARIOS = [
  { emoji: "🎂", label: "Bake a chocolate cake", query: "I need to bake a chocolate cake right now" },
  { emoji: "🍿", label: "Movie night for 4", query: "Hosting a movie night for 4 people" },
  { emoji: "🤒", label: "I have a fever", query: "I have a fever and need medicine and comfort items" },
  { emoji: "🍝", label: "Last-minute Italian dinner", query: "I'm hosting an Italian dinner for 6 people tonight" },
  { emoji: "🎉", label: "Party for 10", query: "Hosting a party for 10 people, need snacks and drinks" },
  { emoji: "👶", label: "New parent essentials", query: "I'm a new parent and need baby essentials" },
  { emoji: "☕", label: "Morning breakfast run", query: "I need a quick breakfast, coffee and essentials" },
  { emoji: "🥤", label: "BBQ weekend", query: "Planning a backyard BBQ this weekend for 8 people" },
];

// ─── Emoji mapper ───────────────────────────────────────────────────────────

function getProductEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("chocolate") || n.includes("cocoa") || n.includes("ghirardelli")) return "🍫";
  if (n.includes("flour") || n.includes("baking powder") || n.includes("yeast")) return "🌾";
  if (n.includes("butter")) return "🧈";
  if (n.includes("egg")) return "🥚";
  if (n.includes("milk") || n.includes("cream") || n.includes("dairy")) return "🥛";
  if (n.includes("cheese")) return "🧀";
  if (n.includes("chip") || n.includes("crisp") || n.includes("doritos") || n.includes("lay")) return "🥔";
  if (n.includes("popcorn") || n.includes("orville")) return "🍿";
  if (n.includes("cola") || n.includes("soda") || n.includes("pepsi") || n.includes("coca")) return "🥤";
  if (n.includes("pasta") || n.includes("spaghetti") || n.includes("noodle") || n.includes("barilla")) return "🍝";
  if (n.includes("sauce") || n.includes("marinara") || n.includes("ketchup") || n.includes("rao")) return "🫙";
  if (n.includes("coffee") || n.includes("starbucks") || n.includes("folger")) return "☕";
  if (n.includes("tea") || n.includes("lipton")) return "🍵";
  if (n.includes("bread") || n.includes("bun") || n.includes("toast")) return "🍞";
  if (n.includes("chicken") || n.includes("meat") || n.includes("beef")) return "🍗";
  if (n.includes("rice")) return "🍚";
  if (n.includes("soup") || n.includes("campbell")) return "🍲";
  if (n.includes("sugar") || n.includes("honey")) return "🍯";
  if (n.includes("oil") || n.includes("olive")) return "🫒";
  if (n.includes("juice") || n.includes("tropicana") || n.includes("orange")) return "🧃";
  if (n.includes("water") || n.includes("sparkling") || n.includes("gatorade")) return "💧";
  if (n.includes("ice cream") || n.includes("gelato") || n.includes("haagen") || n.includes("ben & jerry")) return "🍦";
  if (n.includes("cake") || n.includes("muffin") || n.includes("brownie")) return "🎂";
  if (n.includes("nut") || n.includes("almond") || n.includes("planters")) return "🥜";
  if (n.includes("advil") || n.includes("tylenol") || n.includes("ibuprofen") || n.includes("medicine") || n.includes("dayquil")) return "💊";
  if (n.includes("vicks") || n.includes("vapor")) return "🤧";
  if (n.includes("diaper") || n.includes("pampers")) return "👶";
  if (n.includes("wipes") || n.includes("baby")) return "🍼";
  if (n.includes("formula") || n.includes("enfamil")) return "🍼";
  if (n.includes("candy") || n.includes("m&m") || n.includes("ferrero") || n.includes("chocolate box")) return "🍬";
  if (n.includes("pizza") || n.includes("digiorno")) return "🍕";
  if (n.includes("yogurt") || n.includes("chobani")) return "🥣";
  if (n.includes("oat") || n.includes("quaker") || n.includes("cereal")) return "🥣";
  if (n.includes("vanilla extract") || n.includes("nielsen")) return "🧪";
  if (n.includes("sugar") || n.includes("domino")) return "🧂";
  if (n.includes("red bull") || n.includes("energy")) return "⚡";
  return "📦";
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#CC0C39] text-white px-6 py-3 rounded shadow-xl flex items-center gap-3 font-bold animate-bounce-in">
      <span>⚠️</span>
      <span>{message}</span>
      <button onClick={onClose} className="hover:text-gray-200 ml-2"><X size={16} /></button>
    </div>
  );
}

function CartSkeleton() {
  return (
    <section className="w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6 z-10 relative px-4 py-8">
      <div className="space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-6" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="amazon-card p-4 flex gap-6 items-start">
            <div className="w-32 h-32 rounded bg-gray-200 animate-pulse flex-shrink-0" />
            <div className="flex-grow space-y-3 pt-2">
              <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
            </div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
      <div>
        <div className="amazon-card p-6 space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded-full animate-pulse mt-4" />
          <div className="h-4 w-full bg-gray-100 rounded animate-pulse mt-4" />
          <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </section>
  );
}

function CheckoutModal({ total, itemCount, onClose }: { total: number; itemCount: number; onClose: () => void }) {
  const orderId = `AMZ-NOW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 800);
    const t2 = setTimeout(() => setStep(2), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200">
        <div className="text-center mb-6">
          <div className="text-[#007600] text-5xl mb-3">✓</div>
          <h2 className="text-2xl font-bold text-[#0F1111]">Order placed, thanks!</h2>
          <p className="text-sm text-gray-600 mt-1">Confirmation will be sent to your email.</p>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-3 text-sm mb-6">
          <div className="flex justify-between">
            <span className="font-bold text-gray-700">Order number:</span>
            <span className="text-[#007185]">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-700">Items ordered:</span>
            <span className="text-[#0F1111] font-bold">{itemCount} items</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-700">Order total:</span>
            <span className="text-[#B12704] font-bold">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-700">Delivery:</span>
            <span className="text-[#007600] font-bold">In 10 Minutes ⚡</span>
          </div>
        </div>

        <div className="space-y-4 mb-8 pl-2">
          {[
            { label: "Order Placed", detail: "We've received your order", done: step >= 0 },
            { label: "Picker Assigned", detail: "Fulfillment center is packing items", done: step >= 1 },
            { label: "Out for Delivery", detail: "Drone dispatch preparing", done: step >= 2 },
          ].map(({ label, detail, done }, i) => (
            <div key={label} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 z-10 transition-colors duration-500 ${done ? "bg-[#007600] border-[#007600]" : "bg-white border-gray-300"}`} />
                {i !== 2 && <div className={`w-0.5 h-8 -mt-1 transition-colors duration-500 ${step > i ? "bg-[#007600]" : "bg-gray-200"}`} />}
              </div>
              <div>
                <div className={`font-bold text-sm transition-colors duration-500 ${done ? "text-[#0F1111]" : "text-gray-400"}`}>{label}</div>
                <div className={`text-xs transition-colors duration-500 ${done ? "text-gray-600" : "text-gray-300"}`}>{detail}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] py-2.5 rounded-full font-bold shadow-sm transition-colors"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function Home() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cart, setCart] = useState<SmartCartResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  // ── Core fetch logic — accepts the query directly to avoid race conditions ──
  const fetchCart = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true);
    setCart(null);
    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query }),
      });
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      setCart(data);
    } catch {
      setToast("AI is warming up — please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Handles the search bar submit ──
  const handleSendMessage = () => fetchCart(message);

  // ── Scenario card click — passes query directly, no state race condition ──
  const handleScenario = (query: string) => {
    setMessage(query);
    fetchCart(query);
  };

  // ── Voice input ──
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToast("Voice search is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => { setIsListening(true); setMessage(""); };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
      setIsListening(false);
      // Auto-submit after voice — use transcript directly to avoid race condition
      fetchCart(transcript);
    };
    recognition.onerror = () => setToast("Voice recognition failed. Please try again.");
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  // ── Image upload ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const selectedFile = e.target.files[0];
    setIsLoading(true);
    setCart(null);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await fetch("http://localhost:8000/api/inventory/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      setCart(data);
    } catch {
      setToast("Vision AI could not process the image. Please try again.");
    } finally {
      setIsLoading(false);
      e.target.value = "";
    }
  };

  const handleReset = () => { setCart(null); setMessage(""); };
  const total = cart?.items.reduce((acc, item) => acc + item.price * item.quantity, 0) ?? 0;

  return (
    <main className="min-h-screen font-sans flex flex-col bg-[#EAEDED]">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {showCheckout && (
        <CheckoutModal
          total={total}
          itemCount={cart?.items.length ?? 0}
          onClose={() => { setShowCheckout(false); handleReset(); }}
        />
      )}

      {/* ── Navbar ── */}
      <header className="w-full bg-[#131921] text-white flex flex-col sticky top-0 z-40 shadow-md">
        {/* Top row */}
        <div className="flex items-center justify-between px-4 py-2 gap-4">
          {/* Logo */}
          <div className="flex items-center cursor-pointer hover:border-white border border-transparent p-1 rounded shrink-0">
            <span className="font-bold text-xl tracking-tighter">amazon</span>
            <span className="text-[#FF9900] font-bold text-xl ml-0.5">now</span>
            <span className="bg-[#FF9900] text-[#131921] text-[10px] font-black px-1.5 py-0.5 rounded ml-1.5 tracking-wide">AI</span>
          </div>

          {/* Delivery badge */}
          <div className="hidden md:flex items-center hover:border-white border border-transparent p-1 rounded cursor-pointer shrink-0">
            <MapPin size={18} className="mr-1 text-gray-300" />
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-300 leading-3">Deliver to</span>
              <span className="text-sm font-bold leading-4">Your Location</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-4xl flex items-center relative group">
            <div className="absolute inset-0 bg-[#FF9900] rounded-md -m-0.5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative flex w-full h-10 rounded-md overflow-hidden z-10">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 border-r border-gray-300 flex items-center justify-center transition-colors"
                title="Upload Fridge / Pantry Photo"
                disabled={isLoading}
              >
                <Camera size={20} />
              </button>
              <button
                onClick={handleVoiceInput}
                className={`bg-gray-100 hover:bg-gray-200 px-3 border-r border-gray-300 flex items-center justify-center transition-colors ${isListening ? "text-[#CC0C39] animate-pulse" : "text-gray-600"}`}
                title="Voice Search"
                disabled={isLoading}
              >
                <Mic size={20} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              <input
                ref={inputRef}
                type="text"
                id="amazon-now-search"
                className="flex-1 px-4 text-[#0F1111] focus:outline-none text-[15px]"
                placeholder={isListening ? "🎤 Listening..." : "What do you need? (e.g. Bake a cake, movie night...)"}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading || isListening}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="bg-[#FEBD69] hover:bg-[#F3A847] px-4 flex items-center justify-center transition-colors text-gray-900 disabled:opacity-80"
                id="search-submit-btn"
              >
                <Search size={22} />
              </button>
            </div>
          </div>

          {/* Account */}
          <div className="hidden md:flex flex-col hover:border-white border border-transparent p-1 rounded cursor-pointer shrink-0">
            <span className="text-[11px] text-gray-300 leading-3">Hello, Customer</span>
            <span className="text-sm font-bold leading-4">Account &amp; Lists</span>
          </div>

          {/* Cart */}
          <div className="flex items-center hover:border-white border border-transparent p-1 rounded cursor-pointer shrink-0">
            <div className="relative flex items-end">
              <ShoppingCart size={32} />
              {(cart?.items.length ?? 0) > 0 && (
                <span className="absolute -top-1 left-3.5 text-[#FF9900] font-bold text-[16px] leading-4">
                  {cart!.items.length}
                </span>
              )}
            </div>
            <span className="text-sm font-bold hidden md:block ml-1 mt-3">Cart</span>
          </div>
        </div>

        {/* Bottom row */}
        <div className="bg-[#232F3E] px-4 py-1.5 flex items-center gap-4 text-sm font-medium overflow-x-auto">
          <div className="flex items-center gap-1 cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap">
            <Menu size={18} /> All
          </div>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap">Today's Deals</span>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap">Customer Service</span>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap">Registry</span>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap">Gift Cards</span>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap">Sell</span>
          <span className="ml-auto flex items-center gap-1.5 text-[#FF9900] font-bold whitespace-nowrap">
            <Zap size={14} /> 10-Min Delivery
          </span>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 w-full max-w-[1500px] mx-auto pb-12">

        {/* Loading skeleton */}
        {isLoading && (
          <div>
            <div className="bg-[#007185] text-white px-4 py-2 text-sm text-center flex items-center justify-center gap-2">
              <Sparkles size={16} className="animate-spin" />
              <span>AI is building your perfect cart — running 7 intelligent agents in parallel...</span>
            </div>
            <CartSkeleton />
          </div>
        )}

        {/* ── Homepage: Empty state with rich scenario cards ── */}
        {!cart && !isLoading && (
          <div className="animate-fadein">
            {/* Hero banner */}
            <div className="w-full bg-gradient-to-br from-[#131921] to-[#232F3E] text-white px-8 py-14 text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #FF9900 0%, transparent 50%), radial-gradient(circle at 80% 20%, #007185 0%, transparent 40%)" }} />
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 bg-[#FF9900]/20 border border-[#FF9900]/40 rounded-full px-4 py-1.5 text-[#FF9900] text-sm font-bold mb-5">
                  <Zap size={14} /> Need-Centric Shopping · 7-Agent AI Pipeline
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                  Skip the Search.<br />
                  <span className="text-[#FF9900]">Fulfill the Need.</span>
                </h1>
                <p className="text-lg text-gray-300 max-w-2xl mx-auto mb-3">
                  Tell us what you're doing — not what you want to buy. Our AI builds the perfect cart in seconds.
                </p>
                <p className="text-sm text-gray-400 max-w-xl mx-auto">
                  Powered by LangGraph · GPT-4o Vision · Parallel Agent Architecture
                </p>
              </div>
            </div>

            {/* How it works strip */}
            <div className="bg-white border-b border-gray-200 px-8 py-4">
              <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-sm text-center text-[#565959]">
                {[
                  { icon: "🎙️", step: "1. Speak or type your need" },
                  { icon: "🤖", step: "2. AI understands your intent" },
                  { icon: "🛒", step: "3. Perfect cart built instantly" },
                  { icon: "⚡", step: "4. Delivered in 10 minutes" },
                ].map(({ icon, step }) => (
                  <div key={step} className="flex items-center gap-2 font-medium">
                    <span className="text-xl">{icon}</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scenario cards grid */}
            <div className="px-6 pt-8 pb-4">
              <h2 className="text-center text-[#0F1111] text-xl font-bold mb-2">Try a scenario instantly</h2>
              <p className="text-center text-[#565959] text-sm mb-6">Click any card below — the AI will build your cart in seconds</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {SCENARIOS.map(({ emoji, label, query }) => (
                  <button
                    key={query}
                    id={`scenario-${label.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => handleScenario(query)}
                    className="group bg-white border border-[#D5D9D9] hover:border-[#FF9900] hover:shadow-md rounded-xl p-5 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer hover:-translate-y-0.5"
                  >
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-200">{emoji}</span>
                    <span className="text-sm font-semibold text-[#0F1111] text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom input CTA */}
            <div className="text-center mt-4 mb-8 text-[#565959] text-sm">
              — or type anything custom in the search bar above —
            </div>

            {/* AI feature highlights */}
            <div className="bg-white border-t border-b border-gray-200 px-8 py-8 mt-4">
              <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: "🤖",
                    title: "7-Agent LangGraph Pipeline",
                    desc: "Intent → Context → Consumption → Inventory → Graph → Cart → Explainability. All agents run in parallel for maximum speed.",
                  },
                  {
                    icon: "📸",
                    title: "Vision AI (GPT-4o)",
                    desc: "Upload a photo of your fridge or pantry. Our Vision AI detects what's missing and automatically builds your replenishment cart.",
                  },
                  {
                    icon: "🎙️",
                    title: "Native Voice Search",
                    desc: "Just speak your need. The mic icon in the search bar activates instant voice recognition — no typing required.",
                  },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex flex-col items-center text-center p-4">
                    <span className="text-4xl mb-3">{icon}</span>
                    <h3 className="font-bold text-[#0F1111] mb-2">{title}</h3>
                    <p className="text-sm text-[#565959] leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Smart Cart Results ── */}
        {!isLoading && cart && (
          <div className="px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] xl:grid-cols-[1fr_360px] gap-6">

            {/* Left: Cart items */}
            <div className="amazon-card p-6">
              <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-end">
                <h2 className="text-3xl font-normal text-[#0F1111]">Shopping Cart</h2>
                <div className="flex items-center gap-3">
                  <span className="text-[#565959] text-sm hidden sm:block">Price</span>
                  <button
                    onClick={handleReset}
                    className="text-[#007185] text-xs hover:underline flex items-center gap-1 transition-colors"
                    title="Start over"
                  >
                    <RefreshCw size={13} /> New search
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {cart.items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex gap-6 py-4 border-b border-gray-100 group"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Product image/emoji box */}
                    <div className="w-[160px] h-[160px] bg-[#F7F7F7] border border-gray-200 rounded flex items-center justify-center flex-shrink-0 group-hover:border-[#007185] transition-colors">
                      <span className="text-[90px] hover:scale-110 transition-transform duration-300">
                        {getProductEmoji(item.name)}
                      </span>
                    </div>

                    {/* Product details */}
                    <div className="flex-grow flex flex-col justify-start">
                      <div className="flex justify-between items-start">
                        <div className="max-w-[480px]">
                          <h3 className="text-[17px] text-[#007185] font-medium leading-tight hover:text-[#C7511F] hover:underline cursor-pointer mb-1 transition-colors">
                            {item.name}
                          </h3>
                          <div className="text-xs text-[#007600] font-bold mb-1">In Stock</div>
                          <div className="text-xs text-[#565959] flex items-center gap-1 mb-2">
                            <span className="text-[#0F1111] font-bold">Prime</span>
                            <span>FREE Delivery by</span>
                            <span className="font-bold text-[#0F1111]">Amazon Prime Air</span>
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <select className="bg-[#F0F2F2] border border-[#D5D9D9] rounded py-1 px-2 text-sm shadow-sm cursor-pointer hover:bg-[#E3E6E6] transition-colors">
                              <option>Qty: {item.quantity}</option>
                              {[1, 2, 3, 4, 5].map(n => <option key={n}>{n}</option>)}
                            </select>
                            <span className="text-gray-300">|</span>
                            <span className="text-[#007185] text-xs hover:underline cursor-pointer transition-colors">Delete</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-[#007185] text-xs hover:underline cursor-pointer transition-colors">Save for later</span>
                          </div>
                        </div>
                        <div className="text-[18px] font-bold text-[#0F1111] ml-4 shrink-0">
                          ${(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>

                      {item.reasoning && (
                        <div className="mt-4 bg-[#F0F8FF] border border-[#A6C8FF] p-3 rounded text-sm flex items-start gap-2 shadow-sm">
                          <span className="text-[#007185] font-bold flex-shrink-0">AI Tip:</span>
                          <span className="text-[#565959]">{item.reasoning}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-right mt-4 text-[18px]">
                Subtotal ({cart.items.length} item{cart.items.length !== 1 ? "s" : ""}):&nbsp;
                <span className="font-bold text-[#0F1111]">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Right: Checkout + AI Reasoning */}
            <div className="flex flex-col gap-5">
              {/* Checkout box */}
              <div className="amazon-card p-5">
                <div className="text-[18px] mb-4">
                  Subtotal ({cart.items.length} item{cart.items.length !== 1 ? "s" : ""}):&nbsp;
                  <span className="font-bold text-[#0F1111]">${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mb-5 text-[#0F1111]">
                  <input type="checkbox" className="w-4 h-4 cursor-pointer" id="gift-check" />
                  <label htmlFor="gift-check">This order contains a gift</label>
                </div>
                <button
                  id="proceed-to-checkout-btn"
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] py-2 rounded-full font-normal shadow-sm mb-3 transition-colors"
                >
                  Proceed to checkout
                </button>
                <div className="text-center text-xs text-[#565959]">
                  <span className="text-[#007600] font-bold">⚡ 10-minute delivery</span> with Prime Air
                </div>
              </div>

              {/* AI Reasoning trace */}
              <div className="bg-[#F7F7F7] border border-[#D5D9D9] p-4 rounded shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#007185]" />
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <span className="bg-[#007185] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">LANGGRAPH</span>
                  <span className="bg-[#232F3E] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">AMAZON BEDROCK</span>
                  <h4 className="font-bold text-[#0F1111] ml-1">AI Pipeline Trace</h4>
                </div>
                <div className="text-xs text-[#565959] mb-4 pb-3 border-b border-gray-200">
                  <span className="font-bold text-[#0F1111]">Intent:</span> {cart.intent.toUpperCase().replace(/_/g, " ")}
                </div>
                <ul className="space-y-4">
                  {cart.explainability.map((exp, i) => (
                    <li key={i} className="text-sm text-[#0F1111] flex gap-3 items-start">
                      <div className="mt-0.5 shrink-0">
                        <ChevronRight size={16} className="text-[#007185]" />
                      </div>
                      <div className="leading-snug">{exp}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="w-full bg-[#232F3E] text-white py-8 mt-auto flex flex-col items-center">
        <div className="flex gap-8 text-sm font-medium mb-6 flex-wrap justify-center px-4">
          <span className="hover:underline cursor-pointer">Conditions of Use</span>
          <span className="hover:underline cursor-pointer">Privacy Notice</span>
          <span className="hover:underline cursor-pointer">Your Ads Privacy Choices</span>
        </div>
        <div className="text-xs text-gray-400 text-center px-4">
          Amazon Now AI — Built for Amazon HackOn Season 6 · Theme: Reimagining Urgent Shopping
        </div>
        <div className="text-xs text-gray-500 mt-1">
          © 1996-2026, Amazon.com, Inc. or its affiliates
        </div>
      </footer>
    </main>
  );
}

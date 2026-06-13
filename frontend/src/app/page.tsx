"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Camera, Search, ShoppingCart, MapPin, Menu,
  ChevronRight, Mic, Sparkles, Zap, RefreshCw, X,
  Truck, CheckCircle, Package, Clock, Users, IndianRupee, SlidersHorizontal,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const toINR   = (usd: number) => Math.round(usd * 83.5);
const fmtINR  = (usd: number) => `₹${toINR(usd).toLocaleString("en-IN")}`;
const fmtINRv = (inr: number) => `₹${Math.round(inr).toLocaleString("en-IN")}`;

// ─── Types ───────────────────────────────────────────────────────────────────
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
  reasoning?: string;
  original_price?: number;
  savings?: number;
  is_smart_saver?: boolean;
}
interface SmartCartResponse {
  intent: string;
  context: Record<string, string>;
  items: CartItem[];
  explainability: string[];
  total_cost?: number;
  total_savings?: number;
}
type LocalCart = Record<string, number>;

// ─── Scenarios ───────────────────────────────────────────────────────────────
const SCENARIOS = [
  { emoji: "🎂", label: "Bake a chocolate cake",     query: "I need to bake a chocolate cake right now" },
  { emoji: "🍿", label: "Movie night for 4",          query: "Hosting a movie night for 4 people" },
  { emoji: "🤒", label: "I have a fever",             query: "I have a fever and need medicine and comfort items" },
  { emoji: "🍝", label: "Last-minute Italian dinner", query: "I'm hosting an Italian dinner for 6 people tonight" },
  { emoji: "🎉", label: "Party for 10",               query: "Hosting a party for 10 people, need snacks and drinks" },
  { emoji: "👶", label: "New parent essentials",      query: "I'm a new parent and need baby essentials" },
  { emoji: "☕", label: "Morning breakfast run",       query: "I need a quick breakfast, coffee and essentials" },
  { emoji: "🥤", label: "BBQ weekend",               query: "Planning a backyard BBQ this weekend for 8 people" },
];

// ─── Emoji mapper ─────────────────────────────────────────────────────────────
function getProductEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("chocolate") || n.includes("cocoa") || n.includes("ghirardelli")) return "🍫";
  if (n.includes("flour") || n.includes("baking powder")) return "🌾";
  if (n.includes("butter")) return "🧈";
  if (n.includes("egg")) return "🥚";
  if (n.includes("milk") || n.includes("dairy")) return "🥛";
  if (n.includes("cheese")) return "🧀";
  if (n.includes("chip") || n.includes("crisp") || n.includes("doritos") || n.includes("lay")) return "🥔";
  if (n.includes("popcorn") || n.includes("orville")) return "🍿";
  if (n.includes("cola") || n.includes("soda") || n.includes("pepsi") || n.includes("coca")) return "🥤";
  if (n.includes("pasta") || n.includes("spaghetti") || n.includes("noodle")) return "🍝";
  if (n.includes("sauce") || n.includes("marinara") || n.includes("ketchup")) return "🫙";
  if (n.includes("coffee") || n.includes("starbucks") || n.includes("folger")) return "☕";
  if (n.includes("tea") || n.includes("lipton")) return "🍵";
  if (n.includes("bread") || n.includes("bun") || n.includes("toast")) return "🍞";
  if (n.includes("soup") || n.includes("campbell")) return "🍲";
  if (n.includes("sugar") || n.includes("honey")) return "🍯";
  if (n.includes("juice") || n.includes("tropicana") || n.includes("orange")) return "🧃";
  if (n.includes("water") || n.includes("sparkling") || n.includes("gatorade")) return "💧";
  if (n.includes("ice cream") || n.includes("haagen") || n.includes("ben & jerry")) return "🍦";
  if (n.includes("nut") || n.includes("almond") || n.includes("planters")) return "🥜";
  if (n.includes("advil") || n.includes("tylenol") || n.includes("ibuprofen") || n.includes("dayquil")) return "💊";
  if (n.includes("vicks")) return "🤧";
  if (n.includes("diaper") || n.includes("pampers")) return "👶";
  if (n.includes("baby") || n.includes("formula") || n.includes("enfamil") || n.includes("wipes")) return "🍼";
  if (n.includes("candy") || n.includes("m&m") || n.includes("ferrero")) return "🍬";
  if (n.includes("pizza") || n.includes("digiorno")) return "🍕";
  if (n.includes("yogurt") || n.includes("chobani")) return "🥣";
  if (n.includes("oat") || n.includes("quaker") || n.includes("cereal")) return "🥣";
  if (n.includes("red bull") || n.includes("energy")) return "⚡";
  if (n.includes("oil") || n.includes("olive")) return "🫒";
  if (n.includes("rice")) return "🍚";
  return "📦";
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#CC0C39] text-white px-6 py-3 rounded shadow-xl flex items-center gap-3 font-bold animate-bounce-in">
      ⚠️ <span>{message}</span>
      <button onClick={onClose}><X size={16} /></button>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function CartSkeleton() {
  return (
    <div className="px-4 py-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-w-6xl mx-auto">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="amazon-card p-3 flex flex-col gap-3">
          <div className="w-full aspect-square bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  );
}

// ─── Amazon Pay Modal ─────────────────────────────────────────────────────────
function PaymentModal({ total, savings, itemCount, onSuccess, onClose }: {
  total: number; savings: number; itemCount: number;
  onSuccess: () => void; onClose: () => void;
}) {
  const [payMethod, setPayMethod] = useState<"upi"|"card"|"cod">("upi");
  const [upiId, setUpiId] = useState("9876543210@okaxis");
  const [processing, setProcessing] = useState(false);

  const handlePay = () => {
    setProcessing(true);
    setTimeout(() => { setProcessing(false); onSuccess(); }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        <div className="bg-[#131921] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-lg">amazon</span>
            <span className="bg-[#FF9900] text-[#131921] text-[10px] font-black px-1.5 py-0.5 rounded tracking-wide">Pay</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        <div className="p-5">
          <div className="bg-[#F7F7F7] border border-gray-200 rounded p-4 mb-5">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Order total ({itemCount} items)</span>
              <span className="font-bold">{fmtINRv(total)}</span>
            </div>
            {savings > 0 && (
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#007600]">🏷️ Smart Saver savings</span>
                <span className="text-[#007600] font-bold">−{fmtINRv(savings)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Delivery</span>
              <span className="text-[#007600] font-bold">FREE</span>
            </div>
            <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold text-[#B12704]">
              <span className="text-[#0F1111]">Total payable</span>
              <span>{fmtINRv(total)}</span>
            </div>
          </div>
          <p className="text-sm font-bold text-[#0F1111] mb-3">Select payment method</p>
          <div className="space-y-2 mb-5">
            {[
              { key: "upi",  icon: "📱", label: "UPI / Amazon Pay UPI" },
              { key: "card", icon: "💳", label: "Credit / Debit Card" },
              { key: "cod",  icon: "💵", label: "Cash on Delivery" },
            ].map(m => (
              <label key={m.key} className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-all ${payMethod === m.key ? "border-[#FF9900] bg-[#FFFBF0]" : "border-gray-200 hover:border-gray-400"}`}>
                <input type="radio" name="pay" checked={payMethod === m.key as any} onChange={() => setPayMethod(m.key as any)} className="w-4 h-4 accent-[#FF9900]" />
                <span className="text-lg">{m.icon}</span>
                <span className="text-sm font-medium">{m.label}</span>
              </label>
            ))}
          </div>
          {payMethod === "upi" && (
            <div className="mb-4">
              <label className="text-xs text-gray-600 block mb-1">UPI ID</label>
              <input className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#FF9900]" value={upiId} onChange={e => setUpiId(e.target.value)} />
            </div>
          )}
          <button onClick={handlePay} disabled={processing}
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] disabled:opacity-70 border border-[#FCD200] text-[#0F1111] py-3 rounded-full font-bold text-base shadow transition-colors flex items-center justify-center gap-2">
            {processing ? <><Sparkles size={18} className="animate-spin" /> Processing…</> : <>🔒 Pay {fmtINRv(total)} Securely</>}
          </button>
          <p className="text-center text-[10px] text-gray-400 mt-3">Secured by Amazon Pay · 256-bit SSL Encryption</p>
        </div>
      </div>
    </div>
  );
}

// ─── Order Tracking Modal ─────────────────────────────────────────────────────
const ORDER_STAGES = [
  { icon: CheckCircle, label: "Order Placed",     detail: "Your order has been confirmed",               delay: 0    },
  { icon: Package,     label: "Picker Assigned",  detail: "Someone is picking your items right now",     delay: 1200 },
  { icon: Package,     label: "Packing",          detail: "Your items are being carefully packed",       delay: 2500 },
  { icon: Truck,       label: "Out for Delivery", detail: "Your order is on its way — ETA 10 minutes!", delay: 3800 },
  { icon: CheckCircle, label: "Delivered ⚡",      detail: "Your Amazon Now order has arrived!",          delay: 5200 },
];

function OrderTrackingModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    ORDER_STAGES.forEach((_, i) => {
      if (i === 0) return;
      setTimeout(() => setStage(i), ORDER_STAGES[i].delay);
    });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-lg w-full max-w-md mx-4 shadow-2xl overflow-hidden">
        <div className="bg-[#007185] px-5 py-4 flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-lg">Order Tracking</div>
            <div className="text-[#B2DFEB] text-xs font-mono">{orderId}</div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X size={20} /></button>
        </div>
        <div className="bg-[#E8F5E9] border-b border-[#C8E6C9] px-5 py-3 flex items-center gap-2">
          <Zap size={18} className="text-[#007600]" />
          <span className="text-[#007600] font-bold text-sm">⚡ Estimated Delivery: 10 minutes</span>
        </div>
        <div className="p-6 space-y-0">
          {ORDER_STAGES.map((s, i) => {
            const Icon = s.icon;
            const done   = i <= stage;
            const active = i === stage;
            return (
              <div key={s.label} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-700 ${done ? "bg-[#007600] border-[#007600]" : "bg-white border-gray-300"} ${active ? "ring-4 ring-[#007600]/20 scale-110" : ""}`}>
                    <Icon size={16} className={done ? "text-white" : "text-gray-300"} />
                  </div>
                  {i !== ORDER_STAGES.length - 1 && (
                    <div className={`w-0.5 h-10 transition-colors duration-700 ${done && i < stage ? "bg-[#007600]" : "bg-gray-200"}`} />
                  )}
                </div>
                <div className="pt-1.5 pb-4">
                  <div className={`font-bold text-sm transition-colors duration-700 ${done ? "text-[#0F1111]" : "text-gray-400"}`}>
                    {s.label}
                    {active && i < ORDER_STAGES.length - 1 && (
                      <span className="ml-2 text-[10px] bg-[#FF9900] text-white px-1.5 py-0.5 rounded font-bold">LIVE</span>
                    )}
                  </div>
                  <div className={`text-xs mt-0.5 ${done ? "text-gray-500" : "text-gray-300"}`}>{s.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-6 pb-6">
          {stage === ORDER_STAGES.length - 1 ? (
            <button onClick={onClose} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] py-2.5 rounded-full font-bold">
              🛍️ Continue Shopping
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[#007185] text-sm">
              <Clock size={14} className="animate-spin" /> Live tracking…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────
function ProductCard({ item, qty, onAdd, onInc, onDec }: {
  item: CartItem; qty: number;
  onAdd: () => void; onInc: () => void; onDec: () => void;
}) {
  return (
    <div className={`amazon-card p-3 flex flex-col gap-2 hover:shadow-md transition-shadow group relative ${item.is_smart_saver ? "ring-1 ring-[#FF9900]" : ""}`}>
      {/* Smart Saver badge */}
      {item.is_smart_saver && (
        <div className="absolute top-2 left-2 z-10 bg-[#FF9900] text-[#131921] text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow">
          🏷️ Smart Saver
        </div>
      )}
      {/* Emoji box */}
      <div className="w-full aspect-square bg-[#F7F7F7] rounded-lg flex items-center justify-center group-hover:bg-[#F0F8FF] transition-colors pt-4">
        <span className="text-5xl group-hover:scale-110 transition-transform duration-200">{getProductEmoji(item.name)}</span>
      </div>
      {/* Name */}
      <p className="text-[12px] text-[#0F1111] font-medium leading-tight line-clamp-2 min-h-[32px]">{item.name}</p>
      {/* Price */}
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="text-[16px] font-bold text-[#B12704]">{fmtINR(item.price)}</span>
        {item.original_price && item.original_price > item.price && (
          <span className="text-[11px] text-gray-400 line-through">{fmtINR(item.original_price)}</span>
        )}
      </div>
      {item.is_smart_saver && item.savings && item.savings > 0 && (
        <div className="text-[10px] text-[#007600] font-bold bg-[#E8F5E9] px-2 py-0.5 rounded">
          You save {fmtINR(item.savings)} per unit
        </div>
      )}
      {/* AI tip */}
      {item.reasoning && (
        <p className="text-[10px] text-[#007185] bg-[#F0F8FF] border border-[#A6C8FF] rounded px-2 py-1 line-clamp-2">
          🤖 {item.reasoning}
        </p>
      )}
      {/* Add / qty */}
      {qty === 0 ? (
        <button onClick={onAdd} id={`add-${item.id}`}
          className="mt-auto w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] text-sm py-2 rounded font-bold transition-colors">
          Add
        </button>
      ) : (
        <div className="mt-auto flex items-center justify-between bg-[#FFD814] border border-[#FCD200] rounded overflow-hidden">
          <button onClick={onDec} className="px-3 py-2 hover:bg-[#F7CA00] transition-colors font-bold text-lg leading-none">−</button>
          <span className="font-bold text-sm">{qty}</span>
          <button onClick={onInc} className="px-3 py-2 hover:bg-[#F7CA00] transition-colors font-bold text-lg leading-none">+</button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [message, setMessage]         = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cart, setCart]               = useState<SmartCartResponse | null>(null);
  const [localCart, setLocalCart]     = useState<LocalCart>({});
  const [toast, setToast]             = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showTracking, setShowTracking] = useState(false);
  const [orderId, setOrderId]         = useState("");
  // Preferences
  const [showPrefs, setShowPrefs]     = useState(false);
  const [budget, setBudget]           = useState("");         // INR string
  const [peopleCount, setPeopleCount] = useState("1");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedBudget = budget.trim() ? parseFloat(budget) : undefined;
  const parsedPeople = Math.max(1, parseInt(peopleCount) || 1);

  // ── Core fetch ──
  const fetchCart = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setIsLoading(true); setCart(null); setLocalCart({});
    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:      query,
          budget:       parsedBudget ?? null,
          people_count: parsedPeople,
        }),
      });
      if (!res.ok) throw new Error("Backend error");
      const data: SmartCartResponse = await res.json();
      setCart(data);
      const init: LocalCart = {};
      data.items.forEach(i => { init[i.id] = i.quantity; });
      setLocalCart(init);
    } catch {
      setToast("AI is warming up — please try again in a moment.");
    } finally { setIsLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedBudget, parsedPeople]);

  const handleSendMessage = () => fetchCart(message);
  const handleScenario    = (query: string) => { setMessage(query); fetchCart(query); };

  // ── Voice ──
  const handleVoiceInput = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setToast("Voice search is not supported in this browser."); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = false;
    rec.onstart  = () => { setIsListening(true); setMessage(""); };
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      setMessage(t); setIsListening(false); fetchCart(t);
    };
    rec.onerror = () => setToast("Voice recognition failed.");
    rec.onend   = () => setIsListening(false);
    rec.start();
  };

  // ── Image upload ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setIsLoading(true); setCart(null); setLocalCart({});
    const formData = new FormData();
    formData.append("file", e.target.files[0]);
    try {
      const res = await fetch("http://localhost:8000/api/inventory/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Backend error");
      const data: SmartCartResponse = await res.json();
      setCart(data);
      const init: LocalCart = {};
      data.items.forEach(i => { init[i.id] = i.quantity; });
      setLocalCart(init);
    } catch { setToast("Vision AI could not process the image."); }
    finally { setIsLoading(false); e.target.value = ""; }
  };

  // ── Local cart ops ──
  const addItem = (id: string) => setLocalCart(p => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  const incItem = (id: string) => setLocalCart(p => ({ ...p, [id]: p[id] + 1 }));
  const decItem = (id: string) => setLocalCart(p => {
    const n = { ...p, [id]: p[id] - 1 };
    if (n[id] <= 0) delete n[id];
    return n;
  });

  const cartItems  = cart?.items.filter(i => (localCart[i.id] ?? 0) > 0) ?? [];
  const totalQty   = Object.values(localCart).reduce((a, b) => a + b, 0);
  const totalPrice = cartItems.reduce((acc, i) => acc + toINR(i.price) * (localCart[i.id] ?? 0), 0);
  const totalSavings = cartItems.reduce((acc, i) => acc + toINR(i.savings ?? 0) * (localCart[i.id] ?? 0), 0);

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    setOrderId(`AMZ-NOW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    setShowTracking(true);
  };
  const handleReset = () => { setCart(null); setMessage(""); setLocalCart({}); };

  return (
    <main className="min-h-screen font-sans flex flex-col bg-[#EAEDED]">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {showPayment && (
        <PaymentModal total={totalPrice} savings={totalSavings} itemCount={totalQty}
          onSuccess={handlePaymentSuccess} onClose={() => setShowPayment(false)} />
      )}
      {showTracking && (
        <OrderTrackingModal orderId={orderId} onClose={() => { setShowTracking(false); handleReset(); }} />
      )}

      {/* ── Navbar ── */}
      <header className="w-full bg-[#131921] text-white flex flex-col sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between px-4 py-2 gap-4">
          {/* Logo */}
          <div className="flex items-center cursor-pointer hover:border-white border border-transparent p-1 rounded shrink-0">
            <span className="font-bold text-xl tracking-tighter">amazon</span>
            <span className="text-[#FF9900] font-bold text-xl ml-0.5">now</span>
            <span className="bg-[#FF9900] text-[#131921] text-[10px] font-black px-1.5 py-0.5 rounded ml-1.5 tracking-wide">AI</span>
          </div>
          {/* Deliver */}
          <div className="hidden md:flex items-center hover:border-white border border-transparent p-1 rounded cursor-pointer shrink-0">
            <MapPin size={18} className="mr-1 text-gray-300" />
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-300 leading-3">Deliver to</span>
              <span className="text-sm font-bold leading-4">Your Location</span>
            </div>
          </div>
          {/* Search */}
          <div className="flex-1 max-w-4xl flex items-center relative group">
            <div className="absolute inset-0 bg-[#FF9900] rounded-md -m-0.5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
            <div className="relative flex w-full h-10 rounded-md overflow-hidden z-10">
              <button onClick={() => fileInputRef.current?.click()} disabled={isLoading}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 border-r border-gray-300 flex items-center justify-center" title="Upload photo">
                <Camera size={20} />
              </button>
              <button onClick={handleVoiceInput} disabled={isLoading}
                className={`bg-gray-100 hover:bg-gray-200 px-3 border-r border-gray-300 flex items-center justify-center transition-colors ${isListening ? "text-[#CC0C39] animate-pulse" : "text-gray-600"}`}>
                <Mic size={20} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
              <input
                id="amazon-now-search"
                type="text"
                className="flex-1 px-4 text-[#0F1111] focus:outline-none text-[15px]"
                placeholder={isListening ? "🎤 Listening..." : "What do you need? (e.g. I have a fever, movie night...)"}
                value={message}
                onChange={e => setMessage(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading || isListening}
              />
              <button onClick={() => setShowPrefs(p => !p)} title="Budget & People"
                className={`bg-gray-100 hover:bg-gray-200 px-3 border-l border-gray-300 flex items-center justify-center transition-colors ${showPrefs || parsedBudget || parsedPeople > 1 ? "text-[#FF9900]" : "text-gray-600"}`}>
                <SlidersHorizontal size={18} />
              </button>
              <button onClick={handleSendMessage} disabled={isLoading}
                id="search-submit-btn"
                className="bg-[#FEBD69] hover:bg-[#F3A847] px-4 flex items-center justify-center transition-colors text-gray-900">
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
          <button onClick={() => cart && totalQty > 0 && setShowPayment(true)}
            className="flex items-center hover:border-white border border-transparent p-1 rounded cursor-pointer shrink-0 relative">
            <div className="relative flex items-end">
              <ShoppingCart size={32} />
              {totalQty > 0 && (
                <span className="absolute -top-1 left-3.5 text-[#FF9900] font-bold text-[16px] leading-4">{totalQty}</span>
              )}
            </div>
            <span className="text-sm font-bold hidden md:block ml-1 mt-3">Cart</span>
          </button>
        </div>

        {/* ── Preferences panel ── */}
        {showPrefs && (
          <div className="bg-[#1a2433] border-t border-[#2d3f52] px-4 py-3 flex flex-wrap items-center gap-4 animate-fadein">
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wide">Preferences</span>
            {/* Budget */}
            <div className="flex items-center gap-2">
              <IndianRupee size={14} className="text-[#FF9900]" />
              <span className="text-xs text-gray-300">Budget:</span>
              <div className="flex items-center bg-[#131921] border border-[#3a4f62] rounded overflow-hidden">
                <span className="px-2 text-gray-400 text-sm">₹</span>
                <input
                  id="budget-input"
                  type="number"
                  min="0"
                  placeholder="No limit"
                  value={budget}
                  onChange={e => setBudget(e.target.value)}
                  className="bg-transparent text-white text-sm w-24 py-1 pr-2 focus:outline-none placeholder-gray-600"
                />
              </div>
              {parsedBudget && (
                <span className="text-[#FF9900] text-xs font-bold">Max ₹{parsedBudget.toLocaleString("en-IN")}</span>
              )}
            </div>
            {/* People count */}
            <div className="flex items-center gap-2">
              <Users size={14} className="text-[#FF9900]" />
              <span className="text-xs text-gray-300">For:</span>
              <div className="flex items-center bg-[#131921] border border-[#3a4f62] rounded overflow-hidden">
                <input
                  id="people-count-input"
                  type="number"
                  min="1"
                  max="50"
                  value={peopleCount}
                  onChange={e => setPeopleCount(e.target.value)}
                  className="bg-transparent text-white text-sm w-12 py-1 px-2 text-center focus:outline-none"
                />
              </div>
              <span className="text-gray-400 text-xs">people</span>
              {parsedPeople > 1 && (
                <span className="text-[#FF9900] text-xs font-bold">Quantities scaled ×{parsedPeople}</span>
              )}
            </div>
            {/* Smart Saver info */}
            <div className="ml-auto flex items-center gap-1.5 text-[10px] text-gray-500">
              <span className="bg-[#FF9900] text-[#131921] px-1.5 py-0.5 rounded font-black text-[9px]">🏷️ Smart Saver</span>
              near-expiry deals applied automatically
            </div>
          </div>
        )}

        {/* Bottom strip */}
        <div className="bg-[#232F3E] px-4 py-1.5 flex items-center gap-4 text-sm font-medium overflow-x-auto">
          <div className="flex items-center gap-1 cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap">
            <Menu size={18} /> All
          </div>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap">Today's Deals</span>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap">Customer Service</span>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap">Registry</span>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded whitespace-nowrap">Gift Cards</span>
          <span className="ml-auto flex items-center gap-1.5 text-[#FF9900] font-bold whitespace-nowrap">
            <Zap size={14} /> 10-Min Delivery
          </span>
        </div>
      </header>

      {/* ── Content ── */}
      <div className="flex-1 w-full max-w-[1500px] mx-auto pb-12">

        {isLoading && (
          <div>
            <div className="bg-[#007185] text-white px-4 py-2 text-sm text-center flex items-center justify-center gap-2">
              <Sparkles size={16} className="animate-spin" />
              AI building your cart{parsedBudget ? ` (budget: ₹${parsedBudget.toLocaleString("en-IN")})` : ""}
              {parsedPeople > 1 ? ` for ${parsedPeople} people` : ""} — running 7 agents in parallel…
            </div>
            <CartSkeleton />
          </div>
        )}

        {/* ── Homepage ── */}
        {!cart && !isLoading && (
          <div className="animate-fadein">
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
                {/* Feature pills */}
                <div className="flex flex-wrap justify-center gap-2 mt-6">
                  {["🏷️ Smart Saver deals", "💰 Budget-aware", "👥 Scales by headcount", "📸 Vision AI"].map(f => (
                    <span key={f} className="bg-white/10 text-gray-200 text-xs px-3 py-1 rounded-full border border-white/20">{f}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white border-b border-gray-200 px-8 py-4">
              <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-8 text-sm text-center text-[#565959]">
                {[
                  { icon: "🎙️", step: "1. Speak or type your need" },
                  { icon: "⚙️", step: "2. Set budget & headcount (optional)" },
                  { icon: "🤖", step: "3. AI builds the perfect cart" },
                  { icon: "⚡", step: "4. Delivered in 10 minutes" },
                ].map(({ icon, step }) => (
                  <div key={step} className="flex items-center gap-2 font-medium">
                    <span className="text-xl">{icon}</span><span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Scenario cards */}
            <div className="px-6 pt-8 pb-4">
              <h2 className="text-center text-[#0F1111] text-xl font-bold mb-2">Try a scenario instantly</h2>
              <p className="text-center text-[#565959] text-sm mb-6">Click any card — AI will build your cart. Set budget/headcount above for smarter results.</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {SCENARIOS.map(({ emoji, label, query }) => (
                  <button key={query}
                    id={`scenario-${label.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => handleScenario(query)}
                    className="group bg-white border border-[#D5D9D9] hover:border-[#FF9900] hover:shadow-md rounded-xl p-5 flex flex-col items-center gap-3 transition-all duration-200 cursor-pointer hover:-translate-y-0.5">
                    <span className="text-4xl group-hover:scale-110 transition-transform duration-200">{emoji}</span>
                    <span className="text-sm font-semibold text-[#0F1111] text-center leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center mt-4 mb-8 text-[#565959] text-sm">— or type anything custom in the search bar above —</div>

            {/* Features */}
            <div className="bg-white border-t border-b border-gray-200 px-8 py-8 mt-4">
              <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { icon: "🤖", title: "7-Agent Pipeline",    desc: "Parallel agents for intent, context, consumption, inventory, graph, cart, explainability." },
                  { icon: "🏷️", title: "Smart Saver",        desc: "Near-expiry warehouse items flagged automatically with discounts — great for you, reduces Amazon's waste." },
                  { icon: "💰", title: "Budget-Aware AI",     desc: "Set a budget. The Cart Agent will never build a cart that exceeds it — guaranteed by constraint satisfaction." },
                  { icon: "📸", title: "Vision AI (GPT-4o)", desc: "Upload a fridge photo. Our AI detects what's missing and builds your replenishment cart automatically." },
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
          <div className="animate-fadein">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-[#0F1111]">AI-Built Cart</h2>
                <span className="text-sm bg-[#007185]/10 text-[#007185] font-semibold px-2 py-0.5 rounded border border-[#007185]/30">
                  {cart.intent.replace(/_/g, " ").toUpperCase()}
                </span>
                {parsedBudget && (
                  <span className="text-sm bg-[#E8F5E9] text-[#007600] font-semibold px-2 py-0.5 rounded border border-[#C8E6C9]">
                    💰 Budget ₹{parsedBudget.toLocaleString("en-IN")}
                  </span>
                )}
                {parsedPeople > 1 && (
                  <span className="text-sm bg-[#FFF8E1] text-[#E65100] font-semibold px-2 py-0.5 rounded border border-[#FFE082]">
                    👥 {parsedPeople} people
                  </span>
                )}
                {(cart.total_savings ?? 0) > 0 && (
                  <span className="text-sm bg-[#FFF3CD] text-[#856404] font-semibold px-2 py-0.5 rounded border border-[#FFEEBA]">
                    🏷️ You save {fmtINR(cart.total_savings ?? 0)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {totalQty > 0 && (
                  <button id="buy-now-btn" onClick={() => setShowPayment(true)}
                    className="bg-[#FF9900] hover:bg-[#E58800] text-white font-bold px-6 py-2.5 rounded-full shadow transition-colors flex items-center gap-2">
                    <ShoppingCart size={18} />
                    Buy Now ({totalQty} · {fmtINRv(totalPrice)})
                  </button>
                )}
                <button onClick={handleReset} className="text-[#007185] text-sm hover:underline flex items-center gap-1">
                  <RefreshCw size={13} /> New search
                </button>
              </div>
            </div>

            {/* Product grid */}
            <div className="px-6 py-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {cart.items.map(item => (
                <ProductCard key={item.id} item={item}
                  qty={localCart[item.id] ?? 0}
                  onAdd={() => addItem(item.id)}
                  onInc={() => incItem(item.id)}
                  onDec={() => decItem(item.id)}
                />
              ))}
            </div>

            {/* Sticky checkout bar */}
            {totalQty > 0 && (
              <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-bold text-[#0F1111]">{totalQty} item{totalQty !== 1 ? "s" : ""}</span>
                    <span className="text-[#B12704] font-bold ml-4 text-lg">{fmtINRv(totalPrice)}</span>
                  </div>
                  {totalSavings > 0 && (
                    <span className="text-[#007600] text-sm font-bold bg-[#E8F5E9] px-3 py-1 rounded-full border border-[#C8E6C9]">
                      🏷️ Saving {fmtINRv(totalSavings)}
                    </span>
                  )}
                </div>
                <button id="sticky-checkout-btn" onClick={() => setShowPayment(true)}
                  className="bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] font-bold px-8 py-2.5 rounded-full shadow transition-colors">
                  Proceed to Checkout →
                </button>
              </div>
            )}

            {/* AI Reasoning */}
            <div className="px-6 pb-32">
              <div className="max-w-3xl bg-[#F7F7F7] border border-[#D5D9D9] p-5 rounded shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#007185]" />
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <span className="bg-[#007185] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">LANGGRAPH</span>
                  <span className="bg-[#232F3E] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">GPT-4o</span>
                  <span className="font-bold text-[#0F1111] ml-1">AI Pipeline Trace</span>
                </div>
                <ul className="space-y-3">
                  {cart.explainability.map((exp, i) => (
                    <li key={i} className="text-sm text-[#0F1111] flex gap-3 items-start">
                      <ChevronRight size={16} className="text-[#007185] mt-0.5 shrink-0" />
                      <span className="leading-snug">{exp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="w-full bg-[#232F3E] text-white py-8 mt-auto flex flex-col items-center">
        <div className="flex gap-8 text-sm font-medium mb-6 flex-wrap justify-center px-4">
          <span className="hover:underline cursor-pointer">Conditions of Use</span>
          <span className="hover:underline cursor-pointer">Privacy Notice</span>
          <span className="hover:underline cursor-pointer">Your Ads Privacy Choices</span>
        </div>
        <div className="text-xs text-gray-400 text-center px-4">
          Amazon Now AI — Built for Amazon HackOn Season 6 · Theme: Reimagining Urgent Shopping
        </div>
        <div className="text-xs text-gray-500 mt-1">© 1996-2026, Amazon.com, Inc. or its affiliates</div>
      </footer>
    </main>
  );
}

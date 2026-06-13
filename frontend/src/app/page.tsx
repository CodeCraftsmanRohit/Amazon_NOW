"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Search, ShoppingCart, MapPin, Menu, ChevronRight, Mic } from "lucide-react";

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

function getProductEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("chocolate") || n.includes("cocoa") || n.includes("ghirardelli")) return "🍫";
  if (n.includes("flour") || n.includes("baking powder") || n.includes("yeast")) return "🌾";
  if (n.includes("butter")) return "🧈";
  if (n.includes("egg")) return "🥚";
  if (n.includes("milk") || n.includes("cream") || n.includes("dairy")) return "🥛";
  if (n.includes("cheese")) return "🧀";
  if (n.includes("chip") || n.includes("crisp") || n.includes("snack") || n.includes("popcorn")) return "🍟";
  if (n.includes("cola") || n.includes("soda") || n.includes("pepsi") || n.includes("drink")) return "🥤";
  if (n.includes("cup") || n.includes("plate") || n.includes("paper")) return "🧻";
  if (n.includes("pasta") || n.includes("spaghetti") || n.includes("noodle")) return "🍝";
  if (n.includes("sauce") || n.includes("marinara") || n.includes("ketchup")) return "🫙";
  if (n.includes("coffee")) return "☕";
  if (n.includes("tea")) return "🍵";
  if (n.includes("bread") || n.includes("bun") || n.includes("toast")) return "🍞";
  if (n.includes("chicken") || n.includes("meat") || n.includes("beef")) return "🍗";
  if (n.includes("fish") || n.includes("tuna") || n.includes("salmon")) return "🐟";
  if (n.includes("rice")) return "🍚";
  if (n.includes("vegetable") || n.includes("spinach") || n.includes("broccoli")) return "🥦";
  if (n.includes("tomato")) return "🍅";
  if (n.includes("sugar") || n.includes("honey")) return "🍯";
  if (n.includes("oil") || n.includes("olive")) return "🫒";
  if (n.includes("juice") || n.includes("orange")) return "🧃";
  if (n.includes("water") || n.includes("sparkling")) return "💧";
  if (n.includes("ice cream") || n.includes("gelato")) return "🍦";
  if (n.includes("cake") || n.includes("muffin") || n.includes("brownie")) return "🎂";
  if (n.includes("apple")) return "🍎";
  if (n.includes("banana")) return "🍌";
  if (n.includes("lemon") || n.includes("lime")) return "🍋";
  return "📦";
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#CC0C39] text-white px-6 py-3 rounded shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 font-bold">
      <span>⚠️</span>
      <span>{message}</span>
      <button onClick={onClose} className="hover:text-gray-200 ml-2">✕</button>
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

function CheckoutModal({ total, onClose }: { total: number; onClose: () => void }) {
  const orderId = `AMZ-NOW-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 800);
    const t2 = setTimeout(() => setStep(2), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200 animate-in zoom-in-95 duration-300">
        <div className="text-center mb-6">
          <div className="text-[#007600] text-5xl mb-2">✓</div>
          <h2 className="text-2xl font-bold text-[#0F1111]">Order placed, thanks!</h2>
          <p className="text-sm text-gray-600 mt-1">Confirmation will be sent to your email.</p>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-3 text-sm mb-6">
          <div className="flex justify-between">
            <span className="font-bold text-gray-700">Order number:</span>
            <span className="text-[#007185]">{orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-700">Order total:</span>
            <span className="text-[#B12704] font-bold">${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold text-gray-700">Delivery:</span>
            <span className="text-[#007600] font-bold">In 10 Minutes</span>
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
                <div className={`w-4 h-4 rounded-full border-2 z-10 transition-colors ${done ? "bg-[#007600] border-[#007600]" : "bg-white border-gray-300"}`} />
                {i !== 2 && <div className={`w-0.5 h-8 -mt-1 ${step > i ? "bg-[#007600]" : "bg-gray-200"}`} />}
              </div>
              <div>
                <div className={`font-bold text-sm ${done ? "text-[#0F1111]" : "text-gray-400"}`}>{label}</div>
                <div className={`text-xs ${done ? "text-gray-600" : "text-gray-300"}`}>{detail}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full amazon-btn-primary py-2.5 rounded-full font-bold shadow-sm"
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [cart, setCart] = useState<SmartCartResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);

  const handleVoiceInput = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setToast("Voice search is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      setMessage(""); // Clear input while listening
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      setToast("Voice recognition failed. Please try again.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    setCart(null);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Backend error");
      const data = await res.json();
      setCart(data);
    } catch (e) {
      setToast("AI is warming up, please try again in a moment.");
    } finally {
      setIsLoading(false);
    }
  };

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
    } catch (error) {
      setToast("Vision AI could not process the image. Please try again.");
    } finally {
      setIsLoading(false);
      e.target.value = "";
    }
  };

  const total = cart?.items.reduce((acc, item) => acc + item.price * item.quantity, 0) ?? 0;

  return (
    <main className="min-h-screen font-sans flex flex-col bg-[#EAEDED]">
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      {showCheckout && <CheckoutModal total={total} onClose={() => setShowCheckout(false)} />}

      {/* Classic Amazon Navbar */}
      <header className="w-full bg-[#131921] text-white flex flex-col">
        {/* Top row */}
        <div className="flex items-center justify-between px-4 py-2 gap-4">
          <div className="flex items-center cursor-pointer hover:border-white border border-transparent p-1 rounded">
            <span className="font-bold text-2xl tracking-tighter">Amazon Now</span>
            <span className="text-[#FF9900] ml-1 text-sm font-bold">AI</span>
          </div>

          <div className="hidden md:flex items-center hover:border-white border border-transparent p-1 rounded cursor-pointer">
            <MapPin size={18} className="mr-1 text-gray-300" />
            <div className="flex flex-col">
              <span className="text-[11px] text-gray-300 leading-3">Deliver to Rohit</span>
              <span className="text-sm font-bold leading-4">Seattle 98109</span>
            </div>
          </div>

          <div className="flex-1 max-w-4xl flex items-center relative group">
            <div className="absolute inset-0 bg-[#FF9900] rounded-md -m-0.5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex w-full h-10 rounded-md overflow-hidden z-10">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 border-r border-gray-300 flex items-center justify-center transition-colors"
                title="Upload Fridge/Pantry Photo"
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
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileUpload}
              />
              <input
                type="text"
                className="flex-1 px-4 text-[#0F1111] focus:outline-none text-[15px]"
                placeholder={isListening ? "Listening..." : "What do you need? (e.g. Baking a cake, hosting friends...)"}
                value={message || ""}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                disabled={isLoading || isListening}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="bg-[#FEBD69] hover:bg-[#F3A847] px-4 flex items-center justify-center transition-colors text-gray-900 disabled:opacity-80"
              >
                <Search size={22} />
              </button>
            </div>
          </div>

          <div className="hidden md:flex flex-col hover:border-white border border-transparent p-1 rounded cursor-pointer">
            <span className="text-[11px] text-gray-300 leading-3">Hello, Rohit</span>
            <span className="text-sm font-bold leading-4">Account & Lists</span>
          </div>

          <div className="flex items-center hover:border-white border border-transparent p-1 rounded cursor-pointer">
            <div className="relative flex items-end">
              <ShoppingCart size={32} />
              <span className="absolute -top-1 left-3.5 text-[#FF9900] font-bold text-[16px] leading-4">
                {cart ? cart.items.length : 0}
              </span>
            </div>
            <span className="text-sm font-bold hidden md:block ml-1 mt-3">Cart</span>
          </div>
        </div>

        {/* Bottom row */}
        <div className="bg-[#232F3E] px-4 py-1.5 flex items-center gap-4 text-sm font-medium">
          <div className="flex items-center gap-1 cursor-pointer hover:border-white border border-transparent p-1 rounded">
            <Menu size={18} /> All
          </div>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded">Today's Deals</span>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded">Customer Service</span>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded">Registry</span>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded">Gift Cards</span>
          <span className="cursor-pointer hover:border-white border border-transparent p-1 rounded">Sell</span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-[1500px] mx-auto pb-12">
        
        {/* Loading Skeleton */}
        {isLoading && <CartSkeleton />}

        {/* Empty State Banner (Only when no cart and not loading) */}
        {!cart && !isLoading && (
          <div className="w-full relative bg-white px-8 py-16 text-center border-b border-gray-200 shadow-sm animate-in fade-in duration-500">
            <h1 className="text-4xl font-bold text-[#0F1111] mb-4">Skip the Search. Fulfill the Need.</h1>
            <p className="text-lg text-[#565959] max-w-2xl mx-auto mb-8">
              Tell Amazon Now AI what you are planning, or upload a photo of your empty fridge. Our LangGraph pipeline will instantly build your optimal cart.
            </p>
            <div className="flex justify-center gap-4">
              <button onClick={() => { setMessage("I need to bake a chocolate cake right now"); handleSendMessage(); }} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm text-[#0F1111] transition-colors">
                Try "Bake a chocolate cake"
              </button>
              <button onClick={() => { setMessage("Hosting a movie night for 4 people"); handleSendMessage(); }} className="px-6 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-sm text-[#0F1111] transition-colors">
                Try "Movie night for 4"
              </button>
            </div>
          </div>
        )}

        {/* Smart Cart Results */}
        {!isLoading && cart && (
          <div className="px-4 py-6 grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_340px] gap-6 animate-in slide-in-from-bottom-8 duration-500">
            
            {/* Left Column: Cart Items */}
            <div className="amazon-card p-6">
              <div className="border-b border-gray-200 pb-4 mb-4 flex justify-between items-end">
                <h2 className="text-3xl font-normal text-[#0F1111]">Shopping Cart</h2>
                <span className="text-[#565959] text-sm hidden sm:block">Price</span>
              </div>

              <div className="flex flex-col gap-4">
                {cart.items.map((item, index) => (
                  <div key={item.id} className="flex gap-6 py-4 border-b border-gray-100 group animate-in fade-in slide-in-from-left-8 fill-mode-both duration-500" style={{ animationDelay: `${index * 150}ms` }}>
                    <div className="w-[180px] h-[180px] bg-[#F7F7F7] border border-gray-200 rounded flex items-center justify-center flex-shrink-0 group-hover:border-[#007185] transition-colors">
                      <span className="text-[100px] hover:scale-110 transition-transform duration-300">{getProductEmoji(item.name)}</span>
                    </div>
                    
                    <div className="flex-grow flex flex-col justify-start">
                      <div className="flex justify-between items-start">
                        <div className="max-w-[500px]">
                          <h3 className="text-[18px] text-[#007185] font-medium leading-tight hover:text-[#C7511F] hover:underline cursor-pointer mb-1 transition-colors">
                            {item.name}
                          </h3>
                          <div className="text-xs text-[#007600] font-bold mb-1">In Stock</div>
                          <div className="text-xs text-[#565959] flex items-center gap-1 mb-2">
                            <span className="text-[#0F1111] font-bold">Prime</span>
                            <span>FREE Delivery by</span>
                            <span className="font-bold text-[#0F1111]">Amazon Prime Air</span>
                          </div>
                          <div className="text-xs text-[#565959] flex items-center gap-1 mb-4">
                            <input type="checkbox" className="mr-1 cursor-pointer" defaultChecked />
                            This is a gift <span className="text-[#007185] hover:underline cursor-pointer ml-1 transition-colors">Learn more</span>
                          </div>

                          <div className="flex items-center gap-3">
                            <select className="bg-[#F0F2F2] border border-[#D5D9D9] rounded py-1 px-2 text-sm shadow-sm cursor-pointer hover:bg-[#E3E6E6] transition-colors">
                              <option>Qty: {item.quantity}</option>
                              <option>1</option>
                              <option>2</option>
                            </select>
                            <span className="text-gray-300">|</span>
                            <span className="text-[#007185] text-xs hover:underline cursor-pointer transition-colors">Delete</span>
                            <span className="text-gray-300">|</span>
                            <span className="text-[#007185] text-xs hover:underline cursor-pointer transition-colors">Save for later</span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-[18px] font-bold text-[#0F1111]">
                            ${(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {item.reasoning && (
                        <div className="mt-4 bg-[#F0F8FF] border border-[#A6C8FF] p-3 rounded text-sm text-[#0F1111] flex items-start gap-2 shadow-sm">
                          <span className="text-[#007185] font-bold flex-shrink-0">AI Tip:</span>
                          <span className="text-[#565959]">{item.reasoning}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right mt-4 text-[18px] animate-in fade-in duration-700" style={{ animationDelay: '500ms' }}>
                Subtotal ({cart.items.length} items): <span className="font-bold text-[#0F1111]">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Right Column: Checkout & AI Reasoning */}
            <div className="flex flex-col gap-6">
              
              {/* Checkout Box */}
              <div className="amazon-card p-5 animate-in slide-in-from-right-8 duration-700">
                <div className="text-[18px] mb-4">
                  Subtotal ({cart.items.length} items): <span className="font-bold text-[#0F1111]">${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mb-5 text-[#0F1111]">
                  <input type="checkbox" className="w-4 h-4 cursor-pointer" />
                  <span>This order contains a gift</span>
                </div>
                
                <button 
                  onClick={() => setShowCheckout(true)}
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] py-2 rounded-full font-normal shadow-sm mb-3 transition-colors"
                >
                  Proceed to checkout
                </button>
              </div>

              {/* AI Reasoning Trace */}
              <div className="bg-[#F7F7F7] border border-[#D5D9D9] p-4 rounded shadow-sm relative overflow-hidden animate-in slide-in-from-right-8 duration-700" style={{ animationDelay: '200ms' }}>
                <div className="absolute top-0 left-0 w-1 h-full bg-[#007185]" />
                <div className="flex items-center flex-wrap gap-2 mb-3">
                  <span className="bg-[#007185] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">LANGGRAPH</span>
                  <span className="bg-[#232F3E] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">AMAZON BEDROCK</span>
                  <h4 className="font-bold text-[#0F1111] ml-1">AI Pipeline Trace</h4>
                </div>
                <div className="text-xs text-[#565959] mb-4 pb-3 border-b border-gray-200">
                  <span className="font-bold text-[#0F1111]">Intent:</span> {cart.intent.toUpperCase()}
                </div>
                <ul className="space-y-4">
                  {cart.explainability.map((exp, i) => (
                    <li key={i} className="text-sm text-[#0F1111] flex gap-3 items-start animate-in fade-in slide-in-from-right-4 fill-mode-both" style={{ animationDelay: `${i * 150}ms` }}>
                      <div className="mt-0.5">
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

      {/* Footer */}
      <footer className="w-full bg-[#232F3E] text-white py-8 mt-auto flex flex-col items-center">
        <div className="flex gap-8 text-sm font-medium mb-6">
          <span className="hover:underline cursor-pointer">Conditions of Use</span>
          <span className="hover:underline cursor-pointer">Privacy Notice</span>
          <span className="hover:underline cursor-pointer">Your Ads Privacy Choices</span>
        </div>
        <div className="text-xs text-gray-400">
          © 1996-2026, Amazon.com, Inc. or its affiliates
        </div>
      </footer>
    </main>
  );
}

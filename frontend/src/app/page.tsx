"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Search, ShoppingCart, MapPin, Sparkles, Zap, X,
  ArrowLeft, Mic, Camera, Users, IndianRupee,
  SlidersHorizontal, Star, Truck, CheckCircle, Clock,
  Menu, Wand2, ChevronRight, ChevronDown, Package,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────
const toINR   = (usd: number) => Math.round(usd * 83.5);
const fmtINR  = (usd: number) => `₹${toINR(usd).toLocaleString("en-IN")}`;
const fmtINRv = (inr: number) => `₹${Math.round(inr).toLocaleString("en-IN")}`;

// ── Demo personas (hardcoded — always visible, no API dependency) ─────────────
const PERSONAS: UserPersona[] = [
  { user_id: "priya_sharma",     name: "Priya",   avatar: "👩‍💼", label: "Working Professional", bio: "Cooks Italian twice a week, movie nights on Fridays" },
  { user_id: "rahul_new_parent", name: "Rahul",   avatar: "👨‍👧", label: "New Parent",           bio: "First-time dad, always stocking baby essentials and quick meals" },
  { user_id: "aisha_student",    name: "Aisha",   avatar: "🎓",  label: "College Student",       bio: "Late-night study sessions, tight budget, loves snacks" },
  { user_id: "krishna_host",     name: "Krishna", avatar: "🎉",  label: "Party Host",            bio: "Loves hosting large groups — snacks, drinks, party food" },
  { user_id: "meera_baker",      name: "Meera",   avatar: "🧁",  label: "Home Baker",            bio: "Bakes every weekend — Ghirardelli chocolate, Kerrygold butter, always low on sugar" },
];

// ─── Product images ────────────────────────────────────────────────────────
const PIMG: Record<string, string> = {
  // ── Baking ──────────────────────────────────────────────────────────────
  P001: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=400&h=400&fit=crop", // chocolate chips
  P002: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&h=400&fit=crop", // flour bag
  P003: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&h=400&fit=crop", // butter block
  P004: "https://images.unsplash.com/photo-1506976785307-8732e854ad03?w=400&h=400&fit=crop", // eggs
  P005: "https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=400&h=400&fit=crop", // sugar
  P006: "https://images.unsplash.com/photo-1612201289071-70cdb0e07566?w=400&h=400&fit=crop", // baking powder tin
  P007: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=400&fit=crop", // cocoa powder
  P008: "https://images.unsplash.com/photo-1598103442097-8b74394b95c4?w=400&h=400&fit=crop", // vanilla extract bottle
  // ── Dairy ───────────────────────────────────────────────────────────────
  P009: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400&h=400&fit=crop", // milk jug
  P019: "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400&h=400&fit=crop", // parmesan cheese shaker
  P040: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=400&fit=crop", // yogurt cups
  // ── Pasta & Sauces ──────────────────────────────────────────────────────
  P016: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=400&fit=crop", // dry spaghetti
  P017: "https://images.unsplash.com/photo-1589367920969-ab8e050bbb04?w=400&h=400&fit=crop", // marinara sauce jar
  P018: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&h=400&fit=crop", // tomato pasta sauce
  // ── Bread ───────────────────────────────────────────────────────────────
  P020: "https://source.unsplash.com/featured/400x400/?garlic,bread,food", // garlic bread
  P034: "https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400&h=400&fit=crop", // sliced wheat bread
  // ── Snacks ──────────────────────────────────────────────────────────────
  P010: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=400&h=400&fit=crop", // popcorn
  P011: "https://images.unsplash.com/photo-1600952841320-db92ec4047ca?w=400&h=400&fit=crop", // doritos chips bag
  P015: "https://images.unsplash.com/photo-1536816579748-4ecb3f03d72a?w=400&h=400&fit=crop", // mixed nuts
  P022: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop", // lays chips
  P050: "https://images.unsplash.com/photo-1610614819513-58e34989848b?w=400&h=400&fit=crop", // fruit snacks
  // ── Candy & Chocolate ───────────────────────────────────────────────────
  P014: "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=400&h=400&fit=crop", // ferrero rocher box
  P023: "https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=400&h=400&fit=crop", // m&ms
  // ── Beverages ───────────────────────────────────────────────────────────
  P012: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&h=400&fit=crop", // coca cola cans
  P013: "https://images.unsplash.com/photo-1629203851122-3726555cf5a2?w=400&h=400&fit=crop", // pepsi cans
  P021: "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&h=400&fit=crop", // sparkling water bottles
  P025: "https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=400&h=400&fit=crop", // red bull cans
  P030: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&h=400&fit=crop", // gatorade bottles
  P033: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop", // coffee beans/bag
  P037: "https://images.unsplash.com/photo-1621506289937-a8e7ac0dfd3a?w=400&h=400&fit=crop", // orange juice carton
  P045: "https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=400&h=400&fit=crop", // instant coffee jar
  // ── Tea ─────────────────────────────────────────────────────────────────
  P032: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop", // tea bags box
  // ── Medicine ────────────────────────────────────────────────────────────
  P026: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop", // advil pills bottle
  P027: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop", // tylenol bottle
  P028: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop", // dayquil liquid
  P029: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=400&h=400&fit=crop", // vicks vapo rub
  // ── Canned / Soup ───────────────────────────────────────────────────────
  P031: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=400&fit=crop", // chicken noodle soup cans
  // ── Breakfast ───────────────────────────────────────────────────────────
  P038: "https://images.unsplash.com/photo-1598373182133-52452f7691ef?w=400&h=400&fit=crop", // corn flakes cereal box
  P039: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?w=400&h=400&fit=crop", // oatmeal packets
  // ── Condiments ──────────────────────────────────────────────────────────
  P035: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&h=400&fit=crop", // peanut butter jar
  P036: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop", // strawberry jam jar
  P046: "https://images.unsplash.com/photo-1611251135345-18c56206b863?w=400&h=400&fit=crop", // ketchup bottle
  P047: "https://images.unsplash.com/photo-1626200419199-391ae4be7a41?w=400&h=400&fit=crop", // mayonnaise jar
  // ── Frozen ──────────────────────────────────────────────────────────────
  P024: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=400&fit=crop", // pizza box
  P048: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=400&fit=crop", // ice cream tub
  P049: "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?w=400&h=400&fit=crop", // vanilla ice cream scoop
  // ── Baby ────────────────────────────────────────────────────────────────
  P041: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&h=400&fit=crop", // baby wipes pack
  P042: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop", // diapers pack
  P043: "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400&h=400&fit=crop", // baby shampoo bottle
  P044: "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop", // baby formula tin
};

function getImg(id: string) {
  return PIMG[id] || `https://picsum.photos/seed/${parseInt(id.replace("P",""))*17}/400/400`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
interface CartItem {
  id: string; name: string; price: number; quantity: number;
  image_url: string; reasoning?: string;
  original_price?: number; savings?: number; is_smart_saver?: boolean;
}
interface SmartCartResponse {
  intent: string; context: Record<string, string>;
  items: CartItem[]; explainability: string[];
  total_cost?: number; total_savings?: number;
  processing_time_ms?: number;
  personalised?: boolean;
}

interface UserPersona {
  user_id: string; name: string; avatar: string;
  label: string; bio: string;
}
type LocalCart = Record<string, number>;
type PageMode = "home" | "ai" | "results" | "cart";

// ─── Static catalog data ──────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Vegetables",    emoji: "🥦", bg: "#e8f5e9" },
  { name: "Fruits",        emoji: "🍎", bg: "#fce4ec" },
  { name: "Dairy & Eggs",  emoji: "🥛", bg: "#e3f2fd" },
  { name: "Snacks",        emoji: "🍿", bg: "#fff9c4" },
  { name: "Beverages",     emoji: "🥤", bg: "#e8eaf6" },
  { name: "Staples",       emoji: "🌾", bg: "#fff3e0" },
  { name: "Medicine",      emoji: "💊", bg: "#fce4ec" },
  { name: "Baby Care",     emoji: "👶", bg: "#f3e5f5" },
  { name: "Frozen",        emoji: "🧊", bg: "#e1f5fe" },
  { name: "Bakery",        emoji: "🍞", bg: "#fbe9e7" },
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

// Homepage product sections — more like real Amazon
const HOME_SECTIONS = [
  {
    title: "Customers' Most Loved",
    subtitle: "Top picks based on orders",
    products: [
      { id:"P010", name:"Movie Theater Butter Popcorn 6-Pack", price:4.49, rating:4.5, reviews:2847 },
      { id:"P014", name:"Ferrero Rocher Chocolate Box (24pc)",  price:12.99, rating:4.9, reviews:8921 },
      { id:"P033", name:"Starbucks Pike Place Ground Coffee",   price:9.99, rating:4.7, reviews:6234 },
      { id:"P015", name:"Planters Mixed Nuts (18.25oz)",        price:8.99, rating:4.6, reviews:3210 },
      { id:"P023", name:"M&Ms Party Size Milk Chocolate",       price:11.99, rating:4.8, reviews:5543 },
      { id:"P037", name:"Tropicana Orange Juice No Pulp",       price:5.49, rating:4.5, reviews:2890 },
    ],
  },
  {
    title: "Under ₹500 | Best Value Picks",
    subtitle: "Great quality, unbeatable price",
    products: [
      { id:"P046", name:"Heinz Tomato Ketchup (32oz)",         price:3.99, rating:4.7, reviews:12340 },
      { id:"P022", name:"Lay's Classic Potato Chips (8oz)",    price:3.49, rating:4.5, reviews:5821 },
      { id:"P034", name:"Nature's Own Honey Wheat Bread",      price:3.49, rating:4.4, reviews:1823, ss:true, disc:25 },
      { id:"P032", name:"Lipton Tea Bags (100ct)",             price:5.99, rating:4.6, reviews:4230 },
      { id:"P039", name:"Quaker Instant Oatmeal Variety Pack", price:6.99, rating:4.7, reviews:7821, ss:true, disc:10 },
      { id:"P047", name:"Hellmann's Real Mayonnaise (30oz)",   price:5.79, rating:4.6, reviews:3412 },
    ],
  },
  {
    title: "Best Sellers in Health & Medicine",
    subtitle: "Trusted by millions of customers",
    products: [
      { id:"P026", name:"Advil Ibuprofen 200mg (50ct)",        price:8.99, rating:4.8, reviews:12340 },
      { id:"P027", name:"Tylenol Extra Strength 500mg (100ct)",price:9.49, rating:4.7, reviews:9870 },
      { id:"P028", name:"DayQuil Cold & Flu Liquid (12oz)",    price:11.99, rating:4.6, reviews:6540 },
      { id:"P029", name:"Vicks VapoRub Ointment (6oz)",        price:8.49, rating:4.8, reviews:8210 },
      { id:"P030", name:"Gatorade Thirst Quencher 12-Pack",    price:10.99, rating:4.5, reviews:3210 },
      { id:"P031", name:"Campbell's Chicken Noodle Soup 6-Pack",price:7.99, rating:4.7, reviews:5430 },
    ],
  },
  {
    title: "Fresh Dairy & Breakfast",
    subtitle: "Start your day right",
    products: [
      { id:"P009", name:"Organic Valley Whole Milk (1 Gallon)",  price:4.49, rating:4.7, reviews:3412, ss:true, disc:25 },
      { id:"P003", name:"Kerrygold Unsalted Butter (8oz)",       price:3.19, rating:4.8, reviews:6820, ss:true, disc:20 },
      { id:"P004", name:"Vital Farms Pasture-Raised Eggs (12ct)",price:4.67, rating:4.7, reviews:4321, ss:true, disc:15 },
      { id:"P040", name:"Chobani Greek Yogurt Variety Pack",     price:9.59, rating:4.6, reviews:5621, ss:true, disc:20 },
      { id:"P038", name:"Kellogg's Corn Flakes Cereal (18oz)",   price:4.31, rating:4.4, reviews:3421, ss:true, disc:10 },
      { id:"P035", name:"Skippy Creamy Peanut Butter (16.3oz)",  price:4.29, rating:4.7, reviews:7821 },
    ],
  },
  {
    title: "Party & Celebration Picks",
    subtitle: "Everything you need for a great party",
    products: [
      { id:"P012", name:"Coca-Cola Classic 12-Pack Cans",        price:7.49, rating:4.8, reviews:15230 },
      { id:"P011", name:"Doritos Nacho Cheese Party Size",       price:5.79, rating:4.6, reviews:8754 },
      { id:"P021", name:"Sparkling Ice Variety Pack (12 bottles)",price:9.99, rating:4.5, reviews:3210 },
      { id:"P050", name:"Welch's Fruit Snacks Mixed Fruit (40pc)",price:8.99, rating:4.7, reviews:4310 },
      { id:"P025", name:"Red Bull Energy Drink 4-Pack",          price:9.99, rating:4.5, reviews:6230 },
      { id:"P013", name:"Pepsi 12-Pack Cans",                    price:7.29, rating:4.6, reviews:12840 },
    ],
  },
  {
    title: "🏷️ Smart Saver Deals | Near-Expiry, Big Discounts",
    subtitle: "Same great quality · Better price · Reduces waste",
    highlight: true,
    products: [
      { id:"P020", name:"DeLallo Garlic Bread Loaf (16oz)",      price:2.79, rating:4.5, reviews:1820, ss:true, disc:30, orig:3.99 },
      { id:"P048", name:"Ben & Jerry's Chunky Monkey Ice Cream", price:5.09, rating:4.8, reviews:4521, ss:true, disc:15, orig:5.99 },
      { id:"P049", name:"Häagen-Dazs Vanilla Ice Cream (14oz)", price:4.67, rating:4.7, reviews:3210, ss:true, disc:15, orig:5.49 },
      { id:"P019", name:"Kraft Parmesan Cheese Shaker (8oz)",    price:3.82, rating:4.6, reviews:2340, ss:true, disc:15, orig:4.49 },
      { id:"P024", name:"DiGiorno Pepperoni Pizza (28oz)",       price:5.59, rating:4.4, reviews:3120, ss:true, disc:20, orig:6.99 },
      { id:"P036", name:"Smucker's Strawberry Jam (18oz)",       price:3.99, rating:4.5, reviews:2100 },
    ],
  },
];

// ─── Occasion Packs (hardcoded demo carts) ───────────────────────────────────
interface PackItem { id: string; name: string; price: number; qty: number; }
interface OccasionPack {
  emoji: string; label: string; tag: string;
  color: string; textColor: string;
  items: PackItem[];
}

const OCCASION_PACKS: OccasionPack[] = [
  {
    emoji: "🍿", label: "Movie Night", tag: "Most Popular",
    color: "#1a1a2e", textColor: "#FF9900",
    items: [
      { id:"P010", name:"Orville Redenbacher Popcorn 6-Pack", price:4.49, qty:2 },
      { id:"P012", name:"Coca-Cola Classic 12-Pack",          price:7.49, qty:1 },
      { id:"P011", name:"Doritos Nacho Cheese Party Size",    price:5.79, qty:1 },
      { id:"P023", name:"M&Ms Party Size Milk Chocolate",     price:11.99, qty:1 },
      { id:"P048", name:"Ben & Jerry's Chunky Monkey",        price:5.09, qty:1 }, // Smart Saver
    ],
  },
  {
    emoji: "🎂", label: "Bake a Cake", tag: "Weekend Special",
    color: "#3e1f47", textColor: "#e879f9",
    items: [
      { id:"P001", name:"Ghirardelli Chocolate Chips (12oz)", price:4.99, qty:2 },
      { id:"P003", name:"Kerrygold Unsalted Butter (8oz)",    price:3.19, qty:2 }, // Smart Saver
      { id:"P004", name:"Vital Farms Eggs (12ct)",            price:4.67, qty:1 }, // Smart Saver
      { id:"P005", name:"Domino Granulated Sugar (4lb)",      price:3.29, qty:1 },
      { id:"P007", name:"Hershey's Cocoa Powder (8oz)",       price:3.79, qty:1 },
    ],
  },
  {
    emoji: "🤒", label: "Sick Day Kit", tag: "Emergency",
    color: "#1a2e1a", textColor: "#4ade80",
    items: [
      { id:"P026", name:"Advil Ibuprofen 200mg (50ct)",       price:8.99, qty:1 },
      { id:"P027", name:"Tylenol Extra Strength (100ct)",     price:9.49, qty:1 },
      { id:"P031", name:"Campbell's Chicken Soup 6-Pack",     price:7.99, qty:1 },
      { id:"P030", name:"Gatorade Variety 12-Pack",           price:10.99, qty:1 },
      { id:"P032", name:"Lipton Tea Bags (100ct)",            price:5.99, qty:1 },
    ],
  },
  {
    emoji: "🎉", label: "Party Pack", tag: "For 10+ People",
    color: "#2e1a1a", textColor: "#f97316",
    items: [
      { id:"P012", name:"Coca-Cola Classic 12-Pack",          price:7.49, qty:2 },
      { id:"P011", name:"Doritos Nacho Cheese Party Size",    price:5.79, qty:2 },
      { id:"P015", name:"Planters Mixed Nuts (18.25oz)",      price:8.99, qty:2 },
      { id:"P014", name:"Ferrero Rocher Chocolate Box (24pc)",price:12.99, qty:1 },
      { id:"P021", name:"Sparkling Ice Variety Pack",         price:9.99, qty:1 },
    ],
  },
  {
    emoji: "🍝", label: "Italian Dinner", tag: "Date Night",
    color: "#1a1e2e", textColor: "#60a5fa",
    items: [
      { id:"P016", name:"Barilla Spaghetti Pasta (16oz)",     price:1.89, qty:2 },
      { id:"P017", name:"Rao's Homemade Marinara (24oz)",     price:8.49, qty:1 },
      { id:"P019", name:"Kraft Parmesan Shaker (8oz)",        price:3.82, qty:1 }, // Smart Saver
      { id:"P020", name:"DeLallo Garlic Bread Loaf (16oz)",   price:2.79, qty:1 }, // Smart Saver
      { id:"P021", name:"Sparkling Ice Variety Pack",         price:9.99, qty:1 },
    ],
  },
];

// ─── Star rating ─────────────────────────────────────────────────────────────
function Stars({ r, n }: { r: number; n: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11} className={i <= Math.round(r) ? "fill-[#FF9900] text-[#FF9900]" : "fill-gray-200 text-gray-200"} />
      ))}
      <span className="text-[11px] text-[#007185] ml-0.5">{n.toLocaleString("en-IN")}</span>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] bg-[#CC0C39] text-white px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 font-bold text-sm">
      ⚠️ <span>{msg}</span>
      <button onClick={onClose}><X size={14} /></button>
    </div>
  );
}

// ─── FIX 3: Amazon.in exact header ───────────────────────────────────────────
function AmazonNavbar({ cartCount, onLogoClick, onCartClick }: {
  cartCount: number; onLogoClick: () => void; onCartClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Primary bar */}
      <div className="bg-[#131921] flex items-center px-2 sm:px-3 md:px-4 py-1.5 gap-1 sm:gap-2 md:gap-3 min-h-[56px]">
        {/* Logo */}
        <button onClick={onLogoClick}
          className="flex flex-col items-start hover:outline hover:outline-1 hover:outline-white p-1 rounded shrink-0">
          <div className="flex items-end">
            <span className="text-white font-bold text-[22px] leading-none tracking-tighter font-serif">amazon</span>
            <span className="text-white font-bold text-[14px] leading-none">.in</span>
          </div>
          {/* Orange arrow under amazon */}
          <div className="w-[62px] h-[3px] rounded-full mt-0.5 ml-0.5" style={{ background: "linear-gradient(90deg, transparent 10%, #FF9900 40%, #FF9900 60%, transparent 90%)" }} />
          <div className="flex items-center mt-0.5 ml-10">
            <span className="bg-[#FF9900] text-[#131921] text-[8px] font-black px-1 py-0.5 rounded leading-none">NOW AI</span>
          </div>
        </button>

        {/* Deliver to — hidden on mobile */}
        <div className="hidden md:flex flex-col items-start hover:outline hover:outline-1 hover:outline-white p-1 rounded cursor-pointer shrink-0 min-w-[90px]">
          <span className="text-gray-300 text-[11px] leading-tight">Deliver to</span>
          <div className="flex items-center gap-1 text-white font-bold text-[13px] leading-tight">
            <MapPin size={14} className="text-white shrink-0" />
            <span>India</span>
          </div>
        </div>

        {/* Search bar */}
        <div className="flex-1 flex rounded-md overflow-hidden min-w-0 h-10">
          {/* Category dropdown — show on sm+ */}
          <div className="hidden sm:flex items-center bg-[#f3f3f3] border-r border-gray-300 px-2 gap-1 cursor-pointer hover:bg-gray-200 shrink-0">
            <span className="text-[12px] text-gray-700 whitespace-nowrap">Amazon Fresh</span>
            <ChevronDown size={12} className="text-gray-700" />
          </div>
          <input
            placeholder="Search Amazon.in"
            readOnly
            className="flex-1 bg-white px-3 text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none min-w-0 cursor-default"
          />
          <button className="bg-[#FEBD69] hover:bg-[#F3A847] px-3 sm:px-4 flex items-center justify-center shrink-0 transition-colors">
            <Search size={20} className="text-gray-800" />
          </button>
        </div>

        {/* Language — show on lg+ */}
        <div className="hidden lg:flex items-center gap-1 hover:outline hover:outline-1 hover:outline-white p-1 rounded cursor-pointer shrink-0">
          <span className="text-[18px]">🇮🇳</span>
          <span className="text-white text-[13px] font-bold">EN</span>
          <ChevronDown size={11} className="text-white" />
        </div>

        {/* Account — hidden on mobile */}
        <div className="hidden md:flex flex-col hover:outline hover:outline-1 hover:outline-white p-1 rounded cursor-pointer shrink-0">
          <span className="text-gray-300 text-[11px] leading-tight">Hello, Customer</span>
          <div className="flex items-center gap-0.5">
            <span className="text-white font-bold text-[13px] leading-tight">Account &amp; Lists</span>
            <ChevronDown size={11} className="text-white mt-0.5" />
          </div>
        </div>

        {/* Returns — hidden on mobile */}
        <div className="hidden md:flex flex-col hover:outline hover:outline-1 hover:outline-white p-1 rounded cursor-pointer shrink-0">
          <span className="text-gray-300 text-[11px] leading-tight">Returns</span>
          <span className="text-white font-bold text-[13px] leading-tight">&amp; Orders</span>
        </div>

        {/* Cart */}
        <button onClick={onCartClick}
          className="flex items-end gap-0.5 hover:outline hover:outline-1 hover:outline-white p-1 rounded cursor-pointer shrink-0 relative">
          <div className="relative">
            <ShoppingCart size={32} className="text-white" />
            <span className={`absolute -top-1 left-4 text-[#FF9900] font-bold text-[15px] leading-none ${cartCount > 0 ? "" : "opacity-0"}`}>
              {cartCount > 0 ? cartCount : 0}
            </span>
          </div>
          <span className="text-white font-bold text-[13px] hidden sm:block leading-none mb-1">Cart</span>
        </button>
      </div>

      {/* Secondary nav strip */}
      <div className="bg-[#232F3E] px-2 sm:px-4 py-1 flex items-center gap-1 sm:gap-3 md:gap-4 overflow-x-auto text-white text-[12px] font-medium whitespace-nowrap scrollbar-hide">
        <div className="flex items-center gap-1 hover:outline hover:outline-1 hover:outline-white px-1 py-0.5 rounded cursor-pointer shrink-0">
          <Menu size={15} /><span>All</span>
        </div>
        {["Fresh","MX Player","Sell","Gift Cards","Amazon Pay","Buy Again","Gift Ideas","AmazonBasics","Health, Household & Personal Care","Prime","Subscribe & Save","Home Improvement","Audible"].map(n => (
          <span key={n} className="hover:outline hover:outline-1 hover:outline-white px-1 py-0.5 rounded cursor-pointer shrink-0">{n}</span>
        ))}
        {/* 10-min delivery tag — right side */}
        <span className="ml-auto flex items-center gap-1 text-[#FF9900] font-bold shrink-0">
          <Zap size={12} /> 10-Min Delivery
        </span>
      </div>

      {/* Amazon Fresh green stripe */}
      <div className="h-[3px] w-full" style={{ background: "linear-gradient(90deg, #00a600, #00cc00, #00a600)" }} />
    </header>
  );
}

// ─── FIX 1 + ORDER TRACKING: Full-screen loading overlay ─────────────────────
function FullScreenLoader() {
  return (
    <div className="fixed inset-0 z-30 pt-[100px] bg-[#131921]/95 backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="w-14 h-14 border-4 border-[#FF9900] border-t-transparent rounded-full animate-spin mb-5" />
      <div className="text-white font-bold text-xl mb-2">AI Building Your Cart…</div>
      <div className="text-gray-400 text-sm text-center max-w-sm px-4">
        6 AI agents (4 in parallel) — intent → context · consumption · inventory · graph → cart
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-5 max-w-sm px-4">
        {["Intent","Context","Consumption","Inventory","Graph","Cart"].map((a,i) => (
          <div key={a} className="text-[10px] text-[#FF9900] font-bold bg-[#FF9900]/10 px-2 py-1 rounded border border-[#FF9900]/30 animate-pulse"
            style={{ animationDelay: `${i*200}ms` }}>{a}</div>
        ))}
      </div>
    </div>
  );
}

// ─── FIX 2: Order Tracking Modal (inside the app, no Amazon redirect) ─────────
const ORDER_STAGES = [
  { icon: CheckCircle, label: "Order Placed",    detail: "Your order has been confirmed",               delay: 0    },
  { icon: Package,     label: "Picker Assigned", detail: "Our picker is collecting your items",         delay: 1200 },
  { icon: Package,     label: "Packing",         detail: "Your items are being carefully packed",       delay: 2600 },
  { icon: Truck,       label: "Out for Delivery",detail: "On its way — ETA 10 minutes ⚡",             delay: 4000 },
  { icon: CheckCircle, label: "Delivered! 🎉",   detail: "Your Amazon Now order has arrived!",          delay: 5400 },
];

function OrderTrackingModal({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const timers = ORDER_STAGES.slice(1).map((s, i) =>
      setTimeout(() => setStage(i + 1), s.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#131921] px-5 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-lg">amazon</span>
              <span className="bg-[#FF9900] text-[#131921] text-[9px] font-black px-1.5 py-0.5 rounded">NOW AI</span>
            </div>
            <div className="text-gray-400 text-xs font-mono mt-0.5">Order {orderId}</div>
          </div>
          {stage === ORDER_STAGES.length - 1 && (
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
          )}
        </div>
        {/* ETA banner */}
        <div className="bg-[#E8F5E9] border-b border-[#C8E6C9] px-5 py-2.5 flex items-center gap-2">
          <Zap size={16} className="text-[#007600]" />
          <span className="text-[#007600] font-bold text-sm">⚡ Estimated Delivery: 10 minutes</span>
        </div>
        {/* Stages */}
        <div className="px-6 py-5 space-y-0">
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
                  {i < ORDER_STAGES.length - 1 && (
                    <div className={`w-0.5 h-9 transition-colors duration-700 ${done && i < stage ? "bg-[#007600]" : "bg-gray-200"}`} />
                  )}
                </div>
                <div className="pt-1.5 pb-4">
                  <div className={`font-bold text-sm transition-colors duration-700 ${done ? "text-[#0F1111]" : "text-gray-400"}`}>
                    {s.label}
                    {active && i < ORDER_STAGES.length - 1 && (
                      <span className="ml-2 text-[9px] bg-[#FF9900] text-white px-1.5 py-0.5 rounded font-black">LIVE</span>
                    )}
                  </div>
                  <div className={`text-xs mt-0.5 ${done ? "text-gray-500" : "text-gray-300"}`}>{s.detail}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-6 pb-5">
          {stage === ORDER_STAGES.length - 1 ? (
            <button onClick={onClose}
              className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] py-3 rounded-full font-bold transition-colors">
              🛍️ Continue Shopping
            </button>
          ) : (
            <div className="flex items-center justify-center gap-2 text-[#007185] text-sm">
              <Clock size={14} className="animate-spin" /> Live tracking updates…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Checkout / Amazon Pay Modal (no external redirect) ───────────────────────
function CheckoutModal({ total, savings, itemCount, onSuccess, onClose }: {
  total: number; savings: number; itemCount: number;
  onSuccess: () => void; onClose: () => void;
}) {
  const [method, setMethod]       = useState<"upi"|"card"|"cod">("upi");
  const [upiId,  setUpiId]        = useState("9876543210@okaxis");
  const [step,   setStep]         = useState<"pay"|"processing">("pay");

  const handlePay = () => {
    setStep("processing");
    setTimeout(() => { onSuccess(); }, 2200);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="bg-[#131921] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold text-xl">amazon</span>
            <span className="bg-[#FF9900] text-[#131921] text-[10px] font-black px-2 py-0.5 rounded">Pay</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20} /></button>
        </div>
        {step === "pay" && (
          <div className="p-5">
            <div className="bg-[#F7F7F7] border border-gray-200 rounded-lg p-4 mb-4">
              <div className="font-bold text-sm text-[#0F1111] mb-3">Order Summary</div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Items ({itemCount})</span><span>{fmtINRv(total + savings)}</span></div>
                {savings > 0 && <div className="flex justify-between text-[#007600]"><span>🏷️ Smart Saver savings</span><span className="font-bold">−{fmtINRv(savings)}</span></div>}
                <div className="flex justify-between"><span className="text-gray-600">Delivery</span><span className="text-[#007600] font-bold">FREE</span></div>
                <div className="border-t border-gray-200 pt-2 flex justify-between font-bold"><span>Total</span><span className="text-[#B12704]">{fmtINRv(total)}</span></div>
              </div>
            </div>
            <p className="font-bold text-sm text-[#0F1111] mb-3">Payment method</p>
            <div className="space-y-2 mb-4">
              {[
                { key:"upi",  icon:"📱", label:"UPI / Amazon Pay UPI", sub:"Instant, zero charges" },
                { key:"card", icon:"💳", label:"Credit / Debit Card",  sub:"Visa, Mastercard, RuPay" },
                { key:"cod",  icon:"💵", label:"Cash on Delivery",     sub:"Pay when it arrives" },
              ].map(m => (
                <label key={m.key} className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${method === m.key ? "border-[#FF9900] bg-[#FFFBF0]" : "border-gray-200 hover:border-gray-300"}`}>
                  <input type="radio" name="pay" checked={method===m.key as any} onChange={() => setMethod(m.key as any)} className="w-4 h-4 accent-[#FF9900]" />
                  <span className="text-xl">{m.icon}</span>
                  <div><div className="text-sm font-semibold">{m.label}</div><div className="text-xs text-gray-400">{m.sub}</div></div>
                </label>
              ))}
            </div>
            {method === "upi" && (
              <div className="mb-4">
                <label className="text-xs font-medium text-gray-600 block mb-1">UPI ID</label>
                <input className="w-full border-2 border-gray-200 focus:border-[#FF9900] rounded-lg px-3 py-2 text-sm focus:outline-none"
                  value={upiId} onChange={e => setUpiId(e.target.value)} />
              </div>
            )}
            <button onClick={handlePay}
              className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] py-3.5 rounded-full font-bold text-base shadow transition-colors">
              🔒 Pay {fmtINRv(total)} Securely
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-2">Secured by Amazon Pay · 256-bit SSL</p>
          </div>
        )}
        {step === "processing" && (
          <div className="p-12 flex flex-col items-center">
            <div className="w-14 h-14 border-4 border-[#FF9900] border-t-transparent rounded-full animate-spin mb-5" />
            <div className="text-xl font-bold text-[#0F1111] mb-1">Processing…</div>
            <div className="text-gray-500 text-sm">Securing with Amazon Pay</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reusable product card for homepage ─────────────────────────────────────
interface HomeProduct {
  id: string; name: string; price: number; rating: number; reviews: number;
  ss?: boolean; disc?: number; orig?: number;
}
function HomeProductCard({ id, name, price, rating, reviews, ss, disc, orig, qty, onAdd, onInc, onDec }: HomeProduct & {
  qty: number; onAdd: () => void; onInc: () => void; onDec: () => void;
}) {
  return (
    <div className="bg-white rounded-lg overflow-hidden group cursor-pointer hover:shadow-md transition-shadow border border-gray-100">
      <div className="relative">
        <img src={getImg(id)} alt={name}
          className="w-full h-36 sm:h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${id}42/400/350`; }}
        />
        {ss && disc && (
          <div className="absolute top-2 left-2 bg-[#CC0C39] text-white text-[10px] font-black px-1.5 py-0.5 rounded">
            -{disc}%
          </div>
        )}
        {qty > 0 && (
          <div className="absolute top-2 right-2 bg-[#007600] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
            ✓ {qty}
          </div>
        )}
      </div>
      <div className="p-2 sm:p-3">
        <p className="text-[11px] sm:text-[12px] text-[#0F1111] font-medium line-clamp-2 leading-snug min-h-[32px]">{name}</p>
        <Stars r={rating} n={reviews} />
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-sm sm:text-base font-bold text-[#B12704]">{fmtINR(price)}</span>
          {ss && orig && <span className="text-[11px] text-gray-400 line-through">{fmtINR(orig)}</span>}
        </div>
        <div className="text-[10px] text-[#007600] mt-0.5">FREE Delivery</div>
        {qty === 0 ? (
          <button onClick={e => { e.stopPropagation(); onAdd(); }}
            className="mt-2 w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] text-[11px] sm:text-xs py-1.5 rounded font-bold transition-colors">
            Add to Cart
          </button>
        ) : (
          <div className="mt-2 flex items-center justify-between bg-[#FFD814] border border-[#FCD200] rounded overflow-hidden">
            <button onClick={e => { e.stopPropagation(); onDec(); }} className="px-2.5 py-1 hover:bg-[#F7CA00] font-bold text-base">−</button>
            <span className="text-xs font-bold">{qty}</span>
            <button onClick={e => { e.stopPropagation(); onInc(); }} className="px-2.5 py-1 hover:bg-[#F7CA00] font-bold text-base">+</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FIX 5+6: HOME VIEW — More products, no Snack/Dairy banners
// ═══════════════════════════════════════════════════════════════════
function HomeView({ onAIClick, onPackClick, onWeatherClick, onScanList, homeCart, onAddToCart, onIncCart, onDecCart, onViewCart }: {
  onAIClick: () => void;
  onPackClick: (pack: OccasionPack) => void;
  onWeatherClick: (query: string) => void;
  onScanList: () => void;
  homeCart: LocalCart;
  onAddToCart: (p: HomeProduct) => void;
  onIncCart: (id: string) => void;
  onDecCart: (id: string) => void;
  onViewCart: () => void;
}) {
  // ── Typewriter hero taglines ────────────────────────────────────────────────
  const HERO_LINES = [
    "\"I have a fever\" → perfect cart in seconds.",
    "\"Italian dinner for 4 tonight\" → done in 3 seconds.",
    "\"Movie night, budget ₹1500\" → cart built & split.",
    "\"Bake a cake, Meera\" → sugar added — you're running low.",
    "\"Hosting a party for 10\" → bulk cart, scaled automatically.",
    "\"Early morning breakfast run\" → coffee, eggs & bread ready.",
    "\"Baby essentials, quick!\" → Pampers & formula in one tap.",
  ];
  const [heroLineIdx, setHeroLineIdx] = React.useState(0);
  const [typedText, setTypedText]     = React.useState("");
  const [isErasing, setIsErasing]     = React.useState(false);
  const [showCursor, setShowCursor]   = React.useState(true);

  // Blinking cursor
  React.useEffect(() => {
    const t = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(t);
  }, []);

  // Typewriter engine
  React.useEffect(() => {
    const full = HERO_LINES[heroLineIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isErasing) {
      if (typedText.length < full.length) {
        // Still typing
        timeout = setTimeout(() => {
          setTypedText(full.slice(0, typedText.length + 1));
        }, 45);
      } else {
        // Fully typed — pause then start erasing
        timeout = setTimeout(() => setIsErasing(true), 1800);
      }
    } else {
      if (typedText.length > 0) {
        // Erasing
        timeout = setTimeout(() => {
          setTypedText(full.slice(0, typedText.length - 1));
        }, 22);
      } else {
        // Fully erased — advance to next line
        setIsErasing(false);
        setHeroLineIdx(i => (i + 1) % HERO_LINES.length);
      }
    }
    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedText, isErasing, heroLineIdx]);

  // ── Weather-aware banner ──────────────────────────────────────────────────
  const [weather, setWeather] = React.useState<{temp: number; desc: string; query: string} | null>(null);

  React.useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode&timezone=auto`)
        .then(r => r.json())
        .then(d => {
          const temp = Math.round(d.current.temperature_2m);
          const code = d.current.weathercode;
          const hour = new Date().getHours();
          let desc = "", query = "";
          if (code >= 61) {
            // Rain overrides everything
            desc  = "Rainy outside 🌧️ — perfect for hot soup & tea";
            query = "It's raining outside, I need hot soup, tea and comfort food to stay cosy";
          } else if (hour >= 22 || hour < 5) {
            // Late night
            desc  = "Late night snack run? 🌙";
            query = "Late night craving, need quick snacks and a cold drink";
          } else if (hour >= 5 && hour < 9) {
            // Morning
            desc  = "Good morning ☀️ — breakfast time!";
            query = "Morning breakfast essentials — coffee, eggs, bread and juice";
          } else if (temp >= 35) {
            desc  = "It's scorching out 🥵 — want cold drinks & ice cream?";
            query = "It's very hot outside, I need cold drinks, ice cream and something refreshing";
          } else if (temp >= 28) {
            desc  = "Warm afternoon 🌤️ — staying hydrated?";
            query = "It's warm outside, I need cold drinks and snacks to stay hydrated and refreshed";
          } else if (temp <= 15) {
            desc  = "It's chilly ❄️ — how about hot coffee & comfort food?";
            query = "It's cold outside, I need hot coffee, warm soup and comfort food";
          }
          if (desc) setWeather({ temp, desc, query });
        })
        .catch(() => {});
    }, () => {});
  }, []);

  return (
    <div className="bg-[#EAEDED] min-h-screen pb-12">

      {/* ── FIX 6: Replace banners with real product hero ── */}
      <div className="bg-white overflow-hidden">
        {/* Deal of the day banner */}
        <div className="relative overflow-hidden px-4 sm:px-8 py-5 sm:py-8" style={{ background: "linear-gradient(135deg, #232F3E 0%, #131921 100%)" }}>
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 sm:gap-6 items-center">
            <div className="flex-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 bg-[#CC0C39] text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
                ⚡ Deal of the Day
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">Up to <span className="text-[#FF9900]">60% OFF</span></h2>
              <p className="text-gray-400 text-sm mb-3">On groceries, snacks, dairy & more — delivered in 10 minutes</p>
              <button className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold px-5 py-2 rounded-full text-sm transition-colors">
                See all deals →
              </button>
            </div>
            {/* 4 product images grid */}
            <div className="grid grid-cols-4 gap-2 flex-shrink-0">
              {[{id:"P014"},{id:"P048"},{id:"P010"},{id:"P033"}].map(p => (
                <div key={p.id} className="w-16 sm:w-20 h-16 sm:h-20 rounded-lg overflow-hidden border-2 border-white/20">
                  <img src={getImg(p.id)} alt="" className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${p.id}99/150/150`; }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Shop by Category ── */}
      <div className="bg-white mt-2 px-4 sm:px-6 py-4 sm:py-5">
        <h2 className="text-base sm:text-lg font-bold text-[#0F1111] mb-3">Shop by Category</h2>
        <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <div key={cat.name} className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl border-2 border-gray-100 group-hover:border-[#FF9900] group-hover:shadow-md transition-all"
                style={{ backgroundColor: cat.bg }}>
                {cat.emoji}
              </div>
              <span className="text-[10px] sm:text-[11px] text-[#0F1111] font-medium text-center w-14 sm:w-16 leading-tight">{cat.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Weather-aware smart banner ── */}
      {weather && (
        <div className="mx-2 sm:mx-4 mt-2 rounded-xl overflow-hidden cursor-pointer"
          onClick={() => onWeatherClick(weather.query)}
          style={{ background: "linear-gradient(135deg, #0d47a1, #1565c0)" }}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌡️</span>
              <div>
                <p className="text-white font-bold text-sm">{weather.desc}</p>
                <p className="text-blue-200 text-[11px] mt-0.5">{weather.temp}°C outside · Tap to build a cart instantly</p>
              </div>
            </div>
            <span className="text-white text-xs font-bold bg-white/20 px-3 py-1.5 rounded-full shrink-0 ml-2">Shop Now →</span>
          </div>
        </div>
      )}

      {/* ── Occasion Packs ── */}
      <div className="bg-white mt-2 px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#0F1111]">⚡ Ready-to-Go Packs</h2>
            <p className="text-xs text-[#565959] mt-0.5">One tap · Pre-filled cart · Delivered in 10 mins</p>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {OCCASION_PACKS.map(pack => {
            return (
              <button
                key={pack.label}
                onClick={() => onPackClick(pack)}
                className="flex-shrink-0 w-44 rounded-xl overflow-hidden border border-gray-100 hover:border-[#FF9900] hover:shadow-md transition-all text-left group"
                style={{ background: pack.color }}>
                {/* Pack image strip */}
                <div className="flex gap-0.5 h-20 overflow-hidden">
                  {pack.items.slice(0, 3).map(item => (
                    <div key={item.id} className="flex-1 overflow-hidden">
                      <img src={getImg(item.id)} alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
                <div className="p-2.5">
                  {pack.tag && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: pack.textColor + "33", color: pack.textColor }}>
                      {pack.tag}
                    </span>
                  )}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-lg">{pack.emoji}</span>
                    <span className="text-white font-bold text-sm">{pack.label}</span>
                  </div>
                  <p className="text-gray-400 text-[10px] mt-1">{pack.items.length} items · One tap checkout</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── AI Trigger Button ── */}
      <div className="mx-2 sm:mx-4 mt-2 rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer group" onClick={onAIClick}
        style={{ background: "linear-gradient(135deg, #131921 0%, #1a2a3a 50%, #131921 100%)", border: "2px solid #FF9900" }}>
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 px-4 sm:px-8 py-5 sm:py-7">
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 bg-[#FF9900]/20 border border-[#FF9900]/40 rounded-full px-3 py-1 text-[#FF9900] text-xs font-bold mb-2 sm:mb-3">
              <Sparkles size={12} /> Powered by LangGraph · GPT-4o · Parallel AI Agents
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white mb-1.5 sm:mb-2 leading-tight">
              Meet <span className="text-[#FF9900]">Amazon Now AI</span>
            </h2>
            <div className="text-gray-300 text-xs sm:text-sm max-w-lg min-h-[3rem] flex items-start flex-col justify-center gap-0.5">
              <span className="text-gray-500 text-[11px]">Don&apos;t search. Just describe what you need:</span>
              <p className="font-mono text-sm sm:text-base text-white leading-snug">
                {(() => {
                  // Split at " → " to colour the outcome amber
                  const arrow = typedText.indexOf(" → ");
                  if (arrow === -1) {
                    return (
                      <>
                        <span className="text-gray-200">{typedText}</span>
                        <span
                          className="inline-block w-[2px] h-[1.1em] align-middle ml-[2px] rounded-sm"
                          style={{
                            backgroundColor: "#FF9900",
                            opacity: showCursor ? 1 : 0,
                            transition: "opacity 0.1s",
                          }}
                        />
                      </>
                    );
                  }
                  const prompt  = typedText.slice(0, arrow);
                  const outcome = typedText.slice(arrow + 3);
                  return (
                    <>
                      <span className="text-gray-200">{prompt}</span>
                      <span className="text-[#FF9900]"> → </span>
                      <span className="text-[#FF9900] font-semibold">{outcome}</span>
                      <span
                        className="inline-block w-[2px] h-[1.1em] align-middle ml-[2px] rounded-sm"
                        style={{
                          backgroundColor: "#FF9900",
                          opacity: showCursor ? 1 : 0,
                          transition: "opacity 0.1s",
                        }}
                      />
                    </>
                  );
                })()}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2 sm:mt-3 justify-center sm:justify-start items-center">
              {["🏷️ Smart Saver","💰 Budget-aware","👥 Headcount scaling"].map(f => (
                <span key={f} className="bg-white/10 text-gray-300 text-[10px] px-2 py-0.5 rounded-full border border-white/20">{f}</span>
              ))}
              <button
                onClick={e => { e.stopPropagation(); onScanList(); }}
                className="flex items-center gap-1 bg-[#FF9900]/15 hover:bg-[#FF9900]/30 text-[#FF9900] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#FF9900]/40 transition-colors"
                title="Photo of grocery list, WhatsApp screenshot → instant cart">
                📋 Scan a List
              </button>
            </div>
          </div>
          <div className="shrink-0">
            <button id="ai-trigger-btn"
              className="flex items-center gap-2 px-5 sm:px-8 py-3 sm:py-4 rounded-full font-extrabold text-base sm:text-lg shadow-2xl group-hover:scale-105 transition-transform"
              style={{ background: "linear-gradient(135deg, #FF9900 0%, #e47911 100%)", color: "#131921" }}>
              <Wand2 size={20} /> Try AI Shopping
            </button>
          </div>
        </div>
      </div>

      {/* ── Multiple product sections ── */}
      {HOME_SECTIONS.map(section => (
        <div key={section.title} className={`mt-2 px-4 sm:px-6 py-4 sm:py-5 ${section.highlight ? "bg-[#FFF8E1] border-t-2 border-[#FF9900]" : "bg-white"}`}>
          <div className="flex items-start justify-between mb-3 sm:mb-4 max-w-7xl mx-auto">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0F1111]">{section.title}</h2>
              {section.subtitle && <p className="text-xs text-[#565959] mt-0.5">{section.subtitle}</p>}
            </div>
            <button className="text-xs text-[#007185] hover:underline whitespace-nowrap ml-4 mt-1">See all →</button>
          </div>
          {/* Responsive grid: 2 col on mobile, 3 on sm, 4 on md, 6 on xl */}
          <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
            {section.products.map(p => (
              <HomeProductCard key={p.id} {...p}
                qty={homeCart[p.id] ?? 0}
                onAdd={() => onAddToCart(p)}
                onInc={() => onIncCart(p.id)}
                onDec={() => onDecCart(p.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Bottom AI CTA */}
      <div className="mx-2 sm:mx-4 mt-2 bg-gradient-to-r from-[#131921] to-[#1a2a3a] rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <div className="text-white font-bold text-base sm:text-lg">Didn't find what you need?</div>
          <div className="text-gray-400 text-xs sm:text-sm mt-0.5">Let our AI build the perfect cart in seconds</div>
        </div>
        <button onClick={onAIClick}
          className="flex items-center gap-2 bg-[#FF9900] hover:bg-[#e47911] text-[#131921] font-bold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-colors shadow-lg shrink-0">
          <Sparkles size={15} /> Ask AI
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// AI INPUT VIEW — Responsive centered prompt
// ═══════════════════════════════════════════════════════════════════
function AIInputView({ onSubmit, onBack, onScanImage, initialQuery = "" }: {
  onSubmit: (q: string, b?: number, p?: number, userId?: string) => void;
  onBack: () => void;
  onScanImage: (formData: FormData) => void;
  initialQuery?: string;
}) {
  const [query,       setQuery]       = useState(initialQuery);
  const [budget,      setBudget]      = useState("");
  const [people,      setPeople]      = useState("1");
  const [showPrefs,   setShowPrefs]   = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [activeUser,  setActiveUser]  = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = (q: string) => {
    if (!q.trim()) return;
    const b = budget.trim() ? parseFloat(budget) : undefined;
    const p = Math.max(1, parseInt(people) || 1);
    onSubmit(q, b, p, activeUser || undefined);
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

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    onScanImage(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#131921] via-[#1a2a3a] to-[#131921] flex flex-col">
      <div className="px-4 sm:px-6 pt-4 sm:pt-6">
        <button onClick={onBack} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition-colors">
          <ArrowLeft size={15} /> Back to Amazon
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="inline-flex items-center gap-2 bg-[#FF9900]/20 border border-[#FF9900]/40 rounded-full px-3 sm:px-4 py-1.5 text-[#FF9900] text-xs sm:text-sm font-bold mb-4 sm:mb-6">
          <Sparkles size={13} /> Need-Centric Shopping · 7-Agent AI Pipeline
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white text-center mb-3 sm:mb-4 leading-tight">
          What do you<br /><span className="text-[#FF9900]">need right now?</span>
        </h1>
        <p className="text-gray-400 text-center text-sm sm:text-base md:text-lg mb-7 sm:mb-10 max-w-xl px-2">
          Don't browse. Don't search. Just describe your situation — our AI builds the perfect cart instantly.
        </p>

        {/* Prompt box */}
        <div className="w-full max-w-2xl">
          <div className="relative">
            <textarea
              id="ai-prompt-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(query); } }}
              placeholder={isListening ? "🎤 Listening..." : "e.g. I'm hosting a birthday party for 10 kids tonight..."}
              rows={3}
              className="w-full bg-white/10 backdrop-blur border-2 border-white/20 focus:border-[#FF9900] rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 text-white text-base sm:text-lg placeholder-gray-500 resize-none focus:outline-none transition-colors pr-24"
            />
            <div className="absolute right-3 bottom-3 flex gap-1.5">
              <button onClick={handleVoice}
                className={`p-2 rounded-full transition-colors ${isListening ? "bg-red-500 text-white animate-pulse" : "bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white"}`}>
                <Mic size={18} />
              </button>
              <button onClick={() => fileRef.current?.click()}
                title="Scan grocery list, fridge or pantry photo → instant cart"
                className="p-2 rounded-full bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white transition-colors">
                <Camera size={18} />
              </button>
              <input type="file" ref={fileRef} className="hidden" accept="image/*"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
            </div>
          </div>

          {/* Preferences toggle */}
          <button onClick={() => setShowPrefs(p => !p)}
            className="flex items-center gap-1.5 text-gray-500 hover:text-[#FF9900] text-xs sm:text-sm mt-2.5 transition-colors mx-auto">
            <SlidersHorizontal size={13} />
            {showPrefs ? "Hide" : "Set"} budget &amp; headcount
          </button>

          {showPrefs && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mt-2.5 grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
                  <IndianRupee size={11} /> Budget (optional)
                </label>
                <div className="flex items-center bg-white/10 border border-white/20 rounded-lg overflow-hidden">
                  <span className="px-2.5 text-gray-400 text-sm border-r border-white/20">₹</span>
                  <input type="number" placeholder="No limit" value={budget} onChange={e => setBudget(e.target.value)}
                    className="bg-transparent text-white text-sm py-2 px-2 flex-1 focus:outline-none placeholder-gray-600 w-0 min-w-0" />
                </div>
                {budget && <p className="text-[#FF9900] text-xs mt-1 font-bold">Max ₹{parseFloat(budget).toLocaleString("en-IN")}</p>}
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
                  <Users size={11} /> People
                </label>
                <div className="flex items-center bg-white/10 border border-white/20 rounded-lg overflow-hidden">
                  <input type="number" min="1" max="50" value={people} onChange={e => setPeople(e.target.value)}
                    className="bg-transparent text-white text-sm py-2 px-2 w-12 text-center focus:outline-none" />
                  <span className="px-2 text-gray-400 text-xs border-l border-white/20">people</span>
                </div>
                {parseInt(people) > 1 && <p className="text-[#FF9900] text-xs mt-1 font-bold">Qty scales ×{people}</p>}
              </div>
            </div>
          )}

          <button id="build-cart-btn" onClick={() => submit(query)} disabled={!query.trim()}
            className="w-full mt-4 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-extrabold text-lg sm:text-xl transition-all duration-200 shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: query.trim() ? "linear-gradient(135deg, #FF9900 0%, #e47911 100%)" : "#555", color: "#131921" }}>
            🤖 Build My Cart
          </button>

          {/* ── Personalisation demo strip ── */}
          <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base">🎯</span>
              <div>
                <p className="text-white text-xs font-bold">Personalised shopping demo</p>
                <p className="text-gray-500 text-[10px]">Select a profile to see AI use real purchase history — brand preferences, low-stock alerts, past order patterns</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {PERSONAS.map(u => (
                <button
                  key={u.user_id}
                  onClick={() => setActiveUser(activeUser === u.user_id ? null : u.user_id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    activeUser === u.user_id
                      ? "bg-[#FF9900] text-[#131921] border-[#FF9900]"
                      : "bg-white/5 text-gray-300 border-white/10 hover:border-[#FF9900]/50 hover:text-white"
                  }`}>
                  <span>{u.avatar}</span>
                  <span>{u.name}</span>
                  <span className={`text-[9px] ${activeUser === u.user_id ? "text-[#131921]/70" : "text-gray-500"}`}>{u.label}</span>
                </button>
              ))}
            </div>
            {activeUser ? (
              <div className="mt-3 flex items-start gap-2 bg-[#FF9900]/10 border border-[#FF9900]/30 rounded-lg px-3 py-2">
                <span className="text-base mt-0.5">{PERSONAS.find(u => u.user_id === activeUser)?.avatar}</span>
                <div>
                  <p className="text-[#FF9900] text-[11px] font-bold">{PERSONAS.find(u => u.user_id === activeUser)?.name}'s history loaded</p>
                  <p className="text-gray-400 text-[10px] mt-0.5">{PERSONAS.find(u => u.user_id === activeUser)?.bio}</p>
                  <p className="text-gray-500 text-[10px] mt-1">AI will now use their real order history, preferred brands and inventory gaps to build the cart.</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-600 text-[10px] mt-2.5 text-center">No profile selected — AI uses general signals only</p>
            )}
          </div>

        </div>{/* end max-w-2xl prompt box */}

        {/* Divider + scenarios */}
        <div className="flex items-center gap-3 w-full max-w-2xl my-6 sm:my-8">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-gray-600 text-xs sm:text-sm">or try a quick scenario</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 w-full max-w-2xl">
          {SCENARIOS.map(s => (
            <button key={s.query}
              id={`scenario-${s.label.replace(/\s+/g, "-").toLowerCase()}`}
              onClick={() => submit(s.query)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#FF9900]/50 rounded-xl p-3 sm:p-4 flex flex-col items-center gap-1.5 sm:gap-2 transition-all hover:-translate-y-0.5 cursor-pointer group">
              <span className="text-2xl sm:text-3xl group-hover:scale-110 transition-transform">{s.emoji}</span>
              <span className="text-[10px] sm:text-xs text-gray-300 text-center leading-tight">{s.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// RESULTS VIEW — Responsive product grid with real images
// ═══════════════════════════════════════════════════════════════════
function ResultsView({ cart, localCart, onAdd, onInc, onDec, onCheckout, onReset, budget, people }: {
  cart: SmartCartResponse; localCart: LocalCart;
  onAdd: (id: string) => void; onInc: (id: string) => void; onDec: (id: string) => void;
  onCheckout: () => void; onReset: () => void;
  budget?: number; people: number;
}) {
  const cartItems  = cart.items.filter(i => (localCart[i.id] ?? 0) > 0);
  const totalQty   = Object.values(localCart).reduce((a, b) => a + b, 0);
  const totalPrice = cartItems.reduce((a, i) => a + toINR(i.price) * (localCart[i.id] ?? 0), 0);
  const totalSave  = cartItems.reduce((a, i) => a + toINR(i.savings ?? 0) * (localCart[i.id] ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#EAEDED] pb-36 sm:pb-28">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button onClick={onReset} className="text-[#007185] text-xs sm:text-sm hover:underline flex items-center gap-1 mr-1">
              <ArrowLeft size={13} /> Back
            </button>
            <h2 className="text-base sm:text-xl font-bold text-[#0F1111]">AI-Built Cart</h2>
            <span className="text-[10px] sm:text-sm bg-[#007185]/10 text-[#007185] font-bold px-1.5 sm:px-2 py-0.5 rounded border border-[#007185]/30">
              {cart.intent.replace(/_/g, " ").toUpperCase()}
            </span>
            {budget && <span className="text-[10px] sm:text-sm bg-[#E8F5E9] text-[#007600] font-bold px-1.5 sm:px-2 py-0.5 rounded">💰 ₹{budget.toLocaleString("en-IN")}</span>}
            {people > 1 && (
              <span className="text-[10px] sm:text-sm bg-[#FFF8E1] text-[#E65100] font-bold px-1.5 sm:px-2 py-0.5 rounded">👥 {people}p</span>
            )}
            {people > 1 && totalPrice > 0 && (
              <span className="text-[10px] sm:text-sm bg-[#E8F5E9] text-[#2E7D32] font-bold px-1.5 sm:px-2 py-0.5 rounded" title="Split bill per person">
                💳 {fmtINRv(totalPrice / people)}/person
              </span>
            )}
            {cart.processing_time_ms != null && (
              <span className="text-[10px] sm:text-sm bg-[#FFF3E0] text-[#B25000] font-bold px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1" title="End-to-end AI pipeline time">
                <Zap size={11} /> Built in {(cart.processing_time_ms / 1000).toFixed(1)}s
              </span>
            )}
            {cart.personalised && (
              <span className="text-[10px] sm:text-sm bg-[#E8F4FD] text-[#0066C0] font-bold px-1.5 sm:px-2 py-0.5 rounded flex items-center gap-1" title="Cart built using real purchase history">
                🎯 Personalised
              </span>
            )}
          </div>
          {totalQty > 0 && (
            <button id="buy-now-btn" onClick={onCheckout}
              className="bg-[#FF9900] hover:bg-[#e47911] text-white font-bold px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto shrink-0">
              <ShoppingCart size={15} /> Buy Now ({totalQty} · {fmtINRv(totalPrice)})
            </button>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 pt-4 sm:pt-6">
        {/* AI trace */}
        <div className="bg-[#131921] rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-[#FF9900] text-[#131921] text-[9px] font-black px-1.5 py-0.5 rounded">LANGGRAPH</span>
            <span className="text-white text-xs font-bold">AI Pipeline Reasoning</span>
          </div>
          <div className="space-y-1.5">
            {cart.explainability.map((e, i) => (
              <div key={i} className="text-[11px] sm:text-xs text-gray-400 flex gap-1.5">
                <ChevronRight size={11} className="text-[#FF9900] mt-0.5 shrink-0" />
                <span>{e}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Product grid — responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5">
          {cart.items.map((item, idx) => {
            const qty = localCart[item.id] ?? 0;
            return (
              <div key={item.id}
                className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-shadow border-2 ${qty > 0 ? "border-[#007600]" : item.is_smart_saver ? "border-[#FF9900]/40" : "border-transparent"}`}
                style={{ animationDelay: `${idx*60}ms` }}>
                {/* Image — LARGE, PROMINENT */}
                <div className="relative overflow-hidden">
                  <img src={getImg(item.id)} alt={item.name}
                    className="w-full h-44 sm:h-52 object-cover hover:scale-105 transition-transform duration-300"
                    onError={e => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${item.id}17/400/300`; }}
                  />
                  {item.is_smart_saver && (
                    <div className="absolute top-2.5 left-2.5 bg-[#FF9900] text-[#131921] text-[9px] font-black px-2 py-1 rounded-full shadow-lg">
                      🏷️ Smart Saver
                    </div>
                  )}
                  {qty > 0 && (
                    <div className="absolute top-2.5 right-2.5 bg-[#007600] text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg">
                      ✓ In Cart ×{qty}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="p-3 sm:p-4">
                  <h3 className="font-semibold text-[#0F1111] text-sm leading-snug mb-2 line-clamp-2">{item.name}</h3>
                  <div className="flex items-baseline gap-1.5 mb-1">
                    <span className="text-lg sm:text-xl font-bold text-[#B12704]">{fmtINR(item.price)}</span>
                    {item.original_price && item.original_price > item.price && (
                      <span className="text-xs text-gray-400 line-through">{fmtINR(item.original_price)}</span>
                    )}
                  </div>
                  {item.is_smart_saver && item.savings && item.savings > 0 && (
                    <div className="text-[10px] text-[#007600] font-bold bg-[#E8F5E9] px-2 py-0.5 rounded mb-2 inline-block">
                      Save {fmtINR(item.savings)}/unit
                    </div>
                  )}
                  <div className="text-[10px] text-[#007600] mb-2.5">✓ In Stock · FREE 10-min delivery</div>
                  {item.reasoning && (
                    <div className="bg-[#F0F8FF] border border-[#A6C8FF] rounded-lg px-2.5 py-2 mb-3">
                      <div className="text-[10px] sm:text-[11px] text-[#007185] flex gap-1.5">
                        <span className="shrink-0 font-bold">🤖</span>
                        <span className="leading-snug">{item.reasoning}</span>
                      </div>
                    </div>
                  )}
                  {qty === 0 ? (
                    <button onClick={() => onAdd(item.id)} id={`add-${item.id}`}
                      className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] py-2 sm:py-2.5 rounded-lg font-bold transition-colors text-sm">
                      Add to Cart
                    </button>
                  ) : (
                    <div className="flex items-center justify-between bg-[#FFD814] border border-[#FCD200] rounded-lg overflow-hidden">
                      <button onClick={() => onDec(item.id)} className="px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-[#F7CA00] font-bold text-lg">−</button>
                      <span className="font-bold text-sm sm:text-base">{qty}</span>
                      <button onClick={() => onInc(item.id)} className="px-3 sm:px-4 py-2 sm:py-2.5 hover:bg-[#F7CA00] font-bold text-lg">+</button>
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
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-[#FF9900] px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
            <div className="min-w-0">
              <div className="text-[#0F1111] font-bold text-sm sm:text-base">{totalQty} item{totalQty !== 1 ? "s" : ""}</div>
              <div className="text-[#B12704] font-bold text-base sm:text-xl leading-tight">{fmtINRv(totalPrice)}</div>
            </div>
            {totalSave > 0 && (
              <span className="text-[#007600] text-[10px] sm:text-sm font-bold bg-[#E8F5E9] px-2 sm:px-3 py-1 rounded-full border border-[#C8E6C9] whitespace-nowrap shrink-0">
                🏷️ Saving {fmtINRv(totalSave)}
              </span>
            )}
          </div>
          <button id="sticky-checkout-btn" onClick={onCheckout}
            className="bg-[#FF9900] hover:bg-[#e47911] text-white font-extrabold px-4 sm:px-8 py-2.5 sm:py-3 rounded-full shadow-lg transition-colors text-sm sm:text-base shrink-0 ml-2">
            Checkout →
          </button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CART VIEW — Homepage cart with quantity controls + checkout
// ═══════════════════════════════════════════════════════════════════
interface CartEntry extends HomeProduct { qty: number; aiBuilt?: boolean; savings?: number; }
function CartView({ entries, onInc, onDec, onRemove, aiEntries, onAiInc, onAiDec, onAiRemove, onCheckout, onBack }: {
  entries: CartEntry[];
  onInc: (id: string) => void;
  onDec: (id: string) => void;
  onRemove: (id: string) => void;
  aiEntries?: CartEntry[];
  onAiInc?: (id: string) => void;
  onAiDec?: (id: string) => void;
  onAiRemove?: (id: string) => void;
  onCheckout: () => void;
  onBack: () => void;
}) {
  const allEntries = [...entries, ...(aiEntries ?? [])];
  const total   = allEntries.reduce((s, e) => s + toINR(e.price) * e.qty, 0);
  const savings = allEntries.reduce((s, e) => s + (e.orig ? (toINR(e.orig) - toINR(e.price)) * e.qty : 0) + (e.savings ? toINR(e.savings) * e.qty : 0), 0);

  return (
    <div className="min-h-screen bg-[#EAEDED] pb-32">
      {/* Cart header */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="text-[#007185] text-sm hover:underline flex items-center gap-1">
              <ArrowLeft size={14} /> Continue shopping
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-[#0F1111]">Shopping Cart</h1>
          </div>
          <span className="text-sm text-[#565959]">Price</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 pt-4 flex flex-col lg:flex-row gap-4">
        {/* Items list */}
        <div className="flex-1 space-y-3">
          {allEntries.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center">
              <ShoppingCart size={56} className="mx-auto text-gray-200 mb-4" />
              <h2 className="text-xl font-bold text-[#0F1111] mb-1">Your cart is empty</h2>
              <p className="text-gray-500 text-sm mb-4">Add items from the homepage or use AI shopping to get started.</p>
              <button onClick={onBack}
                className="bg-[#FFD814] border border-[#FCD200] text-[#0F1111] font-bold px-6 py-2 rounded-full text-sm">
                Shop now
              </button>
            </div>
          ) : (
            <>
              {/* AI-built items section */}
              {(aiEntries ?? []).length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <span className="bg-[#FF9900] text-[#131921] text-[9px] font-black px-1.5 py-0.5 rounded">AI BUILT</span>
                    <span className="text-xs font-bold text-[#0F1111]">AI-Recommended Items</span>
                    <span className="text-xs text-[#565959] ml-auto">Powered by LangGraph</span>
                  </div>
                  {(aiEntries ?? []).map(e => (
                    <div key={e.id} className="bg-white rounded-xl border-2 border-[#FF9900]/30 p-3 sm:p-4 flex gap-3 sm:gap-4 hover:shadow-sm transition-shadow mb-2">
                      <img src={getImg(e.id)} alt={e.name}
                        className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                        onError={ev => { (ev.target as HTMLImageElement).src = `https://picsum.photos/seed/${e.id}77/200/200`; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#0F1111] leading-snug mb-0.5 line-clamp-2">{e.name}</p>
                        <div className="text-[#007600] text-xs mb-1">In Stock · FREE 10-min delivery</div>
                        {(e as any).savings > 0 && (
                          <span className="text-[10px] bg-[#FF9900] text-[#131921] px-1.5 py-0.5 rounded font-bold">🏷️ Smart Saver</span>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                            <button onClick={() => onAiDec?.(e.id)} className="px-3 py-1.5 hover:bg-gray-100 font-bold text-base border-r border-gray-200">−</button>
                            <span className="px-3 text-sm font-bold min-w-[2rem] text-center">{e.qty}</span>
                            <button onClick={() => onAiInc?.(e.id)} className="px-3 py-1.5 hover:bg-gray-100 font-bold text-base border-l border-gray-200">+</button>
                          </div>
                          <button onClick={() => onAiRemove?.(e.id)} className="text-[#007185] text-xs hover:underline">Delete</button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-base text-[#0F1111]">{fmtINR(e.price * e.qty)}</div>
                        {e.orig && <div className="text-xs text-gray-400 line-through">{fmtINR(e.orig * e.qty)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Homepage items section */}
              {entries.length > 0 && (
                <div>
                  {(aiEntries ?? []).length > 0 && (
                    <div className="flex items-center gap-2 px-1 mb-2">
                      <span className="text-xs font-bold text-[#0F1111]">Your Selected Items</span>
                    </div>
                  )}
                  {entries.map(e => (
                    <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 flex gap-3 sm:gap-4 hover:shadow-sm transition-shadow mb-2">
                      <img src={getImg(e.id)} alt={e.name}
                        className="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                        onError={ev => { (ev.target as HTMLImageElement).src = `https://picsum.photos/seed/${e.id}77/200/200`; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-[#0F1111] leading-snug mb-0.5 line-clamp-2">{e.name}</p>
                        <div className="text-[#007600] text-xs mb-1">In Stock · FREE 10-min delivery</div>
                        {e.ss && e.disc && (
                          <span className="text-[10px] bg-[#CC0C39] text-white px-1.5 py-0.5 rounded font-bold">-{e.disc}%</span>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center border-2 border-gray-200 rounded-lg overflow-hidden">
                            <button onClick={() => onDec(e.id)} className="px-3 py-1.5 hover:bg-gray-100 font-bold text-base border-r border-gray-200">−</button>
                            <span className="px-3 text-sm font-bold min-w-[2rem] text-center">{e.qty}</span>
                            <button onClick={() => onInc(e.id)} className="px-3 py-1.5 hover:bg-gray-100 font-bold text-base border-l border-gray-200">+</button>
                          </div>
                          <button onClick={() => onRemove(e.id)} className="text-[#007185] text-xs hover:underline">Delete</button>
                          <button className="text-[#007185] text-xs hover:underline">Save for later</button>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-base sm:text-lg text-[#0F1111]">{fmtINR(e.price * e.qty)}</div>
                        {e.orig && <div className="text-xs text-gray-400 line-through">{fmtINR(e.orig * e.qty)}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Order summary sticky sidebar */}
        {allEntries.length > 0 && (
          <div className="lg:w-72 xl:w-80 shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-20">
              {savings > 0 && (
                <div className="text-[#CC0C39] text-sm font-bold mb-2">
                  Your order qualifies for FREE Delivery! 🎉
                </div>
              )}
              <div className="text-base sm:text-lg font-bold text-[#0F1111] mb-3">
                Subtotal ({allEntries.reduce((s,e)=>s+e.qty,0)} items):{" "}
                <span className="text-[#B12704]">{fmtINRv(total)}</span>
              </div>
              {savings > 0 && (
                <div className="text-xs text-[#007600] font-bold mb-2">🏷️ You save {fmtINRv(savings)} on this order</div>
              )}
              <button onClick={onCheckout} id="cart-checkout-btn"
                className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] font-bold py-3 rounded-full text-sm transition-colors mb-2">
                Proceed to Buy ({allEntries.reduce((s,e)=>s+e.qty,0)} items)
              </button>
              <div className="text-center text-[10px] text-gray-400">Secured by Amazon Pay · FREE delivery</div>
              <div className="border-t border-gray-100 mt-3 pt-3 space-y-1.5">
                {allEntries.map(e => (
                  <div key={e.id} className="flex justify-between text-xs">
                    <span className="text-gray-600 truncate mr-2 max-w-[160px]">{e.name.split(" ").slice(0,3).join(" ")}…</span>
                    <span className="font-medium whitespace-nowrap">{fmtINR(e.price)} ×{e.qty}</span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-1.5 flex justify-between text-sm font-bold">
                  <span>Total</span><span className="text-[#B12704]">{fmtINRv(total)}</span>
                </div>
              </div>
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
  const [mode,           setMode]          = useState<PageMode>("home");
  const [isLoading,      setIsLoading]     = useState(false);
  const [cart,           setCart]          = useState<SmartCartResponse | null>(null);
  const [localCart,      setLocalCart]     = useState<LocalCart>({});
  const [homeCart,       setHomeCart]      = useState<LocalCart>({});
  const [homeCatalog,    setHomeCatalog]   = useState<HomeProduct[]>([]);
  const [toast,          setToast]         = useState<string | null>(null);
  const [showPay,        setShowPay]       = useState(false);
  const [showTracking,   setShowTracking]  = useState(false);
  const [orderId,        setOrderId]       = useState("");
  const [activeBudget,   setActiveBudget]  = useState<number | undefined>();
  const [aiInitialQuery, setAiInitialQuery] = useState("");
  const [activePeople,   setActivePeople]  = useState(1);

  // Home cart helpers
  const addToHomeCart = (p: HomeProduct) => {
    setHomeCatalog(prev => prev.some(x => x.id === p.id) ? prev : [...prev, p]);
    setHomeCart(prev => ({ ...prev, [p.id]: (prev[p.id] ?? 0) + 1 }));
  };
  const incHomeCart = (id: string) => setHomeCart(prev => ({ ...prev, [id]: prev[id] + 1 }));
  const decHomeCart = (id: string) => setHomeCart(prev => {
    const next = { ...prev, [id]: (prev[id] ?? 1) - 1 };
    if (next[id] <= 0) delete next[id];
    return next;
  });
  const removeFromHomeCart = (id: string) => setHomeCart(prev => {
    const next = { ...prev }; delete next[id]; return next;
  });

  const homeCartEntries: CartEntry[] = homeCatalog
    .filter(p => (homeCart[p.id] ?? 0) > 0)
    .map(p => ({ ...p, qty: homeCart[p.id] }));
  const homeCartQty   = Object.values(homeCart).reduce((a, b) => a + b, 0);
  const homeCartTotal = homeCartEntries.reduce((s, e) => s + toINR(e.price) * e.qty, 0);
  const homeCartSave  = homeCartEntries.reduce((s, e) => s + (e.orig ? (toINR(e.orig) - toINR(e.price)) * e.qty : 0), 0);

  const fetchCart = useCallback(async (query: string, budget?: number, people = 1, userId?: string) => {
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
        body: JSON.stringify({ message: query, budget: budget ?? null, people_count: people, user_id: userId ?? null }),
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

  // ── Scan image (grocery list / fridge photo) ──────────────────────────────
  const scanFileRef = useRef<HTMLInputElement>(null);

  const fetchInventory = useCallback(async (formData: FormData) => {
    setIsLoading(true);
    setCart(null);
    setLocalCart({});
    setMode("results");
    try {
      const res = await fetch("http://localhost:8000/api/inventory/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      const data: SmartCartResponse = await res.json();
      setCart(data);
      const init: LocalCart = {};
      data.items.forEach(i => { init[i.id] = i.quantity; });
      setLocalCart(init);
    } catch {
      setToast("Could not read the image — please try again.");
      setMode("home");
    } finally { setIsLoading(false); }
  }, []);

  const handleScanList = () => { scanFileRef.current?.click(); };

  const addItem = (id: string) => setLocalCart(p => ({ ...p, [id]: (p[id] ?? 0) + 1 }));
  const incItem = (id: string) => setLocalCart(p => ({ ...p, [id]: p[id] + 1 }));
  const decItem = (id: string) => setLocalCart(p => {
    const n = { ...p, [id]: p[id] - 1 };
    if (n[id] <= 0) delete n[id];
    return n;
  });

  const aiCartQty  = Object.values(localCart).reduce((a, b) => a + b, 0);
  const totalQty   = mode === "cart" ? homeCartQty : (mode === "results" ? aiCartQty : homeCartQty + aiCartQty);
  const cartItemsList = cart?.items.filter(i => (localCart[i.id] ?? 0) > 0) ?? [];
  const totalPrice = mode === "cart"
    ? homeCartTotal
    : cartItemsList.reduce((a, i) => a + toINR(i.price) * (localCart[i.id] ?? 0), 0);
  const totalSave  = mode === "cart"
    ? homeCartSave
    : cartItemsList.reduce((a, i) => a + toINR(i.savings ?? 0) * (localCart[i.id] ?? 0), 0);

  // FIX 2: After payment → Order Tracking (not Amazon.in redirect)
  const handlePaymentSuccess = () => {
    setShowPay(false);
    setOrderId(`AMZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    setShowTracking(true);
  };

  const handleTrackingClose = () => {
    setShowTracking(false);
    setCart(null);
    setMode("home");
    setLocalCart({});
    setHomeCart({});
  };

  return (
    <main className="min-h-screen font-sans bg-[#EAEDED]">
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* FIX 2: Order tracking modal */}
      {showTracking && <OrderTrackingModal orderId={orderId} onClose={handleTrackingClose} />}

      {/* Checkout modal */}
      {showPay && (
        <CheckoutModal
          total={totalPrice} savings={totalSave} itemCount={totalQty}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPay(false)}
        />
      )}

      {/* FIX 1: Full-screen loader — z-[9999] covers EVERYTHING including header */}
      {isLoading && <FullScreenLoader />}

      {/* Navbar always present */}
      <AmazonNavbar
        cartCount={homeCartQty + aiCartQty}
        onLogoClick={() => setMode("home")}
        onCartClick={() => {
          if (homeCartQty + aiCartQty > 0) { setMode("cart"); }
        }}
      />

      {mode === "home" && (
        <>
          {/* Hidden file input for scan list — triggered from homepage cards */}
          <input type="file" ref={scanFileRef} className="hidden" accept="image/*"
            onChange={e => { const f = e.target.files?.[0]; if (f) { const fd = new FormData(); fd.append("file", f); fetchInventory(fd); } e.target.value = ""; }} />
          <HomeView
            onAIClick={() => { setAiInitialQuery(""); setMode("ai"); }}
            onPackClick={(pack) => {
              pack.items.forEach(item => {
                addToHomeCart({ id: item.id, name: item.name, price: item.price,
                  rating: 4.5, reviews: 1000 });
                const current = homeCart[item.id] ?? 0;
                for (let i = current; i < item.qty; i++) incHomeCart(item.id);
              });
              setMode("cart");
            }}
            onWeatherClick={(query) => { setAiInitialQuery(query); setMode("ai"); }}
            onScanList={handleScanList}
            homeCart={homeCart}
            onAddToCart={p => { addToHomeCart(p); }}
            onIncCart={incHomeCart}
            onDecCart={decHomeCart}
            onViewCart={() => setMode("cart")}
          />
        </>
      )}
      {mode === "ai" && <AIInputView initialQuery={aiInitialQuery} onSubmit={fetchCart} onScanImage={fetchInventory} onBack={() => setMode("home")} />}
      {mode === "results" && cart && !isLoading && (
        <ResultsView
          cart={cart} localCart={localCart}
          onAdd={addItem} onInc={incItem} onDec={decItem}
          onCheckout={() => setShowPay(true)}
          onReset={() => setMode("home")}
          budget={activeBudget} people={activePeople}
        />
      )}
      {mode === "cart" && (
        <CartView
          entries={homeCartEntries}
          onInc={incHomeCart}
          onDec={decHomeCart}
          onRemove={removeFromHomeCart}
          aiEntries={cart?.items
            .filter(i => (localCart[i.id] ?? 0) > 0)
            .map(i => ({ id: i.id, name: i.name, price: i.price, qty: localCart[i.id],
              rating: 4.5, reviews: 100, savings: i.savings ?? 0,
              orig: i.original_price, aiBuilt: true }))
          }
          onAiInc={incItem}
          onAiDec={decItem}
          onAiRemove={id => { const n = { ...localCart }; delete n[id]; setLocalCart(n); }}
          onCheckout={() => setShowPay(true)}
          onBack={() => cart ? setMode("results") : setMode("home")}
        />
      )}

      {(mode === "home" || mode === "cart") && (
        <footer className="bg-[#232F3E] text-white py-6 sm:py-8 flex flex-col items-center">
          <div className="flex flex-wrap gap-4 sm:gap-8 text-xs sm:text-sm font-medium mb-4 justify-center px-4">
            <span className="hover:underline cursor-pointer">Conditions of Use</span>
            <span className="hover:underline cursor-pointer">Privacy Notice</span>
            <span className="hover:underline cursor-pointer">Interest-Based Ads</span>
          </div>
          <div className="text-[11px] sm:text-xs text-gray-400 text-center px-4">
            Amazon Now AI — HackOn Season 6 · Reimagining Urgent Shopping
          </div>
          <div className="text-[10px] sm:text-xs text-gray-600 mt-1">© 1996-2026, Amazon.com, Inc. or its affiliates</div>
        </footer>
      )}
    </main>
  );
}

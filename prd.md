# Product Requirements Document (PRD)

## 1. Product Overview
**Name:** Amazon Now AI
**Tagline:** Reimagining Urgent Shopping. Need-Centric Commerce.
**Objective:** Transform the 5-minute search-and-browse shopping experience into a 5-second need-fulfillment experience.

## 2. Target Audience
Quick-commerce customers who:
- Have an immediate, urgent need (e.g., guests arriving, missing an ingredient).
- Lack the time or cognitive energy to search for individual products.
- Value speed and convenience over deep product comparisons.

## 3. Problem Statement
The current e-commerce paradigm is "Product-Centric" (User -> Search -> Browse -> Compare -> Add to Cart -> Checkout). This is inefficient for urgent needs. Quick-commerce customers want a "Need-Centric" flow (User expresses need -> System builds cart -> Checkout).

## 4. Key Features
- **Conversational Input:** Express needs via natural language (e.g., "Hosting a movie night").
- **Visual Input (VLM):** Upload photos of empty fridges or pantries for automatic replenishment.
- **7-Agent LangGraph AI Pipeline:**
  - *Intent Agent:* Determines core need.
  - *Context Agent:* Injects environmental factors (weather, time).
  - *Consumption Agent:* Predicts historical preferences.
  - *Inventory Agent:* Analyzes missing items.
  - *Graph Agent:* Finds semantic product associations.
  - *Cart Agent:* Synthesizes signals into a final cart.
  - *Explainability Agent:* Provides transparent reasoning to the user.
- **Instant Smart Cart:** Generates a ready-to-buy cart of exactly 3 optimal items in under 5 seconds.
- **1-Click Checkout:** Frictionless payment and delivery routing.

## 5. Success Metrics
- Time to Cart (TTC): Under 5 seconds.
- Cart Conversion Rate: Target +35% vs traditional search.
- Search Abandonment: Target 0% (search is bypassed).

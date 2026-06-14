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
- **Visual Input (VLM):** Upload photos of grocery lists, empty fridges or pantries for automatic cart-building.
- **Single-Shot AI Synthesis:** One grounded GPT-4o call reasons over every signal at once — intent, context (weather/time), real purchase history, inventory gaps, and product-graph associations — then synthesises the cart and its explanation. A deterministic in-process product association graph runs concurrently (0ms) and feeds real complementary pairings (pasta → sauce) into the prompt.
  - *Architecture note:* an earlier design used 7 sequential agent calls (~60s). It was deliberately collapsed to 1 grounded call + graph (~3s) because for sub-5-minute Q-commerce sessions, **latency is the product**.
- **Anti-Hallucination Guard:** Every product name, price, and discount is pinned to the catalog after the LLM responds — the model only chooses *which* products; it never invents facts.
- **Personalisation:** Real purchase-history lookup (brand affinities + 14-day reorder-gap detection) tailors the cart per customer.
- **Instant Smart Cart:** Generates a ready-to-buy cart of 3–7 optimal items in under 5 seconds.
- **Budget + Headcount:** Quantity-aware budget fitting and per-person scaling.
- **1-Click Checkout:** Frictionless payment and delivery routing.

## 5. Success Metrics
- Time to Cart (TTC): Under 5 seconds.
- Cart Conversion Rate: Target +35% vs traditional search.
- Search Abandonment: Target 0% (search is bypassed).

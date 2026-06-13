# UI/UX & System Design

## 1. Design Aesthetics
- **Theme:** Premium, Dark Mode, Glassmorphism.
- **Colors:** Deep Black (#000000) background, Amazon Orange (#FF9900) primary accents, White text.
- **Typography:** Inter (Google Font) for clean, modern readability.
- **Animations:** Subtle micro-animations (fade-ins, scale-on-hover) to make the UI feel alive and responsive.
- **Imagery:** Dynamic emoji product mapping to avoid ugly placeholder images during the hackathon demo.

## 2. Core UI Components
1. **Persona Banner:** Introduces the customer context immediately.
2. **Hero Search Bar:** Central, oversized input field emphasizing the conversational nature of the app. Includes a camera icon for VLM uploads.
3. **Smart Cart Panel:** Clean, receipt-like display of exactly 3 optimal items with prices and brief reasoning.
4. **AI Reasoning Panel:** A transparent, bulleted list detailing how the AI traversed the LangGraph pipeline to arrive at the cart.
5. **1-Click Checkout Modal:** A celebratory success modal with simulated order tracking to complete the user journey loop.

## 3. System Design (LangGraph Architecture)
The AI Engine uses a directed acyclic graph (DAG) to process state.
`START -> Intent -> Context -> Consumption -> Inventory -> Graph -> Cart -> Explainability -> END`

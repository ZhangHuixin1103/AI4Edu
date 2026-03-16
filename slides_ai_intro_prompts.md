# Nano Banana Slide Generation Prompts
# Topic: Introduction to AI & Large Language Models

Global style (apply to all slides):
- Background: off-white (#FFFBF0)
- Primary accent: amber (#F59E0B)
- Body text: dark zinc (#18181B)
- Secondary card background: zinc-100 (#F4F4F5)
- Font: Geist Sans throughout
- Slide number badge: small amber circle, bottom-right corner

---

## Slide 1 — What Is AI?

**Prompt:**
Create a slide titled "What Is Artificial Intelligence?".

Content:
- Subtitle: "Teaching machines to do things that normally require human thinking"
- Center graphic: a simple 3-node diagram
  - Left node: 🧠 "Human" — sees a cat, recognizes it instantly
  - Arrow → Center node: ⚙️ "AI" — learns from millions of examples
  - Right node: 🖼️ "Output" — correctly labels a new photo as "cat"
- Below the graphic, three short capability cards in a row:
  1. 👁️ See — image recognition, object detection
  2. 🗣️ Speak — voice assistants, speech-to-text
  3. 📝 Read & Write — translation, summarization, chat
- Footer note: "AI is not magic — it is pattern recognition at scale"

Style: warm amber theme — off-white (#FFFBF0) background, amber (#F59E0B) accent on card borders and node highlights, dark zinc (#18181B) body text, Geist Sans font throughout.

---

## Slide 2 — From AI to Machine Learning to Deep Learning

**Prompt:**
Create a slide titled "How Did We Get Here? A Quick Family Tree".

Content:
- Nested circle / Russian-doll diagram (largest to smallest, left to right):
  - Outermost ring (light amber fill): "Artificial Intelligence" — any technique that makes machines act smart
  - Middle ring (amber fill): "Machine Learning" — systems that learn from data instead of fixed rules
  - Innermost circle (deep amber fill, white text): "Deep Learning" — ML using multi-layer neural networks inspired by the brain
- Below the diagram, a horizontal timeline with 4 milestones:
  1. 1950s — Turing proposes the "thinking machine" idea
  2. 1980s — Neural networks gain traction
  3. 2012 — Deep learning beats humans at image recognition (ImageNet)
  4. 2022+ — Large Language Models go mainstream (ChatGPT, Claude, LLaMA)
- One-line caption: "Every AI headline you read lives inside that innermost circle"

Style: warm amber theme — off-white (#FFFBF0) background, amber gradient rings, dark zinc (#18181B) body text, Geist Sans font throughout.

---

## Slide 3 — What Is a Large Language Model (LLM)?

**Prompt:**
Create a slide titled "What Is a Large Language Model?".

Content:
- Two-column layout:
  - Left column — definition box (amber border):
    - An LLM is a deep-learning model trained on massive amounts of text
    - It learns to predict the next word — billions of times — until it understands language structure, facts, and reasoning
    - "Large" = billions of parameters (think: adjustable knobs inside the model)
  - Right column — visual analogy:
    - Title: "The autocomplete that went to university"
    - Show three progressive stages with arrows:
      1. 📱 Phone autocomplete → predicts next word from your habits
      2. 📚 Early LLM → predicts next word from millions of books
      3. 🎓 Modern LLM → answers questions, writes code, tutors students
- Bottom stat bar (amber background):
  - GPT-4: ~1 trillion parameters | LLaMA 3: 8B – 70B parameters | Trained on: trillions of text tokens

Style: warm amber theme — off-white (#FFFBF0) background, amber (#F59E0B) accent on borders and stat bar, dark zinc (#18181B) body text, Geist Sans font throughout.

---

## Slide 4 — How Does an LLM Actually Work?

**Prompt:**
Create a slide titled "Under the Hood: How an LLM Generates an Answer".

Content:
- Horizontal pipeline diagram with 5 steps, connected by arrows:
  1. 📥 Input (Prompt)
     "What is 3/4 + 1/2?"
  2. 🔤 Tokenization
     Break text into tokens: ["What", "is", "3", "/", "4", "+", "1", "/", "2", "?"]
  3. 🧮 Transformer Layers
     Each layer refines meaning using "attention" — the model decides which words matter most
  4. 📊 Probability Distribution
     The model scores thousands of possible next tokens
  5. 📤 Output (Response)
     "3/4 + 1/2 = 5/4 = 1.25"
- Side note callout (amber dashed border):
  "Fine-tuning: after base training, we can specialize the model on new data — e.g., training it to behave like a confused math student (that's exactly what our Alex model does!)"

Style: warm amber theme — off-white (#FFFBF0) background, amber (#F59E0B) pipeline arrows and callout border, dark zinc (#18181B) labels, Geist Sans font throughout.

---

## Slide 5 — From General LLM to Our AI Math Student

**Prompt:**
Create a slide titled "From General LLM → Our Custom Math Tutor".

Content:
- Three-stage vertical flow (top to bottom), each as a card:

  Card 1 — "Base Model" (zinc-100 background)
  - LLaMA 3 (open-source, Meta)
  - Trained on the entire internet — knows math, science, history, code
  - But: has no specific teaching persona

  Arrow ↓ labeled "Fine-tuning with teacher–student dialogue data"

  Card 2 — "Fine-tuned Model: Alex" (amber-tinted background)
  - Trained on curated examples of a student making math mistakes
  - Now role-plays as a confused 7th grader
  - Deployed via Ollama on a Render server

  Arrow ↓ labeled "Served through a Next.js web app"

  Card 3 — "You + Alex" (amber border, highlighted)
  - You practice explaining and correcting math mistakes
  - The AI stays in character — giving you real teaching practice
  - Visit: https://ai-math-ta.vercel.app

- Footer: "Same technology behind ChatGPT — specialized for teacher training"

Style: warm amber theme — off-white (#FFFBF0) background, amber (#F59E0B) arrows and Card 3 highlight border, zinc-100 (#F4F4F5) for Cards 1–2, dark zinc (#18181B) body text, Geist Sans font throughout.

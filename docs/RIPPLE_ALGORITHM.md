# 🌌 Sayura Ripple Galaxy — 5-Element Scoring Model

## Purpose

The 5-element model gives every affirmation five unique ways to shine in the community:

- **Spread far** (Water)
- **Build personal momentum** (Fire)  
- **Grow steadily over time** (Wood)
- **Resonate widely** (Metal/Air)
- **Stay deeply rooted** (Earth)

Each metric uses a meaningful name, clear icon, and psychologically distinct growth pattern to motivate different user behaviors without overlapping.

## 1. 💧 Ripples (Water) — Social Spread

**Purpose**: Measure how far an affirmation travels via social interactions. Also the combination of formula for all the other 4 elements. Since the feature is called Ripple Galaxy as a measure of the overall impact of an affirmation in the Sayura Universe.

**Logic**:
- Heart = +1 point
- Save to Vault = +5 points (auto-includes heart; no double count)
- Save + Active Streak = +3 bonus points

**Formula**:
```ini
hearts_only = max(0, hearts_total − saves_total)
Ripples = (1 × hearts_only) + (5 × saves_total) + (3 × streak_savers)
```

**Effect**: Encourages sharing, liking, and saving — the first step in spreading an affirmation.

## 2. 🔥 Streak (Fire) — Personal Momentum

**Purpose**: Track consecutive days you speak the affirmation.

**Logic**:
- Increments +1 for each day spoken in a row.
- Resets to 0 if a day is missed.

**Effect**: Builds urgency and habit. Feels like "keeping the flame alive."

## 3. 🌲 Rings (Wood) — Community Longevity

**Purpose**: Show how long the affirmation has been actively spoken by the community.

**Logic**:
- Day 1 a user speaks it = +1
- Day 2 in a row = +2
- Day 3 = +3 … and so on.
- Breaks reset contribution to +1 next time they speak.

**Formula**:
```ini
RingsScore_today = Σ(current_streak_days for all speakers today)
RingsCount_today = unique_speakers_today
RingsScore_total = sum of RingsScore_today
```

**Effect**: Rewards consistent daily practice across many users.

## 4. 🔊 Echo (Metal/Air) — Community Repetition

**Purpose**: Track the total number of times an affirmation has been spoken — regardless of streaks or uniqueness.

**Logic**:
- Every utterance = +1 (multiple per day per person allowed).
- Includes both public and private rituals.

**Effect**: Shows viral resonance — "my words are echoing everywhere."

## 5. 🪨 Bedrock (Earth) — Deep Adoption

**Purpose**: Measure how firmly an affirmation is embedded in the community's daily life.

**Logic**:
- Count unique users who have kept the affirmation in their Vault for 21 consecutive days (habit period).
- Speaking it is optional; the key is retention.

**Effect**: Rewards loyalty and stability — "this affirmation is part of someone's foundation."

## Elemental Summary

| Element | Stat | Icon | Meaning | Motivated Behavior |
|---------|------|------|---------|-------------------|
| Water | Ripples | 💧 | Spread | Share, like, save |
| Fire | Streak | 🔥 | Momentum | Speak daily yourself |
| Wood | Rings | 🌲 | Longevity | Maintain community practice |
| Metal/Air | Echo | 🔊 | Resonance | Repeat & inspire others to repeat |
| Earth | Bedrock | 🪨 | Stability | Keep affirmations long-term |

## UI/UX Philosophy

- **One-word names** keep the nav & stat blocks clean.
- **Elemental icons** create intuitive meaning and thematic unity.
- **Separate growth patterns** ensure at least one metric ticks upward every 2–3 days, giving small dopamine boosts without inflating numbers.

## Clear Emotional Messaging in Onboarding

- **Ripples** → "Your words are touching others."
- **Streak** → "You're keeping the flame alive."
- **Rings** → "Your affirmation has deep roots in the community."
- **Echo** → "Your words are being repeated across the universe."
- **Bedrock** → "Your affirmation is part of someone's foundation."

## 3. Implementation Details

### 3.1 Data Structure
Each affirmation should track:
```typescript
interface AffirmationMetrics {
  ripples: number;      // Social spread points
  streak: number;       // Personal consecutive days
  rings: number;        // Community longevity score
  echo: number;         // Total utterance count
  bedrock: number;      // Deep adoption count (21+ day vault users)
}
```

### 3.2 Growth Patterns
- **Ripples**: Spikes with social interactions
- **Streak**: Linear daily growth, resets on breaks
- **Rings**: Steady community practice accumulation
- **Echo**: Continuous growth with every utterance
- **Bedrock**: Slow, meaningful growth with long-term retention

### 3.3 Psychological Design
- **Multiple growth channels** ensure users always see progress
- **Elemental theming** creates emotional connection
- **Clear messaging** explains the "why" behind each metric
- **Fair weighting** rewards effort appropriately

## 4. UI/UX Design Intent

### 4.1 Emotional Effect

**Ripples (💧)** — Makes the user feel connected to a bigger movement.
- "My words are reaching others."
- Encourages sharing and community interaction.

**Streak (🔥)** — Motivates daily engagement.
- "Keep the flame alive."
- Creates urgency without shaming breaks.

**Rings (🌲)** — Gives a sense of legacy and growth.
- "My affirmation has deep roots in the community."
- Even without streak perfection, progress is visible.

**Echo (🔊)** — Shows viral resonance and adoption.
- "My words are being repeated across the universe."
- Demonstrates widespread community adoption.

**Bedrock (🪨)** — Rewards loyalty and stability.
- "My affirmation is part of someone's foundation."
- Celebrates long-term commitment and deep integration.

### 4.2 Morality & Psychology

- **Positive reinforcement > punishment** — Breaking a streak doesn't erase other metrics.
- **Multiple growth channels** — Users can feel progress via virality, consistency, longevity, resonance, or stability.
- **Transparency** — All formulas are explainable; no "black box" gamification.
- **Fair weighting** — Easy actions get small rewards; effortful actions get bigger rewards.
- **Elemental balance** — Each element represents a different aspect of community health.

### 4.3 Visual Design Goals

- **Elemental icons** give intuitive cues (water = spread, fire = momentum, wood = growth, air = resonance, earth = stability).
- **One-word stat names** keep UI clean and memorable.
- **Numbers that move** — At least one stat should tick upward every 2–3 days to keep engagement high.
- **Milestone celebrations** — Small animations when certain thresholds are crossed (e.g., 100 Ripples, 21-day streak, 50 Rings, 1000 Echoes, 10 Bedrock users).
- **Elemental color coding** — Subtle color themes for each metric type.

## 5. Summary

The 5-Element Ripple Galaxy system creates a comprehensive gamification framework that rewards every aspect of affirmation practice and community engagement.

By using elemental themes (Water, Fire, Wood, Metal/Air, Earth) and psychologically distinct growth patterns, we give users five unique ways to measure their impact:

- **Spread** (Ripples) - Social reach and engagement
- **Momentum** (Streak) - Personal consistency and habit-building
- **Longevity** (Rings) - Community practice sustainability
- **Resonance** (Echo) - Viral adoption and repetition
- **Stability** (Bedrock) - Deep integration and long-term retention

This system ensures users always see progress in at least one area, providing continuous motivation while telling a rich story about their affirmation's journey through the community. The elemental theming creates emotional connection while the clear metrics provide transparency and fairness. 
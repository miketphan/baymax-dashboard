# 02 - Fair Value Gaps (FVG)

**The footprints of institutional order flow and algorithmic price delivery.**

---

## 🎯 What is a Fair Value Gap?

A Fair Value Gap is an imbalance in price where:
- Price moved aggressively in one direction
- Left a "gap" between the wick of one candle and the body/wick of another
- Represents where institutional orders were filled
- Price often returns to fill the gap

**ICT's Definition:**
> "FVGs are the footprints of institutional order flow. They show where algorithms delivered price rapidly, leaving unfilled orders behind."

---

## 📊 Anatomy of an FVG

### Bullish FVG (BISI - Buy Side Imbalance)
```
Candle 1       Candle 2      Candle 3
   │              │             │
   │    High      │    High     │    High
   │      ╲       │      ╲      │      ╲
   │       ╲      │       ╲     │       ╲
   │        ╲     │        ╲    │        ╲
   │         ╲    │         ╲   │         ╲
   │    Low   ╲   │    Low   ╲  │    Low   ╲
   │            ╲ │            ╲│            ╲
                 ↑_____________↑
                      GAP
                       
    Candle 2's Low is HIGHER than Candle 1's High
```

**Formation:**
1. Candle 1: Any candle (usually bearish or neutral)
2. Candle 2: Strong bullish candle
3. Candle 3: Continuation or consolidation
4. **Gap exists between Candle 1's High and Candle 2's Low**

### Bearish FVG (SIBI - Sell Side Imbalance)
```
Candle 1       Candle 2      Candle 3
   │              │             │
   │    High      │    High     │    High
   │      ╱       │      ╱      │      ╱
   │       ╱      │       ╱     │       ╱
   │        ╱     │        ╱    │        ╱
   │         ╱    │         ╱   │         ╱
   │    Low   ╱   │    Low   ╱  │    Low   ╱
   │            ╱ │            ╱│            ╱
   ↑_____________↑
        GAP
        
    Candle 2's High is LOWER than Candle 1's Low
```

**Formation:**
1. Candle 1: Any candle (usually bullish or neutral)
2. Candle 2: Strong bearish candle
3. Candle 3: Continuation or consolidation
4. **Gap exists between Candle 1's Low and Candle 2's High**

---

## 🔍 How to Identify FVGs

### Three-Candle Rule
An FVG requires exactly 3 candles:
- **Candle 1:** First reference point
- **Candle 2:** Impulse candle (creates the gap)
- **Candle 3:** Closes the pattern

### FVG Calculation

**Bullish FVG (BISI):**
```
Top of FVG = Candle 2's Low
Bottom of FVG = Candle 1's High

Gap Size = Candle 2's Low - Candle 1's High
```

**Bearish FVG (SIBI):**
```
Top of FVG = Candle 1's Low
Bottom of FVG = Candle 2's High

Gap Size = Candle 1's Low - Candle 2's High
```

### Visual Examples

**Strong Bullish FVG:**
```
    ╱
   ╱ ← Candle 3 (small bullish)
  ╱
 ╱___
│    ↑── Candle 2's Low (large bullish)
│       ╲
│        ╲
│         ╲ ← Candle 2
│          ╲___
│                ╲
│                 ╲ ← Candle 1's High
│                  ╲
```

**Strong Bearish FVG:**
```
│                  ╱
│                 ╱ ← Candle 1's Low
│                ╱
│          ___╱
│         ╱
│        ╱ ← Candle 2 (large bearish)
│    ___↑
│   ╱
  ╱ ← Candle 3 (small bearish)
 ╱
```

---

## 🎯 Consequent Encroachment (CE)

### Definition
The **50% level** of the Fair Value Gap.

**Calculation:**
```
CE = (Top of FVG + Bottom of FVG) / 2
```

**Why CE Matters:**
- Algorithms often deliver price to the CE level
- High-probability entry point
- Confluence with OTE (50% retracement)
- Institutions often fill orders at this midpoint

### Example
```
Bullish FVG:
Top = 1.0850
Bottom = 1.0820
CE = (1.0850 + 1.0820) / 2 = 1.0835

Price will often return to ~1.0835 before continuing up
```

---

## 📈 FVG Trade Setups

### Setup 1: FVG as Entry Zone

**Bullish FVG Entry:**
1. Identify bullish FVG below current price
2. Wait for price to retrace into FVG
3. Look for bullish confirmation (engulfing, pin bar)
4. Enter at or near CE level
5. Stop below FVG bottom
6. Target next resistance/FVG above

**Bearish FVG Entry:**
1. Identify bearish FVG above current price
2. Wait for price to retrace into FVG
3. Look for bearish confirmation
4. Enter at or near CE level
5. Stop above FVG top
6. Target next support/FVG below

### Setup 2: FVG Confluence with OTE

**High Probability Long:**
```
1. HTF bullish structure (HH, HL)
2. Price pulls back (creates FVG below)
3. Pullback reaches 50-62% (OTE zone)
4. OTE zone overlaps with FVG
5. Enter at FVG + OTE confluence
6. Stop below structure
```

### Setup 3: FVG After BOS/CHoCH

**Momentum Continuation:**
```
1. BOS occurs (break of structure)
2. FVG forms during the BOS
3. Price retraces to fill FVG
4. Enter in direction of BOS
5. Stop below FVG
6. Target next liquidity pool
```

---

## ⚡ FVG Quality Factors

### Strong FVGs (High Probability)

| Characteristic | Why It Matters |
|----------------|----------------|
| **Large gap size** | Shows strong institutional order flow |
| **Forms on BOS** | Confirms trend continuation |
| **Clean 3-candle pattern** | No overlapping wicks |
| **During killzone** | Higher volume, more reliable |
| **In discount/premium** | Aligns with value areas |
| **At HTF level** | Major support/resistance confluence |

### Weak FVGs (Low Probability)

| Characteristic | Why It's Problematic |
|----------------|----------------------|
| **Tiny gap** | Insufficient order flow |
| **In chop/range** | No directional bias |
| **Overlapping wicks** | Pattern not clean |
| **Against HTF bias** | Fighting the trend |
| **Multiple FVGs close** | Conflicting imbalances |

---

## 📊 FVG Management

### Fresh vs Mitigated FVGs

**Fresh FVG:**
- Price has not returned to fill it
- Highest probability
- Priority target for entries

**Mitigated FVG:**
- Price has visited and filled the gap
- Lower probability for second entry
- May still act as support/resistance

### FVG Hierarchy (Which to Trade)

1. **HTF FVGs over LTF FVGs**
   - Daily/4H FVGs are more significant
   - LTF FVGs form within HTF FVGs

2. **Recent FVGs over old FVGs**
   - FVGs from past 5-10 candles
   - Old FVGs (>20 candles) lose relevance

3. **Bigger FVGs over smaller FVGs**
   - Larger gaps = stronger order flow
   - Small gaps often get skipped over

---

## 🔗 FVG Relationships

### FVGs and Order Blocks
```
Often, an FVG forms WITHIN an Order Block:

Order Block:    ████████████████
                 ▲ FVG forms here
                 ████ (FVG inside OB)
                 
Confluence = Higher probability
```

### FVGs and Liquidity
```
Price path:
1. Creates FVG during impulse
2. Runs to take liquidity (EQH/EQL)
3. Returns to fill FVG
4. Continues in original direction

The FVG is the "rest stop" on the way to liquidity
```

### Stacked FVGs
```
Multiple FVGs in same direction:

FVG 1:    ████
FVG 2:      ████
FVG 3:        ████

Price often fills all three before continuing
Creates extended entry zone
```

---

## 🎓 Advanced FVG Concepts

### Breaker FVG
An FVG that forms after breaking a previous FVG:
```
1. Bullish FVG forms
2. Price fills it
3. Price continues down
4. Bearish FVG forms (Breaker)
5. Previous support becomes resistance
```

### Inverse FVG
When price completely fills an FVG and goes beyond it:
```
Bullish FVG:    ████
Price fills it and goes lower
= Structure change, FVG invalidated
```

### FVG as Profit Targets
Use opposing FVGs as take profit levels:
```
Long Entry: At bullish FVG
Target 1: Next bullish FVG
Target 2: Bearish FVG above (resistance)
```

---

## ⚠️ Common FVG Mistakes

| Mistake | Correct Approach |
|---------|------------------|
| Trading every FVG | Wait for HTF confluence |
| Ignoring structure | Trade FVGs in direction of structure |
| Entering before mitigation | Wait for price to reach FVG |
| Using FVG as only factor | Stack with OTE, OB, time |
| Holding through invalidation | Stop out if FVG is fully filled against you |

---

## 📝 FVG Checklist

Before entering on an FVG, confirm:

- [ ] FVG is clearly identifiable (3 candles)
- [ ] Gap is substantial (not just a few pips)
- [ ] Aligns with HTF structure/bias
- [ ] Price is at or approaching FVG
- [ ] During killzone hours (preferably)
- [ ] Has confluence (OTE, OB, level)
- [ ] Clear stop placement (beyond FVG)
- [ ] Target has favorable R:R

**Minimum 6 checks = Consider trading**

---

## 💡 Key FVG Insights

1. **FVGs are magnets**
   - Price is drawn back to fill them
   - The bigger the gap, the stronger the pull

2. **CE is the sweet spot**
   - 50% level gets hit most often
   - Best entry price within FVG

3. **Fresh FVGs are best**
   - Once mitigated, probability drops
   - Mark them when they form

4. **FVGs work in all markets**
   - Forex, futures, crypto
   - All timeframes

5. **Algorithms respect FVGs**
   - Institutional programs target them
   - Retail traders often miss them

---

## 🏋️ Practical Exercises for Mastery

1.  **FVG Identification Marathon:**
    *   Go to a 15M chart and turn on a session indicator to highlight the London and New York Killzones.
    *   Scroll back in time and identify and mark every single valid FVG that formed *during* these killzones.
    *   Use the rectangle tool to draw them out. Note whether they were BISI or SIBI. Do this for at least 10 sessions.

2.  **Consequent Encroachment (CE) Test:**
    *   Using the FVGs you identified in the first exercise, draw a horizontal line at the 50% level (CE) of each one.
    *   Observe how many times price returned to tap the CE level before continuing its move. This will build your confidence in the CE as a precise entry point.

3.  **Fresh vs. Mitigated Log:**
    *   Create two columns in a notebook or text file: "Fresh FVGs" and "Mitigated FVGs".
    *   As you watch the live market on a 5M chart, add new FVGs to the "Fresh" column as they form.
    *   When price trades back into one, note the reaction and move it to the "Mitigated" column.
    *   Over time, you will develop a feel for which fresh FVGs are most likely to be respected.

---

*"FVGs reveal where the smart money moved. Trade where they left their footprints."*

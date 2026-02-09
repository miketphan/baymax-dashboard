# 09 - Premium and Discount Zones

**Trading from value areas using the dealing range framework.**

---

## 🎯 What are Premium and Discount Zones?

**Premium Zone:** Upper half of a dealing range - expensive prices (good for selling)
**Discount Zone:** Lower half of a dealing range - cheap prices (good for buying)

**ICT's Definition:**
> "Buy at a discount, sell at a premium. Never chase price into the premium zone for longs, or discount zone for shorts."

---

## 📊 The Dealing Range

### Definition
The range between a significant swing high and swing low that represents a complete price cycle.

**Components:**
```
Swing High (Premium Zone Top)
    ┌──────────────────────────────┐
    │      Upper Premium           │ ← Sell here
    │    (62% - 100% of range)     │
    ├──────────────────────────────┤
    │      Lower Premium           │
    │    (50% - 62% of range)      │
    ├──────────────────────────────┤ ← Mean Threshold (50%)
    │      Upper Discount          │
    │    (38% - 50% of range)      │
    ├──────────────────────────────┤
    │      Lower Discount          │ ← Buy here
    │    (0% - 38% of range)       │
    └──────────────────────────────┘
Swing Low (Discount Zone Bottom)
```

### Mean Threshold (MT)
The 50% midpoint of the dealing range:
- Balance point between buyers and sellers
- Often acts as support/resistance
- Where price often hesitates
- Good for stop placement reference

---

## 🟢 Discount Zone (Buy Zone)

### Definition
The lower half of the dealing range (0% to 50%)

**Why Buy Here:**
- Price is "cheap" relative to range
- Good value for longs
- Risk is defined (swing low)
- Room to move to premium

### Visual
```
Discount Zone = Buy Zone

    Swing High
         │
    ┌────┴────┐
    │ Premium │
    │   Zone  │
    ├────┬────┤ ← 50% (Mean Threshold)
    │    │    │
    │    │    │
    │Discount │ ← Buy in this area
    │   Zone  │
    │    │    │
    └────┴────┘
         │
    Swing Low

Buy between Swing Low and 50%
```

### Best Entries in Discount
1. **Lower Discount (0-38%):** Best value, lowest risk
2. **OTE in Discount:** 50-62% retracement lands here
3. **FVG in Discount:** Imbalance at value area
4. **OB in Discount:** Institutional support

---

## 🔴 Premium Zone (Sell Zone)

### Definition
The upper half of the dealing range (50% to 100%)

**Why Sell Here:**
- Price is "expensive" relative to range
- Good value for shorts
- Risk is defined (swing high)
- Room to move to discount

### Visual
```
Premium Zone = Sell Zone

    Swing High
         │
    ┌────┴────┐
    │Premium  │ ← Sell in this area
    │   Zone  │
    │    │    │
    ├────┬────┤ ← 50% (Mean Threshold)
    │    │    │
    │Discount │
    │   Zone  │
    └────┴────┘
         │
    Swing Low

Sell between 50% and Swing High
```

### Best Entries in Premium
1. **Upper Premium (62-100%):** Best value, lowest risk
2. **OTE in Premium:** 50-62% retracement lands here
3. **FVG in Premium:** Imbalance at premium area
4. **OB in Premium:** Institutional resistance

---

## 📏 Calculating Dealing Range Zones

### Formula

**Swing High (SH)** to **Swing Low (SL)**

```
Range = SH - SL

Mean Threshold (50%) = SL + (Range × 0.50)

Premium Zone = MT to SH
Discount Zone = SL to MT

Upper Premium = MT + (Range × 0.12) to SH
Lower Premium = MT to MT + (Range × 0.12)

Upper Discount = MT - (Range × 0.12) to MT
Lower Discount = SL to MT - (Range × 0.12)
```

### Example

```
Swing High = 1.1000
Swing Low = 1.0800

Range = 1.1000 - 1.0800 = 0.0200

Mean Threshold = 1.0800 + (0.0200 × 0.50)
               = 1.0800 + 0.0100
               = 1.0900

Premium Zone = 1.0900 to 1.1000
Discount Zone = 1.0800 to 1.0900

Upper Premium = 1.0912 to 1.1000 (62-100%)
Lower Premium = 1.0900 to 1.0912 (50-62%)

Upper Discount = 1.0888 to 1.0900 (38-50%)
Lower Discount = 1.0800 to 1.0888 (0-38%)
```

---

## 🎯 Trading Rules

### The Golden Rule
```
BULLISH BIAS: Buy in Discount, Target Premium
BEARISH BIAS: Sell in Premium, Target Discount
```

### Rule 1: Don't Chase Into Premium (for Longs)
```
Wrong:        Right:
    ╱             ╱
   ╱             ╱
  ╱ ← Buy      ╱
 ╱            ╱ ← Wait for pullback
/            /____
            /     ↑ Buy here (Discount)
           /
          /
Price already in Premium
Don't chase! Wait for Discount.
```

### Rule 2: Don't Chase Into Discount (for Shorts)
```
Wrong:        Right:
\            \
 \            \
  \ ← Sell    \
   \           \
    \____      \
         ↑     \
    Sell here   Wait for bounce
    (Premium)   to Premium

Price already in Discount
Don't short! Wait for Premium.
```

---

## 📊 Multi-Timeframe Premium/Discount

### HTF Dealing Range (Daily/4H)
Establishes overall bias:
```
Daily Chart:
┌─────────────────────────────────────┐
│ Premium Zone                        │
│       ┌───┐ ← Price here            │
│       │   │                         │
├───────┴───┴─────────────────────────┤
│ Discount Zone                       │
└─────────────────────────────────────┘

Bias: Bearish (Price in Premium)
Action: Look for shorts on LTF
```

### LTF Dealing Range (1H/15M)
Precision entry within HTF bias:
```
1H Chart (within Daily Premium):
┌─────────────────────────────────────┐
│ Premium Zone (Daily)                │
│    ┌──────────────────┐             │
│    │  Premium (1H)    │ ← Short here│
│    │       ┌──┐       │             │
│    │       │  │       │             │
│    └───────┴──┴───────┘             │
│       Discount (1H)                 │
└─────────────────────────────────────┘

Confluence: Daily Premium + 1H Premium
= High probability short
```

---

## ⚡ Premium/Discount + Other Concepts

### + OTE
```
OTE (50-62% retracement) often lands in:
- Upper Discount (for longs) ✓ Good
- Lower Premium (for shorts) ✓ Good

Perfect confluence:
Bullish trend + OTE + Discount Zone = Excellent long
```

### + FVG
```
FVG in Discount Zone:
┌─────────────────────────────────────┐
│ Premium                             │
├─────────────────────────────────────┤
│                                     │
│ Discount    ████ ← FVG here         │
│             ████ ← Buy at FVG       │
│                                     │
└─────────────────────────────────────┘

Double confluence = Higher probability
```

### + Structure
```
Bullish structure:
- HH, HL pattern
- Pullback to Discount
- Buy at Discount
- Target next Premium

The pullback SHOULD reach Discount
If it doesn't = Weak trend
```

---

## 📋 Premium/Discount Checklist

- [ ] Dealing range identified (clear swing high/low)
- [ ] Mean Threshold calculated (50%)
- [ ] Premium and Discount zones marked
- [ ] Price currently located (which zone?)
- [ ] HTF bias established
- [ ] For longs: Price in or reaching Discount
- [ ] For shorts: Price in or reaching Premium
- [ ] Has confluence (OTE, FVG, OB, structure)
- [ ] During killzone (preferably)
- [ ] Clear stop placement (beyond swing)

**7+ checks = Tradeable zone entry**

---

## 💡 Key Insights

1. **Value is relative**
   - Premium/Discount changes as range develops
   - Mark new ranges as structure evolves
   - Old ranges lose relevance

2. **50% is the battleground**
   - Mean threshold = decision point
   - Above = bullish control
   - Below = bearish control

3. **Don't chase**
   - Wait for price to come to value
   - Premium for shorts
   - Discount for longs

4. **Stack the confluence**
   - Premium/Discount alone = okay
   - + OTE + FVG + Structure = excellent

5. **Timeframe alignment**
   - HTF zone + LTF zone = Best
   - Conflict between timeframes = Caution

---

## 🎯 Premium/Discount Mantras

- **"Buy at a discount, sell at a premium"**
- **"Don't chase price into premium for longs"**
- **"The 50% level is the battlefield"**
- **"Value is in the discount zone"**
- **"Patience for price to reach value"**

---

*"The market constantly cycles between premium and discount. Your job is to buy the discount and sell the premium."*

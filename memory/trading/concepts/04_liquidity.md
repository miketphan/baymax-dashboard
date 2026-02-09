# 04 - Liquidity

**Understanding where price is drawn to and how to trade around it.**

---

## 🎯 What is Liquidity?

Liquidity refers to pools of orders sitting above or below price that algorithms will seek out before making their next move.

**ICT's Definition:**
> "Price seeks liquidity. Before any significant move, price will go where the orders are - above equal highs or below equal lows."

**Two Types of Liquidity:**
1. **External Liquidity** - Swing highs/lows, equal highs/lows
2. **Internal Liquidity** - FVGs, OBs, dealing range levels

---

## 📈 Buy Side Liquidity (BSL)

### Definition
Liquidity sitting **above price** that will fuel upward moves.

**Sources of BSL:**
- Equal highs (EQH)
- Previous day high (PDH)
- Previous week high (PWH)
- Previous month high (PMH)
- Swing highs
- Retail stop losses (above resistance)

### Visual
```
Price Action:
     EQH ← Equal Highs (BSL here)
    /   \
   /     \
  /       \
 /         \
Price now  ← Price moves toward EQH

Algorithm target: Take out EQH
```

### How to Trade BSL

**For Shorts:**
1. Identify EQH or PDH above price
2. Wait for price to sweep the high
3. Look for rejection/bearish reversal
4. Short after sweep
5. Stop above the sweep wick
6. Target internal liquidity below

**Example:**
```
    EQH (BSL)
      │
    / │ \  ← Sweep
   /  │  \
  /   │   \
 /         \
            ← Entry short after sweep
```

---

## 📉 Sell Side Liquidity (SSL)

### Definition
Liquidity sitting **below price** that will fuel downward moves.

**Sources of SSL:**
- Equal lows (EQL)
- Previous day low (PDL)
- Previous week low (PWL)
- Previous month low (PML)
- Swing lows
- Retail stop losses (below support)

### Visual
```
Price Action:
Price now  ← Price moves toward EQL
 \
  \
   \
    \
     EQL ← Equal Lows (SSL here)
    /   \
```

### How to Trade SSL

**For Longs:**
1. Identify EQL or PDL below price
2. Wait for price to sweep the low
3. Look for rejection/bullish reversal
4. Long after sweep
5. Stop below the sweep wick
6. Target internal liquidity above

**Example:**
```
            ← Entry long after sweep
 /         
/  │       \
   │        \
   │         \
   │    EQL (SSL)
     / │ \  ← Sweep
    /  │  \
```

---

## 🎭 Equal Highs (EQH) & Equal Lows (EQL)

### Equal Highs (EQH)
Two or more swing highs at approximately the same price level.

```
Formation:
    ╱\      ╱\
   /  \    /  \
  /    \  /    \
 /      \/      \
      EQH (BSL here)

Traders place stops above first high
Algorithm sweeps both highs
```

**Trade EQH:**
- Short after sweep of both highs
- Stop above sweep wick
- Target opposing liquidity

---

### Equal Lows (EQL)
Two or more swing lows at approximately the same price level.

```
Formation:
\      /\      /
 \    /  \    /
  \  /    \  /
   \/      \/
   EQL (SSL here)

Traders place stops below first low
Algorithm sweeps both lows
```

**Trade EQL:**
- Long after sweep of both lows
- Stop below sweep wick
- Target opposing liquidity

---

## 🌊 Inducement

### Definition
A "fake" liquidity level created to induce retail traders into the market, only to be swept.

**How Inducement Works:**
1. Algorithm marks a level (EQH/EQL)
2. Retail traders see it as resistance/support
3. Retail enters (shorts above, longs below)
4. Algorithm sweeps the level
5. Retail stops are hit
6. Algorithm moves in intended direction

### Example: Bullish Inducement
```
Price makes lower high (inducement)
Retail shorts thinking it's resistance
Algorithm sweeps the high
Retail stops trigger
Algorithm reverses up

    ╱ ← Inducement high
   ╱
  ╱  ← Retail shorts here
 ╱___
    
   ╱ ← Actual move after sweep
  ╱
```

**Avoid the Trap:**
- Wait for sweep before entering
- Don't anticipate the break
- Let retail get stopped first

---

## 📊 Internal Liquidity (IL)

### Definition
Liquidity within the dealing range - FVGs, OBs, CE levels.

**Purpose:**
- Where price goes after taking external liquidity
- Profit targets
- Entry zones

### Example Price Path
```
External:        Internal:
EQH (BSL)        FVG above
   │                │
   │  ← Takes BSL   │  ← Targets FVG
   │                │
Current            OB
   │                │
   │                │
EQL (SSL)

Path: Current → BSL (sweep) → FVG (target)
```

---

## 🔄 The Liquidity Cycle

### Standard Algorithmic Path

```
Phase 1: ACCUMULATION
- Price in range
- Building positions
- Marking liquidity levels

Phase 2: MANIPULATION
- Sweeps EQH or EQL
- Stops retail traders
- Creates liquidity void

Phase 3: DISTRIBUTION
- Moves toward internal liquidity
- Takes profit at FVG/OB
- Reverses or continues
```

**Timing (EST):**
- Accumulation: 2:00-3:00 AM
- Manipulation: 5:00-6:00 AM
- Distribution: 10:00-11:00 AM

---

## 🎯 Trading Liquidity

### Model 1: Liquidity Sweep Reversal (Turtle Soup)

**For Longs:**
1. Find EQL (equal lows)
2. Wait for break below EQL
3. Immediate rejection (wick)
4. Enter on reclaim of EQL
5. Stop below sweep wick

**For Shorts:**
1. Find EQH (equal highs)
2. Wait for break above EQH
3. Immediate rejection (wick)
4. Enter on reclaim of EQH
5. Stop above sweep wick

### Model 2: Liquidity Run Continuation

**After Sweep:**
1. Price sweeps BSL (EQH)
2. Rejects strongly
3. Bearish structure forms
4. Short on pullback
5. Target next SSL

### Model 3: Liquidity to Liquidity

**The Basic Move:**
```
SSL (below) ← Current → BSL (above)

Algorithm path:
1. At current price
2. Run to BSL (sweep)
3. Reverse
4. Run through current
5. Target SSL
```

Trade: Enter after BSL sweep, target SSL

---

## 📍 Key Liquidity Levels to Mark

### Daily Prep Checklist

Mark these on your charts:

**External Liquidity:**
- [ ] Previous Day High (PDH)
- [ ] Previous Day Low (PDL)
- [ ] Previous Week High (PWH)
- [ ] Previous Week Low (PWL)
- [ ] Equal Highs (EQH)
- [ ] Equal Lows (EQL)

**Internal Liquidity:**
- [ ] Open FVGs
- [ ] Fresh Order Blocks
- [ ] Dealing range 50% (Mean Threshold)
- [ ] Premium/Discount zones

---

## ⚠️ Liquidity Traps

### False Breakout
```
    EQH
      │
    / │ \  ← Breaks EQH
   /  │  \
  /   │   \
 /         ← Looks like continuation

But: Immediate reversal = False breakout
     Only wick above = Trap
```

### How to Avoid Traps
1. Wait for candle CLOSE beyond level
2. Look for confirmation (next candle)
3. Check volume (low volume = trap likely)
4. Wait for retest as support/resistance

---

## 🔗 Liquidity Relationships

### Liquidity + Time
- NY open (9:30 AM): Often sweeps overnight levels
- Silver Bullet (9:50-10:10): Liquidity sweep window
- London Close (5:00 AM): Sweeps Asia range

### Liquidity + Structure
- BSL above = Short targets
- SSL below = Long targets
- BOS above BSL = Continuation up
- CHoCH after sweep = Reversal

### Liquidity + FVG/OB
- Price sweeps liquidity
- Fills FVG or OB
- Continues to next liquidity

---

## 🎓 Advanced Liquidity Concepts

### Multi-Timeframe Liquidity
```
Daily:    EQH at 1.1000
4H:       EQH at 1.0950
1H:       EQH at 1.0920

Price will likely take all three
Trade: Short after 1H sweep, target 4H, then Daily
```

### Liquidity Voids
When liquidity is taken, a "void" is created:
```
Before:          After:
    BSL             Taken
      │               │
      │               │ Void = No orders
      │               │
Current          Current
      │               │
    SSL             SSL (still there)
```

Price often returns to fill the void

---

## 📋 Liquidity Trading Checklist

- [ ] Mark all external liquidity levels
- [ ] Mark all internal liquidity levels
- [ ] Identify which side has more liquidity
- [ ] Price is approaching liquidity
- [ ] During killzone hours
- [ ] Structure supports the sweep
- [ ] Wait for actual sweep (wick or close)
- [ ] Confirmation candle after sweep
- [ ] Clear stop placement
- [ ] Target is next liquidity pool

---

## 💡 Key Liquidity Insights

1. **Price always seeks liquidity**
   - Before big moves
   - At session opens
   - After consolidation

2. **Retail provides liquidity**
   - Stop losses = liquidity
   - Breakout traders get swept
   - Wait for the sweep

3. **External → Internal**
   - Price takes external liquidity first
   - Then targets internal
   - Plan your entries accordingly

4. **Equal levels are magnets**
   - EQH and EQL attract price
   - Mark them daily
   - Trade the sweep

5. **Time matters**
   - Sweeps happen in killzones
   - Avoid mid-day (no liquidity)
   - Best moves = after liquidity taken

---

## 🏋️ Practical Exercises for Mastery

1.  **Daily Liquidity Mapping:**
    *   Before the London session opens, go to a 1H chart.
    *   Mark the previous day's high (PDH) and low (PDL).
    *   Mark the Asia session high and low.
    *   Draw horizontal lines at any obvious equal highs (EQH) or equal lows (EQL).
    *   Observe what happens to these levels during the London and New York sessions. Do this every day for two weeks.

2.  **The "Turtle Soup" Backtest:**
    *   Go to a 15M chart and find 10 examples of a clean, old high or low being taken out by a sharp wick.
    *   Mark the point where price swept the liquidity.
    *   Observe the price action immediately after the sweep. How many of the 10 examples resulted in a significant reversal? This builds conviction in the sweep-and-reversal pattern.

3.  **Inducement Spotting:**
    *   Look at a 5M chart during a trending move.
    *   Identify the small, short-term swing points that are created *against* the main trend. These are often inducement points.
    *   Watch how price often sweeps these minor points before continuing in the primary direction. The goal is to train your eye to distinguish between a major structural point and minor inducement.

---

*"Understand where the liquidity is, and you'll understand where price is going."*

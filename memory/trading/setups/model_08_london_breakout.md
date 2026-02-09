# Trading Model 08: London Breakout

**Purpose:** A time-based model designed to capture the initial, high-momentum move that often occurs after the London session opens, using the preceding Asia session range as a key reference point.

---

## 📋 Quick Reference Card

| Criteria | Description |
| --- | --- |
| **Model Name** | London Breakout (AMD Variation) |
| **Type** | Reversal / Breakout |
| **Ideal Timeframe** | 15M for Asia Range, 5M/15M for Entry |
| **Key Ingredients** | Asia Range, Judas Swing, London Killzone |
| **Session** | London Killzone (2:00 AM - 5:00 AM EST) |
| **Risk Profile** | High (involves trading a fast-moving market) |

---

## ✔️ Must-Have Criteria (The Checklist)

- **[ ] 1. Clear Asia Range:** A clear and relatively consolidated trading range must be established during the Asia session (typically 8:00 PM - 1:00 AM EST). Mark the high and low of this range.
- **[ ] 2. London Open Manipulation (Judas Swing):** Shortly after the London open, price must make a false move, sweeping the liquidity resting above the Asia High or below the Asia Low. This is the **Judas Swing**.
- **[ ] 3. Strong Reversal/Rejection:** After sweeping the liquidity, price must sharply reverse and trade back into the Asia Range. The key is to see a strong rejection, not a slow drift.
- **[ ] 4. Market Structure Shift:** The reversal must be strong enough to cause a market structure shift (BOS or CHoCH) against the direction of the Judas Swing.
- **[ ] 5. Entry Point:** Look for a newly created FVG or Order Block that forms as price re-enters the Asia Range.

---

## 📈 Step-by-Step Execution

This model is a specific application of the **Accumulation, Manipulation, Distribution (AMD)** pattern.

### Bullish London Breakout (Buy Setup)
1.  **Accumulation (Asia):** Mark the high and low of the Asia session range on a 15M chart.
2.  **Manipulation (Judas Swing):** At or near the London open (2:00 AM EST), wait for price to drop and take out the **Asia Low (SSL)**. **Do not short this move.**
3.  **Distribution (The Real Move):**
    -   Watch for price to quickly reverse and trade back above the Asia Low.
    -   Look for a bullish market structure shift on the 5M or 15M chart as price rallies.
    -   Identify a clean FVG or Bullish OB created during this rally.
4.  **Place Order:** Set a limit order to buy at the FVG/OB.
5.  **Set Stop Loss:** Place your stop loss below the low of the Judas Swing.
6.  **Set Target:** The primary target is the **Asia High (BSL)**. Further targets can be higher timeframe PDAs.

### Bearish London Breakout (Sell Setup)
1.  **Accumulation (Asia):** Mark the high and low of the Asia session range on a 15M chart.
2.  **Manipulation (Judas Swing):** At or near the London open, wait for price to rally and take out the **Asia High (BSL)**. **Do not buy this move.**
3.  **Distribution (The Real Move):**
    -   Watch for price to quickly reverse and trade back below the Asia High.
    -   Look for a bearish market structure shift on the 5M or 15M chart as price declines.
    -   Identify a clean FVG or Bearish OB created during this decline.
4.  **Place Order:** Set a limit order to sell at the FVG/OB.
5.  **Set Stop Loss:** Place your stop loss above the high of the Judas Swing.
6.  **Set Target:** The primary target is the **Asia Low (SSL)**.

---

## ⚙️ Trade Management

- **Entry:** This setup forms and moves quickly. You must be ready during the 2:00 AM - 4:00 AM EST window. If you miss the entry, do not chase.
- **Stop Loss:** The stop is well-defined by the peak of the manipulation.
- **Take Profit:** The Asia high/low is a natural magnet for price, making it a high-probability first target. Taking partials at this level is a robust strategy.

---

## 🖼️ Real Trade Example (Conceptual Diagram)

### Bullish Model
```
            /-----> Target: Asia High (BSL)
           /
          /
         /  <-- Entry on FVG
        /
------- Asia High -----------------
       |           |
       | Asia Range|
       |           |
------- Asia Low -------------------
        \         /
         \       / <-- Strong reversal back into range
          \     /
           \---/  <-- Judas Swing sweeps SSL
             |
             SL
```

---

## ❌ Common Mistakes & How to Avoid Them

- **Mistake 1: Trading the Breakout.**
    -   **Problem:** Buying the initial break of the Asia High or shorting the break of the Asia Low. You are trading directly into the manipulation.
    -   **Solution:** You must wait for the **false move first**. The trade is the reversal, not the initial breakout.
- **Mistake 2: No Confirmation of Reversal.**
    -   **Problem:** Price sweeps the liquidity and then just keeps going, stopping you out.
    -   **Solution:** Do not enter blindly. Wait for the strong rejection and the market structure shift back inside the range. This confirms the Judas Swing was indeed false.
- **Mistake 3: Trading in a Trending Environment.**
    -   **Problem:** On a strong trending day, the London session may simply continue the trend without a significant reversal off the Asia range.
    -   **Solution:** Check the higher timeframe context. This model works best when the HTF is consolidating or when the Judas Swing brings price into a major HTF PDA (e.g., a 4H Order Block), adding confluence to the reversal.

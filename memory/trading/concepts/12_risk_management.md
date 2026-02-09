# 12 - Risk Management

**Protecting capital through position sizing, stop placement, and discipline.**

---

## 🎯 The Golden Rules

### Rule #1: Protect Your Capital
> "Live to trade another day. A small loss is better than a blown account."

### Rule #2: Risk Small, Win Big
> "Risk 1% to make 3%. Even with 50% win rate, you profit."

### Rule #3: Plan the Trade, Trade the Plan
> "Every trade needs entry, stop, and target BEFORE you click buy."

---

## 📊 Position Sizing

### The 1-2% Rule

**Risk per trade: Maximum 1-2% of account**

**Why:**
- 10 losses in a row = Only 10-20% drawdown
- Account survives bad streaks
- Psychological pressure manageable
- Compounding works over time

### Formula

```
Position Size = (Account Balance × Risk%) / (Entry - Stop)

Example:
Account: $10,000
Risk: 1% ($100)
Entry: 1.0850
Stop: 1.0820 (30 pips)

Position Size = $100 / 0.0030
              = 33,333 units
              = 0.33 standard lots
```

### Quick Reference Table

| Account | 1% Risk | 2% Risk | Max Loss (10 trades) |
|---------|---------|---------|---------------------|
| $5,000 | $50 | $100 | $500-$1,000 |
| $10,000 | $100 | $200 | $1,000-$2,000 |
| $25,000 | $250 | $500 | $2,500-$5,000 |
| $50,000 | $500 | $1,000 | $5,000-$10,000 |

---

## 🛑 Stop Loss Placement

### Principles

1. **Technical Stops:** Based on market structure
2. **Volatility Stops:** Based on ATR (Average True Range)
3. **Time Stops:** Close if setup invalidates

### ICT Stop Placement

**For Longs:**
```
Entry at OB/FVG/OTE
Stop = Below structure

Structure levels (in order of safety):
1. Below FVG low
2. Below OB low
3. Below recent swing low
4. Below dealing range low

Further away = Safer but larger loss if hit
Closer = Tighter risk but more chance of hit
```

**For Shorts:**
```
Entry at OB/FVG/OTE
Stop = Above structure

Structure levels:
1. Above FVG high
2. Above OB high
3. Above recent swing high
4. Above dealing range high
```

### Example Stop Placements

**FVG Entry:**
```
Bullish FVG:
Top: 1.0850
Bottom: 1.0820
CE: 1.0835

Entry: 1.0835 (at CE)
Stop: 1.0815 (below FVG bottom + buffer)
Risk: 20 pips
```

**OB Entry:**
```
Bullish OB:
High: 1.0850
Low: 1.0820

Entry: 1.0835 (at 50%)
Stop: 1.0815 (below OB low)
Risk: 20 pips
```

**Structure Entry:**
```
Long after BOS:
BOS level: 1.0850
Pullback: 1.0830

Entry: 1.0830
Stop: 1.0800 (below recent swing)
Risk: 30 pips
```

---

## 🎯 Risk:Reward Ratio

### Minimum 1:2 R:R

**Meaning:** Risk $1 to make $2

**Why 1:2:**
- Win 1, lose 2 = Break even
- Win 2, lose 1 = Profit
- Win rate can be 40% and still profitable

### Higher is Better

| R:R | Win Rate Needed | Profitability |
|-----|----------------|---------------|
| 1:1 | 55% | Thin margin |
| 1:2 | 35% | Good |
| 1:3 | 25% | Excellent |
| 1:4 | 20% | Outstanding |

### Calculating R:R

```
R:R = (Target - Entry) / (Entry - Stop)

Example:
Entry: 1.0850
Stop: 1.0820 (30 pips risk)
Target: 1.0910 (60 pips reward)

R:R = 60 / 30 = 2:1 ✓
```

---

## 📉 Daily Loss Limits

### Hard Stops

**Daily Max Loss: 3% of account**

**Why:**
- Prevents revenge trading
- Preserves capital for tomorrow
- Emotional control
- Market may be against you today

### Implementation

```
Example: $10,000 account
Daily limit: $300 (3%)

Trade 1: -$100 (1%)
Trade 2: -$100 (1%)
Trade 3: -$100 (1%)
Total: -$300 (3%)

STOP TRADING FOR THE DAY
```

### Weekly Loss Limits

**Weekly Max Loss: 6-8% of account**

If hit: Take 2-3 days off. Reset mentally.

---

## 🎭 Psychological Risk Management

### Emotional States to Avoid

**1. Revenge Trading**
- After a loss, trying to "get it back"
- Taking impulsive trades
- Increasing size
- **Solution:** Stick to plan, walk away after 3 losses

**2. FOMO (Fear of Missing Out)**
- Chasing price
- Entering without setup
- **Solution:** Wait for your setup, there will be another

**3. Overconfidence**
- After winning streak
- Increasing size
- Ignoring rules
- **Solution:** Same size every trade, stick to system

**4. Fear**
- Hesitating on valid setups
- Closing winners too early
- **Solution:** Trust your analysis, follow plan

### The Reset Button

**When to Walk Away:**
- 3 losses in a row
- Emotionally compromised
- Missed sleep
- External stress
- Market not behaving normally

**How to Reset:**
1. Close all positions
2. Step away from charts
3. Physical activity (walk, exercise)
4. Review trades tomorrow
5. Return with fresh mind

---

## 📊 Trade Management

### Scaling Out (Recommended)

**Method:** Close partial positions at targets

**Example:**
```
Position: 1 lot
Target 1 (1:2 R:R): Close 50% (0.5 lots)
Target 2 (1:3 R:R): Close 25% (0.25 lots)
Target 3 (1:4 R:R): Trail stop, let run

Benefits:
- Lock in profit
- Reduce risk
- Capture extended moves
- Psychological win
```

### Moving Stops to Breakeven

**When:** Price reaches 1:1 R:R

**Why:**
- Eliminates risk
- Frees up mental capital
- Guarantees no loss
- Lets winner run

**How:**
```
Entry: 1.0850
Stop: 1.0820 (30 pips)

When price hits 1.0880 (+30 pips):
Move stop to 1.0850 (breakeven)
```

---

## 🎯 The Complete Risk Plan

### Before Every Trade

- [ ] Position size calculated (1-2% risk)
- [ ] Stop loss identified (technical level)
- [ ] Target identified (minimum 1:2 R:R)
- [ ] R:R calculated and acceptable
- [ ] Daily loss limit not exceeded
- [ ] Mental state is calm and focused
- [ ] Setup meets criteria (OSOK)

### During the Trade

- [ ] Don't move stop further away
- [ ] Don't add to losing position
- [ ] Scale out at targets
- [ ] Move to breakeven at 1:1
- [ ] Stick to the plan

### After the Trade

- [ ] Log the trade (win or loss)
- [ ] Note lessons learned
- [ ] Check daily P&L
- [ ] Stop if daily limit hit
- [ ] Prepare for next setup

---

## 📋 Risk Management Checklist

**Pre-Trade:**
- [ ] Account balance noted
- [ ] Risk % determined (1-2%)
- [ ] Position size calculated
- [ ] Stop placement logical
- [ ] Target placement logical
- [ ] R:R is 1:2 or better
- [ ] Daily loss limit not exceeded
- [ ] Clear mind and focused

**During Trade:**
- [ ] Stick to plan
- [ ] No emotional decisions
- [ ] Scale out at targets
- [ ] Move to breakeven when appropriate

**Post-Trade:**
- [ ] Trade logged
- [ ] Lessons noted
- [ ] Daily P&L checked

---

## 💡 Key Risk Insights

1. **Risk management is job #1**
   - Profits come from good risk management
   - Preserve capital above all

2. **Small losses are wins**
   - Stopped out at -1% = Good trade
   - Held to -5% = Bad trade

3. **Consistency over home runs**
   - 1% daily = 20% monthly
   - Don't swing for fences

4. **Protect profits**
   - Scale out
   - Move to breakeven
   - Let winners run with trailing stop

5. **Know when to stop**
   - 3 losses = break
   - 3% daily loss = done
   - Bad mental state = don't trade

---

## 🎯 Risk Mantras

- **"Protect capital first, profits second"**
- **"Live to trade another day"**
- **"Small losses, big wins"**
- **"1% risk, 3% reward"**
- **"Plan the trade, trade the plan"**
- **"When in doubt, stay out"**

---

*"Risk management separates traders from gamblers. Master it, and you master trading."*

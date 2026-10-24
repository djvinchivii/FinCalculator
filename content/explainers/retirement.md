## What it is

This projects your retirement savings in two phases: **saving** (contributions plus growth until you retire) and **spending** (inflation-adjusted withdrawals while the rest stays invested). It also shows your **FIRE number** — the portfolio size at which work becomes optional.

## The formula

- **FIRE number = annual spending ÷ withdrawal rate.** At a 4% withdrawal rate that's 25× your yearly spending.
- Growth is applied monthly using `(1 + annual return)^(1/12) − 1`.
- Everything is shown in **nominal** dollars (what your statement will say) and **today's dollars**: `nominal ÷ (1 + inflation)^years`.
- In retirement, your spending rises with inflation every year; the simulation runs until the money runs out or you turn 120.

## Worked example

Spending $50,000 a year at a 4% withdrawal rate → FIRE number **$1,250,000** (today's dollars).

Saving $1,000 a month from 30 with $50,000 already invested at 7% gets you to about $1.55 million at 60 — around $640,000 in today's dollars. That's short of the FIRE number, so the money runs out around age 75 unless you save more, retire later or spend less.

## A common mistake

**Forgetting inflation.** A million dollars in 30 years buys what about $410,000 buys today at 3% inflation. Always compare your goal and your projection in the same kind of dollars.

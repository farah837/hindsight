export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  // Which part of the simulator this lesson prepares you for.
  usedIn: string;
  body: string[];
  example: { title: string; text: string };
  check: {
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  };
}

export const LESSONS: Lesson[] = [
  {
    id: "allocation",
    title: "Allocation: how much risk you hold",
    minutes: 3,
    usedIn: "The allocation slider",
    body: [
      "Your allocation is the share of your money in stocks; the rest sits in cash. At 70%, a 10% fall in the index costs your portfolio about 7%.",
      "Cash isn't zero-return. In the simulator it earns the central bank's policy rate, which can be high (about 6% in 2000) or close to zero (2009–2015, 2020–2021).",
      "Losses and gains aren't symmetric. After a 50% fall you need a 100% gain to get back to even, so how much you lose matters more than how much you could gain.",
    ],
    example: {
      title: "The asymmetry in numbers",
      text: "$100,000 falls 50% to $50,000. A 50% gain only gets you back to $75,000; you need +100% to reach $100,000 again.",
    },
    check: {
      question: "Your portfolio is 60% stocks, 40% cash. Stocks fall 20% and cash earns nothing. Roughly how much does your portfolio fall?",
      options: ["20%", "12%", "8%", "It depends on the yield curve"],
      answer: 1,
      explanation: "60% of the portfolio falls 20%: 0.6 × 20% = 12%. Cash cushions the fall in proportion to how much of it you hold.",
    },
  },
  {
    id: "drawdown",
    title: "Drawdowns and recoveries",
    minutes: 3,
    usedIn: "The 'From peak' tile",
    body: [
      "A drawdown is how far the index sits below its previous highest point. A fall of 20% or more is commonly called a bear market.",
      "Drawdowns differ a lot in depth and length. Some recover in months, others take years, and at the bottom you can't tell which kind you're in.",
      "The size of a drawdown on its own doesn't tell you whether to buy or sell. It tells you how much pain you're sitting through, and that's when decisions get emotional.",
    ],
    example: {
      title: "Three very different recoveries",
      text: "U.S. stocks fell over 80% from 1929 to 1932 and took decades to recover in nominal terms. The S&P 500 fell about 57% from 2007 to 2009 and regained its peak in 2013. In 2020 it fell about 34% in five weeks and recovered within about five months.",
    },
    check: {
      question: "The index is 35% below its peak. What does that tell you on its own?",
      options: [
        "It's cheap, so it's time to buy",
        "It's broken, so it's time to sell",
        "How far it has fallen, but not how much further it might fall or how fast it will recover",
        "It will recover within a year",
      ],
      answer: 2,
      explanation:
        "A drawdown describes the past. Deciding what to do needs other evidence, such as valuation, the economy and your own plan. That's why the simulator shows several signals, not just price.",
    },
  },
  {
    id: "valuation",
    title: "Valuation: the CAPE ratio",
    minutes: 4,
    usedIn: "The 'CAPE' tile",
    body: [
      "CAPE (cyclically adjusted price-to-earnings) divides the index price by the average of the last 10 years of inflation-adjusted earnings. Averaging over 10 years smooths out booms and recessions.",
      "Its long-run U.S. average is around 17. Historically, a high CAPE has been followed by lower average returns over the next decade, and a low CAPE by higher ones.",
      "It is a poor timing tool. Markets can stay expensive, or get more expensive, for years. CAPE tells you about the odds over a long horizon, not about next month.",
    ],
    example: {
      title: "Expensive can get more expensive",
      text: "In December 1996 the CAPE was about 28, well above average, when the Fed chair warned of 'irrational exuberance'. The market kept rising for three more years, until the CAPE passed 40 in 2000. Then the long-run odds caught up.",
    },
    check: {
      question: "The CAPE is 30, far above its long-run average. Which statement is best supported by history?",
      options: [
        "The market will fall within the next few months",
        "Expected returns over the next decade are likely to be below average",
        "The market can't go any higher",
        "CAPE doesn't matter when interest rates are low",
      ],
      answer: 1,
      explanation:
        "A high CAPE has historically been followed by below-average long-horizon returns, but it says almost nothing about short-term timing. Use it to think about the odds, not about next month.",
    },
  },
  {
    id: "economy",
    title: "Economic signals: unemployment, rates, yield curve",
    minutes: 4,
    usedIn: "The 'Unemployment', 'Policy rate' and '10y − 2y' tiles",
    body: [
      "Unemployment is a lagging indicator: it usually keeps rising after a recession has started, and often after stocks have bottomed. It is also published with a delay, so the simulator shows last month's figure.",
      "The policy rate is what the central bank charges overnight. Cuts aim to support the economy, and in the simulator the policy rate is also what your cash earns.",
      "The yield curve (10-year minus 2-year Treasury yield) turning negative, or 'inverted', has come before several U.S. recessions, but with a delay of many months and at least one long false alarm.",
    ],
    example: {
      title: "Stocks don't wait for the economy",
      text: "In 2009 the S&P 500 bottomed on 9 March, but unemployment kept rising until it peaked at 10% in October. Anyone waiting for unemployment to improve before buying would have missed the first part of the recovery. The curve was deeply inverted in 2022–23, yet a recession didn't follow quickly, a reminder that its timing is unreliable.",
    },
    check: {
      question: "Unemployment has just hit a new high. Historically, what has that meant for stocks?",
      options: [
        "Stocks are certain to keep falling",
        "Very little on its own; stocks have sometimes bottomed before unemployment peaked",
        "It's a reliable buy signal",
        "Stocks and unemployment always move together",
      ],
      answer: 1,
      explanation:
        "Markets look ahead and unemployment lags. They often turn at different times, so one reading isn't a trading signal in either direction.",
    },
  },
  {
    id: "biases",
    title: "The traps: four biases the coach watches for",
    minutes: 4,
    usedIn: "The coach's checks",
    body: [
      "Loss aversion: losses hurt roughly twice as much as equal gains feel good. After a big fall it can push you to sell just to stop the pain (capitulation).",
      "Chasing: buying more because prices have risen recently, treating past returns as a forecast.",
      "Overconfidence: being far more certain about short-term moves than anyone can justify.",
      "Status-quo bias: doing nothing by default, even when the situation has changed, because acting feels riskier than not acting.",
    ],
    example: {
      title: "How the coach uses this",
      text: "These are the patterns behind the coach's capitulation, chasing, overconfidence and status-quo checks. When one fires, the coach shows the exact rule and numbers, and asks a question rather than telling you you're wrong.",
    },
    check: {
      question: "After a 40% fall you want to sell everything 'before it goes to zero'. Which trap should you check yourself for first?",
      options: ["Chasing", "Loss aversion / capitulation", "Status-quo bias", "None; this is just risk management"],
      answer: 1,
      explanation:
        "Selling after a large fall, driven by fear of further losses, is the classic loss-aversion pattern. It might still be the right call, but only if your reason is something other than the pain.",
    },
  },
  {
    id: "process",
    title: "Decisions you can review",
    minutes: 3,
    usedIn: "Reasoning, triggers, forecasts and the debrief",
    body: [
      "Write down why you're deciding, based on evidence you can point to. Without that, you can't learn from the result later.",
      "Decide in advance what would change your mind, with a number you can check (\"if unemployment goes above 7%\"). A vague trigger such as \"when things calm down\" usually turns into an emotional one.",
      "Calibration: if you say you're 70% sure, you should be right about 70% of the time. Tracking this is how you find out whether your confidence means anything.",
      "Judge the process, not the outcome. A good decision can lose money and a bad one can get lucky, so outcomes only teach you something over many decisions.",
    ],
    example: {
      title: "Process vs outcome",
      text: "Someone who panic-sold in March 2020 and bought back by luck in April got a fine outcome from a poor process. Repeat that process and it will eventually be very expensive. The debrief scores these separately for that reason.",
    },
    check: {
      question: "Which is the most useful 'what would change my mind' condition?",
      options: [
        "When the news gets better",
        "If it feels like the bottom",
        "If the index falls another 15% from here, or unemployment passes 8%, I'll cut to 40%",
        "I'll know it when I see it",
      ],
      answer: 2,
      explanation: "It's measurable, it's set before the event, and it says what action you'll take. You can check later whether you actually followed it.",
    },
  },
];

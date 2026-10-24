import series from "@/data/series.json";

export interface MonthRow {
  date: string; // YYYY-MM, hidden from the trainee until the reveal
  index: number; // rebased to 100 at the first month
  raw: number;
  cape: number | null;
  unemployment: number | null; // previous month's rate (publication lag)
  fedFunds: number | null;
  yieldCurve: number | null; // 10y minus 2y Treasury, monthly average
}

export interface Checkpoint {
  date: string;
  // Paraphrased events that were public by the end of this month. Nothing
  // that happened later is allowed in here.
  context: string[];
}

export interface DemoEntry {
  allocation: number;
  forecast: Forecast;
  confidence: number;
  rationale: string;
  trigger: string;
  reply: string;
}

export type Forecast = "higher" | "flat" | "lower";

export interface Scenario {
  id: "gfc" | "dotcom" | "covid";
  codename: string;
  teaser: string;
  assetLabel: string;
  capeLabel: string;
  startAllocation: number;
  checkpoints: Checkpoint[];
  reveal: {
    title: string;
    asset: string;
    summary: string;
    facts: string[];
  };
  sources: { label: string; url: string }[];
  demo?: DemoEntry[];
  rows: MonthRow[];
}

const FRED = (id: string) => `https://fred.stlouisfed.org/series/${id}`;
const SHILLER = {
  label: "Robert Shiller, U.S. Stock Markets 1871–Present and CAPE Ratio (monthly average prices, CAPE)",
  url: "http://www.econ.yale.edu/~shiller/data.htm",
};
const MACRO_SOURCES = [
  { label: "FRED UNRATE: civilian unemployment rate (BLS)", url: FRED("UNRATE") },
  { label: "FRED FEDFUNDS: effective federal funds rate", url: FRED("FEDFUNDS") },
  { label: "FRED T10Y2Y: 10-year minus 2-year Treasury spread", url: FRED("T10Y2Y") },
];

const data = series as Record<Scenario["id"], MonthRow[]>;

export const SCENARIOS: Scenario[] = [
  {
    id: "gfc",
    codename: "Scenario A",
    teaser: "A broad stock index, a few months after a record high. Credit markets are uneasy.",
    assetLabel: "Broad equity index",
    capeLabel: "Valuation (CAPE)",
    startAllocation: 70,
    checkpoints: [
      {
        date: "2008-01",
        context: [
          "Large banks have reported multi-billion-dollar write-downs on securities backed by risky (subprime) mortgages.",
          "The central bank made an emergency 0.75-point rate cut between meetings, then cut again a week later.",
          "National home prices are falling and mortgage delinquencies are rising.",
        ],
      },
      {
        date: "2008-10",
        context: [
          "A major investment bank has filed for bankruptcy, and the largest insurer needed a government rescue the next day.",
          "Lawmakers passed a $700B programme to stabilise the banking system.",
          "Short-term lending between banks has largely frozen. This was one of the worst months for stocks in decades.",
        ],
      },
      {
        date: "2009-02",
        context: [
          "Employers are cutting roughly 600,000 jobs a month.",
          "A fiscal stimulus package of about $790B was signed into law.",
          "The policy rate is near zero and the central bank is buying mortgage securities directly.",
          "Shares of large banks are collapsing amid talk of nationalisation.",
        ],
      },
      {
        date: "2009-09",
        context: [
          "The index has rallied sharply from its low in March.",
          "Unemployment is still rising and is approaching 10%.",
          "Government stress tests of the 19 largest banks were completed in May; banks found short of capital have been raising it.",
          "The central bank chair says the recession is very likely over, but a weak recovery is expected.",
        ],
      },
    ],
    reveal: {
      title: "The 2008 Global Financial Crisis",
      asset: "S&P 500 (monthly average price), July 2005 to June 2011",
      summary:
        "On daily closes the S&P 500 fell about 57% from its October 2007 peak to its March 2009 low. It regained the 2007 peak in March 2013.",
      facts: [
        "Lehman Brothers filed for bankruptcy on 15 September 2008; AIG was rescued on 16 September.",
        "TARP ($700B) was signed on 3 October 2008.",
        "The market bottomed on 9 March 2009, while unemployment kept rising until October 2009 (10.0%).",
      ],
    },
    sources: [SHILLER, ...MACRO_SOURCES],
    demo: [
      {
        allocation: 70,
        forecast: "flat",
        confidence: 65,
        rationale:
          "The index is 10% below its peak, but unemployment is only 5% and the central bank is cutting rates fast. CAPE has come down to 24. I'll hold my 70%.",
        trigger: "If unemployment goes above 6%, I'll cut to 50%.",
        reply: "It would be a mistake if the mortgage losses spread to the big banks themselves. I'm watching unemployment as my signal.",
      },
      {
        allocation: 30,
        forecast: "lower",
        confidence: 90,
        rationale: "A major bank failed and everything is collapsing. This could go to zero. I want to protect what's left.",
        trigger: "I'll buy back when things calm down.",
        reply:
          "Honestly, starting from cash I wouldn't buy 70% today. But I don't have a re-entry signal. I'll use CAPE under 15 plus a 10% bounce.",
      },
      {
        allocation: 30,
        forecast: "lower",
        confidence: 60,
        rationale:
          "Unemployment is near 8% and job losses are huge. Valuation is the cheapest in years (CAPE 14), but I don't trust it yet.",
        trigger: "If CAPE stays under 18 and the index is 10% above today's level, I'll go back to 50%.",
        reply:
          "If the bottom is close and the rebound starts before my trigger fires, I miss the first part of the recovery. I accept that cost in exchange for not guessing.",
      },
      {
        allocation: 60,
        forecast: "higher",
        confidence: 65,
        rationale:
          "My trigger was hit: the index is well above February and CAPE is 19. Unemployment is still rising, so I'm not going all the way back.",
        trigger: "If unemployment peaks and falls for 3 months, I'll go back to 70%.",
        reply:
          "If it fell another 30% I'd hold at 60% and not sell, because my plan is based on valuation, not price. That's also why I'm at 60, not 70: I can live with that loss.",
      },
    ],
    rows: data.gfc,
  },
  {
    id: "dotcom",
    codename: "Scenario B",
    teaser: "A technology-heavy index after a spectacular run. Everyone is talking about a new economy.",
    assetLabel: "Technology-heavy equity index",
    capeLabel: "Broad-market valuation (CAPE)",
    startAllocation: 70,
    checkpoints: [
      {
        date: "2000-02",
        context: [
          "The index has roughly doubled in the past 12 months.",
          "Broad-market valuations are the highest on record (CAPE above 40).",
          "Many newly listed internet companies have no profits; some shares doubled on their first trading day.",
          "The central bank has raised rates several times since mid-1999.",
          "A large internet company has announced a merger with a traditional media giant.",
        ],
      },
      {
        date: "2000-12",
        context: [
          "The index is roughly half of its peak from earlier this year.",
          "Several high-profile online start-ups have shut down after running out of cash.",
          "The policy rate is still about 6.5%, and the yield curve is slightly inverted.",
          "Companies are cutting their technology spending plans.",
        ],
      },
      {
        date: "2001-09",
        context: [
          "Terrorist attacks closed U.S. stock exchanges for four trading days.",
          "Economic data points to a recession.",
          "The central bank has cut rates repeatedly this year, including an emergency cut after the attacks.",
        ],
      },
      {
        date: "2002-09",
        context: [
          "Major accounting frauds at an energy trader and a telecom giant have shaken trust in reported earnings.",
          "A new corporate-governance law was passed in July.",
          "The index is about 75% below its peak. Broad-market CAPE has fallen from 44 to about 22.",
        ],
      },
    ],
    reveal: {
      title: "The dot-com bubble and bust",
      asset: "Nasdaq Composite (month-end close), January 1997 to December 2004",
      summary:
        "The Nasdaq closed at 5,048.62 on 10 March 2000 and bottomed at 1,114.11 on 9 October 2002, a fall of 78%. It did not close above the 2000 peak again until 2015.",
      facts: [
        "AOL announced its merger with Time Warner in January 2000.",
        "Enron filed for bankruptcy in December 2001 and WorldCom in July 2002; the Sarbanes-Oxley Act followed on 30 July 2002.",
        "The CAPE shown is for the S&P 500, as a broad-market valuation signal.",
      ],
    },
    sources: [
      { label: "FRED NASDAQCOM: Nasdaq Composite Index", url: FRED("NASDAQCOM") },
      SHILLER,
      ...MACRO_SOURCES,
    ],
    rows: data.dotcom,
  },
  {
    id: "covid",
    codename: "Scenario C",
    teaser: "A broad stock index near record highs with unemployment at a 50-year low. Then news arrives.",
    assetLabel: "Broad equity index",
    capeLabel: "Valuation (CAPE)",
    startAllocation: 70,
    checkpoints: [
      {
        date: "2020-02",
        context: [
          "A new respiratory virus has spread from China to Italy, South Korea and Iran.",
          "The index set a record high just over a week ago, then had its fastest 10% fall on record.",
          "Unemployment is at a 50-year low.",
        ],
      },
      {
        date: "2020-03",
        context: [
          "Much of the world is under lockdown. Weekly jobless claims hit 3.3 million; the previous record was about 700,000.",
          "The central bank cut rates to zero and announced open-ended asset purchases.",
          "A relief package of about $2 trillion was signed into law.",
          "At its low earlier this month the index was about 34% below its peak.",
        ],
      },
      {
        date: "2020-06",
        context: [
          "April unemployment was about 14.7%, the highest since the 1930s; May improved slightly.",
          "The index has recovered most of its losses.",
          "Cases are rising again in several large states.",
          "The central bank signals rates will stay near zero through 2022.",
        ],
      },
      {
        date: "2020-11",
        context: [
          "A vaccine candidate showed over 90% efficacy in a large trial.",
          "A national election has just taken place.",
          "The index is at record highs and valuation is high (CAPE above 32).",
        ],
      },
    ],
    reveal: {
      title: "The COVID-19 crash and recovery",
      asset: "S&P 500 (month-end close), January 2018 to December 2021",
      summary:
        "The S&P 500 fell about 34% from 19 February to 23 March 2020, the fastest bear market on record, and regained its previous high by August 2020.",
      facts: [
        "The Fed cut to 0–0.25% on 15 March 2020; the CARES Act was signed on 27 March.",
        "Pfizer/BioNTech reported more than 90% vaccine efficacy on 9 November 2020.",
        "Month-end closes hide the intra-month low of 23 March.",
      ],
    },
    sources: [{ label: "FRED SP500: S&P 500 daily close", url: FRED("SP500") }, SHILLER, ...MACRO_SOURCES],
    rows: data.covid,
  },
];

export function rowIndex(s: Scenario, date: string) {
  const i = s.rows.findIndex((r) => r.date === date);
  if (i < 0) throw new Error(`No data for ${s.id} ${date}`);
  return i;
}

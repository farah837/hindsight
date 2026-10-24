# Evidence: why Hindsight solves a real problem

This page collects the research behind Hindsight in two parts: evidence that the problem is real, and evidence
for the design choices. The end of the page says what is **not** proven yet.

## The problem in one line

People are starting to ask AI what to invest in. AI's investment advice isn't reliable without human oversight,
relying on AI is linked to weaker critical thinking, and investors' own behaviour already costs them money. A
tool that makes the AI decide for them makes all of this worse. A tool that trains their judgment makes it
better.

---

## 1. People are starting to hand investment decisions to AI

| Finding | Source |
|---|---|
| In a survey of 10,000 retail investors in 13 countries, 11% were already using ChatGPT-style AI to pick or change their investments, and 35% more were open to it. | eToro, *Retail Investor Beat*, July 2023 ([press release](https://www.etoro.com/news-and-analysis/press-releases/one-in-ten-retail-investors-using-chat-gpt-style-ai-to-help-pick-and-manage-investments/)) |
| Among U.S. investors, 31% of 18–34-year-olds and 38% of 35–44-year-olds already used these tools. Of those using or open to them, 59% would let AI change and execute trades for them. | eToro U.S. survey, 2023 ([press release](https://etoro.com/en-us/news-and-analysis/latest-news/press-release/four-in-ten-u-s-retail-investors-use-or-are-open-to-using-chat-gpt-style-ai-to-help-pick-and-manage-investments)) |
| In a survey of 1,000+ U.S. adults, 5% used AI for financial information, rising to 10% among 18–29-year-olds. People trusted stock and bond projections from AI about as much as from a financial professional (34% vs 33%). | FINRA Investor Education Foundation, June 2024 ([news release](https://www.finra.org/media-center/newsreleases/2024/report-finra-foundation-financial-professional-or-artificial-intelligence)) |

**Why it matters:** adoption is highest among young and new investors, who are exactly the people still building
judgment. People also trust AI's market projections as much as a professional's.

## 2. AI investment advice isn't reliable without human oversight

| Finding | Source |
|---|---|
| The researchers tested ChatGPT, Gemini, DeepSeek and Perplexity on stock recommendations. They found recurring errors: misunderstood financial concepts, mistakes carried from one step to the next, and reliance on outdated or made-up information. The models could beat the market only with "substantial human oversight", and the authors call for strong safeguards. | Crisostomo & Mykhalyuk, *Large Language Models and Stock Investing: Is the Human Factor Required?*, March 2026 ([arXiv:2603.19944](https://arxiv.org/abs/2603.19944)) |
| U.S. regulators (the SEC, NASAA and FINRA) issued a joint alert about investment fraud that exploits AI's popularity, including platforms promising AI trading systems that "can't lose". | SEC / NASAA / FINRA investor alert, January 2024 ([Investor.gov](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-alerts/artificial-intelligence-ai-and-investment-fraud-investor-alert)) |

**Why it matters:** AI's investment advice only works when a skilled human checks it, and that oversight is the
skill Hindsight trains.

## 3. Relying on AI is linked to weaker critical thinking

| Finding | Source |
|---|---|
| A survey of 319 knowledge workers covered 936 real examples of AI-assisted tasks. The more people trusted the AI, the less critical thinking they applied; the more they trusted their own skills, the more they applied. The authors recommend designing AI tools that keep people's own judgment active. | Lee et al. (Microsoft Research & Carnegie Mellon), *The Impact of Generative AI on Critical Thinking*, CHI 2025 ([coverage](https://www.theregister.com/2025/02/11/microsoft_study_ai_critical_thinking/)) |
| In a study of 666 participants, heavier AI use was linked to lower critical-thinking scores, partly because people offload their thinking to the tool (cognitive offloading). Younger participants relied on AI most and scored lowest. | Gerlich, *AI Tools in Society: Impacts on Cognitive Offloading and the Future of Critical Thinking*, *Societies* 15(1), 2025 ([doi:10.3390/soc15010006](https://doi.org/10.3390/soc15010006)) |

## 4. Investors' own behaviour already costs them money

| Finding | Source |
|---|---|
| Over the 10 years to December 2025, the average dollar in U.S. mutual funds and ETFs earned 8.7% a year, while the funds themselves returned 9.9%. Mistimed buying and selling cost investors about 12% of the funds' total return. | Morningstar, *Mind the Gap 2026* ([report PDF](https://www.morningstar.com/content/cs-assets/v3/assets/blt9415ea4cc4157833/blt852a4301adc2f5db/6a7373d51f7b5ae2da78e1e8/US_Mind_the_Gap_2026.pdf)) |
| In 66,465 households at a U.S. discount broker (1991–96), the households that traded most earned 11.4% a year while the market returned 17.9%. The authors attribute the gap to overconfidence. | Barber & Odean, *Trading Is Hazardous to Your Wealth*, *Journal of Finance* 55(2), 2000 ([paper](https://faculty.haas.berkeley.edu/odean/papers/returns/Returns.html)) |
| In a survey of 2,861 U.S. investors, 51% of those who rated their own investing knowledge as high could not identify the warning signs of fraud. FINRA researchers said overconfidence is a particular problem among younger and less experienced investors. | FINRA Investor Education Foundation investor survey, December 2025 ([coverage](https://www.wealthprofessional.ca/news/industry-news/investors-confidence-outstrips-ability-and-knowledge-finds-study/324131)) |

**Why it matters:** the losses come from *behaviour* (panic selling, chasing, overconfidence), not from a lack of
stock tips. Better answers from an AI don't fix behaviour, but practice can help. That's why Hindsight's coach
watches for exactly these biases.

---

## Evidence for the design choices

| Design choice in Hindsight | Evidence |
|---|---|
| **The AI asks; it never answers.** The coach only asks questions and the tutor refuses to decide for the trainee. | In a field experiment with nearly 1,000 high-school students, those using an unrestricted GPT-4 did 17% *worse* on exams once access was removed than students who never had AI. A tutor with learning guardrails (hints, not answers) largely removed that harm. Bastani et al., *Generative AI without guardrails can harm learning*, *PNAS* 122(26), 2025 ([doi:10.1073/pnas.2422633122](https://doi.org/10.1073/pnas.2422633122)) |
| **Think first.** The coach stays silent until the trainee has committed to a decision. | Lee et al. (above): trusting the AI more means thinking less, so the AI waits until the human has done the thinking. |
| **Pre-mortem question.** "Imagine this turned out badly. Why?" | Imagining that an outcome has already happened increased the number of reasons people came up with by about 30%. Mitchell, Russo & Pennington, 1989, popularised as the *premortem* by Gary Klein ([*HBR*, 2007](https://hbr.org/2007/09/performing-a-project-premortem)) |
| **Bias checks** (capitulation, chasing, overconfidence, status quo) and **calibration** scoring. | Barber & Odean (overconfidence), Morningstar (mistimed buying and selling), FINRA (confidence outstrips knowledge), all above. |
| **Fixed rules, cited data, no look-ahead.** The coach's triggers are fixed rules, every number links to its source, and the tutor won't guess. | Crisostomo & Mykhalyuk (above): LLM investment output contains made-up and outdated information, and grounding it in primary data improves accuracy. |

---

## What's not proven yet

- **We haven't tested Hindsight with users.** The evidence above shows the problem is real and supports the
  design principles. It does not show that Hindsight itself improves decisions. The obvious next step is a small
  study: give trainees a blind scenario before and after training, then compare process scores and calibration.
- **Some figures are a few years old** (eToro 2023, FINRA 2024). AI adoption has likely grown since then, so
  the problem has more likely grown than shrunk.
- **Several studies are correlational** (Gerlich; Lee et al. is self-reported). Bastani et al. is the strongest
  evidence here because it's a randomised field experiment.
- **The 30% pre-mortem figure** measures how many reasons people come up with, not how accurate those reasons
  are. It's often misquoted as "30% better at identifying causes".

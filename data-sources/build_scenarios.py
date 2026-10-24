"""Build monthly scenario series from Shiller + FRED CSVs.

Usage: python3 -I build_scenarios.py <data_dir> <out_json>
"""
import csv
import json
import sys
from collections import OrderedDict

data_dir, out_path = sys.argv[1], sys.argv[2]


def read(name, col):
    rows = {}
    with open(f"{data_dir}/{name}") as f:
        for r in csv.DictReader(f):
            v = r[col]
            if v in ("", "."):
                continue
            rows[r[list(r.keys())[0]]] = float(v)
    return rows


def month_end(daily):
    """Last observation in each month, keyed YYYY-MM."""
    out = OrderedDict()
    for d in sorted(daily):
        out[d[:7]] = daily[d]
    return out


def month_avg(daily):
    acc = {}
    for d, v in daily.items():
        acc.setdefault(d[:7], []).append(v)
    return {m: sum(v) / len(v) for m, v in acc.items()}


def monthly(series):
    return {d[:7]: v for d, v in series.items()}


shiller = read("shiller.csv", "SP500")
cape = read("shiller.csv", "PE10")
spx_shiller = monthly(shiller)
cape_m = {m: v for m, v in monthly(cape).items() if v > 0}
spx_daily = month_end(read("SP500.csv", "SP500"))
ndx = month_end(read("NASDAQCOM.csv", "NASDAQCOM"))
unrate = monthly(read("UNRATE.csv", "UNRATE"))
fed = monthly(read("FEDFUNDS.csv", "FEDFUNDS"))
curve = month_avg(read("T10Y2Y.csv", "T10Y2Y"))


def months(start, end):
    y, m = map(int, start.split("-"))
    ey, em = map(int, end.split("-"))
    while (y, m) <= (ey, em):
        yield f"{y:04d}-{m:02d}"
        m += 1
        if m == 13:
            y, m = y + 1, 1


def prev_month(ym):
    y, m = map(int, ym.split("-"))
    return f"{y - 1:04d}-12" if m == 1 else f"{y:04d}-{m - 1:02d}"


SCENARIOS = [
    ("gfc", spx_shiller, "2005-07", "2011-06"),
    ("dotcom", ndx, "1997-01", "2004-12"),
    ("covid", spx_daily, "2018-01", "2021-12"),
]

out = {}
for sid, price, start, end in SCENARIOS:
    ms = list(months(start, end))
    base = price[ms[0]]
    rows = []
    for m in ms:
        rows.append(
            {
                "date": m,
                # Rebased to 100 so absolute index levels don't give the period away.
                "index": round(price[m] / base * 100, 2),
                "raw": round(price[m], 2),
                "cape": round(cape_m[m], 1) if m in cape_m else None,
                # Unemployment for month t is published in early t+1, so a
                # decision at the end of month t only sees t-1.
                "unemployment": unrate.get(prev_month(m)),
                "fedFunds": fed.get(m),
                "yieldCurve": round(curve[m], 2) if m in curve else None,
            }
        )
    out[sid] = rows

with open(out_path, "w") as f:
    json.dump(out, f, indent=1)
print({k: len(v) for k, v in out.items()})

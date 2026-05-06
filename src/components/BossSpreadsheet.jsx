const COL_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R"];

const HEADERS = [
  "Region", "Account", "Owner", "Stage", "Q1 Actual", "Q2 Actual",
  "Q3 Forecast", "Q4 Forecast", "YTD", "YoY %", "Probability", "Status", "Last Updated", "Notes",
];

const DATA = [
  ["EMEA", "Northwind Holdings",     "J. Patel",   "Closed Won",   "142,300", "158,900", "171,400", "182,000", "654,600", "+8.2%",  "100%", "On Track",    "2026-04-28", "Renewal in Q4"],
  ["NA",   "Tailwind Logistics",     "S. Kim",     "Negotiation",  " 98,750", "102,400", "108,200", "115,000", "424,350", "+5.1%",  "75%",  "On Track",    "2026-04-30", "PoC complete"],
  ["APAC", "Lumen Industries",       "R. Garcia",  "Discovery",    " 67,200", " 71,800", " 76,500", " 81,400", "296,900", "+3.8%",  "50%",  "At Risk",     "2026-04-21", "Awaiting CFO sign-off"],
  ["NA",   "Atlas Manufacturing",    "M. Chen",    "Proposal",     "215,400", "228,100", "241,300", "255,000", "939,800", "+11.4%", "60%",  "On Track",    "2026-05-02", "Multi-year deal"],
  ["EMEA", "Halcyon Logistics GmbH", "L. Becker",  "Closed Won",   " 88,400", " 91,200", " 94,300", " 97,500", "371,400", "+4.6%",  "100%", "On Track",    "2026-04-15", ""],
  ["LATAM","Cordillera Foods SA",    "F. Alvarez", "Discovery",    " 42,100", " 45,800", " 49,200", " 52,400", "189,500", "+9.7%",  "30%",  "Stalled",     "2026-04-08", "Procurement delay"],
  ["APAC", "Meridian Pacific",       "H. Tanaka",  "Negotiation",  "176,900", "182,400", "189,800", "196,500", "745,600", "+6.3%",  "80%",  "On Track",    "2026-05-01", "Legal review"],
  ["NA",   "Riverstone Capital",     "A. Owens",   "Proposal",     "134,500", "141,200", "148,000", "154,800", "578,500", "+7.1%",  "65%",  "On Track",    "2026-04-29", ""],
  ["EMEA", "Brightwater Retail Ltd", "T. Novak",   "Discovery",    " 56,300", " 59,400", " 62,800", " 66,100", "244,600", "+5.5%",  "40%",  "On Track",    "2026-04-22", "Pilot extended"],
  ["NA",   "Cascade Health Group",   "P. Singh",   "Closed Won",   "312,800", "324,500", "338,200", "351,400","1,326,900","+12.8%", "100%", "On Track",    "2026-04-12", "Strategic account"],
  ["APAC", "Kintaro Electronics",    "Y. Suzuki",  "Negotiation",  " 78,900", " 82,400", " 86,200", " 89,800", "337,300", "+4.9%",  "75%",  "On Track",    "2026-05-03", ""],
  ["LATAM","Patagonia Mining Co",    "C. Ribeiro", "Proposal",     "104,200", "110,500", "116,800", "123,200", "454,700", "+6.0%",  "55%",  "At Risk",     "2026-04-25", "Sponsor changed"],
  ["EMEA", "Ironclad Insurance plc", "E. Murphy",  "Closed Won",   "189,400", "196,200", "203,500", "210,900", "800,000", "+3.6%",  "100%", "On Track",    "2026-04-18", "Auto-renewal"],
  ["NA",   "Sequoia Media Partners", "B. Walker",  "Discovery",    " 71,400", " 75,200", " 79,300", " 83,500", "309,400", "+5.3%",  "35%",  "On Track",    "2026-04-26", ""],
  ["APAC", "Banyan Tree Hospitality","N. Lim",     "Negotiation",  "118,600", "123,400", "128,500", "133,800", "504,300", "+4.1%",  "70%",  "On Track",    "2026-04-30", "MSA in legal"],
  ["EMEA", "Veridian Pharmaceuticals","K. Hartman","Proposal",     "245,100", "256,800", "268,900", "281,500","1,052,300","+9.2%",  "60%",  "On Track",    "2026-05-01", ""],
  ["NA",   "Granite Peak Equipment", "D. Russo",   "Closed Lost",  " 34,200", "      —", "      —", "      —", " 34,200", "—",      "0%",   "Lost",        "2026-03-30", "Lost to incumbent"],
  ["LATAM","Andes Communications",   "I. Mendez",  "Discovery",    " 51,800", " 54,200", " 56,900", " 59,700", "222,600", "+4.5%",  "40%",  "On Track",    "2026-04-27", ""],
  ["EMEA", "Fjord Renewables AS",    "O. Lindqvist","Proposal",    " 87,300", " 91,400", " 95,800", "100,400", "374,900", "+4.7%",  "55%",  "On Track",    "2026-04-24", "Sustainability fit"],
  ["APAC", "Jasmine Foods Holdings", "W. Wong",    "Closed Won",   " 62,400", " 64,800", " 67,300", " 69,900", "264,400", "+3.9%",  "100%", "On Track",    "2026-04-19", ""],
  ["NA",   "Polaris Defense Systems","G. Brennan", "Negotiation",  "298,700", "311,400", "324,800", "338,900","1,273,800","+10.1%", "85%",  "On Track",    "2026-05-02", "Compliance review"],
  ["EMEA", "Helios Energy SE",       "V. Kowalski","Discovery",    " 73,500", " 77,200", " 81,100", " 85,200", "317,000", "+5.7%",  "30%",  "On Track",    "2026-04-23", ""],
  ["NA",   "Cobalt Robotics",        "Z. Adler",   "Proposal",     "126,800", "133,200", "139,900", "146,800", "546,700", "+8.4%",  "50%",  "On Track",    "2026-04-28", "POC running"],
  ["APAC", "Sakura Insurance KK",    "M. Ito",     "Closed Won",   "204,600", "212,300", "220,400", "228,800", "866,100", "+5.8%",  "100%", "On Track",    "2026-04-16", ""],
  ["LATAM","Tropico Beverages",      "U. Ferrara", "Negotiation",  " 81,200", " 85,400", " 89,800", " 94,500", "350,900", "+6.4%",  "70%",  "On Track",    "2026-05-01", ""],
];

const TOTAL_ROWS = 38; // pad below data with empty rows
const TOTAL_COLS = HEADERS.length;

function ColumnHeaders() {
  return (
    <tr className="bg-[#f3f2f1] sticky top-0 z-10">
      <th className="w-10 min-w-10 h-[22px] border-r border-b border-[#d1d1d1] text-[11px] text-zinc-600 font-normal sticky left-0 bg-[#f3f2f1] z-20"></th>
      {Array.from({ length: TOTAL_COLS }, (_, i) => (
        <th
          key={i}
          className="h-[22px] border-r border-b border-[#d1d1d1] text-[11px] text-zinc-700 font-normal text-center px-2"
          style={{ minWidth: i === 1 || i === 13 ? 180 : i === 2 || i === 11 ? 110 : 96 }}
        >
          {COL_LETTERS[i]}
        </th>
      ))}
    </tr>
  );
}

function RowNumber({ n }) {
  return (
    <td className="w-10 min-w-10 h-[20px] bg-[#f3f2f1] border-r border-b border-[#d1d1d1] text-[11px] text-zinc-600 text-center sticky left-0 z-10">
      {n}
    </td>
  );
}

function Cell({ children, className = "", align = "left" }) {
  return (
    <td
      className={`h-[20px] border-r border-b border-[#e1e1e1] px-1.5 text-[12px] text-zinc-800 whitespace-nowrap overflow-hidden text-ellipsis ${className}`}
      style={{ textAlign: align, fontFamily: "Calibri, 'Segoe UI', system-ui, sans-serif" }}
    >
      {children}
    </td>
  );
}

const NUM_COLS = new Set([4, 5, 6, 7, 8, 9, 10]);

function statusClass(s) {
  if (s === "On Track") return "text-emerald-700";
  if (s === "At Risk") return "text-amber-700";
  if (s === "Stalled" || s === "Lost") return "text-rose-700";
  return "";
}

function yoyClass(s) {
  if (s.startsWith("+")) return "text-emerald-700";
  if (s.startsWith("-")) return "text-rose-700";
  return "text-zinc-600";
}

export default function BossSpreadsheet() {
  return (
    <div
      className="fixed inset-0 z-[9999] bg-white text-zinc-900 flex flex-col select-none"
      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}
    >
      {/* title bar */}
      <div className="bg-[#107c41] text-white h-7 flex items-center justify-between px-2 text-[12px]">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-4 h-4 bg-white text-[#107c41] text-[10px] font-bold rounded-sm">X</span>
          <span>AutoSave</span>
          <span className="inline-block w-7 h-3.5 bg-white/20 rounded-full relative"><span className="absolute left-0.5 top-0.5 w-2.5 h-2.5 bg-white rounded-full" /></span>
          <span className="text-white/90">Q3_Forecast_FY26_v7_FINAL_revised.xlsx</span>
          <span className="text-white/60">— Saved to OneDrive</span>
        </div>
        <div className="flex items-center gap-2 text-white/90">
          <span className="text-[11px]">Gary Barnett</span>
          <div className="flex">
            <span className="w-9 h-7 flex items-center justify-center hover:bg-white/10 cursor-default">−</span>
            <span className="w-9 h-7 flex items-center justify-center hover:bg-white/10 cursor-default">▢</span>
            <span className="w-9 h-7 flex items-center justify-center hover:bg-red-600 cursor-default">✕</span>
          </div>
        </div>
      </div>

      {/* menu strip */}
      <div className="bg-[#f3f2f1] h-7 flex items-center px-3 gap-4 text-[12px] text-zinc-800 border-b border-[#e1e1e1]">
        <span className="text-white bg-[#107c41] px-2 py-0.5 rounded-sm">File</span>
        {["Home", "Insert", "Draw", "Page Layout", "Formulas", "Data", "Review", "View", "Automate", "Developer", "Help"].map((m) => (
          <span key={m} className="hover:bg-zinc-200 px-1 rounded-sm cursor-default">{m}</span>
        ))}
      </div>

      {/* ribbon */}
      <div className="bg-[#f3f2f1] h-[88px] border-b border-[#d1d1d1] flex items-stretch px-2 gap-1 text-[11px] text-zinc-700">
        <RibbonGroup label="Clipboard">
          <div className="flex flex-col items-center gap-0.5 pr-2 border-r border-[#d1d1d1]">
            <div className="w-8 h-8 bg-white border border-[#d1d1d1] rounded-sm flex items-center justify-center text-base">📋</div>
            <span>Paste</span>
          </div>
          <div className="flex flex-col gap-1 text-[11px] pl-1 justify-center">
            <span>✂ Cut</span>
            <span>📄 Copy</span>
            <span>🖌 Format</span>
          </div>
        </RibbonGroup>
        <RibbonGroup label="Font">
          <div className="flex flex-col gap-1 justify-center">
            <div className="flex gap-1">
              <div className="bg-white border border-[#d1d1d1] rounded-sm h-5 w-32 px-1 text-[11px] flex items-center">Calibri</div>
              <div className="bg-white border border-[#d1d1d1] rounded-sm h-5 w-12 px-1 text-[11px] flex items-center">11</div>
              <div className="bg-white border border-[#d1d1d1] rounded-sm h-5 w-5 flex items-center justify-center">A↑</div>
              <div className="bg-white border border-[#d1d1d1] rounded-sm h-5 w-5 flex items-center justify-center">A↓</div>
            </div>
            <div className="flex gap-0.5">
              {["B", "I", "U", "S", "▦", "♦", "🎨", "A"].map((s, i) => (
                <div key={i} className="bg-white border border-[#d1d1d1] rounded-sm h-6 w-6 flex items-center justify-center font-semibold">{s}</div>
              ))}
            </div>
          </div>
        </RibbonGroup>
        <RibbonGroup label="Alignment">
          <div className="flex gap-0.5 self-center">
            {["⬆", "↕", "⬇", "↩", "≡"].map((s, i) => (
              <div key={i} className="bg-white border border-[#d1d1d1] rounded-sm h-6 w-6 flex items-center justify-center">{s}</div>
            ))}
            {["⬅", "≣", "➡"].map((s, i) => (
              <div key={`a${i}`} className="bg-white border border-[#d1d1d1] rounded-sm h-6 w-6 flex items-center justify-center">{s}</div>
            ))}
          </div>
        </RibbonGroup>
        <RibbonGroup label="Number">
          <div className="flex flex-col gap-1 justify-center">
            <div className="bg-white border border-[#d1d1d1] rounded-sm h-5 w-36 px-1 text-[11px] flex items-center">Currency ▾</div>
            <div className="flex gap-0.5">
              {["$", "%", ",", ".0→", "←.0"].map((s, i) => (
                <div key={i} className="bg-white border border-[#d1d1d1] rounded-sm h-6 w-7 flex items-center justify-center">{s}</div>
              ))}
            </div>
          </div>
        </RibbonGroup>
        <RibbonGroup label="Cells">
          <div className="flex gap-0.5 self-center">
            {["Insert ▾", "Delete ▾", "Format ▾"].map((s, i) => (
              <div key={i} className="bg-white border border-[#d1d1d1] rounded-sm h-7 px-2 flex items-center text-[11px]">{s}</div>
            ))}
          </div>
        </RibbonGroup>
        <RibbonGroup label="Editing">
          <div className="flex gap-0.5 self-center">
            {["Σ Sum ▾", "Sort ▾", "Find ▾"].map((s, i) => (
              <div key={i} className="bg-white border border-[#d1d1d1] rounded-sm h-7 px-2 flex items-center text-[11px]">{s}</div>
            ))}
          </div>
        </RibbonGroup>
      </div>

      {/* name box + formula bar */}
      <div className="h-[22px] bg-white border-b border-[#d1d1d1] flex items-center text-[12px]">
        <div className="w-32 h-full px-2 border-r border-[#d1d1d1] flex items-center text-zinc-700">I14</div>
        <div className="w-8 h-full border-r border-[#d1d1d1] flex items-center justify-center text-zinc-500 italic">fx</div>
        <div className="px-2 text-zinc-800 font-mono">=SUM(E14:H14)</div>
      </div>

      {/* sheet */}
      <div className="flex-1 overflow-auto bg-white">
        <table className="border-collapse" style={{ borderSpacing: 0 }}>
          <thead>
            <ColumnHeaders />
          </thead>
          <tbody>
            {Array.from({ length: TOTAL_ROWS }, (_, ri) => {
              const rowNum = ri + 1;
              if (ri === 0) {
                return (
                  <tr key={ri}>
                    <RowNumber n={rowNum} />
                    {HEADERS.map((h, ci) => (
                      <Cell key={ci} className="bg-[#ddebf7] font-semibold text-zinc-900" align="center">{h}</Cell>
                    ))}
                  </tr>
                );
              }
              const di = ri - 1;
              const row = DATA[di];
              if (!row) {
                return (
                  <tr key={ri}>
                    <RowNumber n={rowNum} />
                    {Array.from({ length: TOTAL_COLS }, (_, ci) => (
                      <Cell key={ci}>{""}</Cell>
                    ))}
                  </tr>
                );
              }
              return (
                <tr key={ri}>
                  <RowNumber n={rowNum} />
                  {row.map((v, ci) => {
                    const align = NUM_COLS.has(ci) ? "right" : "left";
                    const extra =
                      ci === 9 ? yoyClass(v) :
                      ci === 11 ? statusClass(v) : "";
                    return <Cell key={ci} className={extra} align={align}>{v}</Cell>;
                  })}
                </tr>
              );
            })}
            {/* totals row */}
            <tr>
              <RowNumber n={TOTAL_ROWS + 1} />
              <Cell className="bg-[#fff2cc] font-semibold">TOTAL</Cell>
              <Cell className="bg-[#fff2cc]">{""}</Cell>
              <Cell className="bg-[#fff2cc]">{""}</Cell>
              <Cell className="bg-[#fff2cc]">{""}</Cell>
              <Cell className="bg-[#fff2cc] font-semibold" align="right">3,313,650</Cell>
              <Cell className="bg-[#fff2cc] font-semibold" align="right">3,452,800</Cell>
              <Cell className="bg-[#fff2cc] font-semibold" align="right">3,608,900</Cell>
              <Cell className="bg-[#fff2cc] font-semibold" align="right">3,773,300</Cell>
              <Cell className="bg-[#fff2cc] font-semibold" align="right">14,148,650</Cell>
              <Cell className="bg-[#fff2cc] text-emerald-700 font-semibold" align="right">+6.7%</Cell>
              <Cell className="bg-[#fff2cc]">{""}</Cell>
              <Cell className="bg-[#fff2cc]">{""}</Cell>
              <Cell className="bg-[#fff2cc]">{""}</Cell>
              <Cell className="bg-[#fff2cc]">{""}</Cell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* sheet tabs */}
      <div className="h-7 bg-[#f3f2f1] border-t border-[#d1d1d1] flex items-center px-2 gap-1 text-[11px] text-zinc-700">
        <span className="px-1.5 cursor-default">◀</span>
        <span className="px-1.5 cursor-default">▶</span>
        <span className="px-3 py-1 bg-white border border-[#d1d1d1] border-b-white -mb-px font-medium">Forecast Q3</span>
        <span className="px-3 py-1 hover:bg-zinc-200 cursor-default">Pipeline</span>
        <span className="px-3 py-1 hover:bg-zinc-200 cursor-default">Historical</span>
        <span className="px-3 py-1 hover:bg-zinc-200 cursor-default">Assumptions</span>
        <span className="px-3 py-1 hover:bg-zinc-200 cursor-default">Notes</span>
        <span className="px-1.5 cursor-default">+</span>
      </div>

      {/* status bar */}
      <div className="h-6 bg-[#107c41] text-white px-3 flex items-center justify-between text-[11px]">
        <span>Ready</span>
        <div className="flex gap-6">
          <span>Average: 142,887</span>
          <span>Count: 175</span>
          <span>Sum: 14,148,650</span>
        </div>
        <div className="flex items-center gap-3">
          <span>⊞ ▤ ▦</span>
          <span>− ━━━●━━━ +  100%</span>
        </div>
      </div>
    </div>
  );
}

function RibbonGroup({ label, children }) {
  return (
    <div className="flex flex-col items-stretch border-r border-[#d1d1d1] px-2 pt-1">
      <div className="flex flex-1 gap-1">{children}</div>
      <div className="text-[10px] text-zinc-500 text-center pt-0.5">{label}</div>
    </div>
  );
}

"use client";

import Image from "next/image";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useEffect, useState, type ReactNode } from "react";

const activityByDate = [
  { date: "17 Jun", cases: 4 },
  { date: "18 Jun", cases: 2 },
  { date: "19 Jun", cases: 2 },
  { date: "4 Jul", cases: 1 },
  { date: "24 Jul", cases: 1 },
];

const locations = [
  { name: "Kumawu", cases: 5 },
  { name: "Oyoko", cases: 2 },
  { name: "Akronfoso", cases: 1 },
  { name: "Bawjwiasi", cases: 1 },
  { name: "Temate", cases: 1 },
];

const categories = [
  { name: "Electricity & energy", value: 3, color: "#c39a4a" },
  { name: "Roads & infrastructure", value: 3, color: "#7a5a3b" },
  { name: "Healthcare services", value: 2, color: "#4e7c6a" },
  { name: "Education services", value: 1, color: "#8b6f96" },
  { name: "Water & sanitation", value: 1, color: "#4d7899" },
];

const submissionLog = [
  ["17 Jun 2026", "ABDULAI YAKUBU SHAIBU", "Kumawu", "Electricity & energy"],
  ["17 Jun 2026", "Ebenezer Baah", "Akronfoso", "Roads & infrastructure"],
  ["17 Jun 2026", "Emmanuel Opoku", "Temate", "Healthcare services"],
  ["17 Jun 2026", "Saddique Suleiman", "Kumawu", "Roads & infrastructure"],
  ["18 Jun 2026", "Akuoko Emmanuel", "Oyoko", "Electricity & energy"],
  ["18 Jun 2026", "Akuoko Emmanuel", "Oyoko", "Electricity & energy"],
  ["19 Jun 2026", "Kwadwo Asirifi", "Kumawu", "Roads & infrastructure"],
  ["19 Jun 2026", "Isaac Nemi", "Kumawu", "Healthcare services"],
  ["4 Jul 2026", "Hon. Adu Gyamfi Michael", "Kumawu", "Education services"],
  ["24 Jul 2026", "Saahene Dorset", "Bawjwiasi", "Water & sanitation"],
];

function DeferredChart({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (ready) return children;

  return <div className="h-full animate-pulse rounded-xl bg-[#f2eee5]" aria-label="Loading chart" />;
}

function MetricCard({
  value,
  label,
  detail,
  accent = false,
}: {
  value: string;
  label: string;
  detail: string;
  accent?: boolean;
}) {
  return (
    <article
      className={`rounded-2xl border p-5 sm:p-6 ${
        accent
          ? "border-[#c39a4a]/35 bg-[#7a5a3b] text-white shadow-xl shadow-[#7a5a3b]/15"
          : "border-[#dfd4bf] bg-[#fcfaf5] text-[#171415] shadow-sm"
      }`}
    >
      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${accent ? "text-[#ead7ad]" : "text-[#7a5a3b]"}`}>
        {label}
      </p>
      <p className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{value}</p>
      <p className={`mt-3 text-sm leading-5 ${accent ? "text-[#f5ecdb]" : "text-[#706a60]"}`}>{detail}</p>
    </article>
  );
}

export default function ReportPage() {
  const [exporting, setExporting] = useState(false);

  const exportPdf = async () => {
    setExporting(true);

    try {
      const { jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ format: "a4", unit: "mm" });
      const pageWidth = 210;
      const margin = 16;
      const contentWidth = pageWidth - margin * 2;
      const brown: [number, number, number] = [122, 90, 59];
      const gold: [number, number, number] = [195, 154, 74];
      const charcoal: [number, number, number] = [23, 20, 21];
      const muted: [number, number, number] = [103, 93, 77];
      const paper: [number, number, number] = [252, 250, 245];
      const line: [number, number, number] = [223, 212, 191];

      const text = (value: string, x: number, y: number, size = 10, color = charcoal, style: "normal" | "bold" = "normal") => {
        pdf.setFont("helvetica", style);
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
        pdf.text(value, x, y);
      };

      const wrappedText = (value: string, x: number, y: number, width: number, size = 9, color = muted, style: "normal" | "bold" = "normal") => {
        pdf.setFont("helvetica", style);
        pdf.setFontSize(size);
        pdf.setTextColor(...color);
        const lines = pdf.splitTextToSize(value, width);
        pdf.text(lines, x, y);
        return y + lines.length * (size * 0.45);
      };

      const metric = (x: number, y: number, width: number, value: string, label: string, detail: string, highlighted = false) => {
        pdf.setFillColor(...(highlighted ? brown : paper));
        pdf.setDrawColor(...(highlighted ? brown : line));
        pdf.roundedRect(x, y, width, 29, 3, 3, "FD");
        text(label.toUpperCase(), x + 4, y + 6, 6.5, highlighted ? [234, 215, 173] : brown, "bold");
        text(value, x + 4, y + 16, 17, highlighted ? [255, 255, 255] : charcoal, "bold");
        wrappedText(detail, x + 4, y + 22, width - 8, 6.8, highlighted ? [245, 236, 219] : muted);
      };

      pdf.setFillColor(...charcoal);
      pdf.rect(0, 0, pageWidth, 37, "F");
      pdf.setFillColor(...gold);
      pdf.rect(0, 34, pageWidth, 3, "F");
      text("SEKYERE KUMAWU DISTRICT ASSEMBLY", margin, 12, 7, [234, 215, 173], "bold");
      text("Platform Usage Report", margin, 24, 19, [255, 255, 255], "bold");
      text("Service delivery activity overview", margin, 30, 8, [215, 204, 185]);

      text("Activity at a glance", margin, 48, 12, charcoal, "bold");
      metric(margin, 53, 33, "10", "Reported cases", "Cases submitted through the district portal.", true);
      metric(52, 53, 33, "9", "Active contributors", "Field officers who logged a report.");
      metric(88, 53, 33, "5", "Towns reached", "Kumawu, Oyoko, Akronfoso, Bawjwiasi, and Temate.");
      metric(124, 53, 33, "100%", "Portal channel", "All reported cases came through the district portal.");
      metric(160, 53, 34, "Low", "Activity level", "Current volume indicates limited platform traffic.");

      text("Submission activity", margin, 96, 12, charcoal, "bold");
      text("Cases by submission date", margin, 102, 8, muted);
      const chartX = margin;
      const chartY = 109;
      const chartH = 35;
      const chartW = 104;
      const maxCases = 4;
      pdf.setDrawColor(...line);
      pdf.line(chartX, chartY + chartH, chartX + chartW, chartY + chartH);
      activityByDate.forEach((item, index) => {
        const barWidth = 11;
        const gap = 8;
        const x = chartX + 7 + index * (barWidth + gap);
        const height = (item.cases / maxCases) * 27;
        pdf.setFillColor(...brown);
        pdf.roundedRect(x, chartY + chartH - height, barWidth, height, 1.5, 1.5, "F");
        text(String(item.cases), x + 3.4, chartY + chartH - height - 2, 7, brown, "bold");
        text(item.date, x - 1, chartY + chartH + 5, 6.5, muted);
      });
      wrappedText("Eight of the ten cases were submitted across three days in June, making this the period of highest observed activity.", chartX, 153, chartW, 8);

      const panelX = 128;
      text("Case progress", panelX, 96, 12, charcoal, "bold");
      pdf.setFillColor(248, 240, 222);
      pdf.setDrawColor(216, 196, 151);
      pdf.roundedRect(panelX, 102, 66, 53, 3, 3, "FD");
      text("10 / 10", panelX + 6, 118, 22, brown, "bold");
      text("Cases remain received", panelX + 6, 125, 9, charcoal, "bold");
      wrappedText("No recorded assignment, in-progress, resolution, or status-update activity.", panelX + 6, 133, 53, 8);
      text("0", panelX + 6, 149, 12, brown, "bold");
      text("Status updates", panelX + 13, 149, 7.5, muted);
      text("0", panelX + 38, 149, 12, brown, "bold");
      text("Resolved", panelX + 45, 149, 7.5, muted);

      text("Geographic reach", margin, 171, 12, charcoal, "bold");
      text("Cases by town", margin, 177, 8, muted);
      locations.forEach((location, index) => {
        const y = 185 + index * 7;
        const barWidth = (location.cases / 5) * 68;
        text(location.name, margin, y, 7.5, charcoal, "bold");
        pdf.setFillColor(232, 223, 205);
        pdf.roundedRect(52, y - 4, 70, 4, 1, 1, "F");
        pdf.setFillColor(...gold);
        pdf.roundedRect(52, y - 4, barWidth, 4, 1, 1, "F");
        text(String(location.cases), 126, y, 7.5, brown, "bold");
      });

      text("Reported service categories", 140, 171, 12, charcoal, "bold");
      categories.forEach((category, index) => {
        const y = 180 + index * 6.5;
        const hex = category.color.slice(1);
        const red = Number.parseInt(hex.slice(0, 2), 16);
        const green = Number.parseInt(hex.slice(2, 4), 16);
        const blue = Number.parseInt(hex.slice(4, 6), 16);
        pdf.setFillColor(red, green, blue);
        pdf.circle(142, y - 1.8, 1.8, "F");
        text(category.name, 147, y, 7, charcoal);
        text(String(category.value), 190, y, 7, charcoal, "bold");
      });

      pdf.addPage();
      pdf.setFillColor(...charcoal);
      pdf.rect(0, 0, pageWidth, 20, "F");
      text("SEKYERE KUMAWU DISTRICT ASSEMBLY", margin, 9, 6.5, [234, 215, 173], "bold");
      text("Case Activity Register", margin, 16, 11, [255, 255, 255], "bold");

      text("Submitted case record", margin, 32, 13, charcoal, "bold");
      wrappedText("The register below summarises the field-officer reports reflected in this platform activity report.", margin, 39, contentWidth, 8);

      const columns = [margin, 43, 104, 139];
      const headerY = 51;
      pdf.setFillColor(...brown);
      pdf.roundedRect(margin, headerY, contentWidth, 8, 1.5, 1.5, "F");
      ["Date", "Field officer", "Town", "Issue category"].forEach((heading, index) => text(heading.toUpperCase(), columns[index] + 2, headerY + 5, 6.5, [255, 255, 255], "bold"));

      submissionLog.forEach(([date, staff, location, category], index) => {
        const y = headerY + 8 + index * 13;
        const rowColor: [number, number, number] =
          index % 2 === 0 ? [252, 250, 245] : [246, 241, 232];
        pdf.setFillColor(...rowColor);
        pdf.rect(margin, y, contentWidth, 13, "F");
        pdf.setDrawColor(...line);
        pdf.line(margin, y + 13, margin + contentWidth, y + 13);
        text(date, columns[0] + 2, y + 7.5, 7.2, charcoal, "bold");
        wrappedText(staff, columns[1] + 2, y + 5.5, 56, 7.2, charcoal, "bold");
        text(location, columns[2] + 2, y + 7.5, 7.2, charcoal);
        wrappedText(category, columns[3] + 2, y + 5.5, 50, 7.2, charcoal);
      });

      const insightY = 195;
      pdf.setFillColor(248, 240, 222);
      pdf.setDrawColor(216, 196, 151);
      pdf.roundedRect(margin, insightY, contentWidth, 55, 3, 3, "FD");
      text("Key findings", margin + 6, insightY + 10, 12, charcoal, "bold");
      const findings = [
        ["Low platform traffic", "Ten reports across five towns indicates that usage is currently limited and has meaningful room to grow."],
        ["Operational use", "Nine field officers logged cases across the district, demonstrating active use of the reporting workflow."],
        ["Response opportunity", "All reported cases remain in received status, highlighting the need for continued assignment and response activity."],
      ];
      findings.forEach(([title, body], index) => {
        const y = insightY + 19 + index * 10;
        text(`${index + 1}. ${title}:`, margin + 6, y, 8, brown, "bold");
        wrappedText(body, margin + 43, y, 130, 8, muted);
      });

      text("Sekyere Kumawu District Assembly", margin, 282, 7, muted);
      text("Platform Usage Report", 157, 282, 7, muted, "bold");
      pdf.save("sekyere-kumawu-platform-usage-report.pdf");
    } finally {
      setExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f2eee5] text-[#171415]">
      <style jsx global>{`
        @media print {
          @page { size: A4; margin: 11mm; }
          body { background: #fff !important; }
          .report-shell { max-width: none !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .print-break-before { break-before: page; }
          .print-avoid-break { break-inside: avoid; }
          .report-chart { height: 220px !important; }
          .report-table { font-size: 9px !important; }
        }
      `}</style>

      <div className="report-shell mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        <header className="border-b border-[#d7c8ab] pb-6 sm:pb-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/skda-logo.jpeg"
                alt="Sekyere Kumawu District Assembly"
                width={160}
                height={80}
                className="h-14 w-auto object-contain sm:h-16"
              />
              <div className="border-l border-[#d7c8ab] pl-4">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#7a5a3b]">Sekyere Kumawu District Assembly</p>
                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Platform Usage Report</h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <button
                type="button"
                onClick={exportPdf}
                disabled={exporting}
                className="no-print inline-flex items-center gap-2 rounded-full bg-[#7a5a3b] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#7a5a3b]/20 transition hover:bg-[#62482f] disabled:cursor-wait disabled:opacity-70"
              >
                <span aria-hidden="true">↓</span> {exporting ? "Preparing PDF..." : "Export as PDF"}
              </button>
            </div>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard value="10" label="Reported cases" detail="Cases submitted through the district portal." accent />
          <MetricCard value="9" label="Active contributors" detail="Field officers who logged a report." />
          <MetricCard value="5" label="Towns reached" detail="Kumawu, Oyoko, Akronfoso, Bawjwiasi, and Temate." />
          <MetricCard value="100%" label="Portal channel" detail="All reported cases came through the district portal." />
          <MetricCard value="Low" label="Activity level" detail="Current submission volume indicates limited platform traffic." />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <article className="print-avoid-break rounded-3xl border border-[#dfd4bf] bg-[#fcfaf5] p-5 shadow-sm sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a5a3b]">Submission activity</p>
                <h2 className="mt-1 text-xl font-black">Cases by submission date</h2>
              </div>
              <p className="rounded-full bg-[#efe8d9] px-3 py-1 text-xs font-bold text-[#665b4d]">10 total cases</p>
            </div>
            <div className="report-chart mt-6 h-64">
              <DeferredChart><ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityByDate} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#706a60", fontSize: 12 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#706a60", fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "#f2eee5" }} contentStyle={{ borderRadius: 12, borderColor: "#dfd4bf", boxShadow: "0 8px 24px rgba(70, 55, 35, 0.12)" }} />
                  <Bar dataKey="cases" name="Cases" fill="#7a5a3b" radius={[7, 7, 0, 0]} maxBarSize={54} />
                </BarChart>
              </ResponsiveContainer></DeferredChart>
            </div>
            <p className="mt-3 text-sm leading-6 text-[#706a60]">The primary submission window was 17-19 June, accounting for 8 of the 10 cases (80%). One case was recorded in May and two in July.</p>
          </article>

          <article className="print-avoid-break rounded-3xl bg-[#171415] p-5 text-white shadow-xl sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e2c583]">Workflow snapshot</p>
            <h2 className="mt-1 text-xl font-black">Response status</h2>
            <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-5xl font-black text-[#e2c583]">10 / 10</p>
              <p className="mt-2 font-bold">Cases remain received</p>
              <p className="mt-2 text-sm leading-6 text-[#d3ccc1]">No assignment, in-progress, resolution, or status-update activity has been recorded for the verified cases.</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white/8 p-3"><p className="text-[#c8c0b5]">Status updates</p><p className="mt-1 text-2xl font-black">0</p></div>
              <div className="rounded-xl bg-white/8 p-3"><p className="text-[#c8c0b5]">Resolved cases</p><p className="mt-1 text-2xl font-black">0</p></div>
            </div>
          </article>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className="print-avoid-break rounded-3xl border border-[#dfd4bf] bg-[#fcfaf5] p-5 shadow-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a5a3b]">Geographic reach</p>
            <h2 className="mt-1 text-xl font-black">Cases by town</h2>
            <div className="report-chart mt-5 h-72">
              <DeferredChart><ResponsiveContainer width="100%" height="100%">
                <BarChart data={locations} layout="vertical" margin={{ top: 0, right: 20, left: 24, bottom: 0 }}>
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={82} axisLine={false} tickLine={false} tick={{ fill: "#4e4437", fontSize: 12, fontWeight: 600 }} />
                  <Tooltip cursor={{ fill: "#f2eee5" }} contentStyle={{ borderRadius: 12, borderColor: "#dfd4bf" }} />
                  <Bar dataKey="cases" name="Cases" fill="#c39a4a" radius={[0, 7, 7, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer></DeferredChart>
            </div>
            <p className="mt-2 text-sm text-[#706a60]">Kumawu accounted for half of all verified reports.</p>
          </article>

          <article className="print-avoid-break rounded-3xl border border-[#dfd4bf] bg-[#fcfaf5] p-5 shadow-sm sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a5a3b]">Issue mix</p>
            <h2 className="mt-1 text-xl font-black">Reported service categories</h2>
            <div className="mt-5 grid items-center gap-2 sm:grid-cols-[0.9fr_1.1fr]">
              <div className="report-chart h-52">
                <DeferredChart><ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categories} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={3} stroke="none">
                      {categories.map((category) => <Cell key={category.name} fill={category.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#dfd4bf" }} />
                  </PieChart>
                </ResponsiveContainer></DeferredChart>
              </div>
              <ul className="space-y-3">
                {categories.map((category) => (
                  <li key={category.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-[#514a40]"><i className="h-2.5 w-2.5 rounded-full" style={{ background: category.color }} />{category.name}</span>
                    <strong>{category.value}</strong>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        </section>

        <section className="print-break-before mt-8 rounded-3xl border border-[#dfd4bf] bg-[#fcfaf5] shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#e5dbc9] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a5a3b]">Submission register</p>
              <h2 className="mt-1 text-xl font-black">Case activity used in this report</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="report-table w-full min-w-[700px] text-left text-sm">
              <thead className="bg-[#f2eee5] text-xs font-bold uppercase tracking-wider text-[#665b4d]">
                <tr><th className="px-5 py-3 sm:px-7">Date</th><th className="px-5 py-3">Field officer</th><th className="px-5 py-3">Town</th><th className="px-5 py-3 sm:px-7">Issue category</th></tr>
              </thead>
              <tbody className="divide-y divide-[#e9dfcf]">
                {submissionLog.map(([date, staff, location, category], index) => (
                  <tr key={`${date}-${staff}-${index}`} className="text-[#4e4437]">
                    <td className="whitespace-nowrap px-5 py-3.5 font-semibold sm:px-7">{date}</td>
                    <td className="px-5 py-3.5">{staff}</td>
                    <td className="px-5 py-3.5">{location}</td>
                    <td className="px-5 py-3.5 sm:px-7">{category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8">
          <article className="print-avoid-break rounded-3xl border border-[#d8c497] bg-[#f8f0de] p-5 sm:p-7">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#7a5a3b]">Key interpretation</p>
            <h2 className="mt-1 text-xl font-black">What this confirms</h2>
            <ul className="mt-5 space-y-4 text-sm leading-6 text-[#514536]">
              <li><strong>Low platform traffic:</strong> ten reports across five towns indicates that platform usage is currently limited and has meaningful room to grow.</li>
              <li><strong>Operational use:</strong> nine field officers logged ten cases across five towns.</li>
              <li><strong>Concentrated adoption:</strong> eight cases were submitted across three days in June, suggesting an active reporting exercise or onboarding period.</li>
              <li><strong>Follow-through gap:</strong> no case has progressed beyond received, highlighting the need for continued assignment and response activity.</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}

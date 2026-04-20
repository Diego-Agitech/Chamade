"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ReportingData = {
  monthly: Array<{ month: string; opex: number; capex: number; revenues: number }>;
  expenses: Array<{ categoryName: string | null; amount: number; nature: "OPEX" | "CAPEX" }>;
  summary: { opexTotal: number; capexTotal: number; revenuesTotal: number };
};

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

export function ReportingCharts({ data }: { data: ReportingData }) {
  const sourceData = [
    {
      name: "Revenus",
      rental: data.summary.revenuesTotal * 0.6,
      vignes: data.summary.revenuesTotal * 0.3,
      divers: data.summary.revenuesTotal * 0.1,
    },
  ];

  const opexByCategory = Object.values(
    data.expenses
      .filter((expense) => expense.nature === "OPEX")
      .reduce<Record<string, { name: string; value: number }>>((acc, expense) => {
        const key = expense.categoryName ?? "Autres";
        acc[key] = acc[key] ?? { name: key, value: 0 };
        acc[key].value += expense.amount;
        return acc;
      }, {})
  );

  const donutData = [
    { name: "OPEX", value: data.summary.opexTotal },
    { name: "CAPEX", value: data.summary.capexTotal },
    { name: "Revenus", value: data.summary.revenuesTotal },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-serif text-xl text-foreground">Tendance mensuelle</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="opex" stroke="var(--chart-1)" strokeWidth={2} />
              <Line type="monotone" dataKey="capex" stroke="var(--chart-4)" strokeWidth={2} />
              <Line type="monotone" dataKey="revenues" stroke="var(--chart-2)" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-serif text-xl text-foreground">OPEX vs CAPEX vs Revenus</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95}>
                {donutData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-serif text-xl text-foreground">Revenus par source</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sourceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="rental" stackId="a" fill="var(--chart-2)" />
              <Bar dataKey="vignes" stackId="a" fill="var(--chart-5)" />
              <Bar dataKey="divers" stackId="a" fill="var(--chart-3)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-3 font-serif text-xl text-foreground">Répartition OPEX par catégorie</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={opexByCategory} dataKey="value" nameKey="name" outerRadius={95}>
                {opexByCategory.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

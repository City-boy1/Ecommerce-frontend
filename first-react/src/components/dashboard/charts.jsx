import { useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

// Hex values mirror tokens.css (SVG attributes can't use CSS variables).
const INK = "#111111";
const MUTED = "#737373";
const GRID = "#ececec";
const BRONZE = "#947653";

const hasData = (data, key) => Array.isArray(data) && data.some((d) => Number(d[key]) > 0);

function ChartTooltip({ active, payload, label, valueFormat, valueLabel }) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="lm-tip">
      <div className="lm-tip__label">{label}</div>
      <div className="lm-tip__value">{valueFormat ? valueFormat(v) : v}{valueLabel ? <span> {valueLabel}</span> : null}</div>
    </div>
  );
}

// Card with a title, the chart, and a "table" toggle so the numbers are always reachable.
export function ChartCard({ title, subtitle, data, xKey, yKey, valueFormat, xLabel = "", yLabel = "", children, empty = "No data yet" }) {
  const [table, setTable] = useState(false);
  const ok = hasData(data, yKey);
  return (
    <section className="lm-d-card">
      <div className="lm-d-card__head">
        <div>
          <h2>{title}</h2>
          {subtitle && <div className="lm-d-sub" style={{ margin: 0, fontSize: 12 }}>{subtitle}</div>}
        </div>
        {ok && (
          <button type="button" className="lm-linkbtn" onClick={() => setTable((t) => !t)} aria-pressed={table}>
            {table ? "Show chart" : "View as table"}
          </button>
        )}
      </div>
      {!ok ? (
        <p className="lm-d-muted" style={{ textAlign: "center", padding: "56px 18px" }}>{empty}</p>
      ) : table ? (
        <div className="lm-table-wrap">
          <table className="lm-table">
            <thead><tr><th>{xLabel || xKey}</th><th>{yLabel || yKey}</th></tr></thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={i}><td>{d[xKey]}</td><td>{valueFormat ? valueFormat(d[yKey]) : d[yKey]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="lm-chart" role="img" aria-label={`${title}. Use "View as table" for the exact numbers.`}>{children}</div>
      )}
    </section>
  );
}

const axisProps = {
  tick: { fill: MUTED, fontSize: 12 },
  tickLine: false,
  axisLine: false,
};

// One series over time: thin line, light area, hover crosshair + tooltip.
export function TrendChart({ data, xKey, yKey, valueFormat, valueLabel, yTickFormat }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="lm-trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRONZE} stopOpacity={0.22} />
            <stop offset="100%" stopColor={BRONZE} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey={xKey} {...axisProps} interval="preserveStartEnd" minTickGap={24} />
        <YAxis {...axisProps} width={44} allowDecimals={false} tickFormatter={yTickFormat} />
        <Tooltip
          cursor={{ stroke: INK, strokeWidth: 1, strokeDasharray: "3 3" }}
          content={<ChartTooltip valueFormat={valueFormat} valueLabel={valueLabel} />}
        />
        <Area
          type="monotone"
          dataKey={yKey}
          stroke={BRONZE}
          strokeWidth={2}
          fill="url(#lm-trend-fill)"
          dot={false}
          activeDot={{ r: 5, fill: BRONZE, stroke: "#ffffff", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// One series by category: thin bars, rounded data-end, hover tooltip.
export function BarsChart({ data, xKey, yKey, valueFormat, valueLabel, horizontal = false, yTickFormat }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 16, bottom: 0, left: horizontal ? 4 : 0 }}
        barCategoryGap="32%"
      >
        <CartesianGrid horizontal={!horizontal} vertical={horizontal} stroke={GRID} />
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} allowDecimals={false} />
            <YAxis type="category" dataKey={xKey} {...axisProps} width={96} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axisProps} interval="preserveStartEnd" minTickGap={16} />
            <YAxis {...axisProps} width={44} allowDecimals={false} tickFormatter={yTickFormat} />
          </>
        )}
        <Tooltip cursor={{ fill: "rgba(17,17,17,0.04)" }} content={<ChartTooltip valueFormat={valueFormat} valueLabel={valueLabel} />} />
        <Bar
          dataKey={yKey}
          fill={BRONZE}
          radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
          maxBarSize={horizontal ? 18 : 28}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
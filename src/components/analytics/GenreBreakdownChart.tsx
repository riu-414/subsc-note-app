import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { GenreBreakdown } from '@/lib/analytics'

type GenreBreakdownChartProps = {
  data: GenreBreakdown[]
}

export const GenreBreakdownChart = ({ data }: GenreBreakdownChartProps) => {
  if (data.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        グラフを表示するには、契約中のサブスクを登録してください。
      </p>
    )
  }

  return (
    <div className="grid items-center gap-6 md:grid-cols-2">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="monthlyJpy"
              nameKey="name"
              innerRadius={50}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.genreId ?? 'uncategorized'} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${Number(value ?? 0).toLocaleString()}円`,
                String(name ?? ''),
              ]}
              contentStyle={{
                borderRadius: 8,
                fontSize: 12,
                border: '1px solid #e2e8f0',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="flex flex-col gap-1.5">
        {data.map((entry) => (
          <li
            key={entry.genreId ?? 'uncategorized'}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              <span className="text-slate-700">{entry.name}</span>
            </span>
            <span className="text-slate-500 tabular-nums">
              {entry.monthlyJpy.toLocaleString()}円
              <span className="ml-2 text-xs text-slate-400">
                {(entry.ratio * 100).toFixed(1)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

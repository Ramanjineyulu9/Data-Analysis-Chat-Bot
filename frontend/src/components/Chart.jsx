import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#d97706', '#334155', '#eab308', '#ef4444', '#10b981', '#3b82f6'];

export default function Chart({ chartConfig }) {
  if (!chartConfig || chartConfig.type === 'none') return null;

  const { type, data, config } = chartConfig;
  const xAxisKey = config?.xAxis || 'name';
  const yAxisKey = config?.yAxis || 'value';

  // Light mode tooltip
  const CustomTooltipStyle = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e3d8',
    borderRadius: '8px',
    color: '#1e293b',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
            <Tooltip contentStyle={CustomTooltipStyle} />
            <Bar dataKey={yAxisKey} fill="#d97706" radius={[4, 4, 0, 0]} />
          </BarChart>
        );
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
            <Tooltip contentStyle={CustomTooltipStyle} />
            <Line type="monotone" dataKey={yAxisKey} stroke="#334155" strokeWidth={2} dot={{ r: 3, fill: '#334155', strokeWidth: 0 }} activeDot={{ r: 6, fill: '#d97706', strokeWidth: 0 }} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={xAxisKey} stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
            <Tooltip contentStyle={CustomTooltipStyle} />
            <Area type="monotone" dataKey={yAxisKey} stroke="#d97706" fill="#d97706" fillOpacity={0.15} />
          </AreaChart>
        );
      case 'pie':
        return (
          <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <Pie data={data} dataKey={yAxisKey} nameKey={xAxisKey} cx="50%" cy="50%" outerRadius="80%" label={{ fill: '#475569', fontSize: 11 }}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip contentStyle={CustomTooltipStyle} />
            <Legend wrapperStyle={{ fontSize: '11px', color: '#64748b' }} />
          </PieChart>
        );
      default:
        return null;
    }
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      {renderChart()}
    </ResponsiveContainer>
  );
}

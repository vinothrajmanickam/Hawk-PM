import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Project, RagStatus } from '../types';

interface RAGPieChartProps {
  projects: Project[];
  selectedStatus: RagStatus | 'All';
  onSelectStatus: (status: RagStatus | 'All') => void;
}

export default function RAGPieChart({
  projects,
  selectedStatus,
  onSelectStatus
}: RAGPieChartProps) {
  const totalCount = projects.length;
  const redCount = projects.filter((p) => p.ragStatus === 'Red').length;
  const amberCount = projects.filter((p) => p.ragStatus === 'Amber').length;
  const greenCount = projects.filter((p) => p.ragStatus === 'Green').length;

  if (totalCount === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
        <span className="text-xs font-medium">No projects to display chart</span>
      </div>
    );
  }

  const data = [
    { name: 'Red', value: redCount, color: '#ef4444', hoverColor: '#dc2626' },
    { name: 'Amber', value: amberCount, color: '#f59e0b', hoverColor: '#d97706' },
    { name: 'Green', value: greenCount, color: '#10b981', hoverColor: '#059669' }
  ].filter((item) => item.value > 0);

  const handlePieClick = (entry: any) => {
    if (entry && entry.name) {
      const clickedStatus = entry.name as RagStatus;
      if (selectedStatus === clickedStatus) {
        onSelectStatus('All');
      } else {
        onSelectStatus(clickedStatus);
      }
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataInfo = payload[0].payload;
      const pct = ((dataInfo.value / totalCount) * 100).toFixed(1);
      const nameMap: Record<string, string> = {
        Red: 'Red - At Risk',
        Amber: 'Amber - Slight Delay',
        Green: 'Green - On-Track'
      };
      return (
        <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-800 font-sans">
          <p className="font-bold flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dataInfo.color }} />
            {nameMap[dataInfo.name] || dataInfo.name}
          </p>
          <p className="text-slate-300 mt-0.5">
            {dataInfo.value} {dataInfo.value === 1 ? 'project' : 'projects'} ({pct}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full flex flex-col justify-between" id="rag-pie-chart-wrapper">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">RAG Posture Posture</h3>
          <p className="text-[11px] text-slate-500">Interactive live portfolio health breakdown</p>
        </div>
        {selectedStatus !== 'All' && (
          <button
            onClick={() => onSelectStatus('All')}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold px-2 py-1 rounded-lg border border-slate-200 transition"
          >
            Reset filter
          </button>
        )}
      </div>

      <div className="relative h-48 w-full flex items-center justify-center" id="pie-chart-container">
        {/* Center label for Donut chart */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-black text-slate-800 tracking-tight">{totalCount}</span>
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Projects</span>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={4}
              dataKey="value"
              onClick={handlePieClick}
              className="cursor-pointer focus:outline-none"
            >
              {data.map((entry, index) => {
                const isSelected = selectedStatus === entry.name;
                const isAnySelected = selectedStatus !== 'All';
                const opacity = isAnySelected ? (isSelected ? 1.0 : 0.35) : 1.0;
                const stroke = isSelected ? '#1e293b' : '#ffffff';
                const strokeWidth = isSelected ? 2 : 1;

                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    opacity={opacity}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    className="transition-all duration-300 focus:outline-none"
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Custom Interactive Legend */}
      <div className="grid grid-cols-3 gap-1.5 mt-4 pt-4 border-t border-slate-100">
        {[
          { name: 'Red', label: 'At Risk', color: '#ef4444', count: redCount },
          { name: 'Amber', label: 'Slight Delay', color: '#f59e0b', count: amberCount },
          { name: 'Green', label: 'On-Track', color: '#10b981', count: greenCount }
        ].map((item) => {
          const isSelected = selectedStatus === item.name;
          const isAnySelected = selectedStatus !== 'All';
          const isActive = !isAnySelected || isSelected;

          return (
            <button
              key={item.name}
              onClick={() => onSelectStatus(selectedStatus === item.name ? 'All' : (item.name as RagStatus))}
              className={`flex flex-col items-center p-2 rounded-xl border text-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-50 border-slate-400 shadow-xs'
                  : 'bg-white border-slate-100 hover:border-slate-200'
              } ${isActive ? 'opacity-100' : 'opacity-40'}`}
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[10px] font-bold text-slate-700">{item.label}</span>
              </div>
              <span className="text-xs font-extrabold text-slate-900 mt-0.5">
                {item.count} <span className="text-[10px] font-normal text-slate-400">({totalCount ? ((item.count / totalCount) * 100).toFixed(0) : 0}%)</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { VibeScores } from '@/types';

interface VibeChartProps {
  vibe: VibeScores;
  size?: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: unknown[] }) => {
  if (active && payload && (payload as Array<{ value: number; payload: { subject: string } }>).length) {
    const p = (payload as Array<{ value: number; payload: { subject: string } }>)[0];
    return (
      <div className="glass px-3 py-2 rounded-lg text-xs font-medium text-[#ACC8A2]">
        {p.payload.subject}: {p.value}/10
      </div>
    );
  }
  return null;
};

export default function VibeChart({ vibe, size = 220 }: VibeChartProps) {
  const data = [
    { subject: 'Action', value: vibe.action || 0 },
    { subject: 'Comedy', value: vibe.comedy || 0 },
    { subject: 'Dark', value: vibe.dark || 0 },
    { subject: 'Romance', value: vibe.romance || 0 },
    { subject: 'Violence', value: vibe.violence || 0 },
    { subject: 'Story', value: (vibe as any).story || 0 },
    { subject: 'Pacing', value: (vibe as any).pacing || 0 },
  ];

  return (
    <div style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
          <PolarGrid
            stroke="rgba(253,251,212,0.1)"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'rgba(253,251,212,0.5)', fontSize: 10, fontWeight: 600, fontFamily: 'Inter' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Vibe"
            dataKey="value"
            stroke="#C05800"
            fill="rgba(192,88,0,0.2)"
            strokeWidth={2}
            dot={{ fill: '#FDFBD4', r: 3 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

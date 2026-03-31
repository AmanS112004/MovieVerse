import React from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { VibeScores } from '@/types';

interface VibeChartProps {
  vibe: VibeScores;
  size?: number;
  color?: string;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: unknown[] }) => {
  if (active && payload && (payload as Array<{ value: number; payload: { subject: string } }>).length) {
    const p = (payload as Array<{ value: number; payload: { subject: string } }>)[0];
    return (
      <div className="bg-[#111827] border border-white/10 px-3 py-2 rounded-lg text-xs font-black text-white shadow-2xl backdrop-blur-md">
        {p.payload.subject}: {p.value}/10
      </div>
    );
  }
  return null;
};

export default function VibeChart({ vibe, size = 220, color = "#E11D48" }: VibeChartProps) {
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
            stroke="rgba(255,255,255,0.05)"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 800, fontFamily: 'Inter', letterSpacing: '0.1em' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Vibe"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.15}
            strokeWidth={2}
            dot={{ fill: color, r: 3, strokeWidth: 2, stroke: '#111827' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

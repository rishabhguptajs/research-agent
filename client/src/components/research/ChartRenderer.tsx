"use client";

import React from 'react';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { ChartData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartRendererProps {
    chart: ChartData;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ChartRenderer({ chart }: ChartRendererProps) {
    const { type, title, data, xKey, yKeys, colors = COLORS, description } = chart;

    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        />
                        <Legend />
                        {yKeys.map((key, index) => (
                            <Bar key={key} dataKey={key} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
                        ))}
                    </BarChart>
                );
            case 'line':
                return (
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        />
                        <Legend />
                        {yKeys.map((key, index) => (
                            <Line key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} strokeWidth={2} dot={{ r: 4 }} />
                        ))}
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        />
                        <Legend />
                        {yKeys.map((key, index) => (
                            <Area key={key} type="monotone" dataKey={key} fill={colors[index % colors.length]} stroke={colors[index % colors.length]} fillOpacity={0.3} />
                        ))}
                    </AreaChart>
                );
            case 'pie':
                return (
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }: { name?: string; percent?: number }) => `${name || 'Unknown'} ${(percent ? percent * 100 : 0).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey={yKeys[0]} // Pie chart usually takes one value key
                            nameKey={xKey} // And one name key
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                        />
                        <Legend />
                    </PieChart>
                );
            default:
                return null;
        }
    };

    return (
        <Card className="w-full my-4 overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">{title}</CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart() || <div>Unsupported chart type</div>}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

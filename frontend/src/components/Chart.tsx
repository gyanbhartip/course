/**
 * Chart Component
 * Wrapper around recharts for consistent charting
 */

import React from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

export type ChartType = 'line' | 'area' | 'bar' | 'pie' | 'donut';

interface BaseChartProps {
    data: Array<any>;
    width?: number | string;
    height?: number | string;
    className?: string;
}

interface LineChartProps extends BaseChartProps {
    type: 'line';
    xKey: string;
    yKeys: Array<{ key: string; color: string; name: string }>;
}

interface AreaChartProps extends BaseChartProps {
    type: 'area';
    xKey: string;
    yKeys: Array<{ key: string; color: string; name: string }>;
}

interface BarChartProps extends BaseChartProps {
    type: 'bar';
    xKey: string;
    yKeys: Array<{ key: string; color: string; name: string }>;
}

interface PieChartProps extends BaseChartProps {
    type: 'pie' | 'donut';
    dataKey: string;
    nameKey: string;
    colors: Array<string>;
}

type ChartProps =
    | LineChartProps
    | AreaChartProps
    | BarChartProps
    | PieChartProps;

const Chart: React.FC<ChartProps> = props => {
    const { data, width = '100%', height = 300, className = '' } = props;

    if (!data || data.length === 0) {
        return (
            <div
                className={`flex items-center justify-center ${className}`}
                style={{ width, height }}>
                <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📊</div>
                    <p>No data available</p>
                </div>
            </div>
        );
    }

    const renderLineChart = (props: LineChartProps) => {
        const { xKey, yKeys } = props;
        return (
            <ResponsiveContainer width={width} height={height}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {yKeys.map(({ key, color, name }) => (
                        <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stroke={color}
                            name={name}
                            strokeWidth={2}
                            dot={{ r: 4 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        );
    };

    const renderAreaChart = (props: AreaChartProps) => {
        const { xKey, yKeys } = props;
        return (
            <ResponsiveContainer width={width} height={height}>
                <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {yKeys.map(({ key, color, name }) => (
                        <Area
                            key={key}
                            type="monotone"
                            dataKey={key}
                            stackId="1"
                            stroke={color}
                            fill={color}
                            name={name}
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        );
    };

    const renderBarChart = (props: BarChartProps) => {
        const { xKey, yKeys } = props;
        return (
            <ResponsiveContainer width={width} height={height}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xKey} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    {yKeys.map(({ key, color, name }) => (
                        <Bar key={key} dataKey={key} fill={color} name={name} />
                    ))}
                </BarChart>
            </ResponsiveContainer>
        );
    };

    const renderPieChart = (props: PieChartProps) => {
        const { dataKey, nameKey, colors, type } = props;
        const isDonut = type === 'donut';

        return (
            <ResponsiveContainer width={width} height={height}>
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={isDonut ? 60 : 0}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey={dataKey}
                        nameKey={nameKey}>
                        {data.map((_, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={colors[index % colors.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
            </ResponsiveContainer>
        );
    };

    const renderChart = () => {
        switch (props.type) {
            case 'line':
                return renderLineChart(props as LineChartProps);
            case 'area':
                return renderAreaChart(props as AreaChartProps);
            case 'bar':
                return renderBarChart(props as BarChartProps);
            case 'pie':
            case 'donut':
                return renderPieChart(props as PieChartProps);
            default:
                return null;
        }
    };

    return <div className={className}>{renderChart()}</div>;
};

export default Chart;

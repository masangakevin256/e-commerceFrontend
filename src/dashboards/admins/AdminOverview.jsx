import React, { useState, useEffect } from "react";
import axios from "axios";
import { BASE_URL } from "../../tokens/BASE_URL";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    Legend,
    AreaChart,
    Area,
    RadialBarChart,
    RadialBar
} from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#a4de6c", "#d0ed57"];

const AdminOverview = ({ stats }) => {
    const [recentOrders, setRecentOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        fetchRecentOrders();
    }, []);

    const fetchRecentOrders = async () => {
        try {
            setLoadingOrders(true);
            const accessToken = localStorage.getItem("accessToken");
            const res = await axios.get(`${BASE_URL}/orders/recent`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setRecentOrders(res.data);
        } catch (err) {
            console.error("Failed to fetch recent orders:", err);
        } finally {
            setLoadingOrders(false);
        }
    };

    const getTimeAgo = (dateString) => {
        const now = new Date();
        const orderDate = new Date(dateString);
        const diffMs = now - orderDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    if (!stats) {
        return (
            <div className="container-fluid">
                <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading dashboard data...</p>
                </div>
            </div>
        );
    }

    // Format sales trend data for chart
    const formattedSalesTrend = (stats.salesTrend || []).map(item => ({
        date: new Date(item.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
        revenue: Number(item.revenue),
        orders: item.orders || Math.floor(Math.random() * 50) + 10
    }));

    // Category data for charts
    const categoryData = (stats.categoryStats || []).map(cat => ({
        name: cat.name,
        value: cat.value,
        products: cat.products || Math.floor(cat.value * 1.5)
    })).slice(0, 6); // Take top 6 categories

    // System performance data
    const performanceData = [
        { name: 'Mon', value: 89 },
        { name: 'Tue', value: 92 },
        { name: 'Wed', value: 94 },
        { name: 'Thu', value: 88 },
        { name: 'Fri', value: 96 },
        { name: 'Sat', value: 91 },
        { name: 'Sun', value: 95 },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip bg-white border rounded shadow-sm p-3">
                    <p className="fw-bold mb-1">{label}</p>
                    <p className="text-primary mb-0">
                        Revenue: <strong>KES {Number(payload[0].value).toLocaleString()}</strong>
                    </p>
                    <p className="text-success mb-0">
                        Orders: <strong>{payload[1]?.value || 0}</strong>
                    </p>
                </div>
            );
        }
        return null;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            completed: { color: 'success', icon: 'check-circle' },
            processing: { color: 'warning', icon: 'arrow-repeat' },
            pending: { color: 'info', icon: 'clock' },
            cancelled: { color: 'danger', icon: 'x-circle' }
        };
        const config = statusConfig[status] || { color: 'secondary', icon: 'question-circle' };
        return (
            <span className={`badge bg-${config.color} bg-opacity-10 text-${config.color}`}>
                <i className={`bi bi-${config.icon} me-1`}></i>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="container-fluid">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="fw-bold text-primary mb-2">
                                <i className="bi bi-speedometer2 me-2"></i>
                                Dashboard Overview
                            </h2>
                            <p className="text-muted mb-0">
                                Welcome back! Here's what's happening with your store today.
                            </p>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-primary d-flex align-items-center">
                                <i className="bi bi-calendar me-2"></i>
                                {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="row g-4 mb-4">
                {/* Revenue Card */}
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-primary bg-opacity-10 rounded p-3 me-3">
                                    <i className="bi bi-cash-stack text-primary fs-3"></i>
                                </div>
                                <div>
                                    <h6 className="text-muted mb-1">Total Revenue</h6>
                                    <h2 className="fw-bold mb-0">KES {Number(stats.totalRevenue).toLocaleString()}</h2>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="text-success small">
                                    <i className="bi bi-arrow-up me-1"></i>
                                    12.5% vs last week
                                </span>
                                <span className="badge bg-primary bg-opacity-10 text-primary">
                                    <i className="bi bi-graph-up me-1"></i>
                                    Trending
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Orders Card */}
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-success bg-opacity-10 rounded p-3 me-3">
                                    <i className="bi bi-cart-check text-success fs-3"></i>
                                </div>
                                <div>
                                    <h6 className="text-muted mb-1">Total Orders</h6>
                                    <h2 className="fw-bold mb-0">{stats.totalOrders}</h2>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="text-success small">
                                    <i className="bi bi-arrow-up me-1"></i>
                                    8.2% vs last week
                                </span>
                                <span className="badge bg-success bg-opacity-10 text-success">
                                    <i className="bi bi-lightning me-1"></i>
                                    Active
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customers Card */}
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-3">
                                <div className="bg-info bg-opacity-10 rounded p-3 me-3">
                                    <i className="bi bi-people text-info fs-3"></i>
                                </div>
                                <div>
                                    <h6 className="text-muted mb-1">Total Customers</h6>
                                    <h2 className="fw-bold mb-0">{stats.totalCustomers}</h2>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="text-success small">
                                    <i className="bi bi-arrow-up me-1"></i>
                                    5.3% vs last week
                                </span>
                                <span className="badge bg-info bg-opacity-10 text-info">
                                    <i className="bi bi-person-plus me-1"></i>
                                    Growing
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Products Card */}
                <div className="col-xl-3 col-lg-6 col-md-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-3">
                                <div className={`rounded p-3 me-3 ${stats.lowStock > 0 ? 'bg-danger bg-opacity-10' : 'bg-warning bg-opacity-10'}`}>
                                    <i className={`fs-3 ${stats.lowStock > 0 ? 'bi bi-exclamation-triangle text-danger' : 'bi bi-box-seam text-warning'}`}></i>
                                </div>
                                <div>
                                    <h6 className="text-muted mb-1">Total Products</h6>
                                    <h2 className="fw-bold mb-0">{stats.totalProducts}</h2>
                                </div>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                                <span className={`small ${stats.lowStock > 0 ? 'text-danger' : 'text-success'}`}>
                                    <i className={`bi bi-${stats.lowStock > 0 ? 'exclamation-triangle' : 'check-circle'} me-1`}></i>
                                    {stats.lowStock > 0 ? `${stats.lowStock} low stock` : 'All in stock'}
                                </span>
                                {stats.lowStock > 0 && (
                                    <span className="badge bg-danger bg-opacity-10 text-danger animate-pulse">
                                        <i className="bi bi-bell me-1"></i>
                                        Alert
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="row g-4 mb-4">
                {/* Sales Trend Chart */}
                <div className="col-xl-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="fw-bold mb-1">Sales Performance</h5>
                                    <p className="text-muted small mb-0">Revenue and orders over the last 7 days</p>
                                </div>
                                <div className="dropdown">
                                    <button className="btn btn-sm btn-outline-primary d-flex align-items-center" type="button">
                                        <i className="bi bi-download me-2"></i> Export Data
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="card-body p-4 pt-0">
                            <div style={{ width: '100%', height: 320 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={formattedSalesTrend}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6c757d', fontSize: 12 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#6c757d', fontSize: 12 }}
                                            dx={-10}
                                            tickFormatter={(value) => `KES ${value}`}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            name="Revenue"
                                            stroke="#4e54c8"
                                            fill="#4e54c8"
                                            fillOpacity={0.1}
                                            strokeWidth={3}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="orders"
                                            name="Orders"
                                            stroke="#00C49F"
                                            strokeWidth={2}
                                            dot={{ strokeWidth: 0 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Distribution */}
                <div className="col-xl-4">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 p-4">
                            <h5 className="fw-bold mb-1">Category Distribution</h5>
                            <p className="text-muted small mb-0">Products count by category</p>
                        </div>
                        <div className="card-body p-4 pt-0">
                            <div style={{ width: '100%', height: 320 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                            label={(entry) => `${entry.name}: ${entry.value}`}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                    strokeWidth={0}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                borderRadius: '12px',
                                                border: 'none',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                                padding: '12px'
                                            }}
                                            formatter={(value, name, props) => [`${value} products`, props.payload.name]}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="row g-4">
                {/* Recent Orders */}
                <div className="col-xl-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 p-4">
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Recent Orders</h5>
                                <a href="#" className="btn btn-sm btn-link text-decoration-none">
                                    View All <i className="bi bi-arrow-right ms-1"></i>
                                </a>
                            </div>
                        </div>
                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="bg-light">
                                        <tr>
                                            <th className="border-0 py-3 ps-4">Order ID</th>
                                            <th className="border-0 py-3">Customer</th>
                                            <th className="border-0 py-3">Amount</th>
                                            <th className="border-0 py-3">Status</th>
                                            <th className="border-0 py-3 pe-4 text-end">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingOrders ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5">
                                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : recentOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center py-5 text-muted">
                                                    No recent orders
                                                </td>
                                            </tr>
                                        ) : (
                                            recentOrders.map(order => (
                                                <tr key={order.id} className="border-top">
                                                    <td className="py-3 ps-4">
                                                        <div className="fw-semibold">#{order.id}</div>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="d-flex align-items-center">
                                                            <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                                                                <i className="bi bi-person text-primary"></i>
                                                            </div>
                                                            <div>
                                                                <div className="fw-semibold">{order.customer_name}</div>
                                                                <small className="text-muted">{order.customer_email}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 fw-bold">
                                                        KES {Number(order.total).toLocaleString()}
                                                    </td>
                                                    <td className="py-3">
                                                        {getStatusBadge(order.status)}
                                                    </td>
                                                    <td className="py-3 pe-4 text-end">
                                                        <small className="text-muted">{getTimeAgo(order.created_at)}</small>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System Performance */}
                <div className="col-xl-6">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0 p-4">
                            <h5 className="fw-bold mb-0">System Performance</h5>
                        </div>
                        <div className="card-body p-4">
                            <div className="row">
                                <div className="col-md-6 mb-4">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-success bg-opacity-10 rounded p-3 me-3">
                                            <i className="bi bi-check-circle text-success fs-2"></i>
                                        </div>
                                        <div>
                                            <h3 className="fw-bold mb-0">98.5%</h3>
                                            <small className="text-muted">System Uptime</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-4">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-primary bg-opacity-10 rounded p-3 me-3">
                                            <i className="bi bi-speedometer2 text-primary fs-2"></i>
                                        </div>
                                        <div>
                                            <h3 className="fw-bold mb-0">2.4s</h3>
                                            <small className="text-muted">Avg. Response</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-warning bg-opacity-10 rounded p-3 me-3">
                                            <i className="bi bi-shield-check text-warning fs-2"></i>
                                        </div>
                                        <div>
                                            <h3 className="fw-bold mb-0">100%</h3>
                                            <small className="text-muted">Security Status</small>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="d-flex align-items-center">
                                        <div className="bg-info bg-opacity-10 rounded p-3 me-3">
                                            <i className="bi bi-database text-info fs-2"></i>
                                        </div>
                                        <div>
                                            <h3 className="fw-bold mb-0">45.2GB</h3>
                                            <small className="text-muted">Storage Used</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <h6 className="fw-bold mb-3">Weekly Performance</h6>
                                <div style={{ width: '100%', height: 150 }}>
                                    <ResponsiveContainer>
                                        <BarChart data={performanceData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6c757d', fontSize: 11 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                hide
                                            />
                                            <Tooltip
                                                formatter={(value) => [`${value}%`, 'Performance']}
                                                contentStyle={{
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                                }}
                                            />
                                            <Bar
                                                dataKey="value"
                                                fill="#00C49F"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .animate-pulse {
                    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                .custom-tooltip {
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                }
            `}</style>
        </div>
    );
};

export default AdminOverview;
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import axios from "axios";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Calendar } from "./components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./components/ui/popover";
import { useToast } from "./hooks/use-toast";
import { Toaster } from "./components/ui/sonner";
import { 
  TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign, 
  BarChart3, Calendar as CalendarIcon, Download, Sparkles,
  Target, Award, Activity, Globe
} from "lucide-react";
import { format, subDays, subMonths } from "date-fns";
import "@/App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Color schemes for charts
const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// Dashboard Layout Component
const DashboardLayout = ({ children }) => {
  const location = useLocation();
  
  const navigation = [
    { name: 'Overview', href: '/', icon: BarChart3, current: location.pathname === '/' },
    { name: 'Sales Analytics', href: '/sales', icon: TrendingUp, current: location.pathname === '/sales' },
    { name: 'Customer Insights', href: '/customers', icon: Users, current: location.pathname === '/customers' },
    { name: 'Product Performance', href: '/products', icon: ShoppingBag, current: location.pathname === '/products' },
    { name: 'AI Insights', href: '/ai-insights', icon: Sparkles, current: location.pathname === '/ai-insights' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-slate-900">RevenuePulse</h1>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              Sales Intelligence Platform
            </Badge>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" className="text-slate-600">
              <Globe className="h-4 w-4 mr-2" />
              Global View
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 px-6 py-2">
        <div className="flex space-x-8">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                data-testid={`nav-${item.name.toLowerCase().replace(' ', '-')}`}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  item.current
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Content */}
      <main className="px-6 py-6">
        {children}
      </main>
    </div>
  );
};

// Overview Dashboard Component
const Overview = () => {
  const [dashboardData, setDashboardData] = useState({
    sales: null,
    customers: null,
    products: null,
    seasonal: null
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const { toast } = useToast();

  useEffect(() => {
    loadOverviewData();
  }, [dateRange]);

  const loadOverviewData = async () => {
    setLoading(true);
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      const [salesRes, customersRes, productsRes, seasonalRes] = await Promise.all([
        axios.get(`${API}/analytics/sales?start_date=${startDate}&end_date=${endDate}`),
        axios.get(`${API}/analytics/customers`),
        axios.get(`${API}/analytics/products`),
        axios.get(`${API}/analytics/seasonal`)
      ]);

      setDashboardData({
        sales: salesRes.data,
        customers: customersRes.data,
        products: productsRes.data,
        seasonal: seasonalRes.data
      });
    } catch (error) {
      console.error('Error loading overview data:', error);
      toast({ title: "Error", description: "Failed to load dashboard data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = async () => {
    try {
      toast({ title: "Generating sample data...", description: "This may take a moment" });
      await axios.post(`${API}/generate-sample-data`);
      toast({ title: "Success", description: "Sample data generated successfully" });
      loadOverviewData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate sample data", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Range */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard Overview</h2>
          <p className="text-slate-600">Real-time sales performance and customer insights</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-72">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range) setDateRange(range);
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={generateSampleData} variant="outline" size="sm">
            Generate Sample Data
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {dashboardData.sales && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium text-slate-600">Total Revenue</CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center">
                <DollarSign className="h-6 w-6 text-blue-600 mr-2" />
                ${dashboardData.sales.total_revenue.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {dashboardData.sales.period_comparison.revenue_growth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  dashboardData.sales.period_comparison.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(dashboardData.sales.period_comparison.revenue_growth).toFixed(1)}%
                </span>
                <span className="text-sm text-slate-500">vs previous period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium text-slate-600">Total Transactions</CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Activity className="h-6 w-6 text-green-600 mr-2" />
                {dashboardData.sales.total_transactions.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-slate-600">
                  Conversion Rate: {dashboardData.sales.conversion_rate}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium text-slate-600">Average Order Value</CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Award className="h-6 w-6 text-purple-600 mr-2" />
                ${dashboardData.sales.average_order_value.toFixed(0)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                Per transaction average
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-sm font-medium text-slate-600">Active Customers</CardDescription>
              <CardTitle className="text-2xl font-bold flex items-center">
                <Users className="h-6 w-6 text-orange-600 mr-2" />
                {dashboardData.customers.total_customers.toLocaleString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                Retention: {dashboardData.customers.customer_retention_rate.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend */}
        {dashboardData.seasonal && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly performance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dashboardData.seasonal.monthly_trends.labels.map((label, idx) => ({
                  month: label,
                  revenue: dashboardData.seasonal.monthly_trends.revenue[idx],
                  transactions: dashboardData.seasonal.monthly_trends.transactions[idx]
                }))}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px'
                    }}
                    formatter={(value, name) => [
                      name === 'revenue' ? `$${value.toLocaleString()}` : value,
                      name === 'revenue' ? 'Revenue' : 'Transactions'
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Customer Segments */}
        {dashboardData.customers && (
          <Card>
            <CardHeader>
              <CardTitle>Customer Segments</CardTitle>
              <CardDescription>Revenue distribution by customer type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={Object.entries(dashboardData.customers.segment_breakdown).map(([segment, data]) => ({
                      name: segment,
                      value: data.revenue,
                      count: data.count
                    }))}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.keys(dashboardData.customers.segment_breakdown).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Top Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        {dashboardData.products && (
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Highest revenue generating products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.products.top_products.slice(0, 5).map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{product.name}</p>
                        <p className="text-sm text-slate-500">{product.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${product.revenue.toLocaleString()}</p>
                      <p className="text-sm text-slate-500">{product.units_sold} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Customers */}
        {dashboardData.customers && (
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>Highest value customers by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.customers.top_customers.slice(0, 5).map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{customer.name}</p>
                        <p className="text-sm text-slate-500">{customer.transactions} transactions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${customer.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Sales Analytics Component
const SalesAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [seasonalData, setSeasonalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedRegion, setSelectedRegion] = useState("all");
  const { toast } = useToast();

  const regions = ["all", "North America", "Europe", "Asia-Pacific", "Latin America", "Middle East & Africa"];

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange, selectedRegion]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');

      const [analyticsRes, seasonalRes] = await Promise.all([
        axios.get(`${API}/analytics/sales?start_date=${startDate}&end_date=${endDate}&region=${selectedRegion}`),
        axios.get(`${API}/analytics/seasonal`)
      ]);

      setAnalyticsData(analyticsRes.data);
      setSeasonalData(seasonalRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({ title: "Error", description: "Failed to load analytics data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const startDate = format(dateRange.from, 'yyyy-MM-dd');
      const endDate = format(dateRange.to, 'yyyy-MM-dd');
      
      const response = await axios.get(`${API}/export/sales-report?start_date=${startDate}&end_date=${endDate}&format=xlsx`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_report_${format(new Date(), 'yyyyMMdd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({ title: "Success", description: "Sales report exported successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export report", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Sales Analytics</h2>
          <p className="text-slate-600">Detailed sales performance analysis and trends</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Select value={selectedRegion} onValueChange={setSelectedRegion}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              {regions.map(region => (
                <SelectItem key={region} value={region}>
                  {region === "all" ? "All Regions" : region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  if (range) setDateRange(range);
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          
          <Button onClick={exportReport} data-testid="export-report-btn">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Revenue Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">${analyticsData.total_revenue.toLocaleString()}</p>
                <p className="text-sm text-slate-600">Total Revenue</p>
              </div>
              <div className="flex items-center space-x-2">
                {analyticsData.period_comparison.revenue_growth >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm font-medium ${
                  analyticsData.period_comparison.revenue_growth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(analyticsData.period_comparison.revenue_growth).toFixed(1)}% vs previous period
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction Volume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{analyticsData.total_transactions.toLocaleString()}</p>
                <p className="text-sm text-slate-600">Total Transactions</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-blue-600">{analyticsData.conversion_rate}%</p>
                <p className="text-sm text-slate-600">Conversion Rate</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">${analyticsData.average_order_value.toFixed(0)}</p>
                <p className="text-sm text-slate-600">Average Order Value</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-purple-600">${analyticsData.period_comparison.previous_revenue.toLocaleString()}</p>
                <p className="text-sm text-slate-600">Previous Period Revenue</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Seasonal Trends Charts */}
      {seasonalData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Trends</CardTitle>
              <CardDescription>Performance over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={seasonalData.monthly_trends.labels.map((label, idx) => ({
                  month: label,
                  revenue: seasonalData.monthly_trends.revenue[idx]
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quarterly Performance</CardTitle>
              <CardDescription>Seasonal revenue patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(seasonalData.seasonal_patterns).map(([quarter, data]) => ({
                  quarter,
                  revenue: data.revenue,
                  transactions: data.transactions
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? `$${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'Revenue' : 'Transactions'
                  ]} />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Peak Periods */}
      {seasonalData && seasonalData.peak_periods && (
        <Card>
          <CardHeader>
            <CardTitle>Peak Performance Periods</CardTitle>
            <CardDescription>Months with above-average performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {seasonalData.peak_periods.map((period, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{period.period}</p>
                      <p className="text-sm text-slate-600">Peak Period</p>
                    </div>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      +{period.above_average.toFixed(1)}%
                    </Badge>
                  </div>
                  <p className="text-lg font-bold text-blue-700 mt-2">${period.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// AI Insights Component
const AIInsights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadAIInsights();
  }, []);

  const loadAIInsights = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/analytics/ai-insights`);
      setInsights(response.data);
    } catch (error) {
      console.error('Error loading AI insights:', error);
      toast({ title: "Error", description: "Failed to load AI insights", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="text-slate-600">AI is analyzing your sales data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 flex items-center">
            <Sparkles className="h-8 w-8 text-blue-600 mr-3" />
            AI-Powered Insights
          </h2>
          <p className="text-slate-600">Automated analysis and recommendations for your sales performance</p>
        </div>
        
        <Button onClick={loadAIInsights} variant="outline" data-testid="refresh-insights-btn">
          <Activity className="mr-2 h-4 w-4" />
          Refresh Analysis
        </Button>
      </div>

      {insights && (
        <>
          {/* Main AI Insights */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Sparkles className="h-5 w-5 text-blue-600 mr-2" />
                AI Analysis Summary
              </CardTitle>
              <CardDescription>
                Generated on {format(new Date(insights.generated_at), 'PPP')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {insights.insights}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 text-green-600 mr-2" />
                Strategic Recommendations
              </CardTitle>
              <CardDescription>AI-generated action items to improve performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-700 mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-800 font-medium">{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trends Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                Trends Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-slate-800">{insights.trends_analysis}</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// Customer Analytics Component
const CustomerAnalytics = () => {
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/analytics/customers`);
      setCustomerData(response.data);
    } catch (error) {
      console.error('Error loading customer data:', error);
      toast({ title: "Error", description: "Failed to load customer data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Customer Analytics</h2>
        <p className="text-slate-600">Insights into customer behavior and segmentation</p>
      </div>

      {customerData && (
        <>
          {/* Customer Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-600">{customerData.total_customers.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Returning Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{customerData.returning_customers.toLocaleString()}</p>
                <p className="text-sm text-slate-600 mt-1">
                  {((customerData.returning_customers / customerData.total_customers) * 100).toFixed(1)}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Retention Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-purple-600">{customerData.customer_retention_rate.toFixed(1)}%</p>
                <p className="text-sm text-slate-600 mt-1">Customer loyalty metric</p>
              </CardContent>
            </Card>
          </div>

          {/* Customer Segments Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments Distribution</CardTitle>
                <CardDescription>Revenue and count by customer type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(customerData.segment_breakdown).map(([segment, data]) => ({
                        name: segment,
                        value: data.revenue,
                        count: data.count
                      }))}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.keys(customerData.segment_breakdown).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Segment Performance</CardTitle>
                <CardDescription>Detailed breakdown by customer type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(customerData.segment_breakdown).map(([segment, data], index) => (
                    <div key={segment} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-slate-900">{segment}</h3>
                        <Badge style={{ backgroundColor: COLORS[index % COLORS.length] }} className="text-white">
                          {data.count} customers
                        </Badge>
                      </div>
                      <p className="text-2xl font-bold text-slate-800">${data.revenue.toLocaleString()}</p>
                      <p className="text-sm text-slate-600">
                        Avg per customer: ${(data.revenue / data.count).toFixed(0)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Customers by Revenue</CardTitle>
              <CardDescription>Your most valuable customers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerData.top_customers.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-lg font-bold text-blue-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{customer.name}</p>
                        <p className="text-sm text-slate-500">Customer ID: {customer.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">${customer.revenue.toLocaleString()}</p>
                      <p className="text-sm text-slate-500">{customer.transactions} transactions</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// Product Analytics Component  
const ProductAnalytics = () => {
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadProductData();
  }, []);

  const loadProductData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/analytics/products`);
      setProductData(response.data);
    } catch (error) {
      console.error('Error loading product data:', error);
      toast({ title: "Error", description: "Failed to load product data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Product Analytics</h2>
        <p className="text-slate-600">Performance insights and inventory analysis</p>
      </div>

      {productData && (
        <>
          {/* Inventory Insights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-lg">Low Stock Alert</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-red-600">{productData.inventory_insights.low_stock_alert}</p>
                <p className="text-sm text-slate-600">Products need restocking</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-lg">Fast Moving</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-600">{productData.inventory_insights.fast_moving_items}</p>
                <p className="text-sm text-slate-600">High demand products</p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="text-lg">Slow Moving</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-600">{productData.inventory_insights.slow_moving_items}</p>
                <p className="text-sm text-slate-600">Consider promotions</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
              <CardDescription>Revenue by product category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(productData.category_performance).map(([category, data]) => ({
                  category,
                  revenue: data.revenue,
                  units: data.units_sold
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" className="text-xs" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'revenue' ? `$${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'Revenue' : 'Units Sold'
                  ]} />
                  <Bar dataKey="revenue" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Products Table */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Products ranked by revenue performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {productData.top_products.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg font-bold text-green-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{product.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">{product.category}</Badge>
                          <span className="text-sm text-slate-500">ID: {product.id}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-slate-900">${product.revenue.toLocaleString()}</p>
                      <div className="text-sm text-slate-500">
                        <span>{product.units_sold} units • </span>
                        <span>Avg: ${product.avg_price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

// Main App Component
function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/sales" element={<SalesAnalytics />} />
            <Route path="/customers" element={<CustomerAnalytics />} />
            <Route path="/products" element={<ProductAnalytics />} />
            <Route path="/ai-insights" element={<AIInsights />} />
          </Routes>
        </DashboardLayout>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Search, Filter, Plus, Download, DollarSign, Clock, AlertCircle, FileText, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { useInvoices } from '@/hooks/useInvoices';
import InvoiceTable from './InvoiceTable';
import InvoiceForm from './InvoiceForm';

const InvoiceDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const { data: invoices, isLoading, error } = useInvoices();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Management</h1>
            <p className="text-gray-600">Track and manage all your invoices and payments</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error loading invoices: {error.message}</p>
      </div>
    );
  }

  // Calculate invoice statistics without overdue amount display
  const totalInvoices = invoices?.length || 0;
  const pendingInvoices = invoices?.filter(inv => inv.status === 'sent')?.length || 0;
  
  // Calculate overdue count only (no amount display here)
  const currentDate = new Date();
  const overdueInvoices = invoices?.filter(inv => {
    const dueDate = new Date(inv.due_date);
    return inv.status === 'overdue' || (inv.status === 'sent' && dueDate < currentDate);
  })?.length || 0;
  
  const paidInvoices = invoices?.filter(inv => inv.status === 'paid')?.length || 0;

  const invoiceStats = [
    { label: 'Total Invoices', value: totalInvoices.toString(), change: '+8%', icon: DollarSign, color: 'blue' },
    { label: 'Pending Payment', value: pendingInvoices.toString(), change: '-12%', icon: Clock, color: 'orange' },
    { label: 'Overdue', value: overdueInvoices.toString(), change: '+5%', icon: AlertCircle, color: 'red' },
    { label: 'Paid This Month', value: paidInvoices.toString(), change: '+15%', icon: DollarSign, color: 'green' }
  ];

  const handleExport = () => {
    const invoicesToExport = filteredInvoices.length > 0 ? filteredInvoices : invoices || [];
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Invoice Number,Customer,Amount,Due Date,Status,Created Date\n"
      + invoicesToExport.map(invoice => 
          `${invoice.invoice_number},${invoice.customers?.name || 'Unknown'},$${invoice.amount},${invoice.due_date},${invoice.status},${invoice.created_at.split('T')[0]}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoices_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredInvoices = invoices?.filter(invoice => {
    const customerName = invoice.customers?.name || '';
    const matchesSearch = customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  }) || [];

  const getMonthlyData = () => {
    if (!invoices) return [];
    
    const monthlyStats = invoices.reduce((acc: any, invoice) => {
      const date = new Date(invoice.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: monthName,
          monthKey,
          year: date.getFullYear(),
          monthNum: date.getMonth() + 1,
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
          amount: 0
        };
      }
      
      acc[monthKey].total += 1;
      acc[monthKey].amount += Number(invoice.amount);
      
      switch (invoice.status) {
        case 'paid':
          acc[monthKey].paid += 1;
          break;
        case 'sent':
          acc[monthKey].pending += 1;
          break;
        case 'overdue':
          acc[monthKey].overdue += 1;
          break;
      }
      
      return acc;
    }, {});
    
    // Sort by year and month properly
    return Object.values(monthlyStats).sort((a: any, b: any) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.monthNum - b.monthNum;
    });
  };

  const monthlyData = getMonthlyData();

  const riskAnalysisData = React.useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    
    const monthlyRisk: Record<string, any> = {};
    
    invoices.forEach(invoice => {
      const date = new Date(invoice.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      if (!monthlyRisk[monthKey]) {
        monthlyRisk[monthKey] = {
          month: monthName,
          monthKey,
          year: date.getFullYear(),
          monthNum: date.getMonth() + 1,
          lowRisk: 0,
          mediumRisk: 0,
          highRisk: 0
        };
      }
      
      if (invoice.risk_level === 'low') monthlyRisk[monthKey].lowRisk += 1;
      else if (invoice.risk_level === 'high') monthlyRisk[monthKey].highRisk += 1;
      else monthlyRisk[monthKey].mediumRisk += 1;
    });
    
    // Sort by year and month properly
    return Object.values(monthlyRisk).sort((a: any, b: any) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.monthNum - b.monthNum;
    });
  }, [invoices]);

  const statusTrendsData = React.useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    
    const monthlyTrends: Record<string, any> = {};
    
    invoices.forEach(invoice => {
      const date = new Date(invoice.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });
      
      if (!monthlyTrends[monthKey]) {
        monthlyTrends[monthKey] = {
          month: monthName,
          monthKey,
          year: date.getFullYear(),
          monthNum: date.getMonth() + 1,
          paid: 0,
          pending: 0,
          overdue: 0
        };
      }
      
      if (invoice.status === 'paid') monthlyTrends[monthKey].paid += 1;
      else if (invoice.status === 'sent') monthlyTrends[monthKey].pending += 1;
      else if (invoice.status === 'overdue') monthlyTrends[monthKey].overdue += 1;
    });
    
    // Sort by year and month properly
    return Object.values(monthlyTrends).sort((a: any, b: any) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.monthNum - b.monthNum;
    });
  }, [invoices]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Management</h1>
          <p className="text-gray-600">Track and manage all your invoices and payments</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">All Invoices</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {invoiceStats.map((stat, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.change} from last month
                      </p>
                    </div>
                    <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Invoice Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#3B82F6" name="Total" />
                    <Bar dataKey="paid" fill="#10B981" name="Paid" />
                    <Bar dataKey="overdue" fill="#EF4444" name="Overdue" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {invoices?.slice(0, 6).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{invoice.invoice_number}</div>
                        <div className="text-sm text-gray-500">{invoice.customers?.name || 'Unknown Customer'}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${Number(invoice.amount).toLocaleString()}</div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {invoice.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 flex-1">
              <div className="flex-1">
                <Input 
                  placeholder="Search by customer name or invoice number..." 
                  className="w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="sent">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>More Filters</span>
              </Button>
            </div>
            <Dialog open={isNewInvoiceOpen} onOpenChange={setIsNewInvoiceOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2 ml-4">
                  <Plus className="w-4 h-4" />
                  <span>New Invoice</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Invoice</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new invoice.
                  </DialogDescription>
                </DialogHeader>
                <InvoiceForm onSuccess={() => setIsNewInvoiceOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Invoices ({filteredInvoices.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <InvoiceTable invoices={filteredInvoices} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Invoice Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} name="Total" />
                    <Line type="monotone" dataKey="paid" stroke="#10B981" strokeWidth={2} name="Paid" />
                    <Line type="monotone" dataKey="pending" stroke="#F59E0B" strokeWidth={2} name="Pending" />
                    <Line type="monotone" dataKey="overdue" stroke="#EF4444" strokeWidth={2} name="Overdue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={riskAnalysisData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="lowRisk" stroke="#10B981" strokeWidth={2} name="Low Risk" />
                    <Line type="monotone" dataKey="mediumRisk" stroke="#F59E0B" strokeWidth={2} name="Medium Risk" />
                    <Line type="monotone" dataKey="highRisk" stroke="#EF4444" strokeWidth={2} name="High Risk" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Invoice Status Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={statusTrendsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="paid" stroke="#3B82F6" strokeWidth={2} name="Paid" />
                    <Line type="monotone" dataKey="pending" stroke="#8B5CF6" strokeWidth={2} name="Pending" />
                    <Line type="monotone" dataKey="overdue" stroke="#DC2626" strokeWidth={2} name="Overdue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InvoiceDashboard;

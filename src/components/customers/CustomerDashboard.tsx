import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Search, Filter, Plus, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import CustomerRiskAssessment from './CustomerRiskAssessment';
import CustomerForm from './CustomerForm';
import { useCustomers, useCustomerAnalytics } from '@/hooks/useCustomers';
import { useCustomerRiskUpdater } from '@/hooks/useCustomerRiskUpdater';
import { useInvoices } from '@/hooks/useInvoices';
import { usePaymentHistory } from '@/hooks/usePaymentHistory';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const CustomerDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewCustomerOpen, setIsNewCustomerOpen] = useState(false);
  const { data: customers, isLoading } = useCustomers();
  const { data: analytics, isLoading: analyticsLoading } = useCustomerAnalytics();
  const { data: invoices } = useInvoices();
  const { data: paymentHistory } = usePaymentHistory();
  
  // Auto-update customer risk levels based on invoice performance
  useCustomerRiskUpdater();

  // Get payments data with proper relationships for payment behavior
  const { data: paymentsData } = useQuery({
    queryKey: ['payments-with-invoices-for-behavior'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          invoices (
            id,
            amount,
            created_at,
            due_date,
            customer_id,
            customers (
              name
            )
          )
        `)
        .order('payment_date', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate real payment behavior data from actual payments and invoices
  const paymentBehaviorData = React.useMemo(() => {
    if (!paymentsData || !invoices) return [];
    
    const behaviorCounts = {
      '0-15 days': 0,
      '16-30 days': 0,
      '31-45 days': 0,
      '46+ days': 0
    };
    
    // Calculate actual payment delays from real payments
    paymentsData.forEach(payment => {
      if (payment.invoices) {
        const invoiceDate = new Date(payment.invoices.created_at);
        const paymentDate = new Date(payment.payment_date);
        const daysToPayment = Math.floor((paymentDate.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysToPayment <= 15) {
          behaviorCounts['0-15 days']++;
        } else if (daysToPayment <= 30) {
          behaviorCounts['16-30 days']++;
        } else if (daysToPayment <= 45) {
          behaviorCounts['31-45 days']++;
        } else {
          behaviorCounts['46+ days']++;
        }
      }
    });
    
    // Also include current unpaid invoices based on their age
    const today = new Date();
    const unpaidInvoices = invoices?.filter(inv => inv.status !== 'paid') || [];
    
    unpaidInvoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      const daysFromCreation = Math.floor((today.getTime() - invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysFromCreation <= 15) {
        behaviorCounts['0-15 days']++;
      } else if (daysFromCreation <= 30) {
        behaviorCounts['16-30 days']++;
      } else if (daysFromCreation <= 45) {
        behaviorCounts['31-45 days']++;
      } else {
        behaviorCounts['46+ days']++;
      }
    });
    
    return Object.entries(behaviorCounts).map(([range, customers]) => ({
      range,
      customers
    }));
  }, [paymentsData, invoices]);

  if (isLoading || analyticsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
            <p className="text-gray-600">Analyze customer payment behavior and manage relationships</p>
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

  const filteredCustomers = customers?.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'low': return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      case 'high': return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
      default: return <Badge variant="outline">{risk}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Management</h1>
          <p className="text-gray-600">Analyze customer payment behavior and manage relationships</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="directory">Customer Directory</TabsTrigger>
          <TabsTrigger value="analytics">Payment Analytics</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalCustomers || 0}</div>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Active customers
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Active Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.activeCustomers || 0}</div>
                <p className="text-sm text-gray-500">
                  {analytics?.totalCustomers ? Math.round((analytics.activeCustomers / analytics.totalCustomers) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">High Risk Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{analytics?.highRiskCustomers || 0}</div>
                <p className="text-sm text-red-600 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Requires attention
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Avg Payment Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.avgPaymentDays || 32}</div>
                <p className="text-sm text-green-600 flex items-center">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  Industry average: 45
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={analytics?.segmentData || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(analytics?.segmentData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}`, 'Customers']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {(analytics?.segmentData || []).map((segment, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                      <span className="text-sm">{segment.name} ({segment.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Behavior Distribution</CardTitle>
                <p className="text-sm text-gray-600">
                  Based on real payment data ({paymentBehaviorData.reduce((sum, item) => sum + item.customers, 0)} total)
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={paymentBehaviorData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="customers" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="directory" className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-4 flex-1">
              <div className="flex-1">
                <Input 
                  placeholder="Search customers by name or email..." 
                  className="w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="flex items-center space-x-2">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </Button>
            </div>
            <Dialog open={isNewCustomerOpen} onOpenChange={setIsNewCustomerOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2 ml-4">
                  <Plus className="w-4 h-4" />
                  <span>Add Customer</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Customer</DialogTitle>
                  <DialogDescription>
                    Fill in the customer details to add them to your database.
                  </DialogDescription>
                </DialogHeader>
                <CustomerForm onSuccess={() => setIsNewCustomerOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-4 font-medium">Customer</th>
                      <th className="text-left py-3 px-4 font-medium">Industry</th>
                      <th className="text-left py-3 px-4 font-medium">Location</th>
                      <th className="text-left py-3 px-4 font-medium">Risk Level</th>
                      <th className="text-left py-3 px-4 font-medium">Created</th>
                      <th className="text-left py-3 px-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer) => (
                      <tr key={customer.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{customer.industry || 'N/A'}</td>
                        <td className="py-3 px-4">{customer.location || 'N/A'}</td>
                        <td className="py-3 px-4">{getRiskBadge(customer.risk_level || 'medium')}</td>
                        <td className="py-3 px-4">
                          {new Date(customer.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="outline" size="sm">View Details</Button>
                        </td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          No customers found matching your search criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Average Payment Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.avgPaymentDays || 32} days</div>
                <p className="text-sm text-gray-500">Industry average: 45 days</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Collection Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{analytics?.collectionRate || 94.2}%</div>
                <p className="text-sm text-gray-500">+2.1% vs last quarter</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-gray-600">Customer Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{analytics?.retentionRate || 87}%</div>
                <p className="text-sm text-gray-500">12 month retention rate</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Payment Behavior Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics?.paymentTrendsData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="earlyPayments" stroke="#10B981" strokeWidth={2} name="Early Payments" />
                  <Line type="monotone" dataKey="onTimePayments" stroke="#3B82F6" strokeWidth={2} name="On-Time Payments" />
                  <Line type="monotone" dataKey="latePayments" stroke="#EF4444" strokeWidth={2} name="Late Payments" />
                  <Line type="monotone" dataKey="avgDays" stroke="#8B5CF6" strokeWidth={2} name="Avg Payment Days" strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <CustomerRiskAssessment />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CustomerDashboard;

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, RefreshCw, Clock, TrendingUp, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client-local';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date: string;
  predicted_payment_date: string | null;
  status: string;
  risk_level: string;
  days_late: number;
  customers?: {
    name: string;
    customer_number: string;
    credit_score: number;
    location: string;
    industry: string;
    segment: string;
  };
}

interface InvoiceTableProps {
  invoices: Invoice[];
}

const InvoiceTable = ({ invoices }: InvoiceTableProps) => {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());
  const [markingPaidIds, setMarkingPaidIds] = useState<Set<string>>(new Set());
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Function to determine actual status based on due date
  const getActualStatus = (invoice: Invoice) => {
    if (invoice.status === 'paid' || invoice.status === 'cancelled') {
      return invoice.status;
    }
    
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    const isOverdue = today > dueDate;
    
    if (isOverdue && invoice.status !== 'paid') {
      return 'overdue';
    }
    
    return invoice.status || 'draft';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'sent': return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'overdue': return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
      case 'cancelled': return <Badge className="bg-gray-100 text-gray-800">Cancelled</Badge>;
      case 'draft': return <Badge variant="outline">Draft</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'high': return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
      case 'medium': return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
      case 'low': return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
      default: return <Badge variant="outline">{risk}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPredictionStatus = (dueDate: string, predictedDate: string | null) => {
    if (!predictedDate) return null;
    
    const due = new Date(dueDate);
    const predicted = new Date(predictedDate);
    const diffDays = Math.ceil((predicted.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      // Payment is predicted to be early
      return <span className="text-green-600 text-sm">{Math.abs(diffDays)}d early</span>;
    } else if (diffDays === 0) {
      return <span className="text-green-600 text-sm">On time</span>;
    } else if (diffDays <= 5) {
      return <span className="text-yellow-600 text-sm">{diffDays}d delay</span>;
    } else {
      return <span className="text-red-600 text-sm">{diffDays}d delay</span>;
    }
  };

  const handleMarkAsPaid = async (invoice: Invoice) => {
    setMarkingPaidIds(prev => new Set(prev).add(invoice.id));
    
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (error) {
        throw error;
      }

      // Also create a payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          invoice_id: invoice.id,
          amount: invoice.amount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'Manual Update',
          notes: 'Marked as paid manually'
        });

      if (paymentError) {
        console.warn('Payment record creation failed:', paymentError);
      }

      toast.success(`Invoice ${invoice.invoice_number} marked as paid`);
      
      // Refresh all related queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['calculated-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['forecast-data'] });
      
    } catch (error) {
      console.error('Failed to mark invoice as paid:', error);
      toast.error('Failed to mark invoice as paid');
    } finally {
      setMarkingPaidIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  const handleCancelInvoice = async (invoice: Invoice) => {
    setCancellingIds(prev => new Set(prev).add(invoice.id));
    
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoice.id);

      if (error) {
        throw error;
      }

      toast.success(`Invoice ${invoice.invoice_number} cancelled`);
      
      // Refresh all related queries
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['calculated-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['forecast-data'] });
      
    } catch (error) {
      console.error('Failed to cancel invoice:', error);
      toast.error('Failed to cancel invoice');
    } finally {
      setCancellingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  const handleRefreshPrediction = async (invoice: Invoice) => {
    setRefreshingIds(prev => new Set(prev).add(invoice.id));
    
    try {
      const response = await fetch('http://localhost:5173/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: invoice.amount,
          paymentDueDays: 30,
          customerName: `Company_${invoice.customers?.customer_number || '1'}`,
          customerCreditScore: invoice.customers?.credit_score || 700,
          customerSegment: invoice.customers?.segment || 'Average',
          customerLocation: invoice.customers?.location || 'Mumbai',
          customerIndustry: invoice.customers?.industry || 'IT',
          contractType: 'Standard',
          paymentMethod: 'Bank Transfer',
          hasEarlyDiscount: false,
          marketCondition: 1.0,
          paymentUrgency: 0.5,
          invoiceId: invoice.id,
          customerId: invoice.customers?.customer_number || 'unknown'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const predictedDate = new Date();
        predictedDate.setDate(predictedDate.getDate() + data.prediction.predictedDaysToPayment);
        
        const { error } = await supabase
          .from('invoices')
          .update({
            predicted_payment_date: predictedDate.toISOString().split('T')[0],
            risk_level: data.prediction.riskLevel
          })
          .eq('id', invoice.id);
        
        if (error) {
          throw error;
        }
        
        toast.success('Prediction updated successfully');
        queryClient.invalidateQueries({ queryKey: ['invoices'] });
      }
    } catch (error) {
      console.error('Failed to refresh prediction:', error);
      toast.error('Failed to refresh prediction');
    } finally {
      setRefreshingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(invoice.id);
        return newSet;
      });
    }
  };

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input type="checkbox" className="rounded border-gray-300" />
              </TableHead>
              <TableHead>Customer / Invoice</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Predicted Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Risk Level</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const daysUntilDue = getDaysUntilDue(invoice.due_date);
              const isOverdue = daysUntilDue < 0;
              const actualStatus = getActualStatus(invoice);
              
              return (
                <TableRow key={invoice.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" className="rounded border-gray-300" />
                      {isOverdue && actualStatus !== 'paid' && actualStatus !== 'cancelled' && (
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-blue-600">
                        {invoice.customers?.name || 'Unknown Customer'}
                      </div>
                      <div className="text-sm text-gray-500">
                        ● {invoice.invoice_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    ${Number(invoice.amount).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className={`font-medium ${isOverdue && actualStatus !== 'paid' && actualStatus !== 'cancelled' ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(invoice.due_date)}
                      </span>
                      {isOverdue && actualStatus !== 'paid' && actualStatus !== 'cancelled' ? (
                        <span className="text-red-600 text-sm flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {Math.abs(daysUntilDue)} days overdue
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">
                          {daysUntilDue > 0 ? `${daysUntilDue} days remaining` : 'Due today'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      {invoice.predicted_payment_date ? (
                        <>
                          <span className="font-medium text-purple-600 flex items-center">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            {formatDate(invoice.predicted_payment_date)}
                          </span>
                          {getPredictionStatus(invoice.due_date, invoice.predicted_payment_date)}
                        </>
                      ) : (
                        <span className="text-gray-400 text-sm">No prediction</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(actualStatus)}
                  </TableCell>
                  <TableCell>
                    {getRiskBadge(invoice.risk_level || 'medium')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewDetails(invoice)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRefreshPrediction(invoice)}
                        disabled={refreshingIds.has(invoice.id)}
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshingIds.has(invoice.id) ? 'animate-spin' : ''}`} />
                      </Button>
                      {actualStatus !== 'paid' && actualStatus !== 'cancelled' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarkAsPaid(invoice)}
                          disabled={markingPaidIds.has(invoice.id)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle className={`w-4 h-4 ${markingPaidIds.has(invoice.id) ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                      {actualStatus !== 'cancelled' && actualStatus !== 'paid' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleCancelInvoice(invoice)}
                          disabled={cancellingIds.has(invoice.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className={`w-4 h-4 ${cancellingIds.has(invoice.id) ? 'animate-spin' : ''}`} />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {invoices.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No invoices found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Invoice Details Dialog */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Detailed information about invoice {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer</label>
                  <p className="text-sm font-medium">{selectedInvoice.customers?.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-sm font-medium">${Number(selectedInvoice.amount).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Due Date</label>
                  <p className="text-sm">{formatDate(selectedInvoice.due_date)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(getActualStatus(selectedInvoice))}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Risk Level</label>
                  <div className="mt-1">{getRiskBadge(selectedInvoice.risk_level)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Predicted Payment</label>
                  <p className="text-sm">
                    {selectedInvoice.predicted_payment_date 
                      ? formatDate(selectedInvoice.predicted_payment_date)
                      : 'No prediction available'
                    }
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Customer Details</label>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <p><span className="font-medium">Credit Score:</span> {selectedInvoice.customers?.credit_score}</p>
                  <p><span className="font-medium">Location:</span> {selectedInvoice.customers?.location}</p>
                  <p><span className="font-medium">Industry:</span> {selectedInvoice.customers?.industry}</p>
                  <p><span className="font-medium">Segment:</span> {selectedInvoice.customers?.segment}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InvoiceTable;

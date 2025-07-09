
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, MessageSquare, Calendar } from 'lucide-react';

interface Invoice {
  id: string;
  customerName: string;
  customerNumber: string;
  amount: string;
  daysLate: number;
  dueDate: string;
  status: 'overdue' | 'current' | 'upcoming';
  prediction: string;
  riskLevel: 'low' | 'medium' | 'high';
}

const InvoiceRow = ({ invoice }: { invoice: Invoice }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'current': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-4">
        <div className="flex items-center space-x-2">
          <input type="checkbox" className="rounded border-gray-300" />
          {invoice.status === 'overdue' && (
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        <div>
          <div className="font-medium text-blue-600">{invoice.customerName}</div>
          <div className="text-sm text-gray-500">● {invoice.customerNumber}</div>
        </div>
      </td>
      <td className="px-4 py-4 font-medium">{invoice.amount}</td>
      <td className="px-4 py-4">
        {invoice.daysLate > 0 && (
          <span className="text-red-600 font-medium">{invoice.daysLate} days late</span>
        )}
      </td>
      <td className="px-4 py-4 text-sm text-gray-600">{invoice.dueDate}</td>
      <td className="px-4 py-4">
        <Badge className={getStatusColor(invoice.status)}>
          {invoice.status}
        </Badge>
      </td>
      <td className="px-4 py-4">
        <Badge className={getRiskColor(invoice.riskLevel)}>
          {invoice.riskLevel} risk
        </Badge>
      </td>
      <td className="px-4 py-4">{invoice.prediction}</td>
      <td className="px-4 py-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MessageSquare className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </td>
    </tr>
  );
};

const InvoiceList = () => {
  const invoices: Invoice[] = [
    {
      id: '767',
      customerName: 'Phillips',
      customerNumber: '870',
      amount: '$190.83',
      daysLate: 236,
      dueDate: 'Oct 7, 2024',
      status: 'overdue',
      prediction: 'Sep 24, 2024',
      riskLevel: 'high'
    },
    {
      id: '25',
      customerName: 'Western Union Co',
      customerNumber: '25',
      amount: '$1,908.27',
      daysLate: 223,
      dueDate: 'Oct 7, 2024',
      status: 'overdue',
      prediction: 'Sep 26, 2024',
      riskLevel: 'high'
    },
    {
      id: '199',
      customerName: 'Noble Energy',
      customerNumber: '199',
      amount: '$892.45',
      daysLate: 0,
      dueDate: 'Oct 7, 2024',
      status: 'current',
      prediction: 'Oct 10, 2024',
      riskLevel: 'medium'
    },
    {
      id: '527',
      customerName: 'Delta',
      customerNumber: '527',
      amount: '$1,245.67',
      daysLate: 0,
      dueDate: 'Oct 15, 2024',
      status: 'upcoming',
      prediction: 'Oct 12, 2024',
      riskLevel: 'low'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Invoice Management</h2>
        <p className="text-sm text-gray-600 mt-1">Track payment status and predictions</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer Name / Invoice Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Days Late
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Level
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prediction
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoiceList;

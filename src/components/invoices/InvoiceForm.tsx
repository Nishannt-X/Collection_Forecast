
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { useCustomers } from '@/hooks/useCustomers';

interface InvoiceFormProps {
  onSuccess: () => void;
}

const InvoiceForm = ({ onSuccess }: InvoiceFormProps) => {
  const queryClient = useQueryClient();
  const { data: customers } = useCustomers();
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    try {
      const invoiceNumber = `INV-${Date.now()}`;
      const amount = parseFloat(formData.get('amount') as string);
      const paymentDueDays = parseInt(formData.get('paymentDueDays') as string) || 30;
      const hasEarlyDiscount = formData.get('hasEarlyDiscount') === 'on';
      
      // Calculate due date
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + paymentDueDays);
      
      // Get current market condition (simplified - in real app this would come from external data)
      const currentMonth = new Date().getMonth() + 1;
      const marketCondition = 1 + 0.2 * Math.sin(2 * Math.PI * currentMonth / 12);
      
      // Get payment urgency (simplified - in real app this would be calculated based on various factors)
      const paymentUrgency = Math.random() * 0.5 + 0.25; // Random between 0.25-0.75
      
      const { error } = await supabase
        .from('invoices')
        .insert([
          {
            invoice_number: invoiceNumber,
            customer_id: formData.get('customerId') as string,
            amount: amount,
            due_date: dueDate.toISOString().split('T')[0],
            status: (formData.get('status') as string) || 'draft',
            description: formData.get('description') as string,
            contract_type: formData.get('contractType') as string,
            payment_method: formData.get('paymentMethod') as string,
            currency: (formData.get('currency') as string) || 'INR',
            payment_due_days: paymentDueDays,
            has_early_discount: hasEarlyDiscount,
            market_condition: marketCondition,
            payment_urgency: paymentUrgency
          }
        ]);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      onSuccess();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  const handleCustomerChange = (value: string) => {
    setSelectedCustomer(value);
    // Auto-fill contract type based on selected customer
    const customer = customers?.find(c => c.id === value);
    if (customer) {
      const contractTypeField = document.querySelector('[name="contractType"]') as HTMLSelectElement;
      if (contractTypeField && customer.contract_type) {
        contractTypeField.value = customer.contract_type;
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customerId">Customer *</Label>
          <Select name="customerId" required onValueChange={handleCustomerChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers?.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.name} ({customer.customer_number})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Invoice Amount *</Label>
          <Input 
            id="amount" 
            name="amount" 
            type="number" 
            step="0.01" 
            min="0"
            placeholder="Enter amount" 
            required 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="paymentDueDays">Payment Due Days *</Label>
          <Select name="paymentDueDays" defaultValue="30">
            <SelectTrigger>
              <SelectValue placeholder="Select payment terms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 days</SelectItem>
              <SelectItem value="30">30 days</SelectItem>
              <SelectItem value="45">45 days</SelectItem>
              <SelectItem value="60">60 days</SelectItem>
              <SelectItem value="90">90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Payment Method *</Label>
          <Select name="paymentMethod" defaultValue="Bank Transfer">
            <SelectTrigger>
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Credit Card">Credit Card</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select name="currency" defaultValue="INR">
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR (₹)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractType">Contract Type</Label>
          <Select name="contractType">
            <SelectTrigger>
              <SelectValue placeholder="Select contract type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="time-based">Time-based</SelectItem>
              <SelectItem value="milestone">Milestone</SelectItem>
              <SelectItem value="mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue="draft">
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 flex items-center space-x-2 pt-8">
          <Checkbox id="hasEarlyDiscount" name="hasEarlyDiscount" />
          <Label htmlFor="hasEarlyDiscount">Offer Early Payment Discount</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          name="description" 
          placeholder="Enter invoice description..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit">Create Invoice</Button>
      </div>
    </form>
  );
};

export default InvoiceForm;

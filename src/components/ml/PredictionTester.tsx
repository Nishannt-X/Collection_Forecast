
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMLPrediction } from '@/hooks/useMLPrediction';
import { Brain, TrendingUp, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client-local';

const PredictionTester = () => {
  const { predictPayment, isLoading, error, isMLModelLoaded } = useMLPrediction();
  const [prediction, setPrediction] = useState<any>(null);
  const [formData, setFormData] = useState({
    customerName: 'Company_1',
    amount: '100000',
    paymentDueDays: '30',
    contractType: 'Time-based',
    paymentMethod: 'Bank Transfer',
    hasEarlyDiscount: false,
    marketCondition: '1.0',
    paymentUrgency: '0.5',
    customerCreditScore: '700',
    customerSegment: 'Average',
    customerLocation: 'Mumbai',
    customerIndustry: 'IT'
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePredict = async () => {
    try {
      // Create a test customer and invoice in the database for real ML prediction
      const testCustomer = {
        name: formData.customerName,
        customer_number: formData.customerName.replace('Company_', ''),
        credit_score: parseInt(formData.customerCreditScore),
        location: formData.customerLocation,
        industry: formData.customerIndustry,
        contract_type: formData.contractType,
        segment: formData.customerSegment,
        email: `${formData.customerName.toLowerCase()}@example.com`
      };

      // Check if customer exists, if not create one
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('name', formData.customerName)
        .single();

      let customerId = existingCustomer?.id;

      if (!customerId) {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert([testCustomer])
          .select('id')
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.id;
      }

      // Create a test invoice
      const testInvoice = {
        customer_id: customerId,
        invoice_number: `TEST-${Date.now()}`,
        amount: parseFloat(formData.amount),
        due_date: new Date(Date.now() + parseInt(formData.paymentDueDays) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_due_days: parseInt(formData.paymentDueDays),
        contract_type: formData.contractType,
        payment_method: formData.paymentMethod,
        has_early_discount: formData.hasEarlyDiscount,
        market_condition: parseFloat(formData.marketCondition),
        payment_urgency: parseFloat(formData.paymentUrgency),
        status: 'sent',
        description: 'Test invoice for ML prediction'
      };

      const { data: newInvoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([testInvoice])
        .select('id')
        .single();

      if (invoiceError) throw invoiceError;

      // Now make the real ML prediction with database IDs
      const result = await predictPayment({
        invoiceId: newInvoice.id,
        customerId: customerId,
        amount: parseFloat(formData.amount),
        paymentDueDays: parseInt(formData.paymentDueDays),
        contractType: formData.contractType,
        paymentMethod: formData.paymentMethod,
        hasEarlyDiscount: formData.hasEarlyDiscount,
        marketCondition: parseFloat(formData.marketCondition),
        paymentUrgency: parseFloat(formData.paymentUrgency),
        customerCreditScore: parseInt(formData.customerCreditScore),
        customerSegment: formData.customerSegment,
        customerLocation: formData.customerLocation,
        customerIndustry: formData.customerIndustry
      });

      setPrediction(result);

      // Clean up test data
      await supabase.from('invoices').delete().eq('id', newInvoice.id);

    } catch (error) {
      console.error('Prediction error:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-yellow-600 bg-yellow-100';
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    } else {
      return `$${value.toLocaleString()}`;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Payment Prediction Tester</span>
            {isMLModelLoaded && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Real ML Model
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Select
                value={formData.customerName}
                onValueChange={(value) => handleInputChange('customerName', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 200 }, (_, i) => (
                    <SelectItem key={i + 1} value={`Company_${i + 1}`}>
                      Company_{i + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Invoice Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentDueDays">Payment Due Days</Label>
              <Select
                value={formData.paymentDueDays}
                onValueChange={(value) => handleInputChange('paymentDueDays', value)}
              >
                <SelectTrigger>
                  <SelectValue />
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

            <div>
              <Label htmlFor="creditScore">Credit Score</Label>
              <Input
                id="creditScore"
                type="number"
                min="300"
                max="850"
                value={formData.customerCreditScore}
                onChange={(e) => handleInputChange('customerCreditScore', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="industry">Industry</Label>
              <Select
                value={formData.customerIndustry}
                onValueChange={(value) => handleInputChange('customerIndustry', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                value={formData.customerLocation}
                onValueChange={(value) => handleInputChange('customerLocation', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mumbai">Mumbai</SelectItem>
                  <SelectItem value="Delhi">Delhi</SelectItem>
                  <SelectItem value="Bangalore">Bangalore</SelectItem>
                  <SelectItem value="Chennai">Chennai</SelectItem>
                  <SelectItem value="Hyderabad">Hyderabad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => handleInputChange('paymentMethod', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Credit Card">Credit Card</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="segment">Customer Segment</Label>
              <Select
                value={formData.customerSegment}
                onValueChange={(value) => handleInputChange('customerSegment', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reliable">Reliable</SelectItem>
                  <SelectItem value="Average">Average</SelectItem>
                  <SelectItem value="At-risk">At-risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="contractType">Contract Type</Label>
            <Select
              value={formData.contractType}
              onValueChange={(value) => handleInputChange('contractType', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Time-based">Time-based</SelectItem>
                <SelectItem value="Milestone">Milestone</SelectItem>
                <SelectItem value="Fixed">Fixed</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handlePredict}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Predicting...' : 'Generate Prediction'}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {prediction && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Prediction Results</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="w-6 h-6 text-blue-600 mr-2" />
                  <span className="text-2xl font-bold text-blue-600">
                    {prediction.predictedDaysToPayment} days
                  </span>
                </div>
                <p className="text-sm text-gray-600">Predicted Payment Time</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-semibold text-gray-800">
                    {Math.round(prediction.confidenceScore * 100)}%
                  </div>
                  <p className="text-xs text-gray-600">Confidence</p>
                </div>

                <div className="text-center p-3 rounded-lg">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(prediction.riskLevel)}`}>
                    {prediction.riskLevel.toUpperCase()} RISK
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">Analysis</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    • Payment expected {prediction.predictedDaysToPayment > parseInt(formData.paymentDueDays) ? 
                      `${prediction.predictedDaysToPayment - parseInt(formData.paymentDueDays)} days late` : 
                      `${parseInt(formData.paymentDueDays) - prediction.predictedDaysToPayment} days early`}
                  </p>
                  <p>• Customer: {formData.customerName}</p>
                  <p>• Industry: {formData.customerIndustry} in {formData.customerLocation}</p>
                  <p>• Payment Method: {formData.paymentMethod}</p>
                  <p>• Amount: {formatCurrency(parseFloat(formData.amount))}</p>
                  <p>• Contract Type: {formData.contractType}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PredictionTester;

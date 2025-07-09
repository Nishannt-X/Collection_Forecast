import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFlaskMLPrediction } from '@/hooks/useFlaskMLPrediction';
import { Brain, TrendingUp, Clock, AlertTriangle, Server } from 'lucide-react';

const FlaskPredictionTester = () => {
  const { predictPayment, isLoading, error, isModelLoaded } = useFlaskMLPrediction();
  const [prediction, setPrediction] = useState<any>(null);
  const [formData, setFormData] = useState({
    customerName: 'Company_1',
    amount: '100000',
    paymentDueDays: '30',
    contractType: 'time-based',
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
      const result = await predictPayment({
        invoiceId: `test-${Date.now()}`,
        customerId: `customer-${Date.now()}`,
        customerName: formData.customerName,
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>Flask ML Prediction Tester</span>
            {isModelLoaded ? (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center">
                <Server className="w-3 h-3 mr-1" />
                Flask Model Active
              </span>
            ) : (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                Model Not Loaded
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isModelLoaded && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Flask backend model not loaded. Please use the Flask Model Loader first.
              </AlertDescription>
            </Alert>
          )}

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
              <Label htmlFor="amount">Invoice Amount (₹)</Label>
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

          <Button
            onClick={handlePredict}
            disabled={isLoading || !isModelLoaded}
            className="w-full"
          >
            {isLoading ? 'Getting Prediction from Flask...' : 'Generate Real ML Prediction'}
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
              <span>Real ML Prediction Results</span>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Your Trained Model
              </span>
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
                <p className="text-sm text-gray-600">Predicted by Your ML Model</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-semibold text-gray-800">
                    {Math.round(prediction.confidenceScore * 100)}%
                  </div>
                  <p className="text-xs text-gray-600">Model Confidence</p>
                </div>

                <div className="text-center p-3 rounded-lg">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getRiskColor(prediction.riskLevel)}`}>
                    {prediction.riskLevel.toUpperCase()} RISK
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-800 mb-2">ML Analysis</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    • Payment expected {prediction.predictedDaysToPayment > parseInt(formData.paymentDueDays) ? 
                      `${(prediction.predictedDaysToPayment - parseInt(formData.paymentDueDays)).toFixed(1)} days late` : 
                      `${(parseInt(formData.paymentDueDays) - prediction.predictedDaysToPayment).toFixed(1)} days early`}
                  </p>
                  <p>• Customer: {formData.customerName}</p>
                  <p>• Processed by your trained ML model</p>
                  <p>• Real feature engineering applied</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FlaskPredictionTester;


import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Clock, TrendingUp } from 'lucide-react';

interface MLPredictionCardProps {
  prediction: {
    predicted_days_to_payment: number;
    confidence_score: number;
    model_version: string;
    prediction_date: string;
    invoices?: {
      invoice_number: string;
      amount: number;
      due_date: string;
      customers?: {
        name: string;
        customer_number: string;
      };
    };
  };
}

const MLPredictionCard = ({ prediction }: MLPredictionCardProps) => {
  const confidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800';
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center">
          <Brain className="w-4 h-4 mr-2 text-blue-600" />
          ML Prediction
        </CardTitle>
        <Badge variant="outline" className={confidenceColor(prediction.confidence_score)}>
          {Math.round(prediction.confidence_score * 100)}% confidence
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center text-2xl font-bold text-gray-900">
              <Clock className="w-5 h-5 mr-1 text-orange-500" />
              {prediction.predicted_days_to_payment || 'Waiting for ML'} days
            </div>
            <p className="text-xs text-gray-500">Predicted payment time</p>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900">
              {prediction.invoices?.customers?.name || 'Unknown Customer'}
            </div>
            <p className="text-xs text-gray-500">
              {prediction.invoices?.invoice_number} • ₹{prediction.invoices?.amount?.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Model: {prediction.model_version}</span>
            <span>Predicted: {formatDate(prediction.prediction_date)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MLPredictionCard;

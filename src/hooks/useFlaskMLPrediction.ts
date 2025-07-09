
import { useState } from 'react';

const FLASK_API_URL = 'http://localhost:5000';

interface MLPredictionInput {
  invoiceId: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentDueDays: number;
  contractType: string;
  paymentMethod: string;
  hasEarlyDiscount: boolean;
  marketCondition: number;
  paymentUrgency: number;
  customerCreditScore: number;
  customerSegment: string;
  customerLocation: string;
  customerIndustry: string;
}

interface MLPredictionResult {
  predictedDaysToPayment: number;
  confidenceScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface CustomerRisk {
  customerName: string;
  riskLevel: 'low' | 'medium' | 'high';
  riskScore: number;
  averageDelayDays: number;
  paymentReliability: number;
}

export const useFlaskMLPrediction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  const checkHealth = async () => {
    try {
      const response = await fetch(`${FLASK_API_URL}/health`);
      const data = await response.json();
      setIsModelLoaded(data.model_loaded);
      return data;
    } catch (err) {
      setError('Flask backend not available. Make sure it is running on port 5000.');
      return null;
    }
  };

  const loadMLModel = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${FLASK_API_URL}/load-model`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsModelLoaded(true);
        console.log('Flask ML Model loaded successfully:', data.model_info);
      } else {
        setError(data.message);
      }
      
      return data;
    } catch (err) {
      const errorMessage = 'Failed to load model from Flask backend. Ensure the backend is running and model files are present.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const predictPayment = async (input: MLPredictionInput): Promise<MLPredictionResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${FLASK_API_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });

      const data = await response.json();

      if (data.success) {
        setIsLoading(false);
        return data.prediction;
      } else {
        setError(data.message);
        setIsLoading(false);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get prediction from Flask backend';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  const getCustomerRisk = async (customerName: string): Promise<CustomerRisk | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${FLASK_API_URL}/customer-risk/${customerName}`);
      const data = await response.json();

      if (data.success) {
        setIsLoading(false);
        return data;
      } else {
        setError(data.message);
        setIsLoading(false);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get customer risk from Flask backend';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  const generateForecast = async (invoices: MLPredictionInput[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${FLASK_API_URL}/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoices }),
      });

      const data = await response.json();

      if (data.success) {
        setIsLoading(false);
        return data.forecast;
      } else {
        setError(data.message);
        setIsLoading(false);
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate forecast from Flask backend';
      setError(errorMessage);
      setIsLoading(false);
      return null;
    }
  };

  return {
    checkHealth,
    loadMLModel,
    predictPayment,
    getCustomerRisk,
    generateForecast,
    isLoading,
    error,
    isModelLoaded
  };
};

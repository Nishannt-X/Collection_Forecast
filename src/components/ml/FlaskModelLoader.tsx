
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Brain, Server, Play } from 'lucide-react';
import { useFlaskMLPrediction } from '@/hooks/useFlaskMLPrediction';

const FlaskModelLoader = () => {
  const { checkHealth, loadMLModel, isLoading, error, isModelLoaded } = useFlaskMLPrediction();
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // Check backend health on component mount
    const checkBackendHealth = async () => {
      const health = await checkHealth();
      if (health) {
        setBackendStatus('online');
      } else {
        setBackendStatus('offline');
      }
    };

    checkBackendHealth();
  }, []);

  const handleLoadModel = async () => {
    const result = await loadMLModel();
    if (result?.success) {
      console.log('Model loaded successfully!');
    }
  };

  const getStatusColor = () => {
    if (backendStatus === 'offline') return 'text-red-600 bg-red-50 border-red-200';
    if (backendStatus === 'online' && !isModelLoaded) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (backendStatus === 'online' && isModelLoaded) return 'text-green-600 bg-green-50 border-green-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusText = () => {
    if (backendStatus === 'checking') return 'Checking Flask backend...';
    if (backendStatus === 'offline') return 'Flask backend offline';
    if (backendStatus === 'online' && !isModelLoaded) return 'Backend online - Model not loaded';
    if (backendStatus === 'online' && isModelLoaded) return 'Backend online - Model loaded';
    return 'Unknown status';
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5" />
          <span>Flask ML Model Loader</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Backend Status */}
        <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
          <div className="flex items-center space-x-2">
            <Server className="w-4 h-4" />
            <span className="font-medium">{getStatusText()}</span>
          </div>
          {backendStatus === 'online' && (
            <p className="text-xs mt-1">Flask server running on localhost:5000</p>
          )}
        </div>

        {/* Load Model Section */}
        {backendStatus === 'online' && !isModelLoaded && (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <p className="font-medium mb-2">Required files in backend/ directory:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>payment_prediction_model.pkl</li>
                <li>payment_prediction_model.h5</li>
              </ul>
            </div>
            
            <Button
              onClick={handleLoadModel}
              disabled={isLoading}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              {isLoading ? 'Loading Model...' : 'Load ML Model'}
            </Button>
          </div>
        )}

        {/* Success State */}
        {isModelLoaded && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your actual ML model is loaded and ready for predictions!
            </AlertDescription>
          </Alert>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1 border-t pt-3">
          <p className="font-medium">Setup Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Copy your .pkl and .h5 files to backend/ directory</li>
            <li>Run: cd backend && pip install -r requirements.txt</li>
            <li>Run: python app.py</li>
            <li>Click "Load ML Model" above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlaskModelLoader;

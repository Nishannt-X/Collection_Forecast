
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain } from 'lucide-react';
import FlaskModelLoader from './FlaskModelLoader';

const ModelLoader = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>ML Model Management</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="flask" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="flask">Flask Backend (Recommended)</TabsTrigger>
              <TabsTrigger value="browser">Browser Upload (Mock)</TabsTrigger>
            </TabsList>
            
            <TabsContent value="flask" className="mt-6">
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-medium text-green-800 mb-2">✅ Use Your Actual ML Model</h3>
                  <p className="text-sm text-green-700">
                    This option uses your actual trained pickle and h5 files through a Flask backend.
                    This is the recommended approach for real ML predictions.
                  </p>
                </div>
                <FlaskModelLoader />
              </div>
            </TabsContent>
            
            <TabsContent value="browser" className="mt-6">
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-800 mb-2">⚠️ Mock Predictions Only</h3>
                  <p className="text-sm text-yellow-700">
                    Browser upload only generates mock predictions since actual ML models cannot run in browsers.
                    Use Flask backend for real predictions.
                  </p>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <p>Use Flask Backend option above for real ML predictions</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModelLoader;

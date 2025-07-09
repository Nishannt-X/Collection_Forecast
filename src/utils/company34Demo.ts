
// Company_34 Demo Utilities for Payment Prediction Demonstration

const FLASK_API_URL = 'http://localhost:5000';

export interface Company34DemoState {
  setupComplete: boolean;
  historyImproved: boolean;
  beforePrediction?: number;
  afterPrediction?: number;
  historyRecords: number;
}

export class Company34Demo {
  private state: Company34DemoState = {
    setupComplete: false,
    historyImproved: false,
    historyRecords: 0
  };

  async setupDemo(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${FLASK_API_URL}/demo/company-34/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.state.setupComplete = true;
        this.state.historyRecords = data.historyRecords;
        console.log('Company_34 demo setup completed:', data);
      }
      
      return data;
    } catch (error) {
      console.error('Error setting up Company_34 demo:', error);
      return { success: false, message: 'Failed to setup demo' };
    }
  }

  async improveHistory(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${FLASK_API_URL}/demo/company-34/improve`, {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.state.historyImproved = true;
        this.state.historyRecords = data.historyRecords;
        console.log('Company_34 history improved:', data);
      }
      
      return data;
    } catch (error) {
      console.error('Error improving Company_34 history:', error);
      return { success: false, message: 'Failed to improve history' };
    }
  }

  async getBeforeAfterPredictions(): Promise<{
    beforePrediction: number;
    afterPrediction: number;
    improvement: number;
    testInvoice: any;
  } | null> {
    try {
      const testInvoice = {
        customerName: 'Company_34',
        amount: 75000,
        paymentDueDays: 30,
        customerCreditScore: 680,
        customerSegment: 'Average',
        customerIndustry: 'Manufacturing',
        customerLocation: 'Chennai',
        paymentMethod: 'Bank Transfer',
        marketCondition: 1.0,
        paymentUrgency: 0.5
      };

      // Get prediction with poor history
      await this.setupDemo();
      const beforeResponse = await fetch(`${FLASK_API_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testInvoice)
      });
      const beforeData = await beforeResponse.json();
      const beforePrediction = beforeData.success ? beforeData.prediction.predictedDaysToPayment : 0;

      // Improve history and get new prediction
      await this.improveHistory();
      const afterResponse = await fetch(`${FLASK_API_URL}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testInvoice)
      });
      const afterData = await afterResponse.json();
      const afterPrediction = afterData.success ? afterData.prediction.predictedDaysToPayment : 0;

      const improvement = beforePrediction - afterPrediction;

      this.state.beforePrediction = beforePrediction;
      this.state.afterPrediction = afterPrediction;

      return {
        beforePrediction,
        afterPrediction,
        improvement,
        testInvoice
      };
    } catch (error) {
      console.error('Error getting before/after predictions:', error);
      return null;
    }
  }

  async runFullDemo(): Promise<{
    success: boolean;
    results: {
      setupResult: any;
      beforePrediction: number;
      improveResult: any;
      afterPrediction: number;
      improvement: number;
      improvementPercentage: number;
    };
  }> {
    try {
      console.log('🎯 Starting Company_34 ML Learning Demonstration...');

      // Step 1: Setup with poor history
      console.log('📊 Step 1: Setting up poor payment history...');
      const setupResult = await this.setupDemo();
      if (!setupResult.success) {
        throw new Error('Failed to setup demo');
      }

      // Step 2: Get initial prediction
      console.log('🔮 Step 2: Getting initial prediction with poor history...');
      const testInvoice = {
        customerName: 'Company_34',
        amount: 75000,
        paymentDueDays: 30,
        customerCreditScore: 680,
        customerSegment: 'Average',
        customerIndustry: 'Manufacturing',  
        customerLocation: 'Chennai',
        paymentMethod: 'Bank Transfer',
        marketCondition: 1.0,
        paymentUrgency: 0.5
      };

      const beforeResponse = await fetch(`${FLASK_API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testInvoice)
      });
      const beforeData = await beforeResponse.json();
      const beforePrediction = beforeData.success ? beforeData.prediction.predictedDaysToPayment : 0;

      // Step 3: Improve payment history
      console.log('📈 Step 3: Improving payment history...');
      const improveResult = await this.improveHistory();
      if (!improveResult.success) {
        throw new Error('Failed to improve history');
      }

      // Step 4: Get improved prediction
      console.log('🔮 Step 4: Getting new prediction with improved history...');
      const afterResponse = await fetch(`${FLASK_API_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testInvoice)
      });
      const afterData = await afterResponse.json();
      const afterPrediction = afterData.success ? afterData.prediction.predictedDaysToPayment : 0;

      const improvement = beforePrediction - afterPrediction;
      const improvementPercentage = ((improvement / beforePrediction) * 100);

      console.log('✅ Demo Results:');
      console.log(`   📉 Before: ${beforePrediction} days`);
      console.log(`   📈 After: ${afterPrediction} days`);
      console.log(`   🎯 Improvement: ${improvement.toFixed(1)} days (${improvementPercentage.toFixed(1)}%)`);

      return {
        success: true,
        results: {
          setupResult,
          beforePrediction,
          improveResult,
          afterPrediction,
          improvement,
          improvementPercentage
        }
      };
    } catch (error) {
      console.error('Error running full demo:', error);
      return {
        success: false,
        results: {
          setupResult: { success: false },
          beforePrediction: 0,
          improveResult: { success: false },
          afterPrediction: 0,
          improvement: 0,
          improvementPercentage: 0
        }
      };
    }
  }

  getState(): Company34DemoState {
    return { ...this.state };
  }

  reset(): void {
    this.state = {
      setupComplete: false,
      historyImproved: false,
      historyRecords: 0
    };
  }
}

export const company34Demo = new Company34Demo();

// Helper function for department presentation
export const generatePresentationSummary = (results: any) => {
  return {
    title: "ML Model Learning Demonstration - Company_34",
    scenario: "Manufacturing company with initially poor payment behavior",
    testInvoice: {
      amount: "₹75,000",
      dueDays: "30 days",
      industry: "Manufacturing",
      location: "Chennai"
    },
    results: {
      beforeImprovement: `${results.beforePrediction} days (${results.beforePrediction > 30 ? 'DELAYED' : 'ON TIME'})`,
      afterImprovement: `${results.afterPrediction} days (${results.afterPrediction > 30 ? 'DELAYED' : 'ON TIME'})`,
      improvement: `${results.improvement.toFixed(1)} days faster (${results.improvementPercentage.toFixed(1)}% improvement)`,
      modelLearning: "Model successfully adapted to improved company payment patterns"
    },
    keyPoints: [
      "ML model learns from real company payment history",
      "Better payment behavior leads to improved predictions", 
      "Model becomes more accurate as more data is collected",
      "Risk assessment updates dynamically based on company performance"
    ]
  };
};


interface InvoiceData {
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
  invoiceDate: Date;
  dayOfMonth: number;
}

interface CompanyHistory {
  paymentEfficiency: number;
  daysToPayment: number;
  amount: number;
  paymentDate: Date;
}

export class FeatureEngineer {
  private companyHistories: Map<string, CompanyHistory[]> = new Map();

  constructor() {
    // Initialize with empty histories for Company_1 to Company_200
    for (let i = 1; i <= 200; i++) {
      this.companyHistories.set(`Company_${i}`, []);
    }
  }

  addCompanyHistory(companyName: string, history: CompanyHistory): void {
    if (!this.companyHistories.has(companyName)) {
      this.companyHistories.set(companyName, []);
    }
    this.companyHistories.get(companyName)!.push(history);
  }

  getCompanyHistory(companyName: string): CompanyHistory[] {
    return this.companyHistories.get(companyName) || [];
  }

  engineerFeatures(invoiceData: InvoiceData): {
    sequenceFeatures: number[];
    staticFeatures: number[];
    featureNames: {
      sequence: string[];
      static: string[];
    };
  } {
    const history = this.getCompanyHistory(invoiceData.customerName);
    
    // Calculate sequence features (company behavioral patterns)
    const sequenceFeatures = this.calculateSequenceFeatures(history);
    
    // Calculate static features (invoice and context specific)
    const staticFeatures = this.calculateStaticFeatures(invoiceData, history);

    return {
      sequenceFeatures,
      staticFeatures,
      featureNames: {
        sequence: [
          'CompanyEfficiency_3', 'CompanyEfficiency_7', 'CompanyEfficiency_All',
          'CompanyVelocity_Avg', 'CompanyConsistency', 'CompanyTrend',
          'PaymentFrequency', 'DaysSinceLastInvoice'
        ],
        static: [
          'LogInvoiceAmount', 'AmountSquareRoot', 'LogAmountPerDueDay',
          'CreditScoreNorm', 'CreditScoreSquared', 'CreditScoreCubed',
          'MonthSin', 'MonthCos', 'QuarterSin', 'QuarterCos',
          'DayOfWeekSin', 'DayOfWeekCos', 'DayOfMonthSin', 'DayOfMonthCos',
          'MarketCondition', 'PaymentUrgency', 'MarketTrend', 'MarketVolatility',
          'IndustrySeasonalEffect', 'LocationEconomicIndex',
          'CreditScore_Amount', 'CreditScore_Market', 'Amount_Market',
          'Efficiency_Consistency',
          'Industry_TargetEncoded', 'Location_TargetEncoded',
          'PaymentMethod_TargetEncoded', 'Segment_TargetEncoded'
        ]
      }
    };
  }

  private calculateSequenceFeatures(history: CompanyHistory[]): number[] {
    if (history.length === 0) {
      // Default values for new companies
      return [0.7, 0.7, 0.7, 1.0, 0.5, 0.0, 0.1, 30];
    }

    // Recent 3 invoices efficiency
    const recent3 = history.slice(-3);
    const efficiency3 = recent3.reduce((sum, h) => sum + h.paymentEfficiency, 0) / recent3.length;

    // Recent 7 invoices efficiency
    const recent7 = history.slice(-7);
    const efficiency7 = recent7.reduce((sum, h) => sum + h.paymentEfficiency, 0) / recent7.length;

    // All time efficiency
    const efficiencyAll = history.reduce((sum, h) => sum + h.paymentEfficiency, 0) / history.length;

    // Payment velocity (simplified)
    const avgVelocity = history.reduce((sum, h) => sum + (h.daysToPayment / Math.log(h.amount + 1)), 0) / history.length;

    // Consistency (inverse of standard deviation)
    const efficiencies = history.map(h => h.paymentEfficiency);
    const stdDev = this.calculateStandardDeviation(efficiencies);
    const consistency = 1 / (1 + stdDev);

    // Trend (slope of recent efficiency)
    const trend = this.calculateTrend(recent7.map(h => h.paymentEfficiency));

    // Payment frequency (invoices per month)
    const monthlyFreq = history.length > 1 ? this.calculatePaymentFrequency(history) : 0.1;

    // Days since last invoice
    const daysSinceLast = history.length > 0 ? 
      Math.min(365, (Date.now() - history[history.length - 1].paymentDate.getTime()) / (1000 * 60 * 60 * 24)) : 30;

    return [
      efficiency3,
      efficiency7, 
      efficiencyAll,
      avgVelocity,
      consistency,
      trend,
      monthlyFreq,
      daysSinceLast
    ];
  }

  private calculateStaticFeatures(invoiceData: InvoiceData, history: CompanyHistory[]): number[] {
    const date = invoiceData.invoiceDate;
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    const dayOfWeek = date.getDay();
    const dayOfMonth = invoiceData.dayOfMonth;

    // Amount features
    const logAmount = Math.log1p(invoiceData.amount);
    const amountSqrt = Math.sqrt(invoiceData.amount);
    const amountPerDueDay = invoiceData.amount / invoiceData.paymentDueDays;
    const logAmountPerDueDay = Math.log1p(amountPerDueDay);

    // Credit score features
    const creditNorm = (invoiceData.customerCreditScore - 650) / 100;
    const creditSquared = creditNorm * creditNorm;
    const creditCubed = creditNorm * creditNorm * creditNorm;

    // Seasonal features
    const monthSin = Math.sin(2 * Math.PI * month / 12);
    const monthCos = Math.cos(2 * Math.PI * month / 12);
    const quarterSin = Math.sin(2 * Math.PI * quarter / 4);
    const quarterCos = Math.cos(2 * Math.PI * quarter / 4);
    const dayOfWeekSin = Math.sin(2 * Math.PI * dayOfWeek / 7);
    const dayOfWeekCos = Math.cos(2 * Math.PI * dayOfWeek / 7);
    const dayOfMonthSin = Math.sin(2 * Math.PI * dayOfMonth / 30);
    const dayOfMonthCos = Math.cos(2 * Math.PI * dayOfMonth / 30);

    // Market features
    const marketTrend = invoiceData.marketCondition;
    const marketVolatility = 0.05; // Default volatility

    // Industry and location effects (simplified)
    const industryEffect = this.getIndustryEffect(invoiceData.customerIndustry);
    const locationEffect = this.getLocationEffect(invoiceData.customerLocation);

    // Interaction features
    const creditAmountInteraction = creditNorm * logAmount;
    const creditMarketInteraction = creditNorm * invoiceData.marketCondition;
    const amountMarketInteraction = logAmount * invoiceData.marketCondition;

    // Efficiency consistency interaction
    const avgEfficiency = history.length > 0 ? 
      history.reduce((sum, h) => sum + h.paymentEfficiency, 0) / history.length : 0.7;
    const efficiencies = history.map(h => h.paymentEfficiency);
    const consistency = history.length > 1 ? 
      1 / (1 + this.calculateStandardDeviation(efficiencies)) : 0.5;
    const efficiencyConsistency = avgEfficiency * consistency;

    // Target encoded features (simplified)
    const industryEncoded = this.getTargetEncoding(invoiceData.customerIndustry, 'industry');
    const locationEncoded = this.getTargetEncoding(invoiceData.customerLocation, 'location');
    const paymentMethodEncoded = this.getTargetEncoding(invoiceData.paymentMethod, 'paymentMethod');
    const segmentEncoded = this.getTargetEncoding(invoiceData.customerSegment, 'segment');

    return [
      logAmount, amountSqrt, logAmountPerDueDay,
      creditNorm, creditSquared, creditCubed,
      monthSin, monthCos, quarterSin, quarterCos,
      dayOfWeekSin, dayOfWeekCos, dayOfMonthSin, dayOfMonthCos,
      invoiceData.marketCondition, invoiceData.paymentUrgency,
      marketTrend, marketVolatility,
      industryEffect, locationEffect,
      creditAmountInteraction, creditMarketInteraction, amountMarketInteraction,
      efficiencyConsistency,
      industryEncoded, locationEncoded, paymentMethodEncoded, segmentEncoded
    ];
  }

  private calculateStandardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + (index * val), 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  private calculatePaymentFrequency(history: CompanyHistory[]): number {
    if (history.length < 2) return 0.1;
    
    const sortedHistory = history.sort((a, b) => a.paymentDate.getTime() - b.paymentDate.getTime());
    const daysDiff = (sortedHistory[sortedHistory.length - 1].paymentDate.getTime() - 
                     sortedHistory[0].paymentDate.getTime()) / (1000 * 60 * 60 * 24);
    
    return history.length / Math.max(daysDiff / 30, 1); // invoices per month
  }

  private getIndustryEffect(industry: string): number {
    const effects: { [key: string]: number } = {
      'IT': -0.2,
      'Finance': 0.1,
      'Healthcare': 0.0,
      'Retail': -0.1,
      'Manufacturing': 0.2
    };
    return effects[industry] || 0;
  }

  private getLocationEffect(location: string): number {
    const effects: { [key: string]: number } = {
      'Mumbai': -0.1,
      'Delhi': 0.0,
      'Bangalore': -0.05,
      'Chennai': 0.1,
      'Hyderabad': 0.05
    };
    return effects[location] || 0;
  }

  private getTargetEncoding(value: string, type: string): number {
    // Simplified target encoding based on payment efficiency
    const encodings: { [key: string]: { [key: string]: number } } = {
      industry: {
        'IT': 0.75,
        'Finance': 0.70,
        'Healthcare': 0.72,
        'Retail': 0.68,
        'Manufacturing': 0.65
      },
      location: {
        'Mumbai': 0.73,
        'Delhi': 0.70,
        'Bangalore': 0.75,
        'Chennai': 0.68,
        'Hyderabad': 0.71
      },
      paymentMethod: {
        'Bank Transfer': 0.72,
        'Credit Card': 0.75,
        'Cheque': 0.65,
        'UPI': 0.78
      },
      segment: {
        'Reliable': 0.85,
        'Average': 0.70,
        'At-risk': 0.50
      }
    };
    
    return encodings[type]?.[value] || 0.70;
  }
}

export const featureEngineer = new FeatureEngineer();

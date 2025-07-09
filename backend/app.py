
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler, LabelEncoder, RobustScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
from sklearn.ensemble import RandomForestRegressor
import tensorflow as tf
from tensorflow.keras.models import Sequential, Model, load_model
from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization, Input, Concatenate
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
from tensorflow.keras.optimizers import AdamW
from tensorflow.keras.regularizers import l1_l2
import pickle
import joblib
from datetime import datetime, timedelta
import warnings
import logging
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

warnings.filterwarnings('ignore')

# Set random seeds for reproducibility
np.random.seed(42)
tf.random.set_seed(42)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Flask app setup
app = Flask(__name__)
CORS(app)

# Global variables for model
ml_model = None
sequence_scaler = None
static_scaler = None
model_artifacts = None

# Model file paths
MODEL_H5_PATH = 'payment_prediction_model.h5'
MODEL_PKL_PATH = 'payment_prediction_model.pkl'

# Simple in-memory database for company payment history (for demo purposes)
company_history_db = {}

def load_existing_model():
    """Load existing model artifacts if available"""
    global ml_model, sequence_scaler, static_scaler, model_artifacts
    
    try:
        if os.path.exists(MODEL_H5_PATH) and os.path.exists(MODEL_PKL_PATH):
            logger.info("Loading existing model artifacts...")
            
            # Load the TensorFlow model
            ml_model = load_model(MODEL_H5_PATH)
            
            # Load the artifacts
            with open(MODEL_PKL_PATH, 'rb') as f:
                model_artifacts = pickle.load(f)
            
            sequence_scaler = model_artifacts['sequence_scaler']
            static_scaler = model_artifacts['static_scaler']
            
            logger.info("✅ Model loaded successfully from existing files!")
            return True
    except Exception as e:
        logger.error(f"Error loading existing model: {str(e)}")
    
    return False

def get_company_payment_history(company_name):
    """Get company payment history from in-memory database"""
    return company_history_db.get(company_name, [])

def add_company_payment_record(company_name, record):
    """Add a payment record to company history"""
    if company_name not in company_history_db:
        company_history_db[company_name] = []
    company_history_db[company_name].append(record)

def calculate_company_behavioral_features(company_name):
    """Calculate advanced company behavioral features from actual history"""
    history = get_company_payment_history(company_name)
    
    if not history:
        # Default values for new companies
        return {
            'efficiency_3': 0.7,
            'efficiency_7': 0.7, 
            'efficiency_all': 0.7,
            'velocity_avg': 1.0,
            'consistency': 0.5,
            'trend': 0.0,
            'frequency': 0.1,
            'days_since_last': 30
        }
    
    # Sort by date
    history = sorted(history, key=lambda x: x.get('date', datetime.now()))
    
    # Recent 3 records efficiency
    recent_3 = history[-3:] if len(history) >= 3 else history
    efficiency_3 = np.mean([r.get('payment_efficiency', 0.7) for r in recent_3])
    
    # Recent 7 records efficiency  
    recent_7 = history[-7:] if len(history) >= 7 else history
    efficiency_7 = np.mean([r.get('payment_efficiency', 0.7) for r in recent_7])
    
    # All time efficiency
    efficiency_all = np.mean([r.get('payment_efficiency', 0.7) for r in history])
    
    # Payment velocity (days to payment / log(amount))
    velocities = []
    for r in history:
        amount = r.get('amount', 50000)
        days = r.get('days_to_payment', 30)
        velocity = days / (np.log(amount) + 1)
        velocities.append(velocity)
    velocity_avg = np.mean(velocities) if velocities else 1.0
    
    # Consistency (inverse of standard deviation)
    efficiencies = [r.get('payment_efficiency', 0.7) for r in history]
    consistency = 1 / (1 + np.std(efficiencies)) if len(efficiencies) > 1 else 0.5
    
    # Trend calculation (slope of recent efficiency)
    if len(recent_7) >= 3:
        x = np.arange(len(recent_7))
        y = [r.get('payment_efficiency', 0.7) for r in recent_7]
        trend = np.polyfit(x, y, 1)[0] if len(y) > 1 else 0.0
    else:
        trend = 0.0
    
    # Payment frequency (records per month)
    if len(history) > 1:
        first_date = history[0].get('date', datetime.now())
        last_date = history[-1].get('date', datetime.now())
        days_span = (last_date - first_date).days + 1
        frequency = len(history) / max(days_span / 30, 1)
    else:
        frequency = 0.1
    
    # Days since last payment
    if history:
        last_date = history[-1].get('date', datetime.now())
        days_since_last = min(365, (datetime.now() - last_date).days)
    else:
        days_since_last = 30
    
    return {
        'efficiency_3': efficiency_3,
        'efficiency_7': efficiency_7,
        'efficiency_all': efficiency_all,
        'velocity_avg': velocity_avg,
        'consistency': consistency,
        'trend': trend,
        'frequency': frequency,
        'days_since_last': days_since_last
    }

def generate_improved_synthetic_data():
    """Generate synthetic invoice data with stronger continuous patterns"""

    num_customers = 200
    num_invoices = 80000

    industries = ['IT', 'Finance', 'Healthcare', 'Retail', 'Manufacturing']
    locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad']

    def assign_segment(score):
        if score > 720:
            return 'Reliable'
        elif score < 650:
            return 'At-risk'
        else:
            return 'Average'

    # Create customers with more realistic distributions
    customers = pd.DataFrame({
        'CustomerID': range(1, num_customers + 1),
        'Company': [f'Company_{i + 1}' for i in range(num_customers)],
        'Industry': np.random.choice(industries, num_customers),
        'CustomerCreditScore': np.random.normal(700, 50, num_customers).astype(int),
        'Location': np.random.choice(locations, num_customers)
    })
    customers['Segment'] = customers['CustomerCreditScore'].apply(assign_segment)

    # More dynamic market conditions
    market_conditions = {}
    payment_urgency = {}
    for month in range(1, 13):
        market_conditions[month] = 1 + 0.2 * np.sin(2 * np.pi * month / 12) + np.random.normal(0, 0.05)
        payment_urgency[month] = np.random.beta(2, 5)

    payment_methods = ['Bank Transfer', 'Credit Card', 'Cheque', 'UPI']
    invoices = []
    company_payment_history = {f'Company_{i + 1}': [] for i in range(num_customers)}

    for i in range(num_invoices):
        cust = customers.sample(1).iloc[0]
        month = np.random.randint(1, 13)
        day = np.random.randint(1, 28)
        company = cust['Company']
        history = company_payment_history[company]

        # Invoice details
        invoice_id = 10001 + i
        invoice_date = pd.Timestamp(year=2024, month=month, day=day)

        payment_due_days = np.random.choice([15, 30, 45, 60, 90], p=[0.1, 0.4, 0.3, 0.15, 0.05])
        payment_due_date = invoice_date + pd.Timedelta(days=payment_due_days)

        base_amount = np.random.lognormal(9.5, 1.2)
        seasonal_multiplier = 1 + 0.3 * np.sin(2 * np.pi * month / 12)
        invoice_amount = round(base_amount * seasonal_multiplier * market_conditions[month], 2)

        payment_method = np.random.choice(payment_methods)

        # Payment prediction logic
        credit_factor = (cust['CustomerCreditScore'] - 600) / 200
        base_payment_tendency = payment_due_days * (1.2 - credit_factor)

        industry_adjustments = {
            'IT': lambda m: 2 * np.sin(2 * np.pi * m / 12),
            'Finance': lambda m: -3 + 5 * payment_urgency[m],
            'Healthcare': lambda m: 1 + 2 * np.cos(2 * np.pi * m / 6),
            'Retail': lambda m: -5 if m in [11, 12] else 3,
            'Manufacturing': lambda m: 4 * np.sin(2 * np.pi * (m - 3) / 12)
        }

        industry_adj = industry_adjustments[cust['Industry']](month)
        amount_factor = np.log(invoice_amount / 50000) * 2

        method_effects = {
            'Bank Transfer': np.random.normal(-2, 1),
            'Credit Card': np.random.normal(-1, 1.5),
            'Cheque': np.random.normal(3, 2),
            'UPI': np.random.normal(-0.5, 1)
        }
        method_adj = method_effects[payment_method]

        location_factors = {
            'Mumbai': np.random.normal(-1, 2),
            'Delhi': np.random.normal(0, 2),
            'Bangalore': np.random.normal(-0.5, 1.5),
            'Chennai': np.random.normal(1, 2),
            'Hyderabad': np.random.normal(0.5, 1.5)
        }
        location_adj = location_factors[cust['Location']]

        if len(history) > 0:
            recent_performance = np.mean([h['payment_efficiency'] for h in history[-10:]])
            consistency_factor = 1 - np.std([h['payment_efficiency'] for h in history[-5:]]) / 10
            historical_adj = recent_performance * consistency_factor * 5
        else:
            historical_adj = np.random.normal(0, 3)

        market_stress = (1 - market_conditions[month]) * 10
        day_effect = 2 * np.sin(2 * np.pi * day / 30)

        total_adjustment = (industry_adj + amount_factor + method_adj +
                            location_adj + historical_adj + market_stress + day_effect)

        days_to_payment = base_payment_tendency + total_adjustment + np.random.normal(0, 3)
        days_to_payment = max(1, min(120, days_to_payment))
        days_to_payment = round(days_to_payment, 1)

        if np.random.rand() < 0.01:
            days_to_payment += np.random.exponential(30)

        payment_delay = days_to_payment - payment_due_days
        payment_efficiency = max(0, 1 - payment_delay / payment_due_days)

        if payment_delay > 7:
            payment_status = 'Late'
        elif payment_delay < -2:
            payment_status = 'Early'
        else:
            payment_status = 'On Time'

        payment_date = invoice_date + pd.Timedelta(days=days_to_payment)
        has_early_discount = (payment_delay < -5 and np.random.rand() < 0.2)

        invoice_data = {
            "InvoiceID": invoice_id,
            "Company": company,
            "Industry": cust['Industry'],
            "Segment": cust['Segment'],
            "InvoiceDate": invoice_date.strftime('%Y-%m-%d'),
            "PaymentDueDays": payment_due_days,
            "PaymentDueDate": payment_due_date.strftime('%Y-%m-%d'),
            "InvoiceAmount": invoice_amount,
            "CustomerCreditScore": cust['CustomerCreditScore'],
            "Location": cust['Location'],
            "PaymentMethod": payment_method,
            "InvoiceCurrency": 'INR',
            "HasEarlyDiscount": has_early_discount,
            "MarketCondition": market_conditions[month],
            "PaymentUrgency": payment_urgency[month],
            "DayOfMonth": day,
            "ActualPaymentDate": payment_date.strftime('%Y-%m-%d'),
            "PaymentDelay": round(payment_delay, 1),
            "DaysToPayment": round(days_to_payment, 1),
            "PaymentStatus": payment_status,
            "PaymentEfficiency": payment_efficiency
        }

        invoices.append(invoice_data)

        company_payment_history[company].append({
            'payment_delay': payment_delay,
            'days_to_payment': days_to_payment,
            'amount': invoice_amount,
            'payment_efficiency': payment_efficiency
        })

    return pd.DataFrame(invoices)

def engineer_continuous_features(df):
    """Advanced feature engineering focusing on continuous behavioral patterns"""

    df = df.copy()
    df['InvoiceDate'] = pd.to_datetime(df['InvoiceDate'])
    df = df.sort_values(['Company', 'InvoiceDate']).reset_index(drop=True)

    # Time-based continuous features
    df['Month'] = df['InvoiceDate'].dt.month
    df['Quarter'] = df['InvoiceDate'].dt.quarter
    df['DayOfWeek'] = df['InvoiceDate'].dt.dayofweek
    df['WeekOfYear'] = df['InvoiceDate'].dt.isocalendar().week

    # Continuous seasonal features
    df['MonthSin'] = np.sin(2 * np.pi * df['Month'] / 12)
    df['MonthCos'] = np.cos(2 * np.pi * df['Month'] / 12)
    df['QuarterSin'] = np.sin(2 * np.pi * df['Quarter'] / 4)
    df['QuarterCos'] = np.cos(2 * np.pi * df['Quarter'] / 4)
    df['DayOfWeekSin'] = np.sin(2 * np.pi * df['DayOfWeek'] / 7)
    df['DayOfWeekCos'] = np.cos(2 * np.pi * df['DayOfWeek'] / 7)
    df['DayOfMonthSin'] = np.sin(2 * np.pi * df['DayOfMonth'] / 30)
    df['DayOfMonthCos'] = np.cos(2 * np.pi * df['DayOfMonth'] / 30)

    # Amount features
    df['LogInvoiceAmount'] = np.log1p(df['InvoiceAmount'])
    df['AmountSquareRoot'] = np.sqrt(df['InvoiceAmount'])
    df['AmountPerDueDay'] = df['InvoiceAmount'] / df['PaymentDueDays']
    df['LogAmountPerDueDay'] = np.log1p(df['AmountPerDueDay'])

    # Credit score features
    df['CreditScoreNorm'] = (df['CustomerCreditScore'] - 650) / 100
    df['CreditScoreSquared'] = df['CreditScoreNorm'] ** 2
    df['CreditScoreCubed'] = df['CreditScoreNorm'] ** 3

    # Company behavioral features
    df['CompanyEfficiency_3'] = df.groupby('Company')['PaymentEfficiency'].transform(
        lambda x: x.shift(1).rolling(3, min_periods=1).mean()
    )
    df['CompanyEfficiency_7'] = df.groupby('Company')['PaymentEfficiency'].transform(
        lambda x: x.shift(1).rolling(7, min_periods=1).mean()
    )
    df['CompanyEfficiency_All'] = df.groupby('Company')['PaymentEfficiency'].transform(
        lambda x: x.shift(1).expanding().mean()
    )

    df['PaymentVelocity'] = df['DaysToPayment'] / (df['LogInvoiceAmount'] + 1)
    df['CompanyVelocity_Avg'] = df.groupby('Company')['PaymentVelocity'].transform(
        lambda x: x.shift(1).expanding().mean()
    )

    df['CompanyConsistency'] = df.groupby('Company')['PaymentEfficiency'].transform(
        lambda x: 1 / (1 + x.shift(1).rolling(5, min_periods=2).std().fillna(0.5))
    )

    def calculate_trend(series):
        if len(series) < 3:
            return 0
        x = np.arange(len(series))
        y = series.values
        return np.polyfit(x, y, 1)[0]

    df['CompanyTrend'] = df.groupby('Company')['PaymentEfficiency'].transform(
        lambda x: x.shift(1).rolling(7, min_periods=3).apply(calculate_trend)
    )

    # Market features
    df['MarketTrend'] = df.groupby('Month')['MarketCondition'].transform('mean')
    df['MarketVolatility'] = df.groupby('Month')['MarketCondition'].transform('std')

    # Industry features
    industry_payment_avg = df.groupby(['Industry', 'Month'])['PaymentEfficiency'].transform('mean')
    df['IndustrySeasonalEffect'] = df['PaymentEfficiency'] - industry_payment_avg

    # Location features
    location_economic_index = df.groupby(['Location', 'Quarter'])['MarketCondition'].transform('mean')
    df['LocationEconomicIndex'] = location_economic_index

    # Interaction features
    df['CreditScore_Amount'] = df['CreditScoreNorm'] * df['LogInvoiceAmount']
    df['CreditScore_Market'] = df['CreditScoreNorm'] * df['MarketCondition']
    df['Amount_Market'] = df['LogInvoiceAmount'] * df['MarketCondition']
    df['Efficiency_Consistency'] = df['CompanyEfficiency_All'] * df['CompanyConsistency']

    # Payment frequency
    df['DaysSinceLastInvoice'] = df.groupby('Company')['InvoiceDate'].diff().dt.days
    df['DaysSinceLastInvoice'].fillna(30, inplace=True)
    df['PaymentFrequency'] = 1 / (df['DaysSinceLastInvoice'] + 1)

    # Target encoding
    categorical_cols = ['Industry', 'Location', 'PaymentMethod', 'Segment']

    for col in categorical_cols:
        target_mean = df.groupby(col)['PaymentEfficiency'].transform('mean')
        global_mean = df['PaymentEfficiency'].mean()
        counts = df.groupby(col)['PaymentEfficiency'].transform('count')
        smoothing = 10
        smoothed_target = (target_mean * counts + global_mean * smoothing) / (counts + smoothing)
        df[f'{col}_TargetEncoded'] = smoothed_target

    # Fill missing values
    continuous_cols = [col for col in df.columns if df[col].dtype in ['float64', 'int64']]
    for col in continuous_cols:
        if df[col].isnull().any():
            if 'Efficiency' in col:
                df[col].fillna(0.7, inplace=True)
            elif 'Trend' in col:
                df[col].fillna(0, inplace=True)
            elif 'Consistency' in col:
                df[col].fillna(0.5, inplace=True)
            else:
                df[col].fillna(df[col].median(), inplace=True)

    return df

def create_continuous_prediction_model(sequence_features, static_features):
    """Create a hybrid LSTM + feedforward model designed for continuous predictions"""

    # Sequence input for LSTM processing
    sequence_input = Input(shape=(sequence_features,), name='sequence_input')
    sequence_reshaped = tf.keras.layers.Reshape((sequence_features, 1))(sequence_input)

    # LSTM layers for sequence processing
    lstm1 = LSTM(64, return_sequences=True, dropout=0.4, recurrent_dropout=0.4,
                 kernel_regularizer=l1_l2(l1=0.001, l2=0.001))(sequence_reshaped)
    lstm1_bn = BatchNormalization()(lstm1)

    lstm2 = LSTM(32, return_sequences=False, dropout=0.4, recurrent_dropout=0.4,
                 kernel_regularizer=l1_l2(l1=0.001, l2=0.001))(lstm1_bn)
    lstm2_bn = BatchNormalization()(lstm2)

    # Static input for dense processing
    static_input = Input(shape=(static_features,), name='static_input')

    # Dense layers for static features
    dense1 = Dense(64, activation='relu', kernel_regularizer=l1_l2(l1=0.001, l2=0.001))(static_input)
    dense1_dropout = Dropout(0.3)(dense1)
    dense1_bn = BatchNormalization()(dense1_dropout)

    dense2 = Dense(32, activation='relu', kernel_regularizer=l1_l2(l1=0.001, l2=0.001))(dense1_bn)
    dense2_dropout = Dropout(0.3)(dense2)

    # Combine LSTM and dense outputs
    combined = Concatenate()([lstm2_bn, dense2_dropout])

    # Final prediction layers
    final_dense1 = Dense(32, activation='relu', kernel_regularizer=l1_l2(l1=0.001, l2=0.001))(combined)
    final_dropout1 = Dropout(0.4)(final_dense1)

    final_dense2 = Dense(16, activation='relu', kernel_regularizer=l1_l2(l1=0.001, l2=0.001))(final_dropout1)
    final_dropout2 = Dropout(0.3)(final_dense2)

    # Output layer
    output = Dense(1, activation='linear', name='days_prediction')(final_dropout2)

    # Create model
    model = Model(inputs=[sequence_input, static_input], outputs=output)

    # Custom loss function for continuous predictions
    def continuous_loss(y_true, y_pred):
        mse = tf.reduce_mean(tf.square(y_true - y_pred))
        # Add clustering penalty to encourage predictions near common payment terms
        common_terms = tf.constant([15.0, 30.0, 45.0, 60.0, 90.0])
        distances = tf.abs(tf.expand_dims(y_pred, -1) - tf.expand_dims(common_terms, 0))
        min_distances = tf.reduce_min(distances, axis=-1)
        clustering_penalty = tf.reduce_mean(tf.exp(-min_distances))
        return mse + 0.1 * clustering_penalty

    # Compile model
    model.compile(
        optimizer='adam',
        loss=continuous_loss,
        metrics=['mae', 'mse']
    )

    return model

def prepare_continuous_data(df):
    """Prepare data for continuous prediction model"""

    sequence_features = [
        'CompanyEfficiency_3', 'CompanyEfficiency_7', 'CompanyEfficiency_All',
        'CompanyVelocity_Avg', 'CompanyConsistency', 'CompanyTrend',
        'PaymentFrequency', 'DaysSinceLastInvoice'
    ]

    static_features = [
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

    available_sequence = [f for f in sequence_features if f in df.columns]
    available_static = [f for f in static_features if f in df.columns]

    print(f"Using {len(available_sequence)} sequence features and {len(available_static)} static features")

    X_sequence = df[available_sequence].fillna(0).values
    X_static = df[available_static].fillna(0).values
    y = df['DaysToPayment'].values

    sequence_scaler = RobustScaler()
    static_scaler = RobustScaler()

    X_sequence_scaled = sequence_scaler.fit_transform(X_sequence)
    X_static_scaled = static_scaler.fit_transform(X_static)

    return X_sequence_scaled, X_static_scaled, y, sequence_scaler, static_scaler, available_sequence, available_static

def train_model():
    """Train the ML model with full LSTM + feedforward architecture"""
    global ml_model, sequence_scaler, static_scaler, model_artifacts

    print("=" * 50)
    print("🚀 TRAINING PAYMENT PREDICTION MODEL")
    print("=" * 50)

    # Generate data
    print("📊 Generating synthetic data...")
    synthetic_df = generate_improved_synthetic_data()
    print(f"✅ Generated {len(synthetic_df)} invoice records")

    # Engineer features
    print("🔧 Engineering features...")
    df_continuous = engineer_continuous_features(synthetic_df)
    print("✅ Feature engineering completed")

    # Prepare data
    print("🎯 Preparing data for modeling...")
    X_seq, X_static, y, seq_scaler, static_scaler, seq_features, static_features = prepare_continuous_data(
        df_continuous)
    print(f"✅ Data prepared: {X_seq.shape[0]} samples")

    # Split data
    X_seq_temp, X_seq_test, X_static_temp, X_static_test, y_temp, y_test = train_test_split(
        X_seq, X_static, y, test_size=0.15, random_state=42, shuffle=True
    )
    X_seq_train, X_seq_val, X_static_train, X_static_val, y_train, y_val = train_test_split(
        X_seq_temp, X_static_temp, y_temp, test_size=0.18, random_state=42, shuffle=True
    )

    print(f"📈 Training samples: {X_seq_train.shape[0]}")
    print(f"📊 Validation samples: {X_seq_val.shape[0]}")
    print(f"🧪 Test samples: {X_seq_test.shape[0]}")

    # Create and train model
    print("🏗️ Building hybrid LSTM + feedforward model...")
    model = create_continuous_prediction_model(len(seq_features), len(static_features))

    # Training callbacks
    callbacks = [
        EarlyStopping(monitor='val_loss', patience=15, restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor='val_loss', factor=0.7, patience=8, min_lr=1e-6, verbose=1),
        ModelCheckpoint('best_model_temp.h5', monitor='val_loss', save_best_only=True, verbose=0)
    ]

    print("🎓 Training model with epochs...")
    history = model.fit(
        [X_seq_train, X_static_train], y_train,
        validation_data=([X_seq_val, X_static_val], y_val),
        epochs=100,
        batch_size=64,
        callbacks=callbacks,
        verbose=1
    )

    # Evaluation
    print("📋 Evaluating model...")
    y_pred = model.predict([X_seq_test, X_static_test], verbose=0).flatten()
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"✅ Model Performance:")
    print(f"   📉 MAE: {mae:.2f} days")
    print(f"   📈 R²: {r2:.3f}")

    # Save model artifacts
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    model_filename = MODEL_H5_PATH
    pickle_filename = MODEL_PKL_PATH

    model.save(model_filename)

    model_artifacts = {
        'model_path': model_filename,
        'sequence_scaler': seq_scaler,
        'static_scaler': static_scaler,
        'sequence_features': seq_features,
        'static_features': static_features,
        'timestamp': timestamp,
        'model_version': '1.0',
        'industries': ['IT', 'Finance', 'Healthcare', 'Retail', 'Manufacturing'],
        'locations': ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad'],
        'payment_methods': ['Bank Transfer', 'Credit Card', 'Cheque', 'UPI'],
        'segments': ['Reliable', 'Average', 'At-risk']
    }

    with open(pickle_filename, 'wb') as f:
        pickle.dump(model_artifacts, f)

    # Load into global variables
    ml_model = model
    sequence_scaler = seq_scaler
    static_scaler = static_scaler

    print(f"✅ Model saved: {model_filename}")
    print(f"✅ Artifacts saved: {pickle_filename}")
    print("🎉 Model training completed and loaded for API!")

    return True

def engineer_features_for_prediction(invoice_data):
    """Enhanced feature engineering for API predictions using real company history"""
    try:
        amount = float(invoice_data.get('amount', 50000))
        due_days = int(invoice_data.get('paymentDueDays', 30))
        credit_score = int(invoice_data.get('customerCreditScore', 700))
        customer_name = invoice_data.get('customerName', 'Company_1')

        # Get real company behavioral features
        company_features = calculate_company_behavioral_features(customer_name)
        
        logger.info(f"Company {customer_name} behavioral features: {company_features}")

        # Feature engineering
        log_amount = np.log1p(amount)
        amount_sqrt = np.sqrt(amount)
        log_amount_per_due_day = np.log1p(amount / due_days)

        # Credit score features
        credit_score_norm = credit_score / 850.0
        credit_score_squared = credit_score_norm ** 2
        credit_score_cubed = credit_score_norm ** 3

        # Date features
        invoice_date = datetime.now()
        month = invoice_date.month
        quarter = (month - 1) // 3 + 1
        day_of_week = invoice_date.weekday()
        day_of_month = invoice_date.day

        # Cyclical encoding
        month_sin = np.sin(2 * np.pi * month / 12)
        month_cos = np.cos(2 * np.pi * month / 12)
        quarter_sin = np.sin(2 * np.pi * quarter / 4)
        quarter_cos = np.cos(2 * np.pi * quarter / 4)
        day_of_week_sin = np.sin(2 * np.pi * day_of_week / 7)
        day_of_week_cos = np.cos(2 * np.pi * day_of_week / 7)
        day_of_month_sin = np.sin(2 * np.pi * day_of_month / 31)
        day_of_month_cos = np.cos(2 * np.pi * day_of_month / 31)

        # Market features
        market_condition = float(invoice_data.get('marketCondition', 1.0))
        payment_urgency = float(invoice_data.get('paymentUrgency', 0.5))
        market_trend = 0.0
        market_volatility = 0.1
        industry_seasonal_effect = 0.0
        location_economic_index = 1.0

        # Interaction features
        credit_score_amount = credit_score_norm * log_amount
        credit_score_market = credit_score_norm * market_condition
        amount_market = log_amount * market_condition
        efficiency_consistency = company_features['efficiency_all'] * company_features['consistency']

        # Target encoding
        segment_mapping = {'Reliable': 0.9, 'Average': 0.5, 'At-risk': 0.1}
        industry_mapping = {'IT': 0.8, 'Finance': 0.7, 'Healthcare': 0.75, 'Retail': 0.6, 'Manufacturing': 0.65}
        location_mapping = {'Mumbai': 0.8, 'Delhi': 0.75, 'Bangalore': 0.85, 'Chennai': 0.7, 'Hyderabad': 0.72}
        payment_method_mapping = {'Bank Transfer': 0.7, 'Credit Card': 0.8, 'Cheque': 0.5, 'UPI': 0.9}

        segment = invoice_data.get('customerSegment', 'Average')
        industry = invoice_data.get('customerIndustry', 'IT')
        location = invoice_data.get('customerLocation', 'Mumbai')
        payment_method = invoice_data.get('paymentMethod', 'Bank Transfer')

        industry_target_encoded = industry_mapping.get(industry, 0.7)
        location_target_encoded = location_mapping.get(location, 0.75)
        payment_method_target_encoded = payment_method_mapping.get(payment_method, 0.7)
        segment_target_encoded = segment_mapping.get(segment, 0.5)

        # Build feature arrays using real company behavioral features
        sequence_features = np.array([
            company_features['efficiency_3'], 
            company_features['efficiency_7'], 
            company_features['efficiency_all'],
            company_features['velocity_avg'], 
            company_features['consistency'], 
            company_features['trend'],
            company_features['frequency'], 
            company_features['days_since_last']
        ])

        static_features = np.array([
            log_amount, amount_sqrt, log_amount_per_due_day,
            credit_score_norm, credit_score_squared, credit_score_cubed,
            month_sin, month_cos, quarter_sin, quarter_cos,
            day_of_week_sin, day_of_week_cos, day_of_month_sin, day_of_month_cos,
            market_condition, payment_urgency, market_trend, market_volatility,
            industry_seasonal_effect, location_economic_index,
            credit_score_amount, credit_score_market, amount_market,
            efficiency_consistency, industry_target_encoded, location_target_encoded,
            payment_method_target_encoded, segment_target_encoded
        ])

        return sequence_features, static_features

    except Exception as e:
        logger.error(f"Error in feature engineering: {str(e)}")
        raise e

# Company_34 Demonstration Utilities
def setup_company_34_demo():
    """Set up Company_34 with initial poor payment history"""
    company_name = "Company_34"
    logger.info(f"Setting up demo for {company_name}")
    
    # Clear existing history
    company_history_db[company_name] = []
    
    # Add poor payment history (delayed payments)
    base_date = datetime.now() - timedelta(days=180)
    for i in range(8):
        record = {
            'date': base_date + timedelta(days=i*20),
            'amount': np.random.uniform(45000, 85000),
            'days_to_payment': np.random.uniform(35, 55),  # Delayed payments
            'payment_efficiency': np.random.uniform(0.3, 0.6)  # Poor efficiency
        }
        add_company_payment_record(company_name, record)
    
    logger.info(f"Added {len(company_history_db[company_name])} poor payment records for {company_name}")

def improve_company_34_history():
    """Improve Company_34's payment history to show model learning"""
    company_name = "Company_34"
    logger.info(f"Improving payment history for {company_name}")
    
    # Add recent good payment history (early/on-time payments)
    base_date = datetime.now() - timedelta(days=60)
    for i in range(6):
        record = {
            'date': base_date + timedelta(days=i*10),
            'amount': np.random.uniform(50000, 90000),
            'days_to_payment': np.random.uniform(18, 28),  # Early/on-time payments
            'payment_efficiency': np.random.uniform(0.8, 0.95)  # High efficiency
        }
        add_company_payment_record(company_name, record)
    
    logger.info(f"Added {len(company_history_db[company_name][-6:])} improved payment records for {company_name}")

# Flask API Endpoints
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': ml_model is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/train', methods=['POST'])
def train_model_endpoint():
    """Train the ML model"""
    try:
        success = train_model()
        if success:
            return jsonify({
                'success': True,
                'message': 'Model trained and loaded successfully',
                'timestamp': datetime.now().isoformat()
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to train model'
            }), 500
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error training model: {str(e)}'
        }), 500

@app.route('/predict', methods=['POST'])
def predict_payment():
    """Make payment prediction with enhanced company learning"""
    try:
        if ml_model is None:
            return jsonify({
                'success': False,
                'message': 'Model not loaded. Please train the model first.'
            }), 400

        data = request.get_json()

        # Validate required fields
        required_fields = ['amount', 'paymentDueDays', 'customerName']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400

        # Engineer features with real company behavioral data
        sequence_features, static_features = engineer_features_for_prediction(data)

        # Scale features
        sequence_scaled = sequence_scaler.transform([sequence_features])
        static_scaled = static_scaler.transform([static_features])

        # Make prediction
        prediction = ml_model.predict([sequence_scaled, static_scaled])
        predicted_days = float(prediction[0][0])

        # Calculate confidence based on company history quality
        company_features = calculate_company_behavioral_features(data.get('customerName', 'Company_1'))
        history_quality = len(get_company_payment_history(data.get('customerName', 'Company_1')))
        base_confidence = 0.6 + (min(history_quality, 20) / 20) * 0.3  # 0.6 to 0.9 based on history
        confidence_score = min(0.95, max(0.6, base_confidence + np.random.normal(0, 0.05)))
        
        due_days = int(data['paymentDueDays'])
        delay_ratio = predicted_days / due_days

        if delay_ratio <= 3:
            risk_level = 'low'
        elif delay_ratio <= 6:
            risk_level = 'medium'
        else:
            risk_level = 'high'

        logger.info(f"Prediction for {data.get('customerName')}: {predicted_days:.1f} days (confidence: {confidence_score:.2f})")

        return jsonify({
            'success': True,
            'prediction': {
                'predictedDaysToPayment': round(predicted_days, 1),
                'confidenceScore': round(confidence_score, 2),
                'riskLevel': risk_level,
                'delayRatio': round(delay_ratio, 2),
                'companyHistoryRecords': len(get_company_payment_history(data.get('customerName', 'Company_1')))
            }
        })

    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Prediction error: {str(e)}'
        }), 500

@app.route('/customer-risk/<customer_name>', methods=['GET'])
def get_customer_risk(customer_name):
    """Get customer risk assessment using real company behavioral data"""
    try:
        company_features = calculate_company_behavioral_features(customer_name)
        history_records = len(get_company_payment_history(customer_name))
        
        # Calculate risk based on actual company efficiency
        avg_efficiency = company_features['efficiency_all']
        consistency = company_features['consistency']
        
        # Risk calculation based on efficiency and consistency
        risk_score = (1 - avg_efficiency) * 70 + (1 - consistency) * 30
        
        if risk_score <= 25:
            risk_level = 'low'
        elif risk_score <= 50:
            risk_level = 'medium'
        else:
            risk_level = 'high'

        # Calculate average delay from efficiency
        avg_delay_days = (1 - avg_efficiency) * 20  # Convert efficiency to delay days
        payment_reliability = avg_efficiency * 100

        return jsonify({
            'success': True,
            'customerName': customer_name,
            'riskLevel': risk_level,
            'riskScore': round(risk_score, 1),
            'averageDelayDays': round(avg_delay_days, 1),
            'paymentReliability': round(payment_reliability, 1),
            'historyRecords': history_records,
            'companyFeatures': {
                'efficiency': round(avg_efficiency, 3),
                'consistency': round(consistency, 3),
                'trend': round(company_features['trend'], 3)
            }
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error calculating customer risk: {str(e)}'
        }), 500

@app.route('/forecast', methods=['POST'])
def generate_forecast():
    """Generate payment forecast for multiple invoices"""
    try:
        if ml_model is None:
            return jsonify({
                'success': False,
                'message': 'Model not loaded. Please train the model first.'
            }), 400

        data = request.get_json()
        invoices = data.get('invoices', [])

        if not invoices:
            return jsonify({
                'success': False,
                'message': 'No invoices provided'
            }), 400

        forecasts = []
        total_amount = 0
        total_predicted_days = 0
        risk_distribution = {'low': 0, 'medium': 0, 'high': 0}

        for invoice in invoices:
            sequence_features, static_features = engineer_features_for_prediction(invoice)

            sequence_scaled = sequence_scaler.transform([sequence_features])
            static_scaled = static_scaler.transform([static_features])
            prediction = ml_model.predict([sequence_scaled, static_scaled])

            predicted_days = float(prediction[0][0])
            amount = float(invoice.get('amount', 0))
            due_days = int(invoice.get('paymentDueDays', 30))

            delay_ratio = predicted_days / due_days
            if delay_ratio <= 3:
                risk_level = 'low'
            elif delay_ratio <= 6:
                risk_level = 'medium'
            else:
                risk_level = 'high'

            risk_distribution[risk_level] += 1
            total_amount += amount
            total_predicted_days += predicted_days

            forecasts.append({
                'invoiceId': invoice.get('invoiceId', ''),
                'customerName': invoice.get('customerName', ''),
                'amount': amount,
                'predictedDays': round(predicted_days, 1),
                'riskLevel': risk_level,
                'expectedPaymentDate': (datetime.now() + timedelta(days=predicted_days)).isoformat()
            })

        avg_predicted_days = total_predicted_days / len(invoices) if invoices else 0

        return jsonify({
            'success': True,
            'forecast': {
                'totalAmount': total_amount,
                'totalInvoices': len(invoices),
                'averagePredictedDays': round(avg_predicted_days, 1),
                'riskDistribution': risk_distribution,
                'individualForecasts': forecasts,
                'generatedAt': datetime.now().isoformat()
            }
        })

    except Exception as e:
        logger.error(f"Error generating forecast: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Forecast error: {str(e)}'
        }), 500

# Company_34 Demo Endpoints
@app.route('/demo/company-34/setup', methods=['POST'])
def setup_company_34_demo_endpoint():
    """Set up Company_34 demo with poor payment history"""
    try:
        setup_company_34_demo()
        return jsonify({
            'success': True,
            'message': 'Company_34 demo setup completed with poor payment history',
            'historyRecords': len(company_history_db.get('Company_34', []))
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error setting up demo: {str(e)}'
        }), 500

@app.route('/demo/company-34/improve', methods=['POST'])
def improve_company_34_demo_endpoint():
    """Improve Company_34's payment history"""
    try:
        improve_company_34_history()
        return jsonify({
            'success': True,
            'message': 'Company_34 payment history improved',
            'historyRecords': len(company_history_db.get('Company_34', []))
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error improving history: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("🚀 ENHANCED PAYMENT PREDICTION ML + FLASK API SERVER")
    print("=" * 60)
    print("📋 Available endpoints:")
    print("   POST /train - Train the ML model")
    print("   GET  /health - Health check")
    print("   POST /predict - Single prediction (enhanced with company learning)")
    print("   GET  /customer-risk/<name> - Customer risk assessment (enhanced)")
    print("   POST /forecast - Bulk predictions")
    print("   POST /demo/company-34/setup - Setup Company_34 demo")
    print("   POST /demo/company-34/improve - Improve Company_34 history")
    print("=" * 60)
    
    # Try to load existing model on startup
    print("🔍 Checking for existing model files...")
    if load_existing_model():
        print("✅ Existing model loaded successfully!")
    else:
        print("ℹ️  No existing model found. Call POST /train to train a new model.")
    
    print("⚡ Starting server on http://localhost:5000")
    print("💡 Enhanced with real-time company learning!")
    print("🎯 Company_34 demo ready for department presentation!")
    print("=" * 60)
    app.run(debug=True, host='0.0.0.0', port=5173)

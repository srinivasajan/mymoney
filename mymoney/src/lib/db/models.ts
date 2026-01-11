import mongoose, { Schema, Document, Model } from 'mongoose';

// Asset Schema
export interface IAsset extends Document {
    userId: string;
    name: string;
    type: 'cash' | 'savings' | 'investment' | 'property' | 'vehicle' | 'other';
    value: number;
    currency: string;
    institution?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['cash', 'savings', 'investment', 'property', 'vehicle', 'other'], required: true },
    value: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    institution: String,
    notes: String,
}, { timestamps: true });

// Liability Schema
export interface ILiability extends Document {
    userId: string;
    name: string;
    type: 'credit_card' | 'personal_loan' | 'home_loan' | 'car_loan' | 'education_loan' | 'other';
    principal: number;
    currentBalance: number;
    interestRate: number;
    emi?: number;
    tenure?: number;
    startDate?: Date;
    endDate?: Date;
    currency: string;
    institution?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const LiabilitySchema = new Schema<ILiability>({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['credit_card', 'personal_loan', 'home_loan', 'car_loan', 'education_loan', 'other'], required: true },
    principal: { type: Number, required: true },
    currentBalance: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    emi: Number,
    tenure: Number,
    startDate: Date,
    endDate: Date,
    currency: { type: String, default: 'INR' },
    institution: String,
    notes: String,
}, { timestamps: true });

// Transaction Schema
export interface ITransaction extends Document {
    userId: string;
    type: 'income' | 'expense' | 'transfer';
    category: string;
    amount: number;
    description: string;
    date: Date;
    account?: string;
    currency: string;
    tags?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['income', 'expense', 'transfer'], required: true },
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true, index: true },
    account: String,
    currency: { type: String, default: 'INR' },
    tags: [String],
}, { timestamps: true });

// Investment Schema
export interface IInvestment extends Document {
    userId: string;
    name: string;
    type: 'mutual_fund' | 'stock' | 'etf' | 'bond' | 'fd' | 'ppf' | 'nps' | 'gold' | 'crypto' | 'other';
    symbol?: string;
    quantity: number;
    avgBuyPrice: number;
    currentPrice: number;
    investedAmount: number;
    currentValue: number;
    returns: number;
    returnsPercent: number;
    currency: string;
    createdAt: Date;
    updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['mutual_fund', 'stock', 'etf', 'bond', 'fd', 'ppf', 'nps', 'gold', 'crypto', 'other'], required: true },
    symbol: String,
    quantity: { type: Number, required: true },
    avgBuyPrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
    investedAmount: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    returns: { type: Number, default: 0 },
    returnsPercent: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
}, { timestamps: true });

// Goal Schema
export interface IGoal extends Document {
    userId: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    targetDate: Date;
    category: string;
    priority: 'low' | 'medium' | 'high';
    status: 'active' | 'completed' | 'paused';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>({
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    targetDate: { type: Date, required: true },
    category: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['active', 'completed', 'paused'], default: 'active' },
    notes: String,
}, { timestamps: true });

// Watchlist Schema
export interface IWatchlistItem extends Document {
    userId: string;
    symbol: string;
    name: string;
    addedPrice: number;
    addedAt: Date;
}

const WatchlistSchema = new Schema<IWatchlistItem>({
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    addedPrice: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
});

WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

// Paper Trade Schema
export interface IPaperTrade extends Document {
    userId: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    total: number;
    timestamp: Date;
}

const PaperTradeSchema = new Schema<IPaperTrade>({
    userId: { type: String, required: true, index: true },
    symbol: { type: String, required: true },
    type: { type: String, enum: ['BUY', 'SELL'], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
});

// Paper Portfolio Schema
export interface IPaperPortfolio extends Document {
    userId: string;
    cash: number;
    initialCapital: number;
    positions: {
        symbol: string;
        quantity: number;
        avgPrice: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

const PaperPortfolioSchema = new Schema<IPaperPortfolio>({
    userId: { type: String, required: true, unique: true },
    cash: { type: Number, default: 1000000 },
    initialCapital: { type: Number, default: 1000000 },
    positions: [{
        symbol: String,
        quantity: Number,
        avgPrice: Number,
    }],
}, { timestamps: true });

// Risk Profile Schema
export interface IRiskProfile extends Document {
    userId: string;
    score: number;
    level: 'conservative' | 'moderate' | 'aggressive';
    answers: Record<string, number>;
    allocation: {
        equity: number;
        debt: number;
        gold: number;
        cash: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const RiskProfileSchema = new Schema<IRiskProfile>({
    userId: { type: String, required: true, unique: true },
    score: { type: Number, required: true },
    level: { type: String, enum: ['conservative', 'moderate', 'aggressive'], required: true },
    answers: { type: Map, of: Number },
    allocation: {
        equity: Number,
        debt: Number,
        gold: Number,
        cash: Number,
    },
}, { timestamps: true });

// Model exports - check if model exists before creating
export const Asset: Model<IAsset> = mongoose.models.Asset || mongoose.model<IAsset>('Asset', AssetSchema);
export const Liability: Model<ILiability> = mongoose.models.Liability || mongoose.model<ILiability>('Liability', LiabilitySchema);
export const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
export const Investment: Model<IInvestment> = mongoose.models.Investment || mongoose.model<IInvestment>('Investment', InvestmentSchema);
export const Goal: Model<IGoal> = mongoose.models.Goal || mongoose.model<IGoal>('Goal', GoalSchema);
export const WatchlistItem: Model<IWatchlistItem> = mongoose.models.WatchlistItem || mongoose.model<IWatchlistItem>('WatchlistItem', WatchlistSchema);
export const PaperTrade: Model<IPaperTrade> = mongoose.models.PaperTrade || mongoose.model<IPaperTrade>('PaperTrade', PaperTradeSchema);
export const PaperPortfolio: Model<IPaperPortfolio> = mongoose.models.PaperPortfolio || mongoose.model<IPaperPortfolio>('PaperPortfolio', PaperPortfolioSchema);
export const RiskProfile: Model<IRiskProfile> = mongoose.models.RiskProfile || mongoose.model<IRiskProfile>('RiskProfile', RiskProfileSchema);

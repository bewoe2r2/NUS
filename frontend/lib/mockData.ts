/**
 * Bewo Clinical Dashboard - Mock Data Layer
 * Provides comprehensive mock data for all dashboard components.
 * Ensures the dashboard always renders with realistic data.
 */

// ============================================================================
// TYPES
// ============================================================================

export type HealthState = 'STABLE' | 'WARNING' | 'CRISIS';

export interface DayData {
    date: string; // YYYY-MM-DD
    state: HealthState;
    confidence: number;
    glucose: { avg: number; variability: number; readings: number[] };
    steps: number;
    sleep: number; // hours
    hrv: number; // ms (RMSSD)
    restingHR: number;
    medsAdherence: number; // 0-1
    carbsIntake: number; // grams
    socialEngagement: number; // 0-10
    alerts: string[];
}

export interface SurvivalPoint {
    hours: number;
    survival_prob: number;
}

export interface FeatureDistribution {
    feature: string;
    label: string;
    weight: number;
    observedValue: number | null;
    unit: string;
    curves: {
        state: HealthState;
        mean: number;
        variance: number;
    }[];
}

// ============================================================================
// FEATURE DEFINITIONS (From HMM Engine)
// ============================================================================

export const HMM_FEATURES: FeatureDistribution[] = [
    {
        feature: 'glucose_avg',
        label: 'Glucose (Avg)',
        weight: 0.25,
        observedValue: null,
        unit: 'mmol/L',
        curves: [
            { state: 'STABLE', mean: 6.5, variance: 0.8 },
            { state: 'WARNING', mean: 9.0, variance: 1.5 },
            { state: 'CRISIS', mean: 14.0, variance: 3.0 },
        ],
    },
    {
        feature: 'glucose_variability',
        label: 'Glucose CV%',
        weight: 0.10,
        observedValue: null,
        unit: '%',
        curves: [
            { state: 'STABLE', mean: 15, variance: 4 },
            { state: 'WARNING', mean: 28, variance: 6 },
            { state: 'CRISIS', mean: 45, variance: 10 },
        ],
    },
    {
        feature: 'meds_adherence',
        label: 'Medication',
        weight: 0.18,
        observedValue: null,
        unit: '%',
        curves: [
            { state: 'STABLE', mean: 95, variance: 5 },
            { state: 'WARNING', mean: 70, variance: 15 },
            { state: 'CRISIS', mean: 40, variance: 20 },
        ],
    },
    {
        feature: 'carbs_intake',
        label: 'Carbs',
        weight: 0.07,
        observedValue: null,
        unit: 'g',
        curves: [
            { state: 'STABLE', mean: 150, variance: 30 },
            { state: 'WARNING', mean: 220, variance: 40 },
            { state: 'CRISIS', mean: 300, variance: 60 },
        ],
    },
    {
        feature: 'steps_daily',
        label: 'Steps',
        weight: 0.08,
        observedValue: null,
        unit: 'steps',
        curves: [
            { state: 'STABLE', mean: 8000, variance: 2000 },
            { state: 'WARNING', mean: 4000, variance: 1500 },
            { state: 'CRISIS', mean: 1500, variance: 800 },
        ],
    },
    {
        feature: 'resting_hr',
        label: 'Resting HR',
        weight: 0.05,
        observedValue: null,
        unit: 'bpm',
        curves: [
            { state: 'STABLE', mean: 65, variance: 8 },
            { state: 'WARNING', mean: 78, variance: 10 },
            { state: 'CRISIS', mean: 95, variance: 15 },
        ],
    },
    {
        feature: 'hrv_rmssd',
        label: 'HRV (RMSSD)',
        weight: 0.07,
        observedValue: null,
        unit: 'ms',
        curves: [
            { state: 'STABLE', mean: 45, variance: 12 },
            { state: 'WARNING', mean: 28, variance: 8 },
            { state: 'CRISIS', mean: 15, variance: 5 },
        ],
    },
    {
        feature: 'sleep_quality',
        label: 'Sleep',
        weight: 0.10,
        observedValue: null,
        unit: 'hrs',
        curves: [
            { state: 'STABLE', mean: 7.5, variance: 0.8 },
            { state: 'WARNING', mean: 5.5, variance: 1.2 },
            { state: 'CRISIS', mean: 4.0, variance: 1.5 },
        ],
    },
    {
        feature: 'social_engagement',
        label: 'Social Score',
        weight: 0.10,
        observedValue: null,
        unit: '/10',
        curves: [
            { state: 'STABLE', mean: 7, variance: 1.5 },
            { state: 'WARNING', mean: 4, variance: 1.5 },
            { state: 'CRISIS', mean: 2, variance: 1 },
        ],
    },
];

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

function randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min;
}

function generateGlucoseReadings(state: HealthState): number[] {
    const base = state === 'STABLE' ? 6.5 : state === 'WARNING' ? 9.0 : 14.0;
    const variance = state === 'STABLE' ? 1.0 : state === 'WARNING' ? 2.0 : 4.0;
    return Array.from({ length: 6 }, () =>
        Math.max(3.5, base + (Math.random() - 0.5) * variance * 2)
    );
}

function generateDayData(date: Date, stateOverride?: HealthState): DayData {
    // Determine state based on date pattern (create realistic scenario)
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();

    let state: HealthState;
    if (stateOverride) {
        state = stateOverride;
    } else if (dayOfMonth === 10 || dayOfMonth === 11) {
        state = 'CRISIS';
    } else if (dayOfMonth % 7 === 0 || dayOfWeek === 0) {
        state = 'WARNING';
    } else {
        state = 'STABLE';
    }

    const glucoseReadings = generateGlucoseReadings(state);
    const glucoseAvg = glucoseReadings.reduce((a, b) => a + b, 0) / glucoseReadings.length;

    return {
        date: date.toISOString().split('T')[0],
        state,
        confidence: state === 'STABLE' ? randomInRange(0.85, 0.95) :
            state === 'WARNING' ? randomInRange(0.70, 0.85) :
                randomInRange(0.80, 0.92),
        glucose: {
            avg: glucoseAvg,
            variability: state === 'STABLE' ? randomInRange(12, 20) :
                state === 'WARNING' ? randomInRange(25, 35) :
                    randomInRange(40, 55),
            readings: glucoseReadings,
        },
        steps: state === 'STABLE' ? Math.round(randomInRange(6000, 10000)) :
            state === 'WARNING' ? Math.round(randomInRange(3000, 5000)) :
                Math.round(randomInRange(500, 2000)),
        sleep: state === 'STABLE' ? randomInRange(7, 8.5) :
            state === 'WARNING' ? randomInRange(5, 6.5) :
                randomInRange(3.5, 5),
        hrv: state === 'STABLE' ? randomInRange(38, 55) :
            state === 'WARNING' ? randomInRange(22, 35) :
                randomInRange(10, 20),
        restingHR: state === 'STABLE' ? Math.round(randomInRange(58, 72)) :
            state === 'WARNING' ? Math.round(randomInRange(72, 85)) :
                Math.round(randomInRange(88, 105)),
        medsAdherence: state === 'STABLE' ? randomInRange(0.9, 1.0) :
            state === 'WARNING' ? randomInRange(0.6, 0.8) :
                randomInRange(0.2, 0.5),
        carbsIntake: state === 'STABLE' ? Math.round(randomInRange(120, 180)) :
            state === 'WARNING' ? Math.round(randomInRange(200, 260)) :
                Math.round(randomInRange(280, 350)),
        socialEngagement: state === 'STABLE' ? randomInRange(6, 9) :
            state === 'WARNING' ? randomInRange(3, 5) :
                randomInRange(1, 3),
        alerts: state === 'CRISIS' ? ['High glucose detected', 'Missed medication'] :
            state === 'WARNING' ? ['Low activity today'] : [],
    };
}

// ============================================================================
// EXPORTED MOCK DATA
// ============================================================================

/**
 * Generate 14 days of mock historical data
 */
export function generate14DayHistory(): DayData[] {
    const days: DayData[] = [];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push(generateDayData(date));
    }

    return days;
}

/**
 * Mock survival curve (Monte Carlo forecast)
 */
export function generateSurvivalCurve(currentState: HealthState): SurvivalPoint[] {
    const baseRisk = currentState === 'STABLE' ? 0.05 :
        currentState === 'WARNING' ? 0.25 : 0.60;

    return Array.from({ length: 12 }, (_, i) => {
        const crisisProb = Math.min(0.95, baseRisk + (i * 0.03) + Math.random() * 0.05);
        return {
            hours: i * 4,
            survival_prob: 1 - crisisProb, // Survival = 1 - Crisis probability
        };
    });
}

/**
 * Mock transition matrix
 */
export function generateTransitionMatrix(currentState: HealthState): number[][] {
    // Rows: From State, Cols: To State
    // Order: [STABLE, WARNING, CRISIS]
    if (currentState === 'STABLE') {
        return [
            [0.85, 0.12, 0.03],
            [0.30, 0.55, 0.15],
            [0.10, 0.25, 0.65],
        ];
    } else if (currentState === 'WARNING') {
        return [
            [0.75, 0.20, 0.05],
            [0.25, 0.55, 0.20],
            [0.08, 0.22, 0.70],
        ];
    } else {
        return [
            [0.60, 0.30, 0.10],
            [0.20, 0.50, 0.30],
            [0.05, 0.20, 0.75],
        ];
    }
}

/**
 * Get feature distributions with observed values for a specific day
 */
export function getFeatureDistributions(dayData: DayData): FeatureDistribution[] {
    const featureMap: Record<string, number> = {
        glucose_avg: dayData.glucose.avg,
        glucose_variability: dayData.glucose.variability,
        meds_adherence: dayData.medsAdherence * 100,
        carbs_intake: dayData.carbsIntake,
        steps_daily: dayData.steps,
        resting_hr: dayData.restingHR,
        hrv_rmssd: dayData.hrv,
        sleep_quality: dayData.sleep,
        social_engagement: dayData.socialEngagement,
    };

    return HMM_FEATURES.map(f => ({
        ...f,
        observedValue: featureMap[f.feature] ?? null,
    }));
}

/**
 * Calculate log-likelihood for heatmap
 */
export function calculateLogLikelihood(features: FeatureDistribution[]): {
    feature: string;
    stable: number;
    warning: number;
    crisis: number;
}[] {
    return features.map(f => {
        const val = f.observedValue;
        if (val === null) {
            return { feature: f.label, stable: 0, warning: 0, crisis: 0 };
        }

        const logProb = (mean: number, variance: number): number => {
            const safeVariance = Math.max(variance, 1e-6);
            const diff = val - mean;
            return -0.5 * Math.log(2 * Math.PI * safeVariance) - (diff * diff) / (2 * safeVariance);
        };

        return {
            feature: f.label,
            stable: logProb(f.curves[0].mean, f.curves[0].variance) * f.weight,
            warning: logProb(f.curves[1].mean, f.curves[1].variance) * f.weight,
            crisis: logProb(f.curves[2].mean, f.curves[2].variance) * f.weight,
        };
    });
}

/**
 * Generate Gaussian curve points for visualization
 */
export function generateGaussianCurve(
    mean: number,
    variance: number,
    numPoints: number = 50
): { x: number; y: number }[] {
    const safeVariance = Math.max(variance, 1e-6);
    const safeNumPoints = Math.max(numPoints, 1);
    const std = Math.sqrt(safeVariance);
    const minX = mean - 3.5 * std;
    const maxX = mean + 3.5 * std;
    const step = safeNumPoints > 1 ? (maxX - minX) / (safeNumPoints - 1) : 0;

    return Array.from({ length: safeNumPoints }, (_, i) => {
        const x = minX + i * step;
        const y = (1 / (std * Math.sqrt(2 * Math.PI))) *
            Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
        return { x, y };
    });
}

// ============================================================================
// SEEDED RANDOM (for deterministic module-level constants)
// ============================================================================

function seededRandom(seed: number) {
    return () => {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

const rand = seededRandom(42);

function seededRandomInRange(min: number, max: number): number {
    return rand() * (max - min) + min;
}

function generateSeededGlucoseReadings(state: HealthState): number[] {
    const base = state === 'STABLE' ? 6.5 : state === 'WARNING' ? 9.0 : 14.0;
    const variance = state === 'STABLE' ? 1.0 : state === 'WARNING' ? 2.0 : 4.0;
    return Array.from({ length: 6 }, () =>
        Math.max(3.5, base + (rand() - 0.5) * variance * 2)
    );
}

function generateSeededDayData(date: Date, stateOverride?: HealthState): DayData {
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();

    let state: HealthState;
    if (stateOverride) {
        state = stateOverride;
    } else if (dayOfMonth === 10 || dayOfMonth === 11) {
        state = 'CRISIS';
    } else if (dayOfMonth % 7 === 0 || dayOfWeek === 0) {
        state = 'WARNING';
    } else {
        state = 'STABLE';
    }

    const glucoseReadings = generateSeededGlucoseReadings(state);
    const glucoseAvg = glucoseReadings.reduce((a, b) => a + b, 0) / glucoseReadings.length;

    return {
        date: date.toISOString().split('T')[0],
        state,
        confidence: state === 'STABLE' ? seededRandomInRange(0.85, 0.95) :
            state === 'WARNING' ? seededRandomInRange(0.70, 0.85) :
                seededRandomInRange(0.80, 0.92),
        glucose: {
            avg: glucoseAvg,
            variability: state === 'STABLE' ? seededRandomInRange(12, 20) :
                state === 'WARNING' ? seededRandomInRange(25, 35) :
                    seededRandomInRange(40, 55),
            readings: glucoseReadings,
        },
        steps: state === 'STABLE' ? Math.round(seededRandomInRange(6000, 10000)) :
            state === 'WARNING' ? Math.round(seededRandomInRange(3000, 5000)) :
                Math.round(seededRandomInRange(500, 2000)),
        sleep: state === 'STABLE' ? seededRandomInRange(7, 8.5) :
            state === 'WARNING' ? seededRandomInRange(5, 6.5) :
                seededRandomInRange(3.5, 5),
        hrv: state === 'STABLE' ? seededRandomInRange(38, 55) :
            state === 'WARNING' ? seededRandomInRange(22, 35) :
                seededRandomInRange(10, 20),
        restingHR: state === 'STABLE' ? Math.round(seededRandomInRange(58, 72)) :
            state === 'WARNING' ? Math.round(seededRandomInRange(72, 85)) :
                Math.round(seededRandomInRange(88, 105)),
        medsAdherence: state === 'STABLE' ? seededRandomInRange(0.9, 1.0) :
            state === 'WARNING' ? seededRandomInRange(0.6, 0.8) :
                seededRandomInRange(0.2, 0.5),
        carbsIntake: state === 'STABLE' ? Math.round(seededRandomInRange(120, 180)) :
            state === 'WARNING' ? Math.round(seededRandomInRange(200, 260)) :
                Math.round(seededRandomInRange(280, 350)),
        socialEngagement: state === 'STABLE' ? seededRandomInRange(6, 9) :
            state === 'WARNING' ? seededRandomInRange(3, 5) :
                seededRandomInRange(1, 3),
        alerts: state === 'CRISIS' ? ['High glucose detected', 'Missed medication'] :
            state === 'WARNING' ? ['Low activity today'] : [],
    };
}

function generateSeeded14DayHistory(): DayData[] {
    const days: DayData[] = [];
    const today = new Date();

    for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        days.push(generateSeededDayData(date));
    }

    return days;
}

function generateSeededSurvivalCurve(currentState: HealthState): SurvivalPoint[] {
    const baseRisk = currentState === 'STABLE' ? 0.05 :
        currentState === 'WARNING' ? 0.25 : 0.60;

    return Array.from({ length: 12 }, (_, i) => {
        const crisisProb = Math.min(0.95, baseRisk + (i * 0.03) + rand() * 0.05);
        return {
            hours: i * 4,
            survival_prob: 1 - crisisProb,
        };
    });
}

// ============================================================================
// PRE-GENERATED STATIC DATA (for consistent rendering)
// ============================================================================

export const MOCK_14_DAY_HISTORY = generateSeeded14DayHistory();
export const MOCK_TODAY = MOCK_14_DAY_HISTORY[MOCK_14_DAY_HISTORY.length - 1];
export const MOCK_SURVIVAL_CURVE = generateSeededSurvivalCurve(MOCK_TODAY.state);
export const MOCK_TRANSITION_MATRIX = generateTransitionMatrix(MOCK_TODAY.state);

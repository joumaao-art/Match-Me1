import { preferenceFit, type JobPreferences } from './job-preferences';

/**
 * AI-Powered Matching Engine for MatchMe
 * 
 * Uses embedding-based semantic similarity for intelligent matching.
 * Features:
 * - Text embedding generation for profiles and vacancies
 * - Cosine similarity for semantic matching
 * - Multi-factor weighted scoring (10 dimensions)
 * - Explainable recommendations (why each match was made)
 * - Learning from user interactions (adaptive weights)
 * - Compatibility score 0-100
 */

// ============================================================
// Types
// ============================================================

export interface MatchFactor {
  name: string;
  score: number;       // 0-1
  weight: number;      // 0-1
  explanation: string; // Human-readable reason
  details?: string[];  // Specific matching items
}

export interface MatchExplanation {
  overallScore: number;
  factors: MatchFactor[];
  topReasons: string[];
  improvementTips: string[];
  confidence: number; // How confident the AI is in this match
}

export interface EmbeddingVector {
  values: number[];
  dimension: number;
}

export interface ProfileEmbedding {
  id: string;
  type: 'seeker' | 'vacancy';
  embedding: EmbeddingVector;
  textRepresentation: string;
  lastUpdated: number;
}

export interface InteractionSignal {
  userId: string;
  targetId: string;
  action: 'swipe_right' | 'swipe_left' | 'view' | 'save' | 'apply' | 'message' | 'interview' | 'hire';
  timestamp: number;
  context?: Record<string, any>;
}

export interface AIMatchConfig {
  weights: {
    skills: number;
    experience: number;
    education: number;
    languages: number;
    salary: number;
    location: number;
    industry: number;
    workPreference: number;
    remotePolicy: number;
    availability: number;
  };
  embeddingDimension: number;
  learningRate: number;
  decayFactor: number;
  minConfidence: number;
}

export interface SeekerAIProfile {
  id: string;
  skills: { name: string; level: 'beginner' | 'intermediate' | 'advanced' | 'expert'; years: number }[];
  experienceYears: number;
  experienceDetails: string;
  education: { degree: string; field: string; institution: string }[];
  languages: { name: string; level: 'basic' | 'intermediate' | 'advanced' | 'native' }[];
  expectedSalary: { min: number; max: number; currency: string };
  location: { country: string; city: string; willingToRelocate: boolean };
  preferredIndustries: string[];
  workPreference: 'office' | 'hybrid' | 'remote';
  availability: 'immediate' | 'two_weeks' | 'one_month' | 'three_months' | 'negotiable';
  summary: string;
  preferredRoles: string[];
  jobPreferences?: JobPreferences;
}

export interface VacancyAIProfile {
  id: string;
  companyId: string;
  companyName: string;
  requiredSkills: { name: string; importance: 'required' | 'preferred' | 'nice_to_have' }[];
  experienceRange: { min: number; max: number };
  educationRequirement: { minDegree: string; preferredFields: string[] };
  requiredLanguages: { name: string; minLevel: string }[];
  salaryRange: { min: number; max: number; currency: string };
  location: { country: string; city: string };
  industry: string;
  workPolicy: 'office' | 'hybrid' | 'remote';
  employmentType?: string;
  seniorityLevel?: string;
  startDate: 'immediate' | 'flexible' | 'specific';
  description: string;
  title: string;
}

// ============================================================
// Default Configuration
// ============================================================

export const DEFAULT_AI_CONFIG: AIMatchConfig = {
  weights: {
    skills: 0.25,
    experience: 0.12,
    education: 0.08,
    languages: 0.07,
    salary: 0.13,
    location: 0.12,
    industry: 0.08,
    workPreference: 0.07,
    remotePolicy: 0.05,
    availability: 0.03,
  },
  embeddingDimension: 64,
  learningRate: 0.05,
  decayFactor: 0.95,
  minConfidence: 0.3,
};

// ============================================================
// Embedding Generator (Simulated - in production use OpenAI/Cohere)
// ============================================================

class EmbeddingGenerator {
  private dimension: number;
  private vocabCache: Map<string, number[]> = new Map();

  constructor(dimension: number = 64) {
    this.dimension = dimension;
  }

  /**
   * Generate a deterministic embedding from text using character-level hashing
   * In production, this would call an embedding API (OpenAI, Cohere, etc.)
   */
  generateEmbedding(text: string): EmbeddingVector {
    const normalized = text.toLowerCase().trim();
    
    // Check cache
    if (this.vocabCache.has(normalized)) {
      return { values: this.vocabCache.get(normalized)!, dimension: this.dimension };
    }

    const values = new Array(this.dimension).fill(0);
    const words = normalized.split(/\s+/);

    // Generate embedding using word-level feature hashing
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const idx = (charCode * 31 + j * 7 + i * 13) % this.dimension;
        const sign = ((charCode + j) % 2 === 0) ? 1 : -1;
        values[idx] += sign * (1.0 / Math.sqrt(words.length));
      }
    }

    // L2 normalize
    const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
    if (norm > 0) {
      for (let i = 0; i < values.length; i++) {
        values[i] /= norm;
      }
    }

    this.vocabCache.set(normalized, values);
    return { values, dimension: this.dimension };
  }

  /**
   * Generate embedding for a seeker profile
   */
  embedSeekerProfile(profile: SeekerAIProfile): EmbeddingVector {
    const textParts = [
      profile.skills.map(s => `${s.name} ${s.level} ${s.years}years`).join(' '),
      `experience ${profile.experienceYears} years ${profile.experienceDetails}`,
      profile.education.map(e => `${e.degree} ${e.field} ${e.institution}`).join(' '),
      profile.languages.map(l => `${l.name} ${l.level}`).join(' '),
      profile.preferredIndustries.join(' '),
      `${profile.location.country} ${profile.location.city}`,
      profile.workPreference,
      profile.availability,
      profile.summary,
      profile.preferredRoles.join(' '),
    ];
    return this.generateEmbedding(textParts.join(' '));
  }

  /**
   * Generate embedding for a vacancy
   */
  embedVacancy(vacancy: VacancyAIProfile): EmbeddingVector {
    const textParts = [
      vacancy.requiredSkills.map(s => `${s.name} ${s.importance}`).join(' '),
      `experience ${vacancy.experienceRange.min} to ${vacancy.experienceRange.max} years`,
      `${vacancy.educationRequirement.minDegree} ${vacancy.educationRequirement.preferredFields.join(' ')}`,
      vacancy.requiredLanguages.map(l => `${l.name} ${l.minLevel}`).join(' '),
      vacancy.industry,
      `${vacancy.location.country} ${vacancy.location.city}`,
      vacancy.workPolicy,
      vacancy.startDate,
      vacancy.description,
      vacancy.title,
    ];
    return this.generateEmbedding(textParts.join(' '));
  }
}

// ============================================================
// Similarity Calculator
// ============================================================

class SimilarityCalculator {
  /**
   * Cosine similarity between two vectors
   */
  static cosineSimilarity(a: EmbeddingVector, b: EmbeddingVector): number {
    if (a.dimension !== b.dimension) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.dimension; i++) {
      dotProduct += a.values[i] * b.values[i];
      normA += a.values[i] * a.values[i];
      normB += b.values[i] * b.values[i];
    }
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Jaccard similarity for skill sets
   */
  static jaccardSimilarity(setA: string[], setB: string[]): number {
    const a = new Set(setA.map(s => s.toLowerCase().trim()));
    const b = new Set(setB.map(s => s.toLowerCase().trim()));
    const intersection = new Set([...a].filter(x => b.has(x)));
    const union = new Set([...a, ...b]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  /**
   * Fuzzy string match score
   */
  static fuzzyMatch(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    if (s1 === s2) return 1;
    if (s1.includes(s2) || s2.includes(s1)) return 0.8;
    // Simple character overlap
    const chars1 = new Set(s1.split(''));
    const chars2 = new Set(s2.split(''));
    const intersection = [...chars1].filter(c => chars2.has(c)).length;
    return intersection / Math.max(chars1.size, chars2.size);
  }
}

// ============================================================
// AI Matching Engine
// ============================================================

export class AIMatchingEngine {
  private config: AIMatchConfig;
  private embedder: EmbeddingGenerator;
  private interactions: InteractionSignal[] = [];
  private adaptiveWeights: Map<string, AIMatchConfig['weights']> = new Map();
  private profileEmbeddings: Map<string, ProfileEmbedding> = new Map();

  constructor(config: AIMatchConfig = DEFAULT_AI_CONFIG) {
    this.config = config;
    this.embedder = new EmbeddingGenerator(config.embeddingDimension);
    this.loadState();
  }

  // ============================================================
  // Main Matching Function
  // ============================================================

  /**
   * Calculate AI-powered compatibility between a seeker and vacancy
   * Returns score 0-100 with full explanation
   */
  calculateMatch(seeker: SeekerAIProfile, vacancy: VacancyAIProfile): MatchExplanation {
    const weights = this.getAdaptiveWeights(seeker.id);

    // Calculate each factor
    const factors: MatchFactor[] = [
      this.scoreSkills(seeker, vacancy, weights.skills),
      this.scoreExperience(seeker, vacancy, weights.experience),
      this.scoreEducation(seeker, vacancy, weights.education),
      this.scoreLanguages(seeker, vacancy, weights.languages),
      this.scoreSalary(seeker, vacancy, weights.salary),
      this.scoreLocation(seeker, vacancy, weights.location),
      this.scoreIndustry(seeker, vacancy, weights.industry),
      this.scoreWorkPreference(seeker, vacancy, weights.workPreference),
      this.scoreRemotePolicy(seeker, vacancy, weights.remotePolicy),
      this.scoreAvailability(seeker, vacancy, weights.availability),
    ];

    // Semantic similarity bonus from embeddings
    const seekerEmb = this.getOrCreateEmbedding(seeker);
    const vacancyEmb = this.getOrCreateVacancyEmbedding(vacancy);
    const semanticSimilarity = SimilarityCalculator.cosineSimilarity(seekerEmb.embedding, vacancyEmb.embedding);
    const semanticBonus = Math.max(0, semanticSimilarity * 10); // Up to 10 bonus points

    // Calculate weighted score
    const weightedScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
    const preferenceScore = seeker.jobPreferences ? preferenceFit(seeker.jobPreferences, {
      title: vacancy.title, description: vacancy.description, skills: vacancy.requiredSkills.map(s => s.name),
      countryCode: /^[A-Z]{2}$/.test(vacancy.location.country) ? vacancy.location.country : undefined,
      employmentType: vacancy.employmentType, employmentStyle: vacancy.workPolicy === 'office' ? 'onsite' : vacancy.workPolicy, seniorityLevel: vacancy.seniorityLevel,
    }) : null;
    const rawScore = preferenceScore === null ? weightedScore * 100 + semanticBonus : (weightedScore * 100 + semanticBonus) * 0.85 + preferenceScore * 15;
    const overallScore = Math.round(Math.min(100, Math.max(0, rawScore)));

    // Generate top reasons
    const topReasons = this.generateTopReasons(factors, seeker, vacancy);

    // Generate improvement tips
    const improvementTips = this.generateImprovementTips(factors, seeker, vacancy);

    // Calculate confidence based on data completeness
    const confidence = this.calculateConfidence(seeker, vacancy, factors);

    return {
      overallScore,
      factors,
      topReasons,
      improvementTips,
      confidence,
    };
  }

  // ============================================================
  // Factor Scoring Functions
  // ============================================================

  private scoreSkills(seeker: SeekerAIProfile, vacancy: VacancyAIProfile, weight: number): MatchFactor {
    const seekerSkillNames = seeker.skills.map(s => s.name.toLowerCase());
    const requiredSkills = vacancy.requiredSkills.filter(s => s.importance === 'required');
    const preferredSkills = vacancy.requiredSkills.filter(s => s.importance === 'preferred');
    const niceToHave = vacancy.requiredSkills.filter(s => s.importance === 'nice_to_have');

    // Match required skills (most important)
    const requiredMatches = requiredSkills.filter(s => seekerSkillNames.includes(s.name.toLowerCase()));
    const preferredMatches = preferredSkills.filter(s => seekerSkillNames.includes(s.name.toLowerCase()));
    const niceMatches = niceToHave.filter(s => seekerSkillNames.includes(s.name.toLowerCase()));

    // Weighted skill score
    const requiredScore = requiredSkills.length > 0 ? requiredMatches.length / requiredSkills.length : 1;
    const preferredScore = preferredSkills.length > 0 ? preferredMatches.length / preferredSkills.length : 1;
    const niceScore = niceToHave.length > 0 ? niceMatches.length / niceToHave.length : 1;

    const score = requiredScore * 0.6 + preferredScore * 0.3 + niceScore * 0.1;

    // Consider skill level bonus
    const levelBonus = seeker.skills
      .filter(s => vacancy.requiredSkills.some(vs => vs.name.toLowerCase() === s.name.toLowerCase()))
      .reduce((sum, s) => {
        const levelMap: Record<string, number> = { expert: 0.1, advanced: 0.05, intermediate: 0, beginner: -0.05 };
        return sum + (levelMap[s.level] || 0);
      }, 0);

    const finalScore = Math.min(1, Math.max(0, score + levelBonus));

    const matchedDetails = requiredMatches.map(s => s.name);
    const missingDetails = requiredSkills.filter(s => !seekerSkillNames.includes(s.name.toLowerCase())).map(s => s.name);

    let explanation = '';
    if (finalScore >= 0.8) explanation = `Strong skill match: ${matchedDetails.join(', ')}`;
    else if (finalScore >= 0.5) explanation = `Partial skill match. Has: ${matchedDetails.join(', ')}. Missing: ${missingDetails.join(', ')}`;
    else explanation = `Skills gap. Missing required: ${missingDetails.join(', ')}`;

    return { name: 'Skills', score: finalScore, weight, explanation, details: [...matchedDetails.map(s => `✓ ${s}`), ...missingDetails.map(s => `✗ ${s}`)] };
  }

  private scoreExperience(seeker: SeekerAIProfile, vacancy: VacancyAIProfile, weight: number): MatchFactor {
    const { min, max } = vacancy.experienceRange;
    const years = seeker.experienceYears;
    let score: number;
    let explanation: string;

    if (years >= min && years <= max) {
      score = 1;
      explanation = `Perfect experience fit: ${years} years (required: ${min}-${max})`;
    } else if (years < min) {
      const gap = min - years;
      score = Math.max(0, 1 - gap * 0.25);
      explanation = `Under-experienced by ${gap} year(s). Required: ${min}-${max}, has: ${years}`;
    } else {
      const excess = years - max;
      score = Math.max(0.5, 1 - excess * 0.1);
      explanation = `Over-qualified by ${excess} year(s). May be overqualified but brings depth.`;
    }

    return { name: 'Experience', score, weight, explanation, details: [`${years} years (range: ${min}-${max})`] };
  }

  private scoreEducation(seeker: SeekerAIProfile, vacancy: VacancyAIProfile, weight: number): MatchFactor {
    const degreeRank: Record<string, number> = { 'high_school': 1, 'diploma': 2, 'bachelors': 3, 'masters': 4, 'phd': 5 };
    const seekerMaxDegree = Math.max(...seeker.education.map(e => degreeRank[e.degree.toLowerCase()] || 2), 0);
    const requiredDegree = degreeRank[vacancy.educationRequirement.minDegree.toLowerCase()] || 2;

    let score = seekerMaxDegree >= requiredDegree ? 1 : Math.max(0.3, seekerMaxDegree / requiredDegree);

    // Field match bonus
    const seekerFields = seeker.education.map(e => e.field.toLowerCase());
    const preferredFields = vacancy.educationRequirement.preferredFields.map(f => f.toLowerCase());
    const fieldMatch = preferredFields.length > 0 ? preferredFields.some(f => seekerFields.some(sf => sf.includes(f) || f.includes(sf))) : true;
    if (fieldMatch) score = Math.min(1, score + 0.1);

    const explanation = score >= 0.8
      ? `Education meets requirements. Field: ${seeker.education[0]?.field || 'N/A'}`
      : `Education partially matches. Required: ${vacancy.educationRequirement.minDegree}`;

    return { name: 'Education', score, weight, explanation, details: seeker.education.map(e => `${e.degree} in ${e.field}`) };
  }

  private scoreLanguages(seeker: SeekerAIProfile, vacancy: VacancyAIProfile, weight: number): MatchFactor {
    if (vacancy.requiredLanguages.length === 0) return { name: 'Languages', score: 1, weight, explanation: 'No language requirements specified', details: [] };

    const levelRank: Record<string, number> = { basic: 1, intermediate: 2, advanced: 3, native: 4 };
    let matchCount = 0;
    const details: string[] = [];

    for (const req of vacancy.requiredLanguages) {
      const seekerLang = seeker.languages.find(l => l.name.toLowerCase() === req.name.toLowerCase());
      if (seekerLang) {
        const seekerLevel = levelRank[seekerLang.level] || 0;
        const reqLevel = levelRank[req.minLevel] || 2;
        if (seekerLevel >= reqLevel) {
          matchCount++;
          details.push(`✓ ${req.name}: ${seekerLang.level}`);
        } else {
          details.push(`△ ${req.name}: has ${seekerLang.level}, needs ${req.minLevel}`);
          matchCount += 0.5;
        }
      } else {
        details.push(`✗ ${req.name}: not listed`);
      }
    }

    const score = matchCount / vacancy.requiredLanguages.length;
    const explanation = score >= 0.8 ? 'All language requirements met' : `${Math.round(matchCount)}/${vacancy.requiredLanguages.length} language requirements met`;

    return { name: 'Languages', score, weight, explanation, details };
  }

  private scoreSalary(seeker: SeekerAIProfile, vacancy: VacancyAIProfile, weight: number): MatchFactor {
    const seekerMin = seeker.expectedSalary.min;
    const seekerMax = seeker.expectedSalary.max;
    const vacMin = vacancy.salaryRange.min;
    const vacMax = vacancy.salaryRange.max;

    let score: number;
    let explanation: string;

    // Check overlap
    const overlapStart = Math.max(seekerMin, vacMin);
    const overlapEnd = Math.min(seekerMax, vacMax);

    if (overlapStart <= overlapEnd) {
      // There's overlap
      const overlapRange = overlapEnd - overlapStart;
      const seekerRange = seekerMax - seekerMin;
      score = seekerRange > 0 ? Math.min(1, 0.7 + (overlapRange / seekerRange) * 0.3) : 1;
      explanation = `Salary ranges overlap: ${overlapStart.toLocaleString()}-${overlapEnd.toLocaleString()} ${vacancy.salaryRange.currency}`;
    } else if (vacMax < seekerMin) {
      const gap = (seekerMin - vacMax) / seekerMin;
      score = Math.max(0, 1 - gap * 2);
      explanation = `Budget below expectations. Offered: up to ${vacMax.toLocaleString()}, expected: from ${seekerMin.toLocaleString()}`;
    } else {
      score = 1;
      explanation = `Company offers above expectations. Great salary fit!`;
    }

    return { name: 'Salary', score, weight, explanation, details: [`Expected: ${seekerMin.toLocaleString()}-${seekerMax.toLocaleString()}`, `Offered: ${vacMin.toLocaleString()}-${vacMax.toLocaleString()}`] };
  }

  private scoreLocation(seeker: SeekerAIProfile, vacancy: VacancyAIProfile, weight: number): MatchFactor {
    const seekerCity = seeker.location.city.toLowerCase();
    const seekerCountry = seeker.location.country.toLowerCase();
    const vacCity = vacancy.location.city.toLowerCase();
    const vacCountry = vacancy.location.country.toLowerCase();

    let score: number;
    let explanation: string;

    if (vacancy.workPolicy === 'remote') {
      score = 1;
      explanation = 'Remote position - location is flexible';
    } else if (seekerCity === vacCity) {
      score = 1;
      explanation = `Same city: ${vacancy.location.city}`;
    } else if (seekerCountry === vacCountry) {
      score = 0.8;
      explanation = `Same country (${vacancy.location.country}), different city`;
    } else if (seeker.location.willingToRelocate) {
      score = 0.6;
      explanation = `Different location but willing to relocate to ${vacancy.location.city}, ${vacancy.location.country}`;
    } else {
      score = 0.2;
      explanation = `Location mismatch: ${seeker.location.city} vs ${vacancy.location.city}. Not willing to relocate.`;
    }

    return { name: 'Location', score, weight, explanation, details: [`Seeker: ${seeker.location.city}, ${seeker.location.country}`, `Job: ${vacancy.location.city}, ${vacancy.location.country}`] };
  }

  private scoreIndustry(seeker: SeekerAIProfile, vacancy: VacancyAIProfile, weight: number): MatchFactor {
    const preferred = seeker.preferredIndustries.map(i => i.toLowerCase());
    const vacIndustry = vacancy.industry.toLowerCase();

    let score: number;
    let explanation: string;

    if (preferred.length === 0) {
      score = 0.7;
      explanation = 'No industry preference specified';
    } else if (preferred.includes(vacIndustry)) {
      score = 1;
      explanation = `Industry match: ${vacancy.industry} is in preferred list`;
    } else if (preferred.some(p => vacIndustry.includes(p) || p.includes(vacIndustry))) {
      score = 0.7;
      explanation = `Related industry: ${vacancy.industry}`;
    } else {
      score = 0.3;
      explanation = `Industry mismatch: ${vacancy.industry} not in preferences (${seeker.preferredIndustries.join(', ')})`;
    }

    return { name: 'Industry', score, weight, explanation, details: [`Job: ${vacancy.industry}`, `Preferred: ${seeker.preferredIndustries.join(', ') || 'Any'}`] };
  }

  private scoreWorkPreference(seeker: SeekerAIProfile, vacancy: VacancyAIProfile, weight: number): MatchFactor {
    const seekerPref = seeker.workPreference;
    const vacPolicy = vacancy.workPolicy;

    let score: number;
    let explanation: string;

    if (seekerPref === vacPolicy) {
      score = 1;
      explanation = `Perfect work style match: ${vacPolicy}`;
    } else if ((seekerPref === 'hybrid' && (vacPolicy === 'office' || vacPolicy === 'remote')) ||
               (vacPolicy === 'hybrid' && (seekerPref === 'office' || seekerPref === 'remote'))) {
      score = 0.7;
      explanation = `Partial match: prefers ${seekerPref}, job offers ${vacPolicy}`;
    } else {
      score = 0.3;
      explanation = `Work style mismatch: prefers ${seekerPref}, job requires ${vacPolicy}`;
    }

    return { name: 'Work Preference', score, weight, explanation, details: [`Prefers: ${seekerPref}`, `Offered: ${vacPolicy}`] };
  }

  private scoreRemotePolicy(seeker: SeekerAIProfile, vacancy: VacancyAIProfile, weight: number): MatchFactor {
    // This is a more nuanced version of work preference
    const isRemoteSeeker = seeker.workPreference === 'remote';
    const isRemoteVacancy = vacancy.workPolicy === 'remote';

    let score: number;
    let explanation: string;

    if (isRemoteSeeker && isRemoteVacancy) {
      score = 1;
      explanation = 'Both prefer remote work - perfect alignment';
    } else if (!isRemoteSeeker && !isRemoteVacancy) {
      score = 0.9;
      explanation = 'Both prefer on-site/hybrid - good alignment';
    } else if (isRemoteVacancy && !isRemoteSeeker) {
      score = 0.8;
      explanation = 'Remote job available, seeker prefers office but has flexibility';
    } else {
      score = 0.4;
      explanation = 'Seeker prefers remote but job requires on-site presence';
    }

    return { name: 'Remote/Hybrid/Office', score, weight, explanation };
  }

  private scoreAvailability(seeker: SeekerAIProfile, vacancy: VacancyAIProfile, weight: number): MatchFactor {
    const availMap: Record<string, number> = { immediate: 0, two_weeks: 14, one_month: 30, three_months: 90, negotiable: 45 };
    const seekerDays = availMap[seeker.availability] ?? 30;

    let score: number;
    let explanation: string;

    if (vacancy.startDate === 'flexible') {
      score = 1;
      explanation = 'Flexible start date - any availability works';
    } else if (vacancy.startDate === 'immediate' && seeker.availability === 'immediate') {
      score = 1;
      explanation = 'Available immediately - perfect timing';
    } else if (vacancy.startDate === 'immediate' && seekerDays <= 14) {
      score = 0.8;
      explanation = `Available within 2 weeks - acceptable for immediate start`;
    } else if (vacancy.startDate === 'immediate' && seekerDays > 14) {
      score = Math.max(0.3, 1 - seekerDays / 90);
      explanation = `Notice period of ${seekerDays} days may delay start`;
    } else {
      score = 0.8;
      explanation = `Availability: ${seeker.availability}`;
    }

    return { name: 'Availability', score, weight, explanation, details: [`Available: ${seeker.availability}`, `Start: ${vacancy.startDate}`] };
  }

  // ============================================================
  // Explanation Generation
  // ============================================================

  private generateTopReasons(factors: MatchFactor[], seeker: SeekerAIProfile, vacancy: VacancyAIProfile): string[] {
    const reasons: string[] = [];
    const sortedFactors = [...factors].sort((a, b) => (b.score * b.weight) - (a.score * a.weight));

    for (const factor of sortedFactors.slice(0, 3)) {
      if (factor.score >= 0.7) {
        reasons.push(`Strong ${factor.name.toLowerCase()} alignment: ${factor.explanation}`);
      }
    }

    // Add semantic reason
    if (reasons.length < 3) {
      const roleMatch = seeker.preferredRoles.some(r =>
        vacancy.title.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(vacancy.title.toLowerCase())
      );
      if (roleMatch) reasons.push(`Role "${vacancy.title}" matches your preferred positions`);
    }

    if (reasons.length === 0) {
      reasons.push('This match is based on overall profile compatibility');
    }

    return reasons.slice(0, 3);
  }

  private generateImprovementTips(factors: MatchFactor[], seeker: SeekerAIProfile, vacancy: VacancyAIProfile): string[] {
    const tips: string[] = [];
    const weakFactors = factors.filter(f => f.score < 0.5).sort((a, b) => b.weight - a.weight);

    for (const factor of weakFactors.slice(0, 2)) {
      switch (factor.name) {
        case 'Skills': {
          const missing = vacancy.requiredSkills
            .filter(s => s.importance === 'required')
            .filter(s => !seeker.skills.some(sk => sk.name.toLowerCase() === s.name.toLowerCase()))
            .map(s => s.name);
          if (missing.length > 0) tips.push(`Learn ${missing.slice(0, 2).join(' and ')} to improve this match`);
          break;
        }
        case 'Experience':
          if (seeker.experienceYears < vacancy.experienceRange.min) {
            tips.push(`Gain ${vacancy.experienceRange.min - seeker.experienceYears} more year(s) of experience`);
          }
          break;
        case 'Languages':
          tips.push('Add more language certifications to your profile');
          break;
        case 'Location':
          tips.push('Consider enabling "willing to relocate" for more opportunities');
          break;
        default:
          tips.push(`Improve your ${factor.name.toLowerCase()} section for better matches`);
      }
    }

    return tips;
  }

  private calculateConfidence(seeker: SeekerAIProfile, vacancy: VacancyAIProfile, factors: MatchFactor[]): number {
    // Confidence based on data completeness
    let completeness = 0;
    if (seeker.skills.length > 0) completeness += 0.2;
    if (seeker.experienceYears > 0) completeness += 0.15;
    if (seeker.education.length > 0) completeness += 0.1;
    if (seeker.languages.length > 0) completeness += 0.1;
    if (seeker.expectedSalary.min > 0) completeness += 0.15;
    if (seeker.preferredIndustries.length > 0) completeness += 0.1;
    if (seeker.summary.length > 20) completeness += 0.1;
    if (vacancy.requiredSkills.length > 0) completeness += 0.1;

    // Factor variance (low variance = more confident)
    const scores = factors.map(f => f.score);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length;
    const variancePenalty = Math.min(0.2, variance);

    return Math.min(1, Math.max(this.config.minConfidence, completeness - variancePenalty));
  }

  // ============================================================
  // Embedding Management
  // ============================================================

  private getOrCreateEmbedding(seeker: SeekerAIProfile): ProfileEmbedding {
    const existing = this.profileEmbeddings.get(seeker.id);
    if (existing && Date.now() - existing.lastUpdated < 3600000) return existing;

    const embedding = this.embedder.embedSeekerProfile(seeker);
    const profile: ProfileEmbedding = {
      id: seeker.id,
      type: 'seeker',
      embedding,
      textRepresentation: seeker.summary,
      lastUpdated: Date.now(),
    };
    this.profileEmbeddings.set(seeker.id, profile);
    return profile;
  }

  private getOrCreateVacancyEmbedding(vacancy: VacancyAIProfile): ProfileEmbedding {
    const existing = this.profileEmbeddings.get(vacancy.id);
    if (existing && Date.now() - existing.lastUpdated < 3600000) return existing;

    const embedding = this.embedder.embedVacancy(vacancy);
    const profile: ProfileEmbedding = {
      id: vacancy.id,
      type: 'vacancy',
      embedding,
      textRepresentation: vacancy.description,
      lastUpdated: Date.now(),
    };
    this.profileEmbeddings.set(vacancy.id, profile);
    return profile;
  }

  // ============================================================
  // Learning from Interactions
  // ============================================================

  /**
   * Record a user interaction to improve future recommendations
   */
  /**
   * Withdraws the latest pass signal for a target (Discover Undo) so it is no
   * longer retained as negative feedback, then rebuilds that user's adaptive
   * weights from the remaining history.
   */
  revokeInteraction(userId: string, targetId: string, action: InteractionSignal['action'] = 'swipe_left'): boolean {
    for (let i = this.interactions.length - 1; i >= 0; i--) {
      const s = this.interactions[i];
      if (s.userId === userId && s.targetId === targetId && s.action === action) {
        this.interactions.splice(i, 1);
        this.adaptiveWeights.delete(userId);
        this.interactions.filter(x => x.userId === userId).forEach(x => this.updateAdaptiveWeights(x));
        this.saveState();
        return true;
      }
    }
    return false;
  }

  recordInteraction(signal: InteractionSignal) {
    this.interactions.push(signal);
    this.updateAdaptiveWeights(signal);
    this.saveState();
  }

  /**
   * Update weights based on user behavior patterns
   */
  private updateAdaptiveWeights(signal: InteractionSignal) {
    const userId = signal.userId;
    const currentWeights = this.getAdaptiveWeights(userId);
    const lr = this.config.learningRate;

    // Positive signals boost certain weights
    if (signal.action === 'swipe_right' || signal.action === 'apply' || signal.action === 'save') {
      // Analyze what factors were strong in this match and reinforce them
      const context = signal.context;
      if (context) {
        if (context.skillMatch > 0.8) currentWeights.skills = Math.min(0.4, currentWeights.skills + lr);
        if (context.locationMatch > 0.8) currentWeights.location = Math.min(0.3, currentWeights.location + lr);
        if (context.salaryMatch > 0.8) currentWeights.salary = Math.min(0.3, currentWeights.salary + lr);
        if (context.remoteMatch > 0.8) currentWeights.remotePolicy = Math.min(0.2, currentWeights.remotePolicy + lr);
      }
    }

    // Negative signals reduce weights for factors that were high
    if (signal.action === 'swipe_left') {
      const context = signal.context;
      if (context) {
        if (context.skillMatch > 0.8) currentWeights.skills = Math.max(0.1, currentWeights.skills - lr * 0.5);
        if (context.locationMatch > 0.8 && context.overallScore < 50) {
          currentWeights.location = Math.max(0.05, currentWeights.location - lr * 0.3);
        }
      }
    }

    // Normalize weights to sum to 1
    const sum = Object.values(currentWeights).reduce((a, b) => a + b, 0);
    (Object.keys(currentWeights) as (keyof typeof currentWeights)[]).forEach(key => {
      currentWeights[key] /= sum;
    });

    this.adaptiveWeights.set(userId, currentWeights);
  }

  /**
   * Get personalized weights for a user (or defaults)
   */
  private getAdaptiveWeights(userId: string): AIMatchConfig['weights'] {
    if (this.adaptiveWeights.has(userId)) {
      return { ...this.adaptiveWeights.get(userId)! };
    }
    return { ...this.config.weights };
  }

  /**
   * Apply time decay to old interactions
   */
  applyDecay() {
    const now = Date.now();
    const dayMs = 86400000;
    this.interactions = this.interactions.filter(i => (now - i.timestamp) < dayMs * 90); // Keep 90 days
  }

  // ============================================================
  // Batch Recommendations
  // ============================================================

  /**
   * Get ranked recommendations for a seeker
   */
  getRecommendations(seeker: SeekerAIProfile, vacancies: VacancyAIProfile[], limit: number = 20): { vacancy: VacancyAIProfile; explanation: MatchExplanation }[] {
    return vacancies
      .map(vacancy => ({
        vacancy,
        explanation: this.calculateMatch(seeker, vacancy),
      }))
      .filter(r => r.explanation.overallScore >= 20) // Minimum threshold
      .sort((a, b) => b.explanation.overallScore - a.explanation.overallScore)
      .slice(0, limit);
  }

  /**
   * Get ranked candidates for a vacancy
   */
  getCandidateRankings(vacancy: VacancyAIProfile, seekers: SeekerAIProfile[], limit: number = 20): { seeker: SeekerAIProfile; explanation: MatchExplanation }[] {
    return seekers
      .map(seeker => ({
        seeker,
        explanation: this.calculateMatch(seeker, vacancy),
      }))
      .filter(r => r.explanation.overallScore >= 20)
      .sort((a, b) => b.explanation.overallScore - a.explanation.overallScore)
      .slice(0, limit);
  }

  // ============================================================
  // Analytics
  // ============================================================

  /**
   * Get learning statistics for a user
   */
  getLearningStats(userId: string) {
    const userInteractions = this.interactions.filter(i => i.userId === userId);
    const rightSwipes = userInteractions.filter(i => i.action === 'swipe_right').length;
    const leftSwipes = userInteractions.filter(i => i.action === 'swipe_left').length;
    const applies = userInteractions.filter(i => i.action === 'apply').length;
    const weights = this.getAdaptiveWeights(userId);

    return {
      totalInteractions: userInteractions.length,
      rightSwipes,
      leftSwipes,
      applies,
      swipeRatio: rightSwipes + leftSwipes > 0 ? (rightSwipes / (rightSwipes + leftSwipes) * 100).toFixed(1) : '0',
      personalizedWeights: weights,
      isPersonalized: this.adaptiveWeights.has(userId),
      interactionsSinceLastUpdate: userInteractions.filter(i => Date.now() - i.timestamp < 86400000).length,
    };
  }

  // ============================================================
  // Persistence
  // ============================================================

  private saveState() {
    try {
      localStorage.setItem('matchme_ai_interactions', JSON.stringify(this.interactions.slice(-500)));
      localStorage.setItem('matchme_ai_weights', JSON.stringify(Object.fromEntries(this.adaptiveWeights)));
    } catch { /* Storage full */ }
  }

  private loadState() {
    try {
      const interactions = localStorage.getItem('matchme_ai_interactions');
      const weights = localStorage.getItem('matchme_ai_weights');
      if (interactions) this.interactions = JSON.parse(interactions);
      if (weights) {
        const parsed = JSON.parse(weights);
        Object.entries(parsed).forEach(([k, v]) => this.adaptiveWeights.set(k, v as any));
      }
    } catch { /* Corrupted */ }
  }

  /**
   * Reset learning for a user
   */
  resetLearning(userId: string) {
    this.adaptiveWeights.delete(userId);
    this.interactions = this.interactions.filter(i => i.userId !== userId);
    this.saveState();
  }
}

// ============================================================
// Singleton
// ============================================================

export const aiMatchingEngine = new AIMatchingEngine();
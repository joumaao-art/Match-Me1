import { extractRequirements, analyzeSkills, type VacancySkills, type SkillRequirement, type SkillSuggestion } from './skill-match-core';

/** Provider boundary: extraction/comparison remain independent of UI, confirmation and scoring. */
export interface SkillRecommendationProvider {
 readonly id:string;
 extract(vacancy:VacancySkills):SkillRequirement[];
 compare(requirements:SkillRequirement[],skills:string[]):SkillSuggestion[];
}
export const deterministicSkillProvider:SkillRecommendationProvider={
 id:'deterministic-v2',
 extract:extractRequirements,
 compare:(requirements,skills)=>analyzeSkills(requirements,skills,{}),
};

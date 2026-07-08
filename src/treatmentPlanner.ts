import { PatientDetails, CephalometricInput, OciResult } from './types';
import { ClinicalNarrativeQA } from './lib/narrativeQA';
import { OrthoKnowledgeBase } from './lib/knowledgeEngine';

export interface TreatmentPlanningOptions {
  ageGroup: 'growing' | 'adult';
  crowdingSeverity: 'none' | 'mild' | 'moderate' | 'severe';
  spacingSeverity: 'none' | 'mild' | 'moderate' | 'severe';
  archDiscrepancy: number; // in mm
}

export interface TreatmentPlanResult {
  severityAssessment: string;
  skeletalPattern: string;
  dentalCompensation: string;
  occlusalSummary: string;
  treatmentComplexity: 'Simple' | 'Moderate' | 'Complex' | 'Severe / Surgical';
  
  // Treatment categories
  growthModification: {
    applicable: boolean;
    timingConsideration: string;
    growthGuidanceOptions: string[];
  };
  
  orthodonticCamouflage: {
    applicable: boolean;
    extractionConsideration: string;
    spaceManagement: string;
    incisorCompensationStrategies: string;
    anchorageConsiderations: string;
  };
  
  surgicalOrthodontics: {
    applicable: boolean;
    severeSkeletalDiscrepancyFlag: boolean;
    orthognathicReferralConsideration: string;
  };
  
  // Appliances
  applianceSuggestions: {
    category: string;
    justification: string;
    items: string[];
  }[];
  
  // Clinical Report sections
  problemList: string[];
  treatmentObjectives: string[];
  retentionConsiderations: string[];
  
  possibleApproaches: {
    name: string;
    description: string;
    advantages: string[];
    disadvantages: string[];
  }[];
}

/**
 * Expert system clinical rules engine to formulate treatment consideration.
 */
export function generateTreatmentPlan(
  patient: PatientDetails,
  ceph: CephalometricInput,
  oci: OciResult,
  options: TreatmentPlanningOptions
): TreatmentPlanResult {
  const isClass1 = patient.diagnosis === 'Class I';
  const isClass2 = patient.diagnosis === 'Class II';
  const isClass3 = patient.diagnosis === 'Class III';
  
  const anb = typeof ceph.anb === 'number' ? ceph.anb : 2;
  const impa = typeof ceph.impa === 'number' ? ceph.impa : 90;
  const u1sn = typeof ceph.u1Sn === 'number' ? ceph.u1Sn : 104;
  const overjet = typeof ceph.overjet === 'number' ? ceph.overjet : 2.5;
  const overbite = typeof ceph.overbite === 'number' ? ceph.overbite : 2.5;
  
  const problemList: string[] = [];
  const treatmentObjectives: string[] = [];
  const applianceSuggestions: { category: string; justification: string; items: string[] }[] = [];
  const retentionConsiderations: string[] = [
    OrthoKnowledgeBase.RetentionRules.DualRetention,
    OrthoKnowledgeBase.RetentionRules.ActiveRetention
  ];

  // 1. Diagnose skeletal pattern
  let skeletalPatternDesc = '';
  if (isClass2 || anb >= OrthoKnowledgeBase.SkeletalSagittal.ClassII.anbRange.min) {
    skeletalPatternDesc = `Skeletal Class II relationship characterized by a positive sagittal discrepancy (ANB: ${anb}°). `;
    if (ceph.sna !== '' && (ceph.sna as number) > 84) {
      skeletalPatternDesc += 'Primary etiology is maxillary protrusion/prognathism. ';
      problemList.push('Maxillary skeletal protrusion');
    } else if (ceph.snb !== '' && (ceph.snb as number) < 78) {
      skeletalPatternDesc += 'Primary etiology is mandibular skeletal retrognathia. ';
      problemList.push('Mandibular skeletal retrognathia (short mandible)');
    } else {
      skeletalPatternDesc += 'Etiology is a combination of maxillary and mandibular skeletal elements. ';
    }
  } else if (isClass3 || anb <= OrthoKnowledgeBase.SkeletalSagittal.ClassIII.anbRange.max) {
    skeletalPatternDesc = `Skeletal Class III relationship characterized by a negative sagittal discrepancy (ANB: ${anb}°). `;
    if (ceph.sna !== '' && (ceph.sna as number) < 79) {
      skeletalPatternDesc += 'Primary factor is maxillary hypoplasia / retrusion. ';
      problemList.push('Maxillary skeletal retrognathia (hypoplasia)');
    } else if (ceph.snb !== '' && (ceph.snb as number) > 81) {
      skeletalPatternDesc += 'Primary factor is mandibular skeletal prognathism (excess). ';
      problemList.push('Mandibular skeletal excess / prognathism');
    } else {
      skeletalPatternDesc += 'Etiology is a combined maxillo-mandibular skeletal imbalance. ';
    }
  } else {
    skeletalPatternDesc = `Skeletal Class I relationship with normal jaw harmony (ANB: ${anb}°). `;
  }

  // 2. Dental Compensation assessment
  let dentalCompensationDesc = '';
  if (isClass2) {
    if (impa > 95) {
      dentalCompensationDesc = `Natural dental compensation is observed via excessive mandibular incisor proclination (IMPA: ${impa}°) and labial tipping to span the sagittal gap. `;
      problemList.push(`Dentoalveolar compensation: Mandibular incisor proclination (IMPA: ${impa}°)`);
      treatmentObjectives.push('Manage and control lower incisor proclination to preserve labial alveolar bone plates');
    } else if (impa < 87) {
      dentalCompensationDesc = `Mandibular incisors are retroclined (IMPA: ${impa}°), which is atypical for Class II and represents decompensation, increasing the effective overjet. `;
      problemList.push(`Decompensated lower incisors (IMPA: ${impa}°)`);
    } else {
      dentalCompensationDesc = `Mandibular incisors reside in a relatively normal range (IMPA: ${impa}°). `;
    }
    
    if (u1sn < 100) {
      dentalCompensationDesc += `Upper incisors are retroclined (U1-SN: ${u1sn}°), indicating a Division 2 compensatory pattern.`;
      problemList.push(`Upper incisor retroclination (U1-SN: ${u1sn}°)`);
      treatmentObjectives.push('Intrude and flare upper incisors to unlock mandibular advancement path');
    }
  } else if (isClass3) {
    if (u1sn > 110) {
      dentalCompensationDesc = `Significant dental compensation is present with highly proclined upper incisors (U1-SN: ${u1sn}°) attempting to bypass the Class III skeletal discrepancy. `;
      problemList.push(`Dentoalveolar compensation: Maxillary incisor proclination (U1-SN: ${u1sn}°)`);
      treatmentObjectives.push('Maintain or gently upright excessively flared upper incisors to minimize periodontal strain');
    }
    if (impa < 85) {
      dentalCompensationDesc += `Mandibular incisors display compensatory lingual retroclination (IMPA: ${impa}°) to establish positive overjet.`;
      problemList.push(`Dentoalveolar compensation: Mandibular incisor retroclination (IMPA: ${impa}°)`);
    }
  } else {
    dentalCompensationDesc = `Upper (U1-SN: ${u1sn}°) and lower incisors (IMPA: ${impa}°) display minimal sagittal tipping compensation. `;
  }

  // Crowding / Spacing Problems
  if (options.crowdingSeverity !== 'none') {
    problemList.push(`${options.crowdingSeverity.charAt(0).toUpperCase() + options.crowdingSeverity.slice(1)} dental crowding in arches`);
    treatmentObjectives.push('Resolve dental crowding and achieve clean arch alignment');
  }
  if (options.spacingSeverity !== 'none') {
    problemList.push(`${options.spacingSeverity.charAt(0).toUpperCase() + options.spacingSeverity.slice(1)} space distribution`);
    treatmentObjectives.push('Close anterior/posterior spacing and stabilize contact points');
  }
  if (ceph.crossbite && ceph.crossbite !== 'None') {
    problemList.push(`${ceph.crossbite} crossbite`);
    treatmentObjectives.push('Correct anterior/posterior crossbite relationships');
  }
  if (overjet > 4) {
    problemList.push(`Increased overjet (${overjet}mm)`);
    treatmentObjectives.push('Reduce overjet to normal range (2-3mm)');
  } else if (overjet < 0) {
    problemList.push(`Negative overjet / Anterior crossbite (${overjet}mm)`);
    treatmentObjectives.push('Eliminate anterior crossbite and establish positive overjet');
  }
  if (overbite > 4) {
    problemList.push(`Deep overbite (${overbite}mm)`);
    treatmentObjectives.push('Reduce deep overbite to achieve healthy incisal contact');
  } else if (overbite < 1) {
    problemList.push(`Reduced overbite / Open bite (${overbite}mm)`);
    treatmentObjectives.push('Correct open bite / establish functional overbite');
  }

  // 3. Complexity Level Determination
  let complexity: 'Simple' | 'Moderate' | 'Complex' | 'Severe / Surgical' = 'Simple';
  if (oci.totalScore > 65 || anb > 8 || anb < -2) {
    complexity = 'Severe / Surgical';
  } else if (oci.totalScore > 40 || options.crowdingSeverity === 'severe' || options.crowdingSeverity === 'moderate') {
    complexity = 'Complex';
  } else if (oci.totalScore > 20 || options.crowdingSeverity === 'mild') {
    complexity = 'Moderate';
  }

  // 4. Growth Modification options
  const isGrowing = options.ageGroup === 'growing';
  let growthModificationTiming = '';
  const growthGuidanceOptions: string[] = [];
  
  if (isGrowing) {
    if (isClass2) {
      growthModificationTiming = 'Peak skeletal growth velocity period (typically CS3 to CS4 stages on cervical vertebral maturation) is critical.';
      growthGuidanceOptions.push(
        'Mandibular promotion with functional appliances (e.g., Twin Block or Herbst appliance) to stimulate condylar modeling.',
        'High-pull headgear to control vertical maxillary growth if hyperdivergent skeletal pattern exists.'
      );
      applianceSuggestions.push({
        category: 'Functional Orthopedics',
        justification: 'Indicated for correcting skeletal Class II discrepancy via active mandibular growth stimulation during peak development.',
        items: ['Twin Block Appliance', 'Herbst Appliance', 'Forsus Fatigue Resistant Device']
      });
    } else if (isClass3) {
      growthModificationTiming = 'Early interceptive growth intervention is highly recommended before age 9 (CS1 to CS2 stages).';
      growthGuidanceOptions.push(
        'Maxillary protraction utilizing a reverse-pull facemask (Petit type) paired with a Rapid Palatal Expander (RPE).',
        'Alternating Rapid Maxillary Expansion and Constriction (Alt-RAMEC) protocol to disrupt circummaxillary sutures.'
      );
      applianceSuggestions.push({
        category: 'Orthopedic Protraction',
        justification: 'Indicated for skeletal Class III growing patients to release maxillary entrapment and stimulate midface sutural growth.',
        items: ['DeLaire/Petit Facemask', 'Rapid Palatal Expander (RPE) with hooks', 'Alt-RAMEC sutural expansion protocol']
      });
    } else {
      growthModificationTiming = 'Preventative and interceptive space preservation.';
      growthGuidanceOptions.push('Passive space maintenance to guide erupting dentition.');
    }
  } else {
    growthModificationTiming = 'Patient is skeletally mature. Growth modification mechanics are no longer biologically viable.';
  }

  // 5. Orthodontic Camouflage (Extraction/Non-extraction & space management)
  let extractionConsideration = '';
  let spaceManagement = '';
  let incisorCompStrats = '';
  let anchorageConsiderations = '';

  // Extraction rules
  if (options.crowdingSeverity === 'severe') {
    extractionConsideration = 'Bimaxillary or single arch extraction is highly indicated. Standard therapeutic extraction of four first premolars (14, 24, 34, 44) will yield required physical space to resolve severe crowding without pushing incisors out of labial alveolar bone.';
    spaceManagement = 'Complete use of extraction spaces to relieve local imbrication and retract proclined anterior teeth.';
  } else if (options.crowdingSeverity === 'moderate') {
    extractionConsideration = 'Borderline extraction case. Treatment planning must weigh patient profile convexities, periodontal biotype, and lip competence. Consider non-extraction with interproximal reduction (IPR) or orthodontic arch distalization vs. premolar extraction.';
    spaceManagement = 'Controlled arch development / expansion, selective interproximal reduction (IPR) up to 0.5mm per contact point, or molar distalization.';
  } else {
    extractionConsideration = 'Non-extraction approach is fully indicated. Arch integrity can be established safely without physical extractions.';
    spaceManagement = 'Arch alignment achieved through gentle transversal expansion, alignment mechanics, and optional minimal IPR.';
  }

  // Incisor Camouflage mechanics
  if (isClass2) {
    incisorCompStrats = `Controlled retroclination of maxillary incisors (reducing torque) combined with monitored proclination of mandibular incisors. Mandibular incisors must not exceed an IMPA of 110° to prevent alveolar bone dehiscence.`;
    anchorageConsiderations = 'Maximum anchorage in upper arch (TADs / Nance button) is indicated if extraction is used, to ensure extraction space is utilized solely for incisor retraction rather than molar mesialization.';
    if (options.crowdingSeverity === 'moderate' || options.crowdingSeverity === 'severe') {
      applianceSuggestions.push({
        category: 'Fixed Appliances & Anchorage',
        justification: 'Required for full leveling, alignment, and maximum anchorage control during Class II dental camouflage retraction.',
        items: ['0.022-inch Slot Pre-adjusted Edgewise Brackets', 'Transpalatal Arch (TPA)', 'Temporary Anchorage Devices (TADs) / Palatal Screws']
      });
    }
  } else if (isClass3) {
    incisorCompStrats = `Proclination of maxillary anterior segment (U1-SN up to 120°) and retroclination/uprighting of mandibular anterior segment (IMPA reduced toward 80°). This achieves a stable positive overjet by masking the Class III skeletal base.`;
    anchorageConsiderations = 'Lower molar anchorage preservation is required. Consider lower arch Class III elastics or lower TADs to assist in total mandibular arch distalization.';
    applianceSuggestions.push({
      category: 'Fixed Brackets & Inter-arch Mechanics',
      justification: 'Necessary to coordinate dental arches and administer inter-arch force systems for skeletal Class III camouflage.',
      items: ['Class III Orthodontic Elastics (from lower anterior to upper posterior)', 'Lower Lingual Arch (LLA) for anchor consolidation', 'Palatal TAD-supported Maxillary Distalizer']
    });
  } else {
    incisorCompStrats = 'Incisors should be maintained in their current biological sagittal zone with focus purely on alignment and minor torque correction.';
    anchorageConsiderations = 'Standard anchorage mechanics. Minimal or reciprocal anchorage is sufficient.';
  }

  // Transverse expansion appliance addition
  if (ceph.posteriorCrossbite && ceph.posteriorCrossbite !== 'None') {
    applianceSuggestions.unshift({
      category: 'Maxillary Arch Development',
      justification: `Directly indicated to correct ${ceph.posteriorCrossbite.toLowerCase()} posterior crossbite and resolve transverse skeletal/dental maxillary deficiency.`,
      items: [
        options.ageGroup === 'growing' ? 'Hyrax Rapid Palatal Expander (RPE)' : 'Miniscrew-Assisted Rapid Palatal Expander (MARPE)',
        'Quad Helix appliance for slow dental expansion'
      ]
    });
  }

  // Clear aligners justification
  if (complexity === 'Simple' || (complexity === 'Moderate' && options.spacingSeverity !== 'none')) {
    applianceSuggestions.push({
      category: 'Clear Aligner Systems',
      justification: 'A highly aesthetic, premium treatment modality. Best suited for resolving minor to moderate dental spacing/crowding and performing minor dental camouflage without severe skeletal disharmonies.',
      items: ['Sequential Thermoplastic Clear Aligners (Invisalign/equivalent)', 'Attachment templates for root torque expression', 'IPR sequencing kits']
    });
  } else {
    applianceSuggestions.push({
      category: 'Clear Aligner Systems (Alternative)',
      justification: 'Can be utilized for complex camouflage cases, but requires advanced hybrid mechanics (TADs, elastics) and high patient compliance to address severe sagittal discrepancies.',
      items: ['Clear Aligners with precision cuts for elastics', 'Pre-aligner segmental fixed mechanics']
    });
  }

  // 6. Surgical Orthodontics
  let surgicalConsideration = '';
  const isSurgicalCandidate = complexity === 'Severe / Surgical';
  if (isSurgicalCandidate) {
    surgicalConsideration = `Critical skeletal discrepancy (ANB: ${anb}°, computed compensation index total score: ${oci.totalScore}/100) indicates that camouflage alone would carry substantial aesthetic, stability, and periodontal risks. Full orthognathic surgery referral is highly recommended for skeletal correction.`;
    problemList.unshift('Severe jaw sagittal skeletal disharmony');
  } else {
    surgicalConsideration = 'Skeletal pattern is mild-to-moderate. Orthognathic surgery is not standardly indicated. Camouflage is highly feasible.';
  }

  // 7. Approaches Advantages & Disadvantages
  const possibleApproaches: { name: string; description: string; advantages: string[]; disadvantages: string[] }[] = [];
  
  if (isGrowing) {
    possibleApproaches.push({
      name: 'Interceptive Growth Modification (Phase 1)',
      description: `Growth redirection and orthopedic orthopedic traction targeting the skeletal base (${isClass2 ? 'stimulating mandibular growth' : 'protracting the hypoplastic maxilla'}).`,
      advantages: [
        'Directly addresses the skeletal etiology of the malocclusion',
        'Improves skeletal jaw harmony and facial profile aesthetics early',
        'Reduces the complexity, duration, or necessity of a later Phase 2 orthodontic treatment or surgery'
      ],
      disadvantages: [
        'Completely reliant on strict patient compliance with orthopedic appliances',
        'Relies on favorable, active biological growth spurts',
        'Requires two distinct phases of clinical treatment (Phase 1 Orthopedic & Phase 2 Fixed)'
      ]
    });
  }

  possibleApproaches.push({
    name: 'Dentoalveolar Camouflage (Fixed Orthodontics)',
    description: 'Masking the skeletal discrepancy by strategically tipping, torqueing, and moving teeth without modifying the underlying skeletal jaw bases. May involve selective extractions.',
    advantages: [
      'Eliminates the risks, high costs, and downtime of orthognathic surgery',
      'Provides excellent dental occlusion and healthy intercuspation',
      'Can be performed with highly aesthetic clear aligners or low-friction bracket systems'
    ],
    disadvantages: [
      'Facial skeletal profile discrepancy remains unchanged (only dental masking achieved)',
      'Teeth are placed closer to their biological and periodontal boundary limits',
      'Inherent risk of alveolar bone thinning or root resorption if teeth are excessively flared'
    ]
  });

  if (isSurgicalCandidate || complexity === 'Complex') {
    possibleApproaches.push({
      name: 'Combined Orthognathic Surgery & Orthodontics',
      description: 'Orthodontic preparation (decompensation) to move teeth into their true anatomical alignment within each jaw, followed by surgical repositioning (osteotomies) of the maxilla and/or mandible, finalized with post-surgical orthodontic finishing.',
      advantages: [
        'Directly corrects the underlying skeletal imbalance for premium facial aesthetics',
        'Re-establishes ideal airway dimensions and improves joint (TMJ) relationships',
        'Allows for unmatched long-term stability and optimal periodontal bone support'
      ],
      disadvantages: [
        'Requires inpatient general anesthesia and a recovery window of several weeks',
        'Substantially higher financial cost and surgical risks (temporary or permanent paresthesia)',
        'Initial pre-surgical phase temporarily worsens dental appearance (unmasking of malocclusion)'
      ]
    });
  }

  // Summary prose
  let severityAssessment = '';
  if (oci.totalScore <= 20) {
    severityAssessment = 'The patient presents with minimal dentoalveolar sagittal compensation. The skeletal base is relatively harmonious, meaning orthodontic correction can focus primarily on leveling, alignment, and finishing.';
  } else if (oci.totalScore <= 40) {
    severityAssessment = 'The patient presents with a mild degree of dentoalveolar sagittal compensation. Traditional orthodontic alignment is fully realistic with typical mechanics.';
  } else if (oci.totalScore <= 60) {
    severityAssessment = 'The patient presents with moderate, borderline dentoalveolar compensation. Extreme dental tipping is present to mask the skeletal discrepancy. Periodontal boundaries are stretched, requiring a highly controlled camouflage plan or surgery.';
  } else {
    severityAssessment = 'The patient presents with severe to extreme dentoalveolar compensation, representing critical clinical limits. Camouflage mechanics are highly compromised, pointing heavily toward surgical corrective treatment.';
  }

  const context = { patient, ceph, oci };
  const rawPlan = {
    severityAssessment,
    skeletalPattern: skeletalPatternDesc,
    dentalCompensation: dentalCompensationDesc,
    occlusalSummary: `Molar relation: ${ceph.molarRelation || 'Unrecorded'}. Canine relation: ${ceph.canineRelation || 'Unrecorded'}. Overjet: ${overjet} mm. Overbite: ${overbite} mm.`,
    treatmentComplexity: complexity,
    
    growthModification: {
      applicable: isGrowing,
      timingConsideration: growthModificationTiming,
      growthGuidanceOptions: growthGuidanceOptions.map(s => ClinicalNarrativeQA.validateAndClean(s, context))
    },
    
    orthodonticCamouflage: {
      applicable: !isSurgicalCandidate,
      extractionConsideration,
      spaceManagement,
      incisorCompensationStrategies: incisorCompStrats,
      anchorageConsiderations
    },
    
    surgicalOrthodontics: {
      applicable: isSurgicalCandidate || anb < -1 || anb > 8,
      severeSkeletalDiscrepancyFlag: isSurgicalCandidate,
      orthognathicReferralConsideration: surgicalConsideration
    },
    
    applianceSuggestions: applianceSuggestions.map(app => ({
      category: app.category,
      justification: ClinicalNarrativeQA.validateAndClean(app.justification, context),
      items: app.items
    })),
    problemList: problemList.map(s => ClinicalNarrativeQA.validateAndClean(s, context)),
    treatmentObjectives: treatmentObjectives.map(s => ClinicalNarrativeQA.validateAndClean(s, context)),
    retentionConsiderations: retentionConsiderations.map(s => ClinicalNarrativeQA.validateAndClean(s, context)),
    possibleApproaches: possibleApproaches.map(app => ({
      ...app,
      description: ClinicalNarrativeQA.validateAndClean(app.description, context),
      advantages: app.advantages.map(s => ClinicalNarrativeQA.validateAndClean(s, context)),
      disadvantages: app.disadvantages.map(s => ClinicalNarrativeQA.validateAndClean(s, context))
    }))
  };

  // Run deep QA validation on top-level strings
  rawPlan.severityAssessment = ClinicalNarrativeQA.validateAndClean(rawPlan.severityAssessment, context);
  rawPlan.skeletalPattern = ClinicalNarrativeQA.validateAndClean(rawPlan.skeletalPattern, context);
  rawPlan.dentalCompensation = ClinicalNarrativeQA.validateAndClean(rawPlan.dentalCompensation, context);
  rawPlan.occlusalSummary = ClinicalNarrativeQA.validateAndClean(rawPlan.occlusalSummary, context);
  rawPlan.orthodonticCamouflage.extractionConsideration = ClinicalNarrativeQA.validateAndClean(rawPlan.orthodonticCamouflage.extractionConsideration, context);
  rawPlan.orthodonticCamouflage.spaceManagement = ClinicalNarrativeQA.validateAndClean(rawPlan.orthodonticCamouflage.spaceManagement, context);
  rawPlan.orthodonticCamouflage.incisorCompensationStrategies = ClinicalNarrativeQA.validateAndClean(rawPlan.orthodonticCamouflage.incisorCompensationStrategies, context);
  rawPlan.orthodonticCamouflage.anchorageConsiderations = ClinicalNarrativeQA.validateAndClean(rawPlan.orthodonticCamouflage.anchorageConsiderations, context);
  rawPlan.surgicalOrthodontics.orthognathicReferralConsideration = ClinicalNarrativeQA.validateAndClean(rawPlan.surgicalOrthodontics.orthognathicReferralConsideration, context);
  rawPlan.growthModification.timingConsideration = ClinicalNarrativeQA.validateAndClean(rawPlan.growthModification.timingConsideration, context);

  return rawPlan;
}

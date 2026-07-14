import { PatientDetails, CephalometricInput, OciResult } from './types';

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

  // OCI V4.1 DETERMINISTIC OUTPUT FIELDS
  diagnosisText?: string;
  recommendedTreatmentText?: string;
  whySelectedText?: string;
  alternativesText?: string;
  risksText?: string;
  prognosisText?: string;
}

/**
 * Deterministic Orthodontic Clinical Decision Engine
 */
export function generateTreatmentPlan(
  patient: PatientDetails,
  ceph: CephalometricInput,
  oci: OciResult,
  options: TreatmentPlanningOptions
): TreatmentPlanResult {

  // ==========================================
  // STEP 1 & 2: Determine Growth Potential
  // ==========================================
  const age = Number(patient.age) || 12;
  const isFemale = patient.gender === 'Female';
  const isMale = patient.gender === 'Male';
  
  let isGrowing = false;
  if (patient.growthStatus === 'Growing') {
    isGrowing = true;
  } else if (patient.growthStatus === 'Growth Complete') {
    isGrowing = false;
  } else {
    // Deterministic fallback based on age
    if (isFemale && age <= 14) isGrowing = true;
    else if (isMale && age <= 16) isGrowing = true;
    else if (!isFemale && !isMale && age <= 15) isGrowing = true;
  }

  // Override by explicit options group
  if (options.ageGroup === 'growing') isGrowing = true;
  if (options.ageGroup === 'adult') isGrowing = false;

  const growthStatusText = isGrowing 
    ? 'Growing patient with active growth potential' 
    : 'Skeletally mature (growth completed)';

  // ==========================================
  // STEP 3: Determine Skeletal Pattern
  // ==========================================
  const anb = ceph.anb !== '' ? Number(ceph.anb) : 2;
  const sna = ceph.sna !== '' ? Number(ceph.sna) : 82;
  const snb = ceph.snb !== '' ? Number(ceph.snb) : 80;
  const fma = ceph.fma !== '' ? Number(ceph.fma) : 25;

  let skeletalClass: 'Class I' | 'Class II' | 'Class III' = 'Class I';
  let skeletalEtiology = '';
  
  if (anb > 4.5) {
    skeletalClass = 'Class II';
    if (sna > 84 && snb < 78) {
      skeletalEtiology = 'maxillary prognathism and mandibular retrognathism combination';
    } else if (sna > 84) {
      skeletalEtiology = 'maxillary prognathism';
    } else if (snb < 78) {
      skeletalEtiology = 'mandibular retrognathism';
    } else {
      skeletalEtiology = 'mandibular retrognathism and minor maxillary projection';
    }
  } else if (anb < 0) {
    skeletalClass = 'Class III';
    if (sna < 79 && snb > 81) {
      skeletalEtiology = 'maxillary deficiency and mandibular excess combination';
    } else if (sna < 79) {
      skeletalEtiology = 'maxillary deficiency';
    } else if (snb > 81) {
      skeletalEtiology = 'mandibular excess';
    } else {
      skeletalEtiology = 'maxillary deficiency / hypoplasia';
    }
  } else {
    skeletalClass = 'Class I';
    skeletalEtiology = 'normal skeletal jaw relationship';
  }

  // Vertical skeletal pattern
  let verticalPattern = 'Average (Normodivergent)';
  if (fma > 28) {
    verticalPattern = 'Hyperdivergent (Vertical grower / High angle)';
  } else if (fma < 20) {
    verticalPattern = 'Hypodivergent (Horizontal grower / Low angle)';
  }

  // ==========================================
  // STEP 4: Determine Dental Pattern
  // ==========================================
  const overjet = ceph.overjet !== '' ? Number(ceph.overjet) : 2.5;
  const overbite = ceph.overbite !== '' ? Number(ceph.overbite) : 2.5;
  const u1Sn = ceph.u1Sn !== '' ? Number(ceph.u1Sn) : 104;
  const impa = ceph.impa !== '' ? Number(ceph.impa) : 90;

  let dentalPattern = 'Class I malocclusion';
  let isDiv1 = false;
  let isDiv2 = false;

  if (skeletalClass === 'Class II') {
    if (u1Sn < 100 && overbite > 4) {
      isDiv2 = true;
      dentalPattern = 'Class II Division 2 malocclusion (retroclined upper incisors, deep overbite)';
    } else {
      isDiv1 = true;
      dentalPattern = 'Class II Division 1 malocclusion (proclined/normal upper incisors, increased overjet)';
    }
  } else if (skeletalClass === 'Class III') {
    dentalPattern = 'Class III malocclusion (anterior crossbite / negative overjet)';
  }

  const problemList: string[] = [];
  problemList.push(`Skeletal ${skeletalClass} due to ${skeletalEtiology}`);
  problemList.push(dentalPattern);
  problemList.push(`Vertical Pattern: ${verticalPattern}`);

  if (overjet > 4) problemList.push(`Increased overjet (${overjet} mm)`);
  if (overbite > 4) problemList.push(`Deep bite (${overbite} mm)`);
  if (overbite < 0) problemList.push(`Open bite (${overbite} mm)`);
  
  if (options.crowdingSeverity !== 'none') {
    problemList.push(`${options.crowdingSeverity.toUpperCase()} crowding in dental arches`);
  }
  if (options.spacingSeverity !== 'none') {
    problemList.push(`${options.spacingSeverity.toUpperCase()} spacing in dental arches`);
  }
  if (ceph.posteriorCrossbite && ceph.posteriorCrossbite !== 'None') {
    problemList.push(`${ceph.posteriorCrossbite} posterior crossbite`);
  }
  if (ceph.midlineDeviation && ceph.midlineDeviation !== 0) {
    problemList.push(`Midline deviation`);
  }

  // ==========================================
  // STEP 5: Treatment Decision Tree
  // ==========================================
  const primaryTreatment: string[] = [];
  const phaseDetails = {
    phase1: 'N/A',
    phase2: 'Comprehensive fixed orthodontic alignment & leveling',
    phase3: 'Finishing, settling, and detailing dental intercuspation',
    phase4: 'Retention: Upper vacuum-formed retainer + lower fixed lingual wire'
  };

  const suggestions: { category: string; justification: string; items: string[] }[] = [];
  let whySelected = '';

  // CLASS II DIVISION 1 DECISION TREE
  if (skeletalClass === 'Class II' && isDiv1) {
    if (isGrowing) {
      if (skeletalEtiology.includes('mandibular retrognathism')) {
        // MANDATORY TWIN BLOCK functional appliance
        primaryTreatment.push(
          'Twin Block functional appliance (first-line growth modification)',
          'Transition to comprehensive fixed orthodontic treatment after correction of the sagittal discrepancy',
          'Finishing and detailing',
          'Retention'
        );
        phaseDetails.phase1 = 'Twin Block functional appliance therapy for active mandibular orthopedic advancement (9-12 months)';
        
        suggestions.push({
          category: 'Functional Orthopedics',
          justification: 'First-line growth modification is indicated to stimulate mandibular growth during active pubertal growth spurt.',
          items: ['Twin Block functional appliance', 'Herbst appliance (fixed option)', 'Forsus FRD elastics (late-growing option)']
        });

        whySelected = `Patient is a growing individual (${age} years old) presenting with a skeletal Class II relationship due to mandibular retrognathism. Twin Block functional appliance is selected as the primary growth modification therapy to orthopedicly advance the mandible before epiphyseal fusion, avoiding early camouflage extractions or delayed orthognathic surgery.`;
      } else {
        // Maxillary Prognathism growing
        primaryTreatment.push(
          'Orthopedic Headgear or maxillary arch distalization',
          'Transition to comprehensive fixed orthodontic treatment',
          'Finishing and detailing',
          'Retention'
        );
        phaseDetails.phase1 = 'Orthopedic High-pull / Cervical headgear to restrict maxillary growth (8-10 months)';
        
        suggestions.push({
          category: 'Maxillary Growth Restraint',
          justification: 'Indicated to restrict skeletal maxillary projection during active growing years.',
          items: ['High-pull headgear', 'Kariere Motion distalizer', 'Transpalatal arch']
        });

        whySelected = `Patient is a growing individual with a skeletal Class II relationship caused by maxillary prognathism. Orthopedic headgear or maxillary distalization is indicated to restrict maxillary projection and coordinate the dental arches.`;
      }
    } else {
      // Adult Class II Div 1
      if (oci.totalScore <= 40) {
        // Mild: Camouflage
        primaryTreatment.push(
          'Dentoalveolar Camouflage using fixed appliances with Class II elastics',
          'Finishing and detailing',
          'Retention'
        );
        phaseDetails.phase1 = 'Dental leveling and alignment prior to inter-arch mechanics';
        phaseDetails.phase2 = 'Class II elastics and sequential interproximal reduction (IPR) to retract upper incisors';
        
        suggestions.push({
          category: 'Orthodontic Camouflage',
          justification: 'Indicated for mild adult skeletal discrepancies where dental camouflage achieves optimal functional occlusion without surgical intervention.',
          items: ['Class II elastics', 'IPR sequence', '0.022" Pre-adjusted bracket system']
        });

        whySelected = `Patient is an adult with completed growth and a mild skeletal Class II relationship. Dentoalveolar camouflage using fixed appliances and Class II elastics is selected to correct the overjet and establish a stable occlusion.`;
      } else if (oci.totalScore <= 60) {
        // Moderate: Extraction
        primaryTreatment.push(
          'Dentoalveolar Camouflage with extraction of two maxillary first premolars (14, 24)',
          'Comprehensive fixed appliance retraction',
          'Finishing and detailing',
          'Retention'
        );
        phaseDetails.phase1 = 'Extraction of upper first premolars (14, 24) and anchorage consolidation';
        phaseDetails.phase2 = 'Fixed bracket alignment and sliding mechanics to retract upper anterior segment';
        
        suggestions.push({
          category: 'Therapeutic Extraction Camouflage',
          justification: 'Premolar extractions provide the physical space needed to retract the upper incisors and reduce the moderate overjet.',
          items: ['Upper first premolar extractions', 'Transpalatal arch (TPA) for anchorage', 'TADs (Temporary Anchorage Devices)']
        });

        whySelected = `Patient is an adult with a moderate skeletal Class II relationship. Upper premolar extractions are indicated to create space for incisor retraction, allowing camouflage correction of the overjet while keeping lower incisors stable.`;
      } else {
        // Severe: Surgery
        primaryTreatment.push(
          'Combined Orthognathic Surgery (BSSO mandibular advancement) and comprehensive orthodontics',
          'Pre-surgical orthodontic decompensation',
          'Surgical jaw repositioning',
          'Post-surgical refinement and finishing',
          'Retention'
        );
        phaseDetails.phase1 = 'Pre-surgical orthodontic alignment and decompensation (retroclining lower incisors, proclining upper incisors)';
        phaseDetails.phase2 = 'Orthognathic surgery: Bilateral Sagittal Split Osteotomy (BSSO) for mandibular advancement';
        phaseDetails.phase3 = 'Post-surgical finishing and occlusal settling elastics';

        suggestions.push({
          category: 'Orthognathic Surgery',
          justification: 'Severe skeletal Class II in a mature adult cannot be safely corrected with camouflage without periodontal breakdown or profile flattening.',
          items: ['Bilateral Sagittal Split Osteotomy (BSSO)', 'Rigid internal fixation plates', 'Pre-surgical decompensation elastics']
        });

        whySelected = `Patient is an adult with a severe skeletal Class II discrepancy and completed growth. Dentoalveolar camouflage is contraindicated due to extreme overjet, lack of growth potential, and risk of profile flattening. Surgical mandibular advancement via BSSO is the primary treatment of choice.`;
      }
    }
  }

  // CLASS II DIVISION 2 DECISION TREE
  else if (skeletalClass === 'Class II' && isDiv2) {
    if (isGrowing) {
      primaryTreatment.push(
        'Initial leveling and flaring of retroclined upper incisors (unlocking the bite)',
        'Twin Block functional appliance for mandibular growth modification',
        'Comprehensive fixed orthodontic refinement',
        'Retention'
      );
      phaseDetails.phase1 = 'Unlock mandible by leveling and proclining upper incisors (utility arch / partial brackets)';
      phaseDetails.phase2 = 'Twin Block functional appliance therapy for orthopedic mandibular promotion';

      suggestions.push({
        category: 'Incisor Unlocking & Orthopedics',
        justification: 'Upper central incisors must be proclined first to remove the mechanical lock on the mandible before functional advancement.',
        items: ['Utility intrusion arch', 'Twin Block functional appliance', 'Class II elastics']
      });

      whySelected = `Patient is a growing individual with a Class II Division 2 pattern. Retroclined upper central incisors lock the mandible in a retruded position. Initial proclination to unlock the bite is required before active functional growth modification with a Twin Block.`;
    } else {
      // Adult Class II Div 2
      primaryTreatment.push(
        'Fixed appliances to level the curve of Spee and procline retroclined incisors',
        'Inter-arch Class II elastics or selective camouflage extractions',
        'Finishing and detailing',
        'Retention'
      );
      phaseDetails.phase1 = 'Unlock dental arch, align, and level deep curve of Spee';
      
      suggestions.push({
        category: 'Fixed Appliance Camouflage',
        justification: 'Adult deep bite correction via intrusion of anterior segments and level curve of Spee.',
        items: ['Intrusion utility arches', 'Bite turbos', 'Class II elastics']
      });

      whySelected = `Patient is a mature adult with a Class II Division 2 malocclusion. Fixed appliances are indicated to level the arches, correct retroclined incisor torque, and resolve the deep bite prior to finalizing occlusion.`;
    }
  }

  // CLASS III DECISION TREE
  else if (skeletalClass === 'Class III') {
    if (isGrowing) {
      if (skeletalEtiology.includes('maxillary deficiency')) {
        const isSevereClass3 = anb <= -4;
        if (isSevereClass3) {
          primaryTreatment.push(
            'Bone-Anchored Maxillary Protraction (BAMP) utilizing miniplates and Class III elastics',
            'Comprehensive fixed orthodontic treatment',
            'Retention'
          );
          phaseDetails.phase1 = 'Surgical placement of miniplates in maxilla and mandible followed by continuous Class III elastic traction';
          
          suggestions.push({
            category: 'Skeletal Anchorage Protraction',
            justification: 'Severe skeletal Class III in a growing patient requires bone-borne orthopedic forces to prevent dental flaring and optimize maxillary protraction.',
            items: ['BAMP miniplates', 'Class III orthopedic elastics', 'Maxillary expansion']
          });

          whySelected = `Patient is a growing individual with a severe skeletal Class III due to maxillary deficiency. Bone-Anchored Maxillary Protraction (BAMP) is selected to utilize skeletal anchorage for orthopedic maxilla advancement, avoiding dental tipping.`;
        } else {
          primaryTreatment.push(
            'Rapid Maxillary Expansion (RME) combined with a Reverse-Pull Facemask (Petit type)',
            'Comprehensive fixed orthodontic treatment',
            'Retention'
          );
          phaseDetails.phase1 = 'Hyrax expander activated daily + reverse-pull facemask orthopedic traction (6-9 months)';
          
          suggestions.push({
            category: 'Orthopedic Protraction',
            justification: 'Interceptive growth modification via RME and Facemask stimulations maxillary sutural growth before expansion sutures fuse.',
            items: ['Rapid Palatal Expander (RPE) with traction hooks', 'Petit type reverse-pull facemask', 'Chinchair appliance']
          });

          whySelected = `Patient is a growing individual with a mild-to-moderate skeletal Class III maxillary deficiency. Rapid Palatal Expansion combined with a reverse-pull facemask is selected to orthopedicly protract the maxilla and correct the anterior crossbite.`;
        }
      } else {
        // Mandibular excess growing
        primaryTreatment.push(
          'Interceptive growth monitoring with chincup therapy or Class III elastics',
          'Delayed comprehensive fixed orthodontics or orthognathic surgery at growth completion',
          'Retention'
        );
        phaseDetails.phase1 = 'Interceptive orthopedic monitoring and vertical control';

        suggestions.push({
          category: 'Interceptive Orthopedics',
          justification: 'Mandibular excess growth is difficult to restrict. Early chincup or elastics may redirect growth, but delayed surgery is often indicated.',
          items: ['Chincup therapy', 'Class III elastics', 'Lower lingual arch']
        });

        whySelected = `Patient is a growing individual with Class III due to mandibular excess. Growth modification has limited predictability; interceptive monitoring is indicated with delayed definitive surgery at maturity if discrepancy worsens.`;
      }
    } else {
      // Adult Class III
      if (oci.totalScore <= 40) {
        // Mild: Camouflage
        primaryTreatment.push(
          'Dentoalveolar Camouflage (fixed appliances with Class III elastics and/or mandibular incisor extraction)',
          'Finishing and detailing',
          'Retention'
        );
        phaseDetails.phase1 = 'Dental alignment and coordination';
        phaseDetails.phase2 = 'Class III elastics and mandibular incisor retroclination / distalization';

        suggestions.push({
          category: 'Class III Camouflage',
          justification: 'Indicated for mild adult Class III cases to achieve positive overjet via incisor proclination/retroclination.',
          items: ['Class III elastics', 'Mandibular first premolar extractions', 'Lower TADs for total arch distalization']
        });

        whySelected = `Patient is an adult with a mild skeletal Class III discrepancy. Dentoalveolar camouflage via lower arch distalization using elastics/TADs is selected to establish normal overjet and canine relations.`;
      } else {
        // Severe: Surgery
        primaryTreatment.push(
          'Combined Orthognathic Surgery (LeFort I maxillary advancement and/or BSSO mandibular setback)',
          'Pre-surgical orthodontic decompensation',
          'Surgical jaw repositioning',
          'Post-surgical finishing and coordination',
          'Retention'
        );
        phaseDetails.phase1 = 'Pre-surgical alignment and decompensation (proclining lower incisors, retroclining upper incisors)';
        phaseDetails.phase2 = 'Bimaxillary orthognathic surgery: LeFort I advancement and BSSO mandibular setback';

        suggestions.push({
          category: 'Combined Surgical-Orthodontic',
          justification: 'Severe adult Class III discrepancies cannot be camouflaged without resulting in unsafe lower incisor retroclination or profile compromise.',
          items: ['LeFort I maxillary advancement osteotomy', 'BSSO mandibular setback osteotomy', 'Rigid internal fixation plates']
        });

        whySelected = `Patient is a mature adult with a severe skeletal Class III discrepancy. Combined orthognathic surgery (maxillary advancement/mandibular setback) is indicated to correct the skeletal base relationship and achieve profile harmony.`;
      }
    }
  }

  // CLASS I DECISION TREE
  else {
    if (options.crowdingSeverity === 'severe') {
      primaryTreatment.push(
        'Fixed orthodontic treatment with extraction of four first premolars (14, 24, 34, 44)',
        'Leveling, alignment, and space closure',
        'Finishing and detailing',
        'Retention'
      );
      phaseDetails.phase1 = 'Extractions of 14, 24, 34, 44 premolars followed by canine distalization and incisor retraction';

      suggestions.push({
        category: 'Therapeutic Extractions',
        justification: 'Extraction of first premolars is mandatory to resolve severe crowding exceeding 8mm, ensuring incisors remain within safe alveolar bone limits.',
        items: ['Premolar extractions (14, 24, 34, 44)', 'Sliding mechanics', 'Transpalatal arch (TPA)']
      });

      whySelected = `Patient presents with a skeletal Class I relationship and severe dental crowding. Extraction of four first premolars is indicated to gain sufficient physical arch space for alignment without causing lip protrusion or alveolar dehiscence.`;
    } else if (options.crowdingSeverity === 'moderate') {
      primaryTreatment.push(
        'Non-extraction alignment with interproximal reduction (IPR) and/or transverse expansion',
        'Finishing and detailing',
        'Retention'
      );
      phaseDetails.phase1 = 'Leveling and arch expansion followed by planned interproximal reduction (IPR)';

      suggestions.push({
        category: 'Space Gaining Mechanics',
        justification: 'Moderate crowding can be resolved via non-extraction expansion and selective IPR, avoiding unnecessary extractions.',
        items: ['Interproximal reduction (IPR)', 'Arch expansion wires', 'Bite openers']
      });

      whySelected = `Patient presents with a skeletal Class I relationship and moderate crowding. Space gaining mechanics via transverse arch expansion and selective IPR are selected as a conservative non-extraction approach.`;
    } else {
      // Mild crowding or spacing
      primaryTreatment.push(
        'Non-extraction alignment using fixed appliances or clear aligners',
        'Finishing and detailing',
        'Retention'
      );
      
      suggestions.push({
        category: 'Aesthetic Alignment',
        justification: 'Mild crowding or spacing is best resolved with conservative non-extraction alignment (brackets or clear aligners).',
        items: ['Clear aligners (Invisalign)', '0.022" Ceramic/Metal brackets', 'IPR if needed']
      });

      whySelected = `Patient presents with a skeletal Class I relationship and mild crowding/spacing. Conservative non-extraction alignment is indicated using fixed brackets or aesthetic clear aligners.`;
    }
  }

  // ==========================================
  // SPECIFIC MECHANICAL ADDITIONS
  // ==========================================
  
  // Transverse crossbites
  if (ceph.posteriorCrossbite && ceph.posteriorCrossbite !== 'None') {
    if (isGrowing) {
      primaryTreatment.unshift('Rapid Palatal Expansion (RPE) using a Hyrax appliance');
      phaseDetails.phase1 = 'Rapid Palatal Expansion (RPE) to resolve transverse deficiency prior to sagittal mechanics';
      
      suggestions.unshift({
        category: 'Transverse Expansion',
        justification: 'RPE is indicated in growing patients to correct skeletal posterior crossbite via midpalatal suture separation.',
        items: ['Hyrax Palatal Expander', 'Quad Helix (for dental expansion)']
      });
    } else {
      primaryTreatment.unshift('Miniscrew-Assisted Rapid Palatal Expansion (MARPE) or SARPE');
      phaseDetails.phase1 = 'MARPE suture expansion or Surgically-Assisted Palatal Expansion (SARPE)';
      
      suggestions.unshift({
        category: 'Skeletal Transverse Expansion',
        justification: 'Mature palatal sutures require cortical miniscrew anchorage or surgical assistance to achieve skeletal expansion.',
        items: ['MARPE expander', 'Surgically-Assisted RPE (SARPE)']
      });
    }
  }

  // Deep bite mechanics
  if (overbite > 4) {
    if (isGrowing) {
      primaryTreatment.push('Anterior bite plate or utility intrusion archwire');
      suggestions.push({
        category: 'Deep Bite Correction',
        justification: 'Growing deep bites are corrected by preventing incisor eruption with an anterior bite plate while allowing posterior eruption.',
        items: ['Anterior bite plate', 'Utility intrusion arch', 'Reverse curve of Spee wire']
      });
    } else {
      primaryTreatment.push('Curve of Spee leveling and anterior intrusion using intrusion arches or TADs');
      suggestions.push({
        category: 'Deep Bite Intrusion',
        justification: 'Adult deep bites require active incisor intrusion or posterior extrusion using intrusion arches or skeletal TADs.',
        items: ['Intrusion utility arches', 'Bite turbos / Posterior composite pillars', 'Mini-screws (TADs) for anterior intrusion']
      });
    }
  }

  // Open bite mechanics
  if (overbite < 0) {
    const hasHabit = patient.habits && patient.habits.length > 0 && !patient.habits.includes('None') && !patient.habits.includes('');
    if (hasHabit) {
      primaryTreatment.unshift('Habit interception appliance (tongue crib)');
      phaseDetails.phase1 = 'Habit breaker / tongue crib appliance to eliminate digit sucking or tongue thrusting';
      
      suggestions.push({
        category: 'Habit Interception',
        justification: 'Digit or tongue habits must be intercepted to allow spontaneous open bite closure.',
        items: ['Tongue crib appliance', 'Palatal spur appliance', 'Myofunctional therapy']
      });
    } else if (fma > 28) {
      // Vertical grower open bite
      primaryTreatment.push('Posterior segment intrusion utilizing Temporary Anchorage Devices (TADs)');
      suggestions.push({
        category: 'Vertical Control Intrusion',
        justification: 'Open bite in a high angle patient requires posterior intrusion using TADs to rotate the mandible counter-clockwise.',
        items: ['Posterior palatal TADs', 'Intrusion arches', 'Vertical elastics']
      });
    }
  }

  // ==========================================
  // STEP 6: Extraction Decision Explanation
  // ==========================================
  let extractionConsideration = '';
  const isExtractionRecommended = primaryTreatment.some(t => t.toLowerCase().includes('extraction'));
  if (isExtractionRecommended) {
    extractionConsideration = 'Therapeutic extractions are recommended due to severe space deficiency and/or excessive incisor protrusion. This ensures alignment stability without compromising the labial cortical plate.';
  } else {
    extractionConsideration = 'Non-extraction approach is recommended because the arch space deficiency is mild-to-moderate. Arch development, transverse expansion, and interproximal reduction (IPR) are sufficient for alignment.';
  }

  // ==========================================
  // STEP 8: Orthognathic Surgery indication
  // ==========================================
  let orthognathicReferralConsideration = 'Not indicated. The skeletal pattern is mild-to-moderate and dentoalveolar camouflage or growth modification is highly feasible.';
  if (primaryTreatment.some(t => t.toLowerCase().includes('surgery') || t.toLowerCase().includes('orthognathic'))) {
    orthognathicReferralConsideration = `Orthognathic surgery is indicated because skeletal jaw discrepancy is severe (ANB: ${anb}°), growth is completed, and dentoalveolar camouflage alone would cause severe aesthetic and periodontal compromise.`;
  }

  // ==========================================
  // STEP 9: Alternatives, Risks, Prognosis
  // ==========================================
  const possibleApproaches: { name: string; description: string; advantages: string[]; disadvantages: string[] }[] = [];
  
  // Primary Approach
  possibleApproaches.push({
    name: isGrowing && skeletalClass !== 'Class I' ? 'Primary Growth Modification & Orthodontics' : 'Primary Camouflage / Definitive Orthodontics',
    description: `Sequence of phases focused on correcting the primary sagittal and transverse discrepancies: ${primaryTreatment[0]}.`,
    advantages: [
      'Addresses the primary etiology of the malocclusion',
      'Minimizes the need for later surgical interventions',
      'Optimizes facial aesthetics, airway dimensions, and functional occlusion'
    ],
    disadvantages: [
      'Requires strict patient compliance',
      'Longer overall treatment duration across multiple phases'
    ]
  });

  // Alternative 1
  possibleApproaches.push({
    name: 'Alternative 1: Clear Aligner Therapy with Auxiliaries',
    description: 'Sequenced thermoplastic aligners combined with Class II/III elastics, Temporary Anchorage Devices (TADs), or palatal expanders.',
    advantages: [
      'Superior aesthetics and comfortable daily wear',
      'Facilitates excellent oral hygiene and decreases white spot lesions',
      'Precise control of individual tooth movements'
    ],
    disadvantages: [
      'Entirely reliant on patient compliance (22 hours/day)',
      'Limited efficacy in major vertical or severe skeletal jaw corrections'
    ]
  });

  // Alternative 2
  possibleApproaches.push({
    name: 'Alternative 2: Surgical Decompensation & Orthognathic Surgery',
    description: 'Orthodontic setup followed by bilateral sagittal split osteotomy (BSSO) or LeFort I osteotomy after growth is completed.',
    advantages: [
      'Directly corrects severe skeletal discrepancies',
      'Achieves dramatic improvement in facial profile and airway parameters'
    ],
    disadvantages: [
      'Requires general anesthesia and hospitalization',
      'Significantly higher financial cost and recovery period'
    ]
  });

  // Alternative 3
  possibleApproaches.push({
    name: 'Alternative 3: Compromise Non-extraction / Alignment Only',
    description: 'Minimal correction focusing solely on resolving anterior crowding/spacing without attempting to correct the underlying skeletal relationship.',
    advantages: [
      'Shorter treatment time and lower cost',
      'Avoids surgical or extraction procedures'
    ],
    disadvantages: [
      'Underlying skeletal Class II/III discrepancy and profile remain unchanged',
      'Higher risk of post-treatment relapse'
    ]
  });

  // Treatment objectives list
  const treatmentObjectives = [
    'Correct skeletal discrepancy',
    'Correct dental relationship',
    'Improve facial profile',
    'Improve function',
    'Improve smile',
    'Correct overjet',
    'Correct overbite',
    'Correct crowding',
    'Improve stability'
  ];

  // Risks list
  const risks = [
    'Transient root resorption (blunting of root apexes)',
    'Post-treatment relapse if retention protocols are not strictly followed',
    'Decalcification (white spot lesions) around brackets due to poor oral hygiene',
    'Growth limitations (unfavorable growth patterns or early growth completion)',
    'Compliance issues (failure to wear elastics or functional appliances)'
  ];

  // Determine Prognosis
  let prognosis: 'Excellent' | 'Good' | 'Fair' | 'Poor' = 'Good';
  if (isGrowing) {
    prognosis = oci.totalScore <= 40 ? 'Excellent' : 'Good';
  } else {
    prognosis = oci.totalScore > 60 ? 'Fair' : 'Good';
  }

  // Formatting deterministic output text
  const diagnosisText = `Skeletal ${skeletalClass} due to ${skeletalEtiology}. ${dentalPattern}. ${verticalPattern}. ${growthStatusText}.`;
  const recommendedTreatmentText = primaryTreatment.map((t, idx) => `${idx + 1}. ${t}`).join('\n');

  return {
    severityAssessment: `OCI Index score: ${oci.totalScore}%. Skeletal ${skeletalClass} characterized by ${skeletalEtiology}.`,
    skeletalPattern: `Skeletal Class ${skeletalClass} (${anb}° ANB) with ${verticalPattern}.`,
    dentalCompensation: `Maxillary incisors (U1-SN: ${u1Sn}°), Mandibular incisors (IMPA: ${impa}°). Compensation Level: ${oci.compensationLevel}.`,
    occlusalSummary: `Molar Relation: Class ${patient.molarRelationRight || 'I'}. Canine Relation: Class ${patient.canineRelationRight || 'I'}. Overjet: ${overjet} mm. Overbite: ${overbite} mm.`,
    treatmentComplexity: oci.totalScore > 60 ? 'Severe / Surgical' : oci.totalScore > 40 ? 'Complex' : oci.totalScore > 20 ? 'Moderate' : 'Simple',
    
    growthModification: {
      applicable: isGrowing,
      timingConsideration: isGrowing ? 'Optimal intervention during active pubertal growth spurt.' : 'Completed growth; modification is no longer viable.',
      growthGuidanceOptions: isGrowing ? [primaryTreatment[0]] : []
    },
    
    orthodonticCamouflage: {
      applicable: oci.totalScore <= 60,
      extractionConsideration,
      spaceManagement: options.crowdingSeverity === 'severe' ? 'Premolar extraction space closure' : 'Expansion and interproximal reduction (IPR)',
      incisorCompensationStrategies: `Torque control: Maxillary incisors (U1-SN), Mandibular incisors (IMPA).`,
      anchorageConsiderations: options.crowdingSeverity === 'severe' ? 'Maximum anchorage using Transpalatal Arch (TPA) or TADs' : 'Reciprocal anchorage'
    },
    
    surgicalOrthodontics: {
      applicable: oci.totalScore > 60 && !isGrowing,
      severeSkeletalDiscrepancyFlag: oci.totalScore > 60,
      orthognathicReferralConsideration
    },
    
    applianceSuggestions: suggestions,
    problemList,
    treatmentObjectives,
    retentionConsiderations: [
      'Dual Retention: Upper vacuum-formed Essix retainer + lower fixed canine-to-canine lingual wire',
      'Active retention compliance monitoring during the first 12 months'
    ],
    possibleApproaches,

    // V4.1 DETERMINISTIC OUTPUT
    diagnosisText,
    recommendedTreatmentText,
    whySelectedText: whySelected,
    alternativesText: possibleApproaches.map(a => `• **${a.name}**\n  *Advantage*: ${a.advantages.join(', ')}\n  *Disadvantage*: ${a.disadvantages.join(', ')}`).join('\n\n'),
    risksText: risks.join('\n'),
    prognosisText: `Prognosis is rated as **${prognosis}** assuming cooperative patient compliance with elastics and active retention appliances.`
  };
}

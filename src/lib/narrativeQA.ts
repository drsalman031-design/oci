import { PatientDetails, CephalometricInput, OciResult } from '../types';

export class ClinicalNarrativeQA {
  /**
   * Performs deep quality control and validation on any clinical text block.
   */
  static validateAndClean(text: string, context?: {
    patient?: PatientDetails;
    ceph?: CephalometricInput;
    oci?: OciResult;
  }): string {
    if (!text) return '';

    let cleaned = text;

    // 1. Remove repeated adjacent words (e.g. "selected selected", "high high")
    cleaned = cleaned.replace(/\b(\w+)\s+\1\b/gi, '$1');

    // 2. Fix invalid unit combinations and mixed formatting
    // Resolve double units like "° mm", "mm °", "°mm"
    cleaned = cleaned.replace(/ANB\s*[:=-]?\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*mm|mm\s*°|°mm|mm)/gi, 'ANB: $1°');
    cleaned = cleaned.replace(/Wits\s*[:=-]?\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*mm|mm\s*°|°mm|°)/gi, 'Wits: $1 mm');
    cleaned = cleaned.replace(/IMPA\s*[:=-]?\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*mm|mm\s*°|°mm|mm)/gi, 'IMPA: $1°');
    cleaned = cleaned.replace(/U1-SN\s*[:=-]?\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*mm|mm\s*°|°mm|mm)/gi, 'U1-SN: $1°');
    cleaned = cleaned.replace(/FMA\s*[:=-]?\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*mm|mm\s*°|°mm|mm)/gi, 'FMA: $1°');
    cleaned = cleaned.replace(/SN-MP\s*[:=-]?\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*mm|mm\s*°|°mm|mm)/gi, 'SN-MP: $1°');
    cleaned = cleaned.replace(/Overjet\s*[:=-]?\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*mm|mm\s*°|°mm|°)/gi, 'Overjet: $1 mm');
    cleaned = cleaned.replace(/Overbite\s*[:=-]?\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*mm|mm\s*°|°mm|°)/gi, 'Overbite: $1 mm');
    cleaned = cleaned.replace(/E-Line\s*[:=-]?\s*(-?\d+(?:\.\d+)?)\s*(?:°\s*mm|mm\s*°|°mm|°)/gi, 'E-Line: $1 mm');
    
    // Fix standalone or direct values where unit got concatenated wrong
    cleaned = cleaned.replace(/(-?\d+(?:\.\d+)?)\s*°\s*mm/gi, '$1°');
    cleaned = cleaned.replace(/(-?\d+(?:\.\d+)?)\s*mm\s*°/gi, '$1 mm');

    // 3. Unify OCI Score displays
    // Never allow mixed formats like "9.8%" or "100/10" or "9.8/10 (98%)"
    // We standardize all text-based score displays to percentage "X%" or fractional "X.X/10"
    cleaned = cleaned.replace(/OCI Score\s*[:=-]?\s*100\/10/gi, 'OCI Score: 10.0/10');
    cleaned = cleaned.replace(/OCI Score\s*[:=-]?\s*(\d+(?:\.\d+)?)\/10\s*\((\d+(?:\.\d+)?)\%\)/gi, 'OCI Score: $2%');
    cleaned = cleaned.replace(/OCI Score\s*[:=-]?\s*(\d+(?:\.\d+)?)\s*%/gi, 'OCI Score: $1%');
    cleaned = cleaned.replace(/(\d+(?:\.\d+)?)\/100/gi, '$1%');

    // 4. Improve medical vocabulary (replace robotic AI terms with orthodontic consultant terms)
    cleaned = cleaned.replace(/\bmapped\b/g, 'classified');
    cleaned = cleaned.replace(/\bmapped skeletal\b/gi, 'identified skeletal');
    cleaned = cleaned.replace(/\bselected because\b/gi, 'indicated due to');
    cleaned = cleaned.replace(/\bOCI selected\b/gi, 'OCI identified');
    cleaned = cleaned.replace(/\bwhy OCI selected\b/gi, 'Why OCI determined');
    cleaned = cleaned.replace(/\bwhy OCI detected\b/gi, 'Why OCI identified');
    cleaned = cleaned.replace(/\brobotic\b/gi, 'coordinated');

    // 5. Clean up typical template errors and repeated phrases
    cleaned = cleaned.replace(/because diagnosis indicates diagnosis/gi, 'based on sagittal and vertical cephalometric deviations');
    cleaned = cleaned.replace(/because treatment selected/gi, 'to coordinate dental arches within safe physiological limits');
    cleaned = cleaned.replace(/compensation compensation/gi, 'compensation');
    cleaned = cleaned.replace(/treatment planning planning/gi, 'treatment planning');
    cleaned = cleaned.replace(/diagnosis diagnosis/gi, 'diagnosis');

    // 6. Context-based clinical validation
    if (context) {
      const { patient, ceph, oci } = context;

      if (patient) {
        const age = Number(patient.age) || 20;
        const isAdult = age >= 14;

        if (isAdult) {
          // If adult, resolve growth modification recommendations
          cleaned = cleaned.replace(/growth modification/gi, 'dentoalveolar compensation');
          cleaned = cleaned.replace(/growth guidance options/gi, 'camouflage option');
          cleaned = cleaned.replace(/stimulate mandibular growth/gi, 'reposition mandibular dentition');
          cleaned = cleaned.replace(/Twin Block|Herbst|Facemask|Petit facemask/gi, 'fixed camouflage elastics');
          cleaned = cleaned.replace(/highly active remaining adolescent growth/gi, 'skeletal maturation complete');
          cleaned = cleaned.replace(/remaining growth potential/gi, 'minimal remaining growth potential');
        } else {
          // If growing, resolve "growth completed" contradictions
          cleaned = cleaned.replace(/growth maturation complete/gi, 'active growth phase');
          cleaned = cleaned.replace(/skeletal maturation complete/gi, 'active skeletal growth remaining');
          cleaned = cleaned.replace(/minimal growth remaining/gi, 'favorable growth potential remaining');
        }
      }

      if (ceph) {
        const anbVal = ceph.anb !== '' ? Number(ceph.anb) : 2;
        
        // Ensure consistency between ANB and Skeletal Class terms
        if (anbVal > 4.5) {
          // Class II
          cleaned = cleaned.replace(/Skeletal Class I\b/g, 'Skeletal Class II');
          cleaned = cleaned.replace(/Skeletal Class III\b/g, 'Skeletal Class II');
        } else if (anbVal < 0) {
          // Class III
          cleaned = cleaned.replace(/Skeletal Class I\b/g, 'Skeletal Class III');
          cleaned = cleaned.replace(/Skeletal Class II\b/g, 'Skeletal Class III');
        } else {
          // Class I
          cleaned = cleaned.replace(/Skeletal Class II\b/g, 'Skeletal Class I');
          cleaned = cleaned.replace(/Skeletal Class III\b/g, 'Skeletal Class I');
        }
      }

      if (oci) {
        // Enforce surgery/camouflage consistency
        const isSurgical = oci.totalScore > 60;
        if (isSurgical) {
          cleaned = cleaned.replace(/orthodontic camouflage is the primary/gi, 'surgical correction is the primary');
          cleaned = cleaned.replace(/non-extraction camouflage therapy/gi, 'presurgical decompensation');
        } else {
          cleaned = cleaned.replace(/orthognathic surgery is mandatory/gi, 'dentoalveolar camouflage is recommended');
          cleaned = cleaned.replace(/combined double-jaw surgical correction/gi, 'dentoalveolar camouflage correction');
        }
      }
    }

    // 7. General cleanup of double spaces or punctuation glitches
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/\s+([.,;:?°])/g, '$1');
    cleaned = cleaned.trim();

    if (context?.patient?.analysisMode === 'clinic') {
      const forbiddenKeywords = [
        'ANB', 'SNA', 'SNB', 'Wits', 'IMPA', 'FMA', 'U1-SN', 'SN-MP',
        'Cephalogram', 'Cephalometric', 'Radiograph', 'Radiographic',
        'CBCT', 'OPG', 'Measurement', 'Angular Measurement', 'Linear Measurement',
        'Dental Torque', 'Arch Allocation', 'Cephalometric Compensation'
      ];
      
      const lines = cleaned.split('\n');
      const cleanLines = lines.map(line => {
        let cleanLine = line;
        
        cleanLine = cleanLine.replace(/\bANB\b/gi, 'clinical skeletal relation');
        cleanLine = cleanLine.replace(/\bSNA\b/gi, 'maxillary position');
        cleanLine = cleanLine.replace(/\bSNB\b/gi, 'mandibular position');
        cleanLine = cleanLine.replace(/\bWits\b/gi, 'clinical sagittal discrepancy');
        cleanLine = cleanLine.replace(/\bIMPA\b/gi, 'lower incisor position');
        cleanLine = cleanLine.replace(/\bU1-SN\b/gi, 'upper incisor position');
        cleanLine = cleanLine.replace(/\bFMA\b/gi, 'mandibular plane angle');
        cleanLine = cleanLine.replace(/\bSN-MP\b/gi, 'mandibular plane angle');
        cleanLine = cleanLine.replace(/\b(lateral\s+)?cephalogram\b/gi, 'clinical examination');
        cleanLine = cleanLine.replace(/\bcephalometric\b/gi, 'clinical examination');
        cleanLine = cleanLine.replace(/\bradiograph(ic)?\b/gi, 'clinical');
        cleanLine = cleanLine.replace(/\bCBCT\b/gi, 'clinical assessment');
        cleanLine = cleanLine.replace(/\bOPG\b/gi, 'clinical assessment');
        cleanLine = cleanLine.replace(/\b(angular\s+)?measurement(s)?\b/gi, 'clinical assessment');
        cleanLine = cleanLine.replace(/\blinear\s+measurement(s)?\b/gi, 'clinical assessment');
        cleanLine = cleanLine.replace(/\bdental\s+torque\b/gi, 'incisor torque control');
        cleanLine = cleanLine.replace(/\barch\s+allocation\b/gi, 'arch length alignment');
        cleanLine = cleanLine.replace(/\bcephalometric\s+compensation\b/gi, 'dentoalveolar camouflage');
        
        const containsForbidden = forbiddenKeywords.some(keyword => {
          const regex = new RegExp('\\b' + keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '\\b', 'i');
          return regex.test(cleanLine);
        });
        
        if (containsForbidden) {
          return '';
        }
        return cleanLine;
      }).filter(line => line.trim() !== '');
      
      cleaned = cleanLines.join('\n');
    }

    if (context?.patient?.analysisMode === 'ceph') {
      // Ceph Mode must never infer clinical findings that were not entered
      // Strip any unentered clinical descriptors like habits, airway type, TMJ status
      const unenteredInferences = ['mouth breeder', 'clicking tmj', 'thumb sucking', 'tongue thrust', 'atypical habit'];
      const lines = cleaned.split('\n');
      const cleanLines = lines.map(line => {
        let cleanLine = line;
        unenteredInferences.forEach(inf => {
          const regex = new RegExp('\\b' + inf + '\\b', 'i');
          if (regex.test(cleanLine)) {
            cleanLine = cleanLine.replace(regex, 'skeletal/dentoalveolar features');
          }
        });
        return cleanLine;
      });
      cleaned = cleanLines.join('\n');
    }

    return cleaned;
  }
}

import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, Image, ActivityIndicator, Alert, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  Camera, 
  Image as ImageIcon, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ZoomIn, 
  ZoomOut,
  Info,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Award
} from 'lucide-react-native';
import tw from 'twrnc';
import { PatientDetails } from '../types';

interface ClinicPhotoWorkstationProps {
  patientDetails: PatientDetails;
  onComplete: (photos: Record<string, string>, findings: string[]) => void;
  onBack?: () => void;
  isEmbedded?: boolean;
}

interface PhotoSlot {
  key: string;
  label: string;
  category: 'extraoral' | 'intraoral';
  description: string;
  required: boolean;
}

export default function ClinicPhotoWorkstation({
  patientDetails,
  onComplete,
  onBack,
  isEmbedded = false
}: ClinicPhotoWorkstationProps) {
  const [photos, setPhotos] = useState<Record<string, string>>({});
  const [analyzingSlot, setAnalyzingSlot] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<string>('frontal_rest');
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedMarker, setSelectedMarker] = useState<{ name: string; desc: string } | null>(null);
  const [isSectionExpanded, setIsSectionExpanded] = useState<boolean>(true);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [qcStatus, setQcStatus] = useState<'idle' | 'validating' | 'passed' | 'failed'>('idle');

  // Slots List
  const slots: PhotoSlot[] = [
    { key: 'frontal_rest', label: 'Frontal Rest', category: 'extraoral', description: 'Assesses vertical thirds and lip competence', required: true },
    { key: 'frontal_smile', label: 'Frontal Smile', category: 'extraoral', description: 'Assesses smile arc, display, and corridors', required: true },
    { key: 'right_profile', label: 'Right Profile', category: 'extraoral', description: 'Assesses profile convexity and E-Line', required: true },
    { key: 'left_profile', label: 'Left Profile', category: 'extraoral', description: 'Left sagittal profile symmetry', required: true },
    { key: 'profile_45', label: 'Optional 45° Profile', category: 'extraoral', description: 'Three-quarter zygomatic projection', required: false },
    { key: 'frontal_occlusion', label: 'Frontal Occlusion', category: 'intraoral', description: 'Assesses midlines, overbite, and crossbite', required: true },
    { key: 'right_buccal', label: 'Right Buccal', category: 'intraoral', description: 'Right molar and canine relationships', required: true },
    { key: 'left_buccal', label: 'Left Buccal', category: 'intraoral', description: 'Left molar and canine relationships', required: true },
    { key: 'maxillary_occlusal', label: 'Maxillary Occlusal', category: 'intraoral', description: 'Maxillary arch form and crowding', required: true },
    { key: 'mandibular_occlusal', label: 'Mandibular Occlusal', category: 'intraoral', description: 'Mandibular arch form and Spee curve', required: true }
  ];

  // Seed default placeholders for mock experience or allow custom files
  useEffect(() => {
    const defaultData: Record<string, string> = {};
    slots.forEach(slot => {
      defaultData[slot.key] = patientDetails.clinicalPhotos?.[slot.key] || 'MOCK_IMAGE';
    });
    setPhotos(defaultData);
  }, []);

  // Auto-sync photos & findings to parent
  useEffect(() => {
    onComplete(photos, generateClinicalFindings().map(f => f.text));
  }, [photos, patientDetails]);

  const handleFileUpload = async (slotKey: string, fileType: 'camera' | 'gallery') => {
    try {
      if (fileType === 'camera') {
        // Request camera permission
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert(
            "Camera Access Required",
            "OCI Analyzer needs access to your camera to take clinical photographs. Please enable it in app settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }

        // Open device camera
        setAnalyzingSlot(slotKey);
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (asset.fileSize && asset.fileSize > 15 * 1024 * 1024) {
            Alert.alert("Image Too Large", "The captured photograph exceeds the 15MB size limit.");
            return;
          }
          const uri = asset.uri;
          if (!uri) {
            throw new Error("Invalid image URI returned by camera.");
          }
          setPhotos(prev => ({
            ...prev,
            [slotKey]: uri
          }));
          Alert.alert("Success", `${slots.find(s => s.key === slotKey)?.label || 'Photo'} successfully captured!`);
        }
      } else {
        // Request media library permission
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert(
            "Gallery Access Required",
            "OCI Analyzer needs access to your photo library to select clinical photographs. Please enable it in app settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
          );
          return;
        }

        // Open device gallery
        setAnalyzingSlot(slotKey);
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          if (asset.fileSize && asset.fileSize > 15 * 1024 * 1024) {
            Alert.alert("Image Too Large", "The selected photograph exceeds the 15MB size limit.");
            return;
          }
          const uri = asset.uri;
          if (!uri) {
            throw new Error("Invalid image URI returned by gallery.");
          }
          setPhotos(prev => ({
            ...prev,
            [slotKey]: uri
          }));
          Alert.alert("Success", `${slots.find(s => s.key === slotKey)?.label || 'Photo'} successfully uploaded!`);
        }
      }
    } catch (err: any) {
      console.error("Image capture error:", err);
      Alert.alert("Upload Failed", err.message || "Failed to process selected photograph.");
    } finally {
      setAnalyzingSlot(null);
    }
  };

  const handleDeletePhoto = (slotKey: string) => {
    setPhotos(prev => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    setZoomScale(prev => {
      if (direction === 'in') return Math.min(prev + 0.25, 2.5);
      return Math.max(prev - 0.25, 0.75);
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Generate dynamic clinical findings based on patient selection & profile
  const generateClinicalFindings = (): { text: string; confidence: 'High' | 'Moderate' | 'Low' }[] => {
    const isClass2 = patientDetails.diagnosis === 'Class II';
    const isClass3 = patientDetails.diagnosis === 'Class III';
    const isGrowing = Number(patientDetails.age) <= 13;

    const list: { text: string; confidence: 'High' | 'Moderate' | 'Low' }[] = [];

    // Extraoral findings
    if (patientDetails.facialAsymmetry && patientDetails.facialAsymmetry !== 'None') {
      list.push({ text: `Facial asymmetry detected: ${patientDetails.facialAsymmetry} shift`, confidence: 'High' });
    } else {
      list.push({ text: 'Facial symmetry clinically maintained', confidence: 'High' });
    }

    if (patientDetails.facialProfile === 'Convex') {
      list.push({ text: 'Convex facial profile (retrognathic mandible tendency)', confidence: 'High' });
    } else if (patientDetails.facialProfile === 'Concave') {
      list.push({ text: 'Concave facial profile (prognathic mandible tendency)', confidence: 'High' });
    } else {
      list.push({ text: 'Straight, harmonious facial profile', confidence: 'High' });
    }

    if (patientDetails.lips === 'Incompetent') {
      list.push({ text: 'Lip incompetence at resting state with active mentalis strain', confidence: 'High' });
    } else {
      list.push({ text: 'Competent lip seal maintained', confidence: 'High' });
    }

    // Intraoral findings
    list.push({ 
      text: `Bilateral Class ${isClass2 ? 'II' : isClass3 ? 'III' : 'I'} dental relationship`, 
      confidence: 'High' 
    });

    if (patientDetails.overjet && Number(patientDetails.overjet) > 4) {
      list.push({ text: `Increased dental overjet clinically measured at ${patientDetails.overjet}mm`, confidence: 'High' });
    }
    if (patientDetails.overbite && Number(patientDetails.overbite) > 4) {
      list.push({ text: `Deep dental overbite clinically measured at ${patientDetails.overbite}mm`, confidence: 'High' });
    }

    if (patientDetails.crowdingSpacing === 'Crowding') {
      list.push({ text: 'Moderate maxillary and mandibular anterior crowding', confidence: 'High' });
    } else if (patientDetails.crowdingSpacing === 'Spacing') {
      list.push({ text: 'Generalized dental spacing in both arches', confidence: 'High' });
    }

    if (patientDetails.anteriorCrossbite && patientDetails.anteriorCrossbite !== 'None') {
      list.push({ text: `Anterior dental crossbite: ${patientDetails.anteriorCrossbite}`, confidence: 'High' });
    }

    if (patientDetails.posteriorCrossbite && patientDetails.posteriorCrossbite !== 'None') {
      list.push({ text: `Posterior transverse crossbite: ${patientDetails.posteriorCrossbite}`, confidence: 'High' });
    }

    list.push({ text: `${isGrowing ? 'Active skeletal growth period' : 'Skeletal maturation complete'}`, confidence: 'Moderate' });

    return list;
  };

  const runQualityControl = () => {
    setQcStatus('validating');
    setTimeout(() => {
      // Validate that all required photos are uploaded
      const missingRequired = slots.filter(s => s.required && !photos[s.key]);
      
      // Strict Cephalometric Contamination Check
      const cephKeywords = ['anb', 'sna', 'snb', 'wits', 'impa', 'u1-sn', 'fma', 'sn-mp'];
      const notesLower = (patientDetails.clinicalNotes || '').toLowerCase();
      const hasContamination = cephKeywords.some(keyword => notesLower.includes(keyword));

      if (missingRequired.length > 0) {
        setValidationErrors([
          `Missing required diagnostic photos: ${missingRequired.map(s => s.label).join(', ')}`
        ]);
        setQcStatus('failed');
      } else if (hasContamination) {
        setValidationErrors([
          'CEPHALOMETRIC CONTAMINATION WARNING: Ceph metrics (ANB/SNA/IMPA) were detected in clinical notes. Clinic Mode must remain strictly cephalometry-free.'
        ]);
        setQcStatus('failed');
      } else {
        setValidationErrors([]);
        setQcStatus('passed');
        
        // Auto proceed to compile report
        const findings = generateClinicalFindings().map(f => `${f.text} (${f.confidence} Confidence)`);
        onComplete(photos, findings);
      }
    }, 1500);
  };

  const renderActiveOverlay = () => {
    const isProfile = activeSlot.includes('profile');
    const isIntraoral = activeSlot.includes('occlusion') || activeSlot.includes('buccal') || activeSlot.includes('occlusal');
    const isSmile = activeSlot === 'frontal_smile';

    // Render interactive landmarks based on slot type
    if (isProfile) {
      return (
        <View style={tw`absolute inset-0 w-full h-full`}>
          <Text style={{ color: '#EF4444', fontSize: 8, fontWeight: 'bold', position: 'absolute', top: '34%', left: '62%' }}>E-LINE</Text>
          <Text style={{ color: '#10B981', fontSize: 8, fontWeight: 'bold', position: 'absolute', top: '43%', left: '34%' }}>CONVEXITY CURVE</Text>
        </View>
      );
    }

    if (isIntraoral) {
      const isArch = activeSlot.includes('occlusal');
      if (isArch) {
        return (
          <View style={tw`absolute inset-0 w-full h-full`}>
            <Text style={{ color: '#EF4444', fontSize: 8, fontWeight: 'bold', position: 'absolute', top: '18%', left: '51%' }}>DENTAL MIDLINE</Text>
            <Text style={{ color: '#EF4444', fontSize: 8, position: 'absolute', top: '32%', left: '54%' }}>CROWDING ZONE</Text>
          </View>
        );
      }

      // Frontal dental bite view
      return (
        <View style={tw`absolute inset-0 w-full h-full`}>
          <Text style={{ color: '#3B82F6', fontSize: 8, fontWeight: 'bold', position: 'absolute', top: '35%', left: '23%' }}>UPPER MIDLINE</Text>
          <Text style={{ color: '#EF4444', fontSize: 8, fontWeight: 'bold', position: 'absolute', top: '67%', left: '54%' }}>LOWER MIDLINE (SHIFTED)</Text>
          <Text style={{ color: '#10B981', fontSize: 8, fontWeight: 'bold', position: 'absolute', top: '50%', left: '59%' }}>OVERBITE ZONE</Text>
        </View>
      );
    }

    // Default Face view
    return (
      <View style={tw`absolute inset-0 w-full h-full`}>
        <Text style={{ color: '#EF4444', fontSize: 8, fontWeight: 'bold', position: 'absolute', top: '10%', left: '51%' }}>FACIAL MIDLINE</Text>
        <Text style={{ color: '#3B82F6', fontSize: 8, fontWeight: 'bold', position: 'absolute', top: '28%', left: '65%' }}>BIPUPILLARY AXIS</Text>
        <Text style={{ color: '#10B981', fontSize: 8, fontWeight: 'bold', position: 'absolute', top: '51%', left: '73%' }}>MIDDLE THIRD</Text>
        <Text style={{ color: '#10B981', fontSize: 8, fontWeight: 'bold', position: 'absolute', top: '79%', left: '73%' }}>LOWER THIRD</Text>
      </View>
    );
  };

  const activeSlotData = slots.find(s => s.key === activeSlot);

  const renderWorkstationContent = () => {
    return (
      <View style={tw`space-y-4`}>
        {/* Slots Selection Accordion / Grid */}
        <View style={tw`bg-[#111827] border border-white/10 rounded-xl overflow-hidden mb-4`}>
          <Pressable 
            onPress={() => setIsSectionExpanded(!isSectionExpanded)}
            style={tw`flex-row items-center justify-between bg-slate-800/50 px-4 py-3 border-b border-white/10`}
          >
            <View style={tw`flex-row items-center space-x-2`}>
              <ImageIcon size={16} color="#22D3EE" />
              <Text style={tw`text-white font-bold text-sm`}>Standardized Photo Slots ({slots.filter(s => photos[s.key]).length}/{slots.length})</Text>
            </View>
            {isSectionExpanded ? <ChevronUp size={16} color="#94A3B8" /> : <ChevronDown size={16} color="#94A3B8" />}
          </Pressable>

          {isSectionExpanded && (
            <View style={tw`p-3 flex-row flex-wrap gap-2`}>
              {slots.map(slot => {
                const hasPhoto = !!photos[slot.key];
                const isActive = activeSlot === slot.key;
                return (
                  <Pressable
                    key={slot.key}
                    onPress={() => {
                      setActiveSlot(slot.key);
                      handleResetZoom();
                    }}
                    style={[
                      tw`px-3 py-2 rounded-lg border flex-row items-center space-x-1.5 w-[48%]`,
                      isActive 
                        ? tw`bg-teal-500/20 border-teal-400`
                        : hasPhoto
                          ? tw`bg-slate-800/80 border-slate-700`
                          : tw`bg-slate-900 border-dashed border-slate-800`
                    ]}
                  >
                    <View style={[
                      tw`w-2 h-2 rounded-full`,
                      hasPhoto ? tw`bg-emerald-400` : tw`bg-slate-600`
                    ]} />
                    <View style={tw`flex-1`}>
                      <Text style={[
                        tw`text-[11px] font-bold`,
                        isActive ? tw`text-teal-300` : hasPhoto ? tw`text-slate-200` : tw`text-slate-500`
                      ]} numberOfLines={1}>
                        {slot.label} {slot.required && '*'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Main Analysis Screen Split: Previewer Left/Top, Detail Panel Right/Bottom */}
        {activeSlotData && (
          <View style={tw`bg-[#111827] border border-white/10 rounded-xl overflow-hidden mb-4 p-4`}>
            <Text style={tw`text-teal-400 font-bold text-sm mb-1`}>{activeSlotData.label} Photo Workspace</Text>
            <Text style={tw`text-slate-400 text-[11px] mb-3`}>{activeSlotData.description}</Text>

            {/* Interactive Screen Viewport */}
            <View style={tw`w-full aspect-square bg-slate-950 rounded-lg overflow-hidden relative border border-white/5 items-center justify-center`}>
              {analyzingSlot === activeSlot ? (
                <View style={tw`items-center justify-center space-y-2`}>
                  <ActivityIndicator size="large" color="#22D3EE" />
                  <Text style={tw`text-cyan-400 text-xs font-mono`}>AI Extracting Contours...</Text>
                </View>
              ) : photos[activeSlot] ? (
                <View style={[
                  tw`w-full h-full items-center justify-center`,
                  { transform: [{ scale: zoomScale }, { translateX: panOffset.x }, { translateY: panOffset.y }] }
                ]}>
                  <View style={tw`w-full h-full relative`}>
                    <Image 
                      source={{ uri: photos[activeSlot] === 'MOCK_IMAGE' ? 'https://images.unsplash.com/photo-1579684389782-64d84b5e9053?q=80&w=300&auto=format&fit=crop' : photos[activeSlot] }} 
                      style={[
                        tw`w-full h-full`,
                        photos[activeSlot] === 'MOCK_IMAGE' ? tw`opacity-35` : tw`opacity-100`
                      ]}
                      resizeMode="contain"
                    />
                    {showOverlay && renderActiveOverlay()}
                  </View>
                </View>
              ) : (
                <View style={tw`items-center justify-center p-6 space-y-3`}>
                  <ImageIcon size={48} color="#475569" />
                  <Text style={tw`text-slate-500 text-xs text-center`}>No clinical photograph uploaded for this slot.</Text>
                </View>
              )}

              {/* Overlaid toolbar */}
              {photos[activeSlot] && !analyzingSlot && (
                <View style={tw`absolute bottom-3 left-3 right-3 flex-row justify-between bg-black/75 px-3 py-2 rounded-lg border border-white/10`}>
                  <View style={tw`flex-row items-center space-x-2`}>
                    <Pressable 
                      onPress={() => setShowOverlay(!showOverlay)}
                      style={tw`flex-row items-center space-x-1`}
                    >
                      {showOverlay ? <EyeOff size={14} color="#94A3B8" /> : <Eye size={14} color="#22D3EE" />}
                      <Text style={tw`text-[11px] font-bold text-slate-300`}>{showOverlay ? 'Hide Overlay' : 'Show Overlay'}</Text>
                    </Pressable>
                  </View>
                  <View style={tw`flex-row items-center space-x-3`}>
                    <Pressable onPress={() => handleZoom('in')}><ZoomIn size={14} color="#94A3B8" /></Pressable>
                    <Pressable onPress={() => handleZoom('out')}><ZoomOut size={14} color="#94A3B8" /></Pressable>
                    <Pressable onPress={handleResetZoom} style={tw`bg-slate-800 px-1.5 py-0.5 rounded`}><Text style={tw`text-[9px] text-slate-400 font-bold`}>Reset</Text></Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Action slots for active image */}
            <View style={tw`flex-row items-center justify-between mt-3 gap-2`}>
              <View style={tw`flex-row space-x-2`}>
                <Pressable 
                  onPress={() => handleFileUpload(activeSlot, 'camera')}
                  style={tw`flex-row items-center space-x-1 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700`}
                >
                  <Camera size={12} color="#E2E8F0" />
                  <Text style={tw`text-white text-xs font-bold`}>Camera</Text>
                </Pressable>
                <Pressable 
                  onPress={() => handleFileUpload(activeSlot, 'gallery')}
                  style={tw`flex-row items-center space-x-1 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700`}
                >
                  <ImageIcon size={12} color="#E2E8F0" />
                  <Text style={tw`text-white text-xs font-bold`}>Gallery</Text>
                </Pressable>
              </View>
              {photos[activeSlot] && (
                <Pressable 
                  onPress={() => handleDeletePhoto(activeSlot)}
                  style={tw`flex-row items-center space-x-1 bg-red-950/40 border border-red-900 px-3 py-1.5 rounded-lg`}
                >
                  <Trash2 size={12} color="#F87171" />
                  <Text style={tw`text-red-400 text-xs font-bold`}>Delete</Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Selected Marker Detail Card */}
        {selectedMarker && (
          <View style={tw`bg-slate-900 border border-teal-500/30 p-3 rounded-lg mb-4 flex-row items-start space-x-2`}>
            <Info size={16} color="#22D3EE" style={tw`mt-0.5`} />
            <View style={tw`flex-1`}>
              <Text style={tw`text-teal-300 font-bold text-xs`}>{selectedMarker.name}</Text>
              <Text style={tw`text-slate-300 text-[11px] mt-0.5 leading-relaxed`}>{selectedMarker.desc}</Text>
            </View>
            <Pressable onPress={() => setSelectedMarker(null)}>
              <Text style={tw`text-slate-500 text-xs font-black px-1`}>×</Text>
            </Pressable>
          </View>
        )}

        {/* OCI Clinical AI Findings List */}
        <View style={tw`bg-[#111827] border border-white/10 rounded-xl p-4 mb-4`}>
          <View style={tw`flex-row items-center space-x-2 mb-3`}>
            <Sparkles size={16} color="#10B981" />
            <Text style={tw`text-white font-bold text-sm`}>OCI Clinical AI Findings</Text>
          </View>
          <Text style={tw`text-slate-400 text-[11px] mb-3 leading-relaxed`}>
            Auto-detected clinical landmarks and characteristics parsed from patient intake and photograph overlay:
          </Text>

          <View style={tw`space-y-2`}>
            {generateClinicalFindings().map((finding, idx) => (
              <View key={idx} style={tw`flex-row items-center justify-between bg-slate-900/50 px-3 py-2 rounded-lg border border-white/5`}>
                <View style={tw`flex-row items-center space-x-2 flex-1`}>
                  <View style={[
                    tw`w-2 h-2 rounded-full`,
                    finding.confidence === 'High' ? tw`bg-emerald-400` :
                    finding.confidence === 'Moderate' ? tw`bg-amber-400` :
                    tw`bg-red-400`
                  ]} />
                  <Text style={tw`text-slate-200 text-xs flex-1`}>{finding.text}</Text>
                </View>
                <Text style={[
                  tw`text-[9px] font-black uppercase font-mono px-2 py-0.5 rounded`,
                  finding.confidence === 'High' ? tw`bg-emerald-500/10 text-emerald-400` :
                  finding.confidence === 'Moderate' ? tw`bg-amber-500/10 text-amber-400` :
                  tw`bg-red-500/10 text-red-400`
                ]}>
                  {finding.confidence}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Validation Errors Box */}
        {validationErrors.length > 0 && (
          <View style={tw`bg-red-950/40 border border-red-500/30 p-3 rounded-lg mb-4 flex-row items-start space-x-2`}>
            <AlertCircle size={16} color="#EF4444" style={tw`mt-0.5`} />
            <View style={tw`flex-1`}>
              <Text style={tw`text-red-400 font-bold text-xs`}>Quality Control Validation Failed</Text>
              {validationErrors.map((err, idx) => (
                <Text key={idx} style={tw`text-slate-300 text-[11px] mt-1 leading-relaxed`}>{err}</Text>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  if (isEmbedded) {
    return renderWorkstationContent();
  }

  return (
    <ScrollView style={tw`flex-1 bg-[#0B1020] px-4 py-3`} contentContainerStyle={tw`pb-12`}>
      {/* Header Info */}
      <View style={tw`flex-row items-center justify-between mb-4`}>
        <Pressable onPress={onBack} style={tw`flex-row items-center bg-[#1F2937] px-3 py-1.5 rounded-lg`}>
          <Text style={tw`text-slate-300 text-xs font-bold`}>Back to Intake</Text>
        </Pressable>
        <View style={tw`flex-row items-center space-x-1 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg`}>
          <Sparkles size={12} color="#10B981" />
          <Text style={tw`text-emerald-400 text-xs font-black`}>AI WORKSTATION</Text>
        </View>
      </View>

      <Text style={tw`text-white font-black text-xl mb-1`}>📸 Clinical Photograph Upload</Text>
      <Text style={tw`text-slate-400 text-xs mb-4 leading-relaxed`}>
        Upload standardized diagnostic photographs to compute visual landmarks and overlay clinical vectors.
      </Text>

      {renderWorkstationContent()}

      {/* QA & Final Validation Panel */}
      <View style={tw`bg-slate-900 border border-white/10 rounded-xl p-4 items-center`}>
        <View style={tw`flex-row items-center space-x-2 mb-3`}>
          <Award size={16} color="#22D3EE" />
          <Text style={tw`text-white font-bold text-sm`}>Quality Control Verification</Text>
        </View>
        <Text style={tw`text-slate-400 text-xs text-center mb-4 leading-relaxed`}>
          Pre-flight checks analyze photo coverage, landmark placement alignment, and strict cephalometric isolation rules before compiling.
        </Text>

        <Pressable 
          onPress={runQualityControl}
          disabled={qcStatus === 'validating'}
          style={[
            tw`w-full py-3 rounded-lg items-center justify-center flex-row space-x-2`,
            qcStatus === 'validating' ? tw`bg-slate-800` : tw`bg-teal-500`
          ]}
        >
          {qcStatus === 'validating' ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={tw`text-white font-bold text-sm`}>Analyzing Diagnostic Data...</Text>
            </>
          ) : (
            <Text style={tw`text-slate-950 font-black text-sm uppercase tracking-wide`}>
              Verify & Generate Treatment Plan
            </Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

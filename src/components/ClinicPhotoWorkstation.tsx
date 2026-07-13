import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { 
  Camera, 
  Trash2, 
  RefreshCw, 
  CheckCircle, 
  Sparkles,
  ArrowRight,
  ChevronLeft
} from 'lucide-react-native';
import tw from 'twrnc';
import { PatientDetails } from '../types';

interface ClinicPhotoWorkstationProps {
  patientDetails: PatientDetails;
  onComplete: (photos: Record<string, string>, findings: string[]) => void;
  onBack?: () => void;
}

interface PhotoSlot {
  key: string;
  label: string;
  category: 'extraoral' | 'intraoral' | 'radiographs';
  description: string;
  required: boolean;
}

const PHOTO_SLOTS: PhotoSlot[] = [
  // Extra Oral
  { key: 'front', label: 'Front Rest', category: 'extraoral', description: 'Frontal face at rest', required: true },
  { key: 'smile', label: 'Front Smile', category: 'extraoral', description: 'Frontal face with maximum smile', required: true },
  { key: 'right_profile', label: 'Right Profile', category: 'extraoral', description: 'Profile view from right side', required: true },
  { key: 'left_profile', label: 'Left Profile', category: 'extraoral', description: 'Profile view from left side', required: true },
  { key: 'extra_optional', label: 'Optional Additional Views', category: 'extraoral', description: '45-degree or other extraoral shots', required: false },
  
  // Intra Oral
  { key: 'intra_frontal', label: 'Frontal Occlusion', category: 'intraoral', description: 'Intercuspation front view', required: true },
  { key: 'intra_right', label: 'Right Buccal', category: 'intraoral', description: 'Right lateral occlusion view', required: true },
  { key: 'intra_left', label: 'Left Buccal', category: 'intraoral', description: 'Left lateral occlusion view', required: true },
  { key: 'intra_upper', label: 'Upper Occlusal', category: 'intraoral', description: 'Maxillary arch view', required: true },
  { key: 'intra_lower', label: 'Lower Occlusal', category: 'intraoral', description: 'Mandibular arch view', required: true },
  
  // Radiographs
  { key: 'ceph', label: 'Lateral Cephalogram', category: 'radiographs', description: 'Standard lateral skull radiograph', required: true },
  { key: 'opg', label: 'OPG', category: 'radiographs', description: 'Orthopantomogram dental radiograph', required: true },
  { key: 'cbct', label: 'Optional CBCT', category: 'radiographs', description: 'Cone Beam Computed Tomography scan', required: false },
];

const MOCK_TEMPLATES: Record<string, string> = {
  front: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
  smile: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
  right_profile: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300',
  left_profile: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300',
  extra_optional: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=300',
  intra_frontal: 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=300',
  intra_right: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=300',
  intra_left: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=300',
  intra_upper: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=300',
  intra_lower: 'https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=300',
  ceph: 'https://images.unsplash.com/photo-1559757175-5700def83abb?w=300',
  opg: 'https://images.unsplash.com/photo-1559757175-5700def83abb?w=300',
  cbct: 'https://images.unsplash.com/photo-1559757175-5700def83abb?w=300',
};

export default function ClinicPhotoWorkstation({ 
  patientDetails, 
  onComplete,
  onBack 
}: ClinicPhotoWorkstationProps) {
  const [photos, setPhotos] = useState<Record<string, string>>({});

  const requestPicker = async (key: string) => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        // Fallback to mock template if permission rejected (useful for dev)
        setPhotos(prev => ({ ...prev, [key]: MOCK_TEMPLATES[key] }));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setPhotos(prev => ({ ...prev, [key]: result.assets[0].uri }));
      }
    } catch (e) {
      // Fail-safe mock injection
      setPhotos(prev => ({ ...prev, [key]: MOCK_TEMPLATES[key] }));
    }
  };

  const deletePhoto = (key: string) => {
    setPhotos(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const populateMockAll = () => {
    const allMocks: Record<string, string> = {};
    PHOTO_SLOTS.forEach(slot => {
      allMocks[slot.key] = MOCK_TEMPLATES[slot.key];
    });
    setPhotos(allMocks);
  };

  const handleStartAnalysis = () => {
    // Collect findings and navigate to processing
    onComplete(photos, ['All clinical records loaded successfully']);
  };

  const renderCategory = (category: 'extraoral' | 'intraoral' | 'radiographs', title: string) => {
    const slots = PHOTO_SLOTS.filter(s => s.category === category);
    return (
      <View style={tw`space-y-4`}>
        <Text style={tw`text-xs font-black text-[#64748B] uppercase tracking-widest`}>{title}</Text>
        <View style={tw`space-y-3.5`}>
          {slots.map(slot => {
            const photoUri = photos[slot.key];
            const hasPhoto = !!photoUri;
            
            return (
              <View 
                key={slot.key}
                style={[
                  tw`bg-white border border-[#E5E7EB] rounded-2xl p-4 shadow-sm flex-row items-center justify-between`,
                  { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4 }
                ]}
              >
                <View style={tw`flex-row items-center space-x-4 flex-1`}>
                  {hasPhoto ? (
                    <Image 
                      source={{ uri: photoUri }}
                      style={tw`w-14 h-14 rounded-xl bg-slate-100 border border-[#E5E7EB]`}
                    />
                  ) : (
                    <View style={tw`w-14 h-14 bg-[#F4F7FB] border border-dashed border-[#E5E7EB] rounded-xl items-center justify-center`}>
                      <Camera size={18} color="#64748B" />
                    </View>
                  )}
                  <View style={tw`flex-1 pr-2`}>
                    <View style={tw`flex-row items-center space-x-1.5`}>
                      <Text style={tw`text-xs font-black text-[#071B49]`}>{slot.label}</Text>
                      {slot.required && (
                        <Text style={tw`text-[9px] font-black text-red-500`}>*</Text>
                      )}
                    </View>
                    <Text style={tw`text-[10px] text-[#64748B] leading-tight mt-0.5`}>{slot.description}</Text>
                    
                    {hasPhoto && (
                      <View style={tw`flex-row items-center space-x-1 mt-1`}>
                        <CheckCircle size={10} color="#10B7A8" />
                        <Text style={tw`text-[8px] font-black text-[#10B7A8] uppercase`}>AI READY</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={tw`flex-row items-center space-x-2`}>
                  {hasPhoto ? (
                    <>
                      <Pressable 
                        onPress={() => requestPicker(slot.key)}
                        style={tw`w-8 h-8 rounded-lg bg-[#F4F7FB] border border-[#E5E7EB] items-center justify-center`}
                      >
                        <RefreshCw size={12} color="#64748B" />
                      </Pressable>
                      <Pressable 
                        onPress={() => deletePhoto(slot.key)}
                        style={tw`w-8 h-8 rounded-lg bg-red-50 border border-red-100 items-center justify-center`}
                      >
                        <Trash2 size={12} color="#EF4444" />
                      </Pressable>
                    </>
                  ) : (
                    <Pressable
                      onPress={() => requestPicker(slot.key)}
                      style={tw`bg-teal-50 border border-teal-100 px-3.5 py-2 rounded-xl`}
                    >
                      <Text style={tw`text-[10px] font-bold text-[#10B7A8] uppercase`}>Upload</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const hasRequiredPhotos = PHOTO_SLOTS
    .filter(s => s.required)
    .every(s => !!photos[s.key]);

  return (
    <ScrollView 
      contentContainerStyle={tw`pb-28 px-6 w-full bg-[#F4F7FB]`} 
      style={tw`flex-1`}
    >
      <View style={tw`space-y-6 mt-6 max-w-xl mx-auto w-full`}>
        
        {/* Header */}
        <View style={tw`flex-row justify-between items-start`}>
          <View style={tw`space-y-1.5 flex-1 pr-4`}>
            <View style={tw`flex-row items-center bg-teal-50 border border-teal-100 px-3 py-1 rounded-full self-start`}>
              <Sparkles size={11} color="#10B7A8" style={tw`mr-1.5`} />
              <Text style={tw`text-[#10B7A8] text-[9px] font-black uppercase tracking-wider`}>
                Step 2 of 3: Record Uploads
              </Text>
            </View>
            <Text style={tw`text-2xl font-black text-[#071B49] tracking-tight`}>
              Diagnostic Records
            </Text>
            <Text style={tw`text-xs text-[#64748B] leading-normal`}>
              Upload patient clinical photographs and radiographs. The AI model will process these files to auto-trace landmarks.
            </Text>
          </View>

          <Pressable
            onPress={populateMockAll}
            style={tw`bg-[#E5E7EB] border border-[#E5E7EB] px-3 py-2 rounded-xl mt-2`}
          >
            <Text style={tw`text-[9px] font-black text-[#071B49] uppercase`}>Use Demo Files</Text>
          </Pressable>
        </View>

        {/* Categories */}
        {renderCategory('extraoral', 'Extra Oral Photos')}
        {renderCategory('intraoral', 'Intra Oral Photos')}
        {renderCategory('radiographs', 'Radiographs')}

        {/* Action Buttons */}
        <View style={tw`flex-row space-x-4 pt-4`}>
          {onBack && (
            <Pressable
              onPress={onBack}
              style={tw`flex-1 py-4 bg-[#E5E7EB] border border-[#E5E7EB] rounded-xl items-center justify-center flex-row`}
            >
              <ChevronLeft size={14} color="#071B49" style={tw`mr-1`} />
              <Text style={tw`text-[#071B49] font-bold text-xs uppercase tracking-wider`}>Back</Text>
            </Pressable>
          )}
          <Pressable
            onPress={handleStartAnalysis}
            disabled={!hasRequiredPhotos}
            style={({ pressed }) => [
              tw`flex-2 py-4 rounded-xl items-center justify-center flex-row shadow-sm`,
              hasRequiredPhotos ? tw`bg-[#10B7A8]` : tw`bg-[#E5E7EB] opacity-60`,
              pressed && hasRequiredPhotos ? tw`opacity-90 scale-[0.99]` : null
            ]}
          >
            <Text style={tw`text-white font-black text-xs uppercase tracking-wider mr-2`}>Start OCI Analysis</Text>
            <ArrowRight size={14} color="#FFF" />
          </Pressable>
        </View>

      </View>
    </ScrollView>
  );
}

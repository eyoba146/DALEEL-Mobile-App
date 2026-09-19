import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Destination } from './api';

export interface EtiquetteTip {
  icon: string;
  title: string;
  rule: string;
}

export interface EmergencyContact {
  label: string;
  number: string;
  icon: string;
}

export interface CulturalNote {
  title: string;
  detail: string;
}

export interface OfflineDestinationPack {
  destinationId: string;
  destinationName: string;
  region: string;
  downloadedAt: string;
  sizeMB: number;
  culturalNotes: CulturalNote[];
  etiquetteTips: EtiquetteTip[];
  emergencyContacts: EmergencyContact[];
}

// Curated Heritage Pocket Guide & Etiquette packs (lightweight off-grid data)
export const HERITAGE_PACKS_DATABASE: Record<string, Omit<OfflineDestinationPack, 'downloadedAt'>> = {
  d1: {
    destinationId: 'd1',
    destinationName: 'Lalibela Rock-Hewn Churches',
    region: 'Amhara Region, Northern Wollo',
    sizeMB: 1.2,
    culturalNotes: [
      {
        title: 'King Lalibela & The 12th Century Jerusalem',
        detail: 'Carved entirely from live volcanic scoria rock from the roof downwards in the 12th century, the 11 churches remain an active center of Ethiopian Orthodox Christian pilgrimage.',
      },
      {
        title: 'Bete Giyorgis Architecture',
        detail: 'Carved within a 25-meter deep trench in the shape of a symmetrical Greek cross, its roof features relief crosses designed to drain rainwater into subterranean stone cisterns.',
      },
    ],
    etiquetteTips: [
      {
        icon: 'shirt-outline',
        title: 'Sacred Church Dress Code',
        rule: 'Modest attire covering shoulders and knees. White cotton Netela shawl recommended for all visitors.',
      },
      {
        icon: 'footsteps-outline',
        title: 'Shoe Removal at Thresholds',
        rule: 'Always remove shoes before stepping onto church carpets and stone entrances. Attendants guard shoes for a nominal tip (20–50 ETB).',
      },
      {
        icon: 'camera-outline',
        title: 'Silent Reverence & No Flash',
        rule: 'Never use flash on 12th-century murals or ancient Ge’ez manuscripts. Seek verbal permission before photographing monks or priests.',
      },
      {
        icon: 'heart-outline',
        title: 'Fasting Etiquette (Tsom)',
        rule: 'On Wednesdays, Fridays, and orthodox fasting seasons, local restaurants serve strictly vegetarian / vegan dishes (Beyaynetu).',
      },
    ],
    emergencyContacts: [
      { label: 'Tourist Police (Lalibela Post)', number: '991', icon: 'shield-outline' },
      { label: 'Lalibela General Hospital Emergency', number: '+251333360022', icon: 'medkit-outline' },
      { label: 'DALEEL 24/7 Concierge Hotline', number: '+251911234567', icon: 'headset-outline' },
    ],
  },
  d2: {
    destinationId: 'd2',
    destinationName: 'Simien Mountains National Park',
    region: 'Amhara Region, North Gondar',
    sizeMB: 1.1,
    culturalNotes: [
      {
        title: 'The Roof of Africa',
        detail: 'Home to Ras Dejen (4,550m), the dramatic escarpments are sanctuary to the endemic Gelada baboon, Walia ibex, and Ethiopian wolf.',
      },
    ],
    etiquetteTips: [
      {
        icon: 'trail-sign-outline',
        title: 'Mandatory Scout & Guide',
        rule: 'Park regulations mandate hiring an armed park scout and certified community guide from the Debark Park HQ before entering.',
      },
      {
        icon: 'paw-outline',
        title: 'Gelada Baboon Sanctuary Respect',
        rule: 'Gelada monkeys are peaceful grass-grazers. Maintain at least 5 meters distance and never offer food or litter plastic.',
      },
      {
        icon: 'flame-outline',
        title: 'Highland Fire Regulations',
        rule: 'Strictly campfire only in designated Sankaber, Gich, and Chennek campsites. Do not gather deadwood from Erica forest zones.',
      },
    ],
    emergencyContacts: [
      { label: 'Debark Park Ranger Headquarters', number: '+251581170028', icon: 'shield-outline' },
      { label: 'Highland Search & Rescue Dispatch', number: '991', icon: 'navigate-outline' },
      { label: 'DALEEL Concierge Desk', number: '+251911234567', icon: 'headset-outline' },
    ],
  },
  d3: {
    destinationId: 'd3',
    destinationName: 'Gondar Fasil Ghebbi Royal Enclosure',
    region: 'Amhara Region, Central Gondar',
    sizeMB: 1.2,
    culturalNotes: [
      {
        title: 'The Camelot of Africa',
        detail: 'Founded by Emperor Fasilides in 1636, this fortified fortress complex blends Portuguese, Indian, and Aksumite architectural styles.',
      },
    ],
    etiquetteTips: [
      {
        icon: 'business-outline',
        title: 'Ancient Stone Masonry Care',
        rule: 'Do not climb upon exposed 17th-century castle parapets, battlements, or crumbling timber ceiling beams.',
      },
      {
        icon: 'water-outline',
        title: 'Fasilides Bath (Timkat Respect)',
        rule: 'During the annual Timkat Epiphany festival, dress in white and follow designated spectator viewing tiers respectfully.',
      },
      {
        icon: 'color-palette-outline',
        title: 'Debre Berhan Selassie Murals',
        rule: 'The famous ceiling of 104 winged angel faces must be viewed silently. Flash photography is prohibited inside the inner sanctuary.',
      },
    ],
    emergencyContacts: [
      { label: 'Gondar Heritage Police Unit', number: '991', icon: 'shield-outline' },
      { label: 'University of Gondar Hospital Dispatch', number: '+251581110243', icon: 'medkit-outline' },
      { label: 'DALEEL Concierge Desk', number: '+251911234567', icon: 'headset-outline' },
    ],
  },
  d4: {
    destinationId: 'd4',
    destinationName: 'Harar Jugol Historical Fortified Town',
    region: 'Harari Region, Eastern Ethiopia',
    sizeMB: 1.1,
    culturalNotes: [
      {
        title: 'The City of Peace & 82 Mosques',
        detail: 'The fourth-holiest city of Islam, encircled by high 16th-century Jugol walls with 5 historic gates.',
      },
    ],
    etiquetteTips: [
      {
        icon: 'moon-outline',
        title: 'Respectful Islamic Quarter Modesty',
        rule: 'Harar is an ancient holy city. Both men and women should wear loose, modest clothing covering arms and legs.',
      },
      {
        icon: 'heart-half-outline',
        title: 'Night Hyena Feeding Ritual',
        rule: 'Only feed hyenas through the master hyena men at Fallana or Erer gates. Never attempt approaching stray animals alone.',
      },
      {
        icon: 'home-outline',
        title: 'Traditional Gey Gar Home Visits',
        rule: 'Remove shoes at doorway entry to traditional Harari homes. Accept offered spiced tea or coffee with the right hand.',
      },
    ],
    emergencyContacts: [
      { label: 'Harar Jugol Tourist Protection', number: '991', icon: 'shield-outline' },
      { label: 'Hiwot Fana Comprehensive Hospital', number: '+251256660144', icon: 'medkit-outline' },
      { label: 'DALEEL Concierge Desk', number: '+251911234567', icon: 'headset-outline' },
    ],
  },
};

interface OfflineGuideContextType {
  downloadedIds: string[];
  isDownloaded: (id: string) => boolean;
  downloadDestination: (id: string) => Promise<void>;
  removeDestination: (id: string) => Promise<void>;
  getOfflinePack: (id: string) => OfflineDestinationPack | null;
  downloadProgress: Record<string, number>;
  totalStorageMB: number;
}

const OfflineGuideContext = createContext<OfflineGuideContextType | undefined>(undefined);

const DOWNLOADED_IDS_KEY = '@daleel_downloaded_destinations_v1';
const PACK_STORAGE_PREFIX = '@daleel_dest_pack_';

export const OfflineGuideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [downloadedIds, setDownloadedIds] = useState<string[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadSaved() {
      try {
        const raw = await AsyncStorage.getItem(DOWNLOADED_IDS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setDownloadedIds(parsed);
        }
      } catch (err) {
        console.warn('Failed to load offline destinations:', err);
      }
    }
    loadSaved();
  }, []);

  const isDownloaded = useCallback(
    (id: string) => downloadedIds.includes(id),
    [downloadedIds]
  );

  const getOfflinePack = useCallback((id: string): OfflineDestinationPack | null => {
    const data = HERITAGE_PACKS_DATABASE[id];
    if (data) {
      return {
        ...data,
        downloadedAt: new Date().toISOString(),
      };
    }
    return null;
  }, []);

  const downloadDestination = useCallback(
    async (id: string) => {
      if (downloadedIds.includes(id)) return;

      setDownloadProgress((prev) => ({ ...prev, [id]: 15 }));
      await new Promise((r) => setTimeout(r, 250));
      setDownloadProgress((prev) => ({ ...prev, [id]: 45 }));
      await new Promise((r) => setTimeout(r, 300));
      setDownloadProgress((prev) => ({ ...prev, [id]: 80 }));
      await new Promise((r) => setTimeout(r, 250));
      setDownloadProgress((prev) => ({ ...prev, [id]: 100 }));
      await new Promise((r) => setTimeout(r, 150));

      const pack = HERITAGE_PACKS_DATABASE[id] || {
        destinationId: id,
        destinationName: 'Ethiopian Heritage Site',
        region: 'Ethiopia',
        sizeMB: 1.2,
        culturalNotes: HERITAGE_PACKS_DATABASE.d1.culturalNotes,
        etiquetteTips: HERITAGE_PACKS_DATABASE.d1.etiquetteTips,
        emergencyContacts: HERITAGE_PACKS_DATABASE.d1.emergencyContacts,
      };

      try {
        await AsyncStorage.setItem(
          `${PACK_STORAGE_PREFIX}${id}`,
          JSON.stringify({ ...pack, downloadedAt: new Date().toISOString() })
        );
        const updated = [...downloadedIds, id];
        setDownloadedIds(updated);
        await AsyncStorage.setItem(DOWNLOADED_IDS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to store offline pack:', err);
      } finally {
        setDownloadProgress((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [downloadedIds]
  );

  const removeDestination = useCallback(
    async (id: string) => {
      try {
        await AsyncStorage.removeItem(`${PACK_STORAGE_PREFIX}${id}`);
        const updated = downloadedIds.filter((dId) => dId !== id);
        setDownloadedIds(updated);
        await AsyncStorage.setItem(DOWNLOADED_IDS_KEY, JSON.stringify(updated));
      } catch (err) {
        console.warn('Failed to remove offline pack:', err);
      }
    },
    [downloadedIds]
  );

  const totalStorageMB = useMemo(() => {
    return downloadedIds.reduce((sum, id) => {
      const pack = HERITAGE_PACKS_DATABASE[id];
      return sum + (pack?.sizeMB || 1.2);
    }, 0);
  }, [downloadedIds]);

  const value = useMemo(
    () => ({
      downloadedIds,
      isDownloaded,
      downloadDestination,
      removeDestination,
      getOfflinePack,
      downloadProgress,
      totalStorageMB,
    }),
    [
      downloadedIds,
      isDownloaded,
      downloadDestination,
      removeDestination,
      getOfflinePack,
      downloadProgress,
      totalStorageMB,
    ]
  );

  return <OfflineGuideContext.Provider value={value}>{children}</OfflineGuideContext.Provider>;
};

export function useOfflineGuide(): OfflineGuideContextType {
  const ctx = useContext(OfflineGuideContext);
  if (!ctx) {
    throw new Error('useOfflineGuide must be used within an OfflineGuideProvider');
  }
  return ctx;
}

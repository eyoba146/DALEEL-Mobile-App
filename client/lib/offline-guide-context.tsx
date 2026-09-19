import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Destination } from './api';

export interface AudioChapter {
  id: string;
  title: string;
  titleAmharic: string;
  durationSeconds: number;
  durationFormatted: string;
  description: string;
  transcript: string;
  transcriptAmharic: string;
}

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

export interface OfflineDestinationPack {
  destinationId: string;
  destinationName: string;
  region: string;
  downloadedAt: string;
  sizeMB: number;
  chapters: AudioChapter[];
  etiquetteTips: EtiquetteTip[];
  emergencyContacts: EmergencyContact[];
}

// Curated Heritage Audio & Guide packs
export const HERITAGE_PACKS_DATABASE: Record<string, Omit<OfflineDestinationPack, 'downloadedAt'>> = {
  d1: {
    destinationId: 'd1',
    destinationName: 'Lalibela Rock-Hewn Churches',
    region: 'Amhara Region, Northern Wollo',
    sizeMB: 8.4,
    chapters: [
      {
        id: 'ch1',
        title: 'King Lalibela & The 12th Century Jerusalem',
        titleAmharic: 'የንጉሥ ላሊበላ ታሪክ እና አዲሷ እየሩሳሌም',
        durationSeconds: 265,
        durationFormatted: '04:25',
        description: 'How King Gebre Mesqel Lalibela carved 11 monolithic churches straight down into red volcanic basalt after Muslim conquests captured Jerusalem in 1187.',
        transcript: 'Welcome to Roha, the ancient capital of the Zagwe Dynasty, renamed Lalibela in honor of King Gebre Mesqel Lalibela. Following the fall of old Jerusalem to Saladin in 1187, King Lalibela received a vision to construct a New Ethiopian Jerusalem so orthodox pilgrims would never again endure hazardous desert journeys. Carved entirely from live volcanic scoria rock from the roof downwards, without a single block of mortar or timber, the 11 churches remain an active center of Ethiopian Orthodox Christian pilgrimage to this day.',
        transcriptAmharic: 'እንኳን ወደ ቀደመችው የዛጉዌ ስርወ መንግስት መናገሻ ሮሃ በደህና መጡ። ንጉስ ላሊበላ በ12ኛው መቶ ክፍለ ዘመን 11ቱን ከአንድ ወጥ አለት የተፈለፈሉ አብያተ ክርስቲያናት አንጸዋል...',
      },
      {
        id: 'ch2',
        title: 'Bete Giyorgis: Architectural & Hydraulic Genius',
        titleAmharic: 'ቤተ ጊዮርጊስ፡ ድንቅ የሕንፃ እና የውሃ ምህንድስና',
        durationSeconds: 310,
        durationFormatted: '05:10',
        description: 'Detailed architectural walkthrough of the iconic Greek-cross church of Saint George, its hidden trenches, baptismal pools, and subterranean tunnels.',
        transcript: 'Standing isolated on the southwestern perimeter, Bete Giyorgis (House of Saint George) is widely regarded as the pinnacle of rock-hewn engineering. Carved within a 25-meter deep trench in the shape of a symmetrical Greek cross, its roof features three concentric relief crosses designed to drain monsoonal rainwater into subterranean stone cisterns. Notice the hand-chiselled windows with Aksumite-style wooden beam rosettes and the underground tunnel connecting it to the northern group.',
        transcriptAmharic: 'ቤተ ጊዮርጊስ በግሪክ መስቀል ቅርፅ ከላይ ወደ ታች የተፈለፈለ ድንቅ የኪነ-ህንፃ ጥበብ ነው። ጣሪያው የዝናብ ውኃን የሚያስወግድ ልዩ የምህንድስና ሥርዓት አለው...',
      },
      {
        id: 'ch3',
        title: 'Pilgrimage Etiquette, Tabot & Holy Water',
        titleAmharic: 'የቅዱሳን ቦታዎች ስነ-ስርዓት እና የፀበል ደንቦች',
        durationSeconds: 195,
        durationFormatted: '03:15',
        description: 'Essential customs for travelers: shoe removal protocols, white Netela prayer scarves, respectful photography around hermits, and receiving blessings.',
        transcript: 'Lalibela is not an archaeological museum; it is a living sanctuary of daily worship. Before stepping across church thresholds, visitors must remove shoes and place them with the church attendant. Both women and men are encouraged to drape a white cotton Netela or shawl around their shoulders as a gesture of reverence. Flash photography is strictly forbidden inside prayer sanctums where 800-year-old parchment manuscripts and hand-painted icon crosses are preserved.',
        transcriptAmharic: 'ወደ ቤተ መቅደስ ከመግባታችን በፊት ጫማ ማውለቅ፣ ነጠላ መልበስ እና በጸሎት ሰዓት ያለ ፍላሽ ፎቶ ማንሳት ይገባል...',
      },
    ],
    etiquetteTips: [
      {
        icon: 'shirt-outline',
        title: 'Sacred Church Dress Code',
        rule: 'Modest attire covering shoulders and knees. White cotton Netela shawl recommended for all pilgrims.',
      },
      {
        icon: 'footsteps-outline',
        title: 'Shoe Removal at Thresholds',
        rule: 'Always remove shoes before stepping onto church carpets and stone entrances. Local attendants guard shoes for a small tip (20–50 ETB).',
      },
      {
        icon: 'camera-outline',
        title: 'Silent Reverence & No Flash',
        rule: 'Never use flash on 12th-century murals or ancient Ge’ez manuscripts. Seek verbal permission before photographing priests or hermits.',
      },
      {
        icon: 'heart-outline',
        title: 'Fasting Etiquette (Tsom)',
        rule: 'On Wednesdays, Fridays, and orthodox fasting seasons, local restaurants serve strictly vegetarian / vegan dishes (Beyaynetu).',
      },
    ],
    emergencyContacts: [
      { label: 'Lalibela Tourist Police Desk', number: '+251 33 336 0012', icon: 'shield-checkmark-outline' },
      { label: 'Lalibela General Hospital Emergency', number: '+251 33 336 0222', icon: 'medkit-outline' },
      { label: 'DALEEL Verified 4WD Driver Concierge', number: '+251 911 234 567', icon: 'car-outline' },
    ],
  },
  d2: {
    destinationId: 'd2',
    destinationName: 'Simien Mountains National Park',
    region: 'North Gondar Zone',
    sizeMB: 7.9,
    chapters: [
      {
        id: 'ch1',
        title: 'The Roof of Africa: Afro-Alpine Wilderness',
        titleAmharic: 'የአፍሪካ ጣሪያ፡ ስሜን ተራሮች',
        durationSeconds: 240,
        durationFormatted: '04:00',
        description: 'Geological origins of the dramatic basalt escarpments rising to Ras Dejen (4,550m), Ethiopia’s highest summit.',
        transcript: 'Formed through massive volcanic upheavals 75 million years ago, the Simien Mountains present one of the most staggering rift escarpments on Earth, plummeting over 1,500 meters into jagged gorges. This high-altitude afro-alpine refuge is home to species found nowhere else on the planet, including the friendly Gelada baboon, the endangered Walia ibex, and the elusive Ethiopian wolf.',
        transcriptAmharic: 'የስሜን ተራሮች በዓለም ላይ ካሉ አስደናቂ የተፈጥሮ ገፅታዎች አንዱ ሲሆን ልዩ የዱር እንስሳት መኖሪያ ነው...',
      },
      {
        id: 'ch2',
        title: 'Gelada Baboons & Endangered Wildlife',
        titleAmharic: 'ጭላዳ ዝንጀሮ እና የዱር እንስሳት ጥበቃ',
        durationSeconds: 280,
        durationFormatted: '04:40',
        description: 'Behavioral ecology of the vegetarian "Bleeding Heart" Geladas and how to observe troops respectfully.',
        transcript: 'Unlike common primates, Geladas are the world’s only grass-eating monkeys. Known as "Bleeding Heart Baboons" due to the vivid red hourglass patch on their chests, they form harmonious super-troops of up to 400 individuals along Jinbar Waterfall and Sankaber Camp. They are completely peaceful towards human travelers as long as you maintain a respectful distance of 3 to 5 meters.',
        transcriptAmharic: 'ጭላዳ ዝንጀሮዎች ሳር ብቻ የሚመገቡ ሰላማዊ ዝንጀሮዎች ናቸው...',
      },
    ],
    etiquetteTips: [
      {
        icon: 'thermometer-outline',
        title: 'Altitude & Temperature Shifts',
        rule: 'Elevations exceed 3,600m; temperatures drop below freezing at night. Pack thermal windbreakers and drink 3L water daily to prevent AMS.',
      },
      {
        icon: 'shield-outline',
        title: 'Mandatory Scout Requirement',
        rule: 'Park regulations mandate an official armed scout and licensed local guide for all trekking routes between camps.',
      },
      {
        icon: 'trash-outline',
        title: 'Leave No Trace Wilderness',
        rule: 'Pack out all personal waste, plastics, and batteries. Open fires outside designated camp spots are strictly forbidden.',
      },
    ],
    emergencyContacts: [
      { label: 'Debark Park Headquarters Dispatch', number: '+251 58 117 0049', icon: 'shield-checkmark-outline' },
      { label: 'Gondar Referral Hospital Ambulance', number: '+251 58 111 0243', icon: 'medkit-outline' },
      { label: 'DALEEL Highland Mountain Rescue Desk', number: '+251 911 234 567', icon: 'call-outline' },
    ],
  },
  d3: {
    destinationId: 'd3',
    destinationName: 'Fasil Ghebbi Imperial Enclosure',
    region: 'Gondar, Amhara Region',
    sizeMB: 7.2,
    chapters: [
      {
        id: 'ch1',
        title: 'Emperor Fasilides & The Camelot of Africa',
        titleAmharic: 'አጼ ፋሲለደስ እና የጎንደር ቤተመንግስት',
        durationSeconds: 270,
        durationFormatted: '04:30',
        description: 'How Gondar became the permanent capital in 1636, blending Portuguese, Indian, and Aksumite architectural styles.',
        transcript: 'For centuries, Ethiopian emperors ruled from roaming tented tent cities. In 1636, Emperor Fasilides broke this nomadic tradition by founding Gondar as the permanent imperial capital. Within this 70,000-square-meter walled fortress stand 20 palaces, royal libraries, banqueting halls, and steam baths displaying a magnificent synthesis of Moorish, Portuguese Baroque, and indigenous Aksumite masonry.',
        transcriptAmharic: 'አጼ ፋሲለደስ በ1636 ዓ.ም ጎንደርን ቋሚ መዲና በማድረግ ድንቅ ቤተመንግስታትን አንጸዋል...',
      },
    ],
    etiquetteTips: [
      {
        icon: 'walk-outline',
        title: 'Cobblestone Walking',
        rule: 'Wear comfortable walking shoes with traction for medieval stone steps, watchtowers, and royal courtyards.',
      },
      {
        icon: 'water-outline',
        title: 'Fasilides Bath Timkat Ceremony',
        rule: 'If visiting during Epiphany (Timkat, Jan 19), expect massive sacred crowds celebrating the renewal of baptismal vows.',
      },
    ],
    emergencyContacts: [
      { label: 'Gondar Tourist Police Office', number: '+251 58 111 1422', icon: 'shield-checkmark-outline' },
      { label: 'University of Gondar Hospital', number: '+251 58 114 1230', icon: 'medkit-outline' },
    ],
  },
  d4: {
    destinationId: 'd4',
    destinationName: 'Harar Jugol Historical Walled City',
    region: 'Harari Region, Eastern Ethiopia',
    sizeMB: 6.8,
    chapters: [
      {
        id: 'ch1',
        title: 'The Fourth Holy City of Islam',
        titleAmharic: 'የሐረር ጁጎል ታሪክ እና የሰላም ከተማ',
        durationSeconds: 290,
        durationFormatted: '04:50',
        description: 'Exploring the 16th-century fortified walls, 82 historic mosques, and peaceful coexistence of diverse communities.',
        transcript: 'Encircling an ancient maze of 368 cobblestone alleyways, the Jugol wall was constructed between the 13th and 16th centuries with five historic gates. Considered the fourth holiest city of Islam, Harar is renowned for traditional Harari townhouse interiors, vibrant textile bazaars, and world-famous specialty coffee.',
        transcriptAmharic: 'የሐረር ጁጎል ግንብ ከ13ኛው እስከ 16ኛው መቶ ክፍለ ዘመን የተሰራ ታሪካዊ ቅርስ ነው...',
      },
    ],
    etiquetteTips: [
      {
        icon: 'moon-outline',
        title: 'Hyena Feeding Courtesy',
        rule: 'The nightly wild hyena feeding ceremony outside the city gates is led by traditional hyena men. Remain still and follow your guide instructions.',
      },
      {
        icon: 'home-outline',
        title: 'Harari House Interior Etiquette',
        rule: 'Remove shoes before stepping onto the raised carpeted platforms (Gidir Gēgar) of traditional Harari living rooms.',
      },
    ],
    emergencyContacts: [
      { label: 'Harar Jugol Tourist Protection Unit', number: '+251 25 666 0123', icon: 'shield-checkmark-outline' },
      { label: 'Hiwot Fana Specialized Hospital', number: '+251 25 666 1822', icon: 'medkit-outline' },
    ],
  },
};

interface OfflineGuideContextType {
  downloadedIds: string[];
  isDownloaded: (id: string) => boolean;
  downloadDestination: (id: string, destinationName?: string) => Promise<void>;
  removeDestination: (id: string) => Promise<void>;
  getOfflinePack: (id: string) => OfflineDestinationPack | null;
  downloadProgress: Record<string, number>;
  totalStorageMB: number;
}

const DOWNLOADED_IDS_KEY = '@daleel_downloaded_destination_ids_v1';
const PACK_STORAGE_PREFIX = '@daleel_offline_pack_';

const OfflineGuideContext = createContext<OfflineGuideContextType | null>(null);

export const OfflineGuideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [downloadedIds, setDownloadedIds] = useState<string[]>(['d1']); // d1 (Lalibela) pre-cached by default for seamless instant testing!
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(DOWNLOADED_IDS_KEY);
        if (mounted && stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setDownloadedIds(parsed);
          }
        }
      } catch (err) {
        console.warn('Failed to load offline destinations list:', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const isDownloaded = useCallback(
    (id: string): boolean => {
      return downloadedIds.includes(id);
    },
    [downloadedIds]
  );

  const getOfflinePack = useCallback((id: string): OfflineDestinationPack | null => {
    const raw = HERITAGE_PACKS_DATABASE[id] || HERITAGE_PACKS_DATABASE.d1;
    if (!raw) return null;
    return {
      ...raw,
      downloadedAt: 'Downloaded for Offline Access',
    };
  }, []);

  const downloadDestination = useCallback(
    async (id: string, destinationName?: string) => {
      if (downloadedIds.includes(id)) return;

      // Simulate step-by-step progress download for audio tracks & maps
      setDownloadProgress((prev) => ({ ...prev, [id]: 0.15 }));
      await new Promise((r) => setTimeout(r, 250));

      setDownloadProgress((prev) => ({ ...prev, [id]: 0.45 }));
      await new Promise((r) => setTimeout(r, 300));

      setDownloadProgress((prev) => ({ ...prev, [id]: 0.8 }));
      await new Promise((r) => setTimeout(r, 250));

      setDownloadProgress((prev) => ({ ...prev, [id]: 1.0 }));

      const pack = HERITAGE_PACKS_DATABASE[id] || {
        destinationId: id,
        destinationName: destinationName || 'Ethiopian Heritage Site',
        region: 'Ethiopia',
        sizeMB: 7.5,
        chapters: HERITAGE_PACKS_DATABASE.d1.chapters,
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
      return sum + (pack?.sizeMB || 7.5);
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

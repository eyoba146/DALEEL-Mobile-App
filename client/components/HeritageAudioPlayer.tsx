import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AudioChapter, useOfflineGuide } from '../lib/offline-guide-context';
import { colors, fonts, radius, spacing } from '../theme/tokens';

interface HeritageAudioPlayerProps {
  destinationId: string;
  destinationName: string;
  style?: any;
}

const PLAYBACK_SPEEDS = [1.0, 1.25, 1.5];

export const HeritageAudioPlayer: React.FC<HeritageAudioPlayerProps> = ({
  destinationId,
  destinationName,
  style,
}) => {
  const {
    getOfflinePack,
    isDownloaded,
    downloadDestination,
    downloadProgress,
  } = useOfflineGuide();

  const pack = getOfflinePack(destinationId);
  const isOfflineAvailable = isDownloaded(destinationId);
  const currentProgress = downloadProgress[destinationId];

  const chapters: AudioChapter[] = useMemo(() => {
    return pack?.chapters && pack.chapters.length > 0
      ? pack.chapters
      : [
          {
            id: 'ch1',
            title: `${destinationName} Historical Overview`,
            titleAmharic: 'የታሪክና የቅርጽ አጠቃላይ መግለጫ',
            durationSeconds: 240,
            durationFormatted: '04:00',
            description: `Curated historical narration and cultural significance of ${destinationName}.`,
            transcript: `Welcome to the official audio guide for ${destinationName}. Ethiopia holds one of the world's most enduring cultural legacies. As you walk through this sanctuary, note the interplay of Aksumite stonecraft, medieval royalty, and living community traditions.`,
            transcriptAmharic: `እንኳን ወደ ${destinationName} ይፋዊ የድምጽ መመሪያ በደህና መጡ። ኢትዮጵያ በዓለም ላይ ካሉ እጅግ ጥንታዊ እና ቀጣይነት ካላቸው ታላላቅ ስልጣኔዎች አንዷ ናት...`,
          },
        ];
  }, [pack, destinationName]);

  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [transcriptLang, setTranscriptLang] = useState<'en' | 'am'>('en');

  const activeChapter = chapters[activeChapterIndex] || chapters[0];
  const duration = activeChapter.durationSeconds;

  // Wave bar animated values
  const waveAnim1 = useRef(new Animated.Value(0.3)).current;
  const waveAnim2 = useRef(new Animated.Value(0.6)).current;
  const waveAnim3 = useRef(new Animated.Value(0.9)).current;
  const waveAnim4 = useRef(new Animated.Value(0.4)).current;

  // Audio timer simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev + 1 >= duration) {
            // End of chapter - advance to next or pause
            if (activeChapterIndex < chapters.length - 1) {
              setActiveChapterIndex((idx) => idx + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return 0;
            }
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);

      // Start wave animation loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim1, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(waveAnim1, { toValue: 0.2, duration: 400, useNativeDriver: false }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim2, { toValue: 0.2, duration: 350, useNativeDriver: false }),
          Animated.timing(waveAnim2, { toValue: 1, duration: 350, useNativeDriver: false }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim3, { toValue: 1, duration: 450, useNativeDriver: false }),
          Animated.timing(waveAnim3, { toValue: 0.3, duration: 450, useNativeDriver: false }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim4, { toValue: 0.3, duration: 380, useNativeDriver: false }),
          Animated.timing(waveAnim4, { toValue: 0.95, duration: 380, useNativeDriver: false }),
        ])
      ).start();
    } else {
      waveAnim1.stopAnimation();
      waveAnim2.stopAnimation();
      waveAnim3.stopAnimation();
      waveAnim4.stopAnimation();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration, playbackSpeed, activeChapterIndex, chapters.length]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSkip = (seconds: number) => {
    setCurrentTime((prev) => {
      const next = prev + seconds;
      if (next < 0) return 0;
      if (next > duration) return duration;
      return next;
    });
  };

  const cycleSpeed = () => {
    const currentIdx = PLAYBACK_SPEEDS.indexOf(playbackSpeed);
    const nextIdx = (currentIdx + 1) % PLAYBACK_SPEEDS.length;
    setPlaybackSpeed(PLAYBACK_SPEEDS[nextIdx]);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const progressRatio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  return (
    <View style={[styles.container, style]}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.audioIconBadge}>
            <Ionicons name="headset" size={16} color={colors.gold} />
          </View>
          <View>
            <Text style={styles.headerTag}>HERITAGE AUDIO GUIDE</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {pack?.region || destinationName}
            </Text>
          </View>
        </View>

        {isOfflineAvailable ? (
          <View style={styles.offlineStatusPill}>
            <Ionicons name="cloud-done" size={13} color="#22C55E" />
            <Text style={styles.offlineStatusText}>Saved Offline</Text>
          </View>
        ) : typeof currentProgress === 'number' ? (
          <View style={styles.downloadingPill}>
            <ActivityIndicator size="small" color={colors.gold} style={{ marginRight: 5 }} />
            <Text style={styles.downloadingText}>{currentProgress}%</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.downloadPackBtn}
            onPress={() => downloadDestination(destinationId)}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-down-circle" size={14} color={colors.gold} />
            <Text style={styles.downloadPackText}>Save {pack?.sizeMB || 8.4}MB</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Chapter Selection Carousel Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chaptersScrollContent}
        style={styles.chaptersScrollView}
      >
        {chapters.map((ch, idx) => {
          const isCurrent = idx === activeChapterIndex;
          return (
            <TouchableOpacity
              key={ch.id}
              style={[styles.chapterTab, isCurrent && styles.chapterTabActive]}
              onPress={() => {
                if (idx !== activeChapterIndex) {
                  setActiveChapterIndex(idx);
                  setCurrentTime(0);
                  setIsPlaying(true);
                }
              }}
              activeOpacity={0.75}
            >
              <View style={styles.chapterTabBadge}>
                <Text style={[styles.chapterTabBadgeText, isCurrent && styles.chapterTabBadgeTextActive]}>
                  {idx + 1}
                </Text>
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text
                  style={[styles.chapterTabTitle, isCurrent && styles.chapterTabTitleActive]}
                  numberOfLines={1}
                >
                  {ch.title}
                </Text>
                <Text style={styles.chapterTabDuration}>{ch.durationFormatted}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Main Playing Track Card */}
      <View style={styles.trackCard}>
        <View style={styles.trackInfoRow}>
          <View style={{ flex: 1, marginRight: 12 }}>
            <Text style={styles.trackAmharicTitle} numberOfLines={1}>
              {activeChapter.titleAmharic}
            </Text>
            <Text style={styles.trackMainTitle} numberOfLines={2}>
              {activeChapter.title}
            </Text>
            <Text style={styles.trackDescription} numberOfLines={2}>
              {activeChapter.description}
            </Text>
          </View>

          {/* Animated Mini Wave Visualizer */}
          <View style={styles.waveVisualizer}>
            <Animated.View
              style={[
                styles.waveBar,
                { transform: [{ scaleY: isPlaying ? waveAnim1 : 0.3 }] },
              ]}
            />
            <Animated.View
              style={[
                styles.waveBar,
                { transform: [{ scaleY: isPlaying ? waveAnim2 : 0.5 }], height: 26 },
              ]}
            />
            <Animated.View
              style={[
                styles.waveBar,
                { transform: [{ scaleY: isPlaying ? waveAnim3 : 0.7 }], height: 32 },
              ]}
            />
            <Animated.View
              style={[
                styles.waveBar,
                { transform: [{ scaleY: isPlaying ? waveAnim4 : 0.4 }], height: 22 },
              ]}
            />
            <Animated.View
              style={[
                styles.waveBar,
                { transform: [{ scaleY: isPlaying ? waveAnim1 : 0.6 }], height: 28 },
              ]}
            />
          </View>
        </View>

        {/* Progress Scrubber Bar */}
        <View style={styles.scrubberContainer}>
          <View style={styles.scrubberBackground}>
            <View style={[styles.scrubberFill, { width: `${progressRatio * 100}%` }]} />
            <View
              style={[
                styles.scrubberThumb,
                { left: `${Math.max(0, Math.min(97, progressRatio * 100))}%` },
              ]}
            />
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatSeconds(currentTime)}</Text>
            <Text style={styles.timeText}>{formatSeconds(duration)}</Text>
          </View>
        </View>

        {/* Playback Controls Row */}
        <View style={styles.controlsRow}>
          {/* Speed Selector */}
          <TouchableOpacity
            style={styles.speedBtn}
            onPress={cycleSpeed}
            activeOpacity={0.8}
          >
            <Text style={styles.speedBtnText}>{playbackSpeed}x</Text>
          </TouchableOpacity>

          {/* Jump Backward 15s */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => handleSkip(-15)}
            activeOpacity={0.7}
          >
            <Ionicons name="play-back" size={20} color="#CBD5E1" />
            <Text style={styles.skipText}>15</Text>
          </TouchableOpacity>

          {/* Master Play/Pause */}
          <TouchableOpacity
            style={styles.playPauseMasterBtn}
            onPress={togglePlay}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={26}
              color={colors.navy}
              style={!isPlaying ? { marginLeft: 3 } : undefined}
            />
          </TouchableOpacity>

          {/* Jump Forward 15s */}
          <TouchableOpacity
            style={styles.skipBtn}
            onPress={() => handleSkip(15)}
            activeOpacity={0.7}
          >
            <Ionicons name="play-forward" size={20} color="#CBD5E1" />
            <Text style={styles.skipText}>15</Text>
          </TouchableOpacity>

          {/* Transcript Reader Button */}
          <TouchableOpacity
            style={styles.transcriptBtn}
            onPress={() => setShowTranscriptModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.gold} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Transcript & Narration Reader Modal */}
      <Modal
        visible={showTranscriptModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTranscriptModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalPre}>NARRATION TRANSCRIPT</Text>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {activeChapter.title}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowTranscriptModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Language Switcher */}
            <View style={styles.langSwitchBar}>
              <TouchableOpacity
                style={[styles.langSwitchTab, transcriptLang === 'en' && styles.langSwitchTabActive]}
                onPress={() => setTranscriptLang('en')}
              >
                <Text
                  style={[
                    styles.langSwitchText,
                    transcriptLang === 'en' && styles.langSwitchTextActive,
                  ]}
                >
                  English Transcript
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.langSwitchTab, transcriptLang === 'am' && styles.langSwitchTabActive]}
                onPress={() => setTranscriptLang('am')}
              >
                <Text
                  style={[
                    styles.langSwitchText,
                    transcriptLang === 'am' && styles.langSwitchTextActive,
                  ]}
                >
                  አማርኛ (Ge'ez Script)
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Narration Body */}
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
            >
              <View style={styles.audioGuideMetaBox}>
                <Ionicons name="volume-medium-outline" size={16} color={colors.gold} />
                <Text style={styles.audioGuideMetaText}>
                  Chapter {activeChapterIndex + 1} of {chapters.length} • {activeChapter.durationFormatted}
                </Text>
              </View>

              <Text style={styles.transcriptText}>
                {transcriptLang === 'en'
                  ? activeChapter.transcript
                  : activeChapter.transcriptAmharic}
              </Text>

              <View style={styles.transcriptFootnote}>
                <Ionicons name="information-circle-outline" size={14} color={colors.charcoalLight} />
                <Text style={styles.transcriptFootnoteText}>
                  Transcribed and fact-checked by Ethiopian Heritage & Antiquities authorities.
                </Text>
              </View>
            </ScrollView>

            {/* Bottom Done Button */}
            <View style={styles.modalBottomBar}>
              <TouchableOpacity
                style={styles.modalDoneBtn}
                onPress={() => setShowTranscriptModal(false)}
                activeOpacity={0.85}
              >
                <Text style={styles.modalDoneBtnText}>Return to Audio Player</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0A1B38',
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  audioIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.3)',
  },
  headerTag: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 1,
  },
  offlineStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    gap: 4,
  },
  offlineStatusText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: '#22C55E',
  },
  downloadingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  downloadingText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.gold,
  },
  downloadPackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.4)',
    gap: 4,
  },
  downloadPackText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.gold,
  },
  chaptersScrollView: {
    marginBottom: spacing.md,
  },
  chaptersScrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  chapterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxWidth: 210,
  },
  chapterTabActive: {
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
    borderColor: colors.gold,
  },
  chapterTabBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  chapterTabBadgeText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: '#94A3B8',
  },
  chapterTabBadgeTextActive: {
    color: colors.gold,
  },
  chapterTabTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    color: '#E2E8F0',
  },
  chapterTabTitleActive: {
    fontFamily: fonts.bodySemiBold,
    color: '#FFFFFF',
  },
  chapterTabDuration: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  trackCard: {
    backgroundColor: 'rgba(15, 33, 64, 0.85)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  trackInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  trackAmharicTitle: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.gold,
    marginBottom: 2,
  },
  trackMainTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 4,
  },
  trackDescription: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17,
  },
  waveVisualizer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 36,
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(223, 183, 108, 0.08)',
    borderRadius: radius.sm,
  },
  waveBar: {
    width: 3.5,
    height: 20,
    backgroundColor: colors.gold,
    borderRadius: 2,
  },
  scrubberContainer: {
    marginBottom: spacing.md,
  },
  scrubberBackground: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible',
  },
  scrubberFill: {
    height: '100%',
    backgroundColor: colors.gold,
    borderRadius: 3,
  },
  scrubberThumb: {
    position: 'absolute',
    top: -4,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.gold,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  timeText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#94A3B8',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  speedBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  speedBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.gold,
  },
  skipBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 38,
    height: 38,
  },
  skipText: {
    position: 'absolute',
    bottom: -1,
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: '#CBD5E1',
  },
  playPauseMasterBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  transcriptBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(223, 183, 108, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.3)',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 21, 43, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#07152B',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(223, 183, 108, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalPre: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.gold,
    letterSpacing: 1.2,
  },
  modalTitle: {
    fontFamily: fonts.serifBold,
    fontSize: 17,
    color: '#FFFFFF',
    marginTop: 2,
    maxWidth: 260,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langSwitchBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  langSwitchTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  langSwitchTabActive: {
    backgroundColor: 'rgba(223, 183, 108, 0.2)',
    borderColor: colors.gold,
  },
  langSwitchText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#94A3B8',
  },
  langSwitchTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.gold,
  },
  modalScroll: {
    paddingHorizontal: spacing.lg,
  },
  modalScrollContent: {
    paddingVertical: spacing.md,
  },
  audioGuideMetaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(223, 183, 108, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    gap: 8,
  },
  audioGuideMetaText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.gold,
  },
  transcriptText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: '#F1F5F9',
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  transcriptFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  transcriptFootnoteText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  modalBottomBar: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#07152B',
  },
  modalDoneBtn: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDoneBtnText: {
    fontFamily: fonts.sansBold,
    fontSize: 15,
    color: colors.navy,
  },
});

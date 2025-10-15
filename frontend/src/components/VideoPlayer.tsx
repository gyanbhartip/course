/**
 * VideoPlayer Component
 * Full-featured video player with progress tracking, quality selection, and keyboard shortcuts
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    Settings,
    SkipBack,
    SkipForward,
} from 'lucide-react';
import { useContentProgress, useCreateProgress } from '../hooks/useProgress';
import { useWebSocket } from '../hooks/useWebSocket';
import type { VideoManifest, VideoQuality } from '../src/types';

interface VideoPlayerProps {
    contentId: string;
    courseId: string;
    manifest: VideoManifest;
    onProgressUpdate?: (progress: number, position: number) => void;
    className?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
    contentId,
    courseId,
    manifest,
    onProgressUpdate,
    className = '',
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const progressSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [selectedQuality, setSelectedQuality] = useState<VideoQuality | null>(
        null,
    );
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const [buffering, setBuffering] = useState(false);

    // Hooks
    const { data: progress } = useContentProgress(contentId);
    const createProgressMutation = useCreateProgress();
    const { subscribeToCourse, unsubscribeFromCourse } = useWebSocket();

    // Initialize video source and quality
    useEffect(() => {
        if (manifest.qualities.length > 0) {
            // Select best quality by default (prefer 720p)
            const preferredQuality =
                manifest.qualities.find(q => q.name === '720p') ||
                manifest.qualities[0];
            setSelectedQuality(preferredQuality);
        }
    }, [manifest]);

    // Subscribe to course updates when component mounts
    useEffect(() => {
        subscribeToCourse(courseId);
        return () => {
            unsubscribeFromCourse(courseId);
        };
    }, [courseId, subscribeToCourse, unsubscribeFromCourse]);

    // Load last position on mount
    useEffect(() => {
        if (progress?.last_position && videoRef.current) {
            videoRef.current.currentTime = progress.last_position;
        }
    }, [progress]);

    // Auto-hide controls
    useEffect(() => {
        if (!isPlaying) return;

        const timer = setTimeout(() => {
            setShowControls(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [isPlaying, showControls]);

    // Save progress every 5 seconds
    const saveProgress = useCallback(() => {
        if (!videoRef.current || !contentId || !courseId) return;

        const currentTime = videoRef.current.currentTime;
        const duration = videoRef.current.duration;
        const progressPercentage =
            duration > 0 ? (currentTime / duration) * 100 : 0;

        // Clear existing timeout
        if (progressSaveTimeoutRef.current) {
            clearTimeout(progressSaveTimeoutRef.current);
        }

        // Debounce progress saving
        progressSaveTimeoutRef.current = setTimeout(() => {
            createProgressMutation.mutate({
                course_id: courseId,
                content_id: contentId,
                progress_percentage: Math.round(progressPercentage),
                last_position: Math.round(currentTime),
                completed: progressPercentage >= 95,
            });

            onProgressUpdate?.(progressPercentage, currentTime);
        }, 1000); // Save after 1 second of inactivity
    }, [contentId, courseId, createProgressMutation, onProgressUpdate]);

    // Event handlers
    const handlePlayPause = useCallback(() => {
        if (!videoRef.current) return;

        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
    }, [isPlaying]);

    const handleSeek = useCallback((time: number) => {
        if (!videoRef.current) return;
        videoRef.current.currentTime = time;
        setCurrentTime(time);
    }, []);

    const handleVolumeChange = useCallback((newVolume: number) => {
        if (!videoRef.current) return;
        videoRef.current.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    }, []);

    const handleMuteToggle = useCallback(() => {
        if (!videoRef.current) return;
        videoRef.current.muted = !isMuted;
        setIsMuted(!isMuted);
    }, [isMuted]);

    const handleFullscreenToggle = useCallback(() => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            if (containerRef.current.requestFullscreen) {
                containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }, [isFullscreen]);

    const handleQualityChange = useCallback((quality: VideoQuality) => {
        if (!videoRef.current) return;

        const currentTime = videoRef.current.currentTime;
        const wasPlaying = !videoRef.current.paused;

        setSelectedQuality(quality);
        videoRef.current.src = quality.url;
        videoRef.current.load();

        // Restore position and play state
        videoRef.current.addEventListener(
            'loadeddata',
            () => {
                videoRef.current!.currentTime = currentTime;
                if (wasPlaying) {
                    videoRef.current!.play();
                }
            },
            { once: true },
        );

        setShowQualityMenu(false);
    }, []);

    const handlePlaybackRateChange = useCallback((rate: number) => {
        if (!videoRef.current) return;
        videoRef.current.playbackRate = rate;
        setPlaybackRate(rate);
        setShowSettings(false);
    }, []);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!videoRef.current) return;

            switch (event.code) {
                case 'Space':
                case 'KeyK':
                    event.preventDefault();
                    handlePlayPause();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    handleSeek(Math.max(0, currentTime - 5));
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    handleSeek(Math.min(duration, currentTime + 5));
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    handleVolumeChange(Math.min(1, volume + 0.1));
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    handleVolumeChange(Math.max(0, volume - 0.1));
                    break;
                case 'KeyF':
                    event.preventDefault();
                    handleFullscreenToggle();
                    break;
                case 'KeyM':
                    event.preventDefault();
                    handleMuteToggle();
                    break;
                case 'KeyJ':
                    event.preventDefault();
                    handleSeek(Math.max(0, currentTime - 10));
                    break;
                case 'KeyL':
                    event.preventDefault();
                    handleSeek(Math.min(duration, currentTime + 10));
                    break;
                case 'Digit0':
                case 'Digit1':
                case 'Digit2':
                case 'Digit3':
                case 'Digit4':
                case 'Digit5':
                case 'Digit6':
                case 'Digit7':
                case 'Digit8':
                case 'Digit9':
                    event.preventDefault();
                    const percentage =
                        event.code === 'Digit0'
                            ? 0
                            : parseInt(event.code.slice(-1)) * 10;
                    handleSeek((percentage / 100) * duration);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [
        currentTime,
        duration,
        volume,
        handlePlayPause,
        handleSeek,
        handleVolumeChange,
        handleMuteToggle,
        handleFullscreenToggle,
    ]);

    // Video event handlers
    const handleTimeUpdate = useCallback(() => {
        if (!videoRef.current) return;
        setCurrentTime(videoRef.current.currentTime);
        saveProgress();
    }, [saveProgress]);

    const handleLoadedMetadata = useCallback(() => {
        if (!videoRef.current) return;
        setDuration(videoRef.current.duration);
    }, []);

    const handlePlay = useCallback(() => {
        setIsPlaying(true);
        setShowControls(true);
    }, []);

    const handlePause = useCallback(() => {
        setIsPlaying(false);
        setShowControls(true);
    }, []);

    const handleWaiting = useCallback(() => {
        setBuffering(true);
    }, []);

    const handleCanPlay = useCallback(() => {
        setBuffering(false);
    }, []);

    const handleMouseMove = useCallback(() => {
        setShowControls(true);
    }, []);

    const formatTime = (time: number) => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = Math.floor(time % 60);

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
                .toString()
                .padStart(2, '0')}`;
        }
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2];

    return (
        <div
            ref={containerRef}
            className={`relative bg-black rounded-lg overflow-hidden ${className}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setShowControls(false)}>
            {/* Video Element */}
            <video
                ref={videoRef}
                className="w-full h-full"
                src={selectedQuality?.url}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handlePlay}
                onPause={handlePause}
                onWaiting={handleWaiting}
                onCanPlay={handleCanPlay}
                onClick={handlePlayPause}
            />

            {/* Buffering Indicator */}
            {buffering && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
                </div>
            )}

            {/* Controls Overlay */}
            {showControls && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                    {/* Top Controls */}
                    <div className="absolute top-4 right-4 flex space-x-2">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                            <Settings className="h-5 w-5 text-white" />
                        </button>
                        <button
                            onClick={handleFullscreenToggle}
                            className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                            {isFullscreen ? (
                                <Minimize className="h-5 w-5 text-white" />
                            ) : (
                                <Maximize className="h-5 w-5 text-white" />
                            )}
                        </button>
                    </div>

                    {/* Center Play Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <button
                            onClick={handlePlayPause}
                            className="p-4 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                            {isPlaying ? (
                                <Pause className="h-8 w-8 text-white" />
                            ) : (
                                <Play className="h-8 w-8 text-white" />
                            )}
                        </button>
                    </div>

                    {/* Bottom Controls */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                        {/* Progress Bar */}
                        <div className="mb-4">
                            <input
                                type="range"
                                min="0"
                                max={duration || 0}
                                value={currentTime}
                                onChange={e =>
                                    handleSeek(Number(e.target.value))
                                }
                                className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                            />
                        </div>

                        {/* Control Buttons */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handlePlayPause}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    {isPlaying ? (
                                        <Pause className="h-5 w-5 text-white" />
                                    ) : (
                                        <Play className="h-5 w-5 text-white" />
                                    )}
                                </button>

                                <button
                                    onClick={() =>
                                        handleSeek(
                                            Math.max(0, currentTime - 10),
                                        )
                                    }
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <SkipBack className="h-5 w-5 text-white" />
                                </button>

                                <button
                                    onClick={() =>
                                        handleSeek(
                                            Math.min(
                                                duration,
                                                currentTime + 10,
                                            ),
                                        )
                                    }
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <SkipForward className="h-5 w-5 text-white" />
                                </button>

                                <button
                                    onClick={handleMuteToggle}
                                    className="p-2 hover:bg-white/20 rounded-full transition-colors">
                                    {isMuted ? (
                                        <VolumeX className="h-5 w-5 text-white" />
                                    ) : (
                                        <Volume2 className="h-5 w-5 text-white" />
                                    )}
                                </button>

                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={isMuted ? 0 : volume}
                                    onChange={e =>
                                        handleVolumeChange(
                                            Number(e.target.value),
                                        )
                                    }
                                    className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer slider"
                                />

                                <span className="text-white text-sm">
                                    {formatTime(currentTime)} /{' '}
                                    {formatTime(duration)}
                                </span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setShowQualityMenu(!showQualityMenu)
                                        }
                                        className="px-3 py-1 bg-white/20 rounded text-white text-sm hover:bg-white/30 transition-colors">
                                        {selectedQuality?.name || 'Auto'}
                                    </button>

                                    {showQualityMenu && (
                                        <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-32">
                                            {manifest.qualities.map(quality => (
                                                <button
                                                    key={quality.name}
                                                    onClick={() =>
                                                        handleQualityChange(
                                                            quality,
                                                        )
                                                    }
                                                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/20 transition-colors ${
                                                        selectedQuality?.name ===
                                                        quality.name
                                                            ? 'text-indigo-400'
                                                            : 'text-white'
                                                    }`}>
                                                    {quality.name}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setShowSettings(!showSettings)
                                        }
                                        className="px-3 py-1 bg-white/20 rounded text-white text-sm hover:bg-white/30 transition-colors">
                                        {playbackRate}x
                                    </button>

                                    {showSettings && (
                                        <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-20">
                                            {playbackRates.map(rate => (
                                                <button
                                                    key={rate}
                                                    onClick={() =>
                                                        handlePlaybackRateChange(
                                                            rate,
                                                        )
                                                    }
                                                    className={`w-full text-left px-3 py-2 text-sm rounded hover:bg-white/20 transition-colors ${
                                                        playbackRate === rate
                                                            ? 'text-indigo-400'
                                                            : 'text-white'
                                                    }`}>
                                                    {rate}x
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VideoPlayer;

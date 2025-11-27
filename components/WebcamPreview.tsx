/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useEffect, useRef } from 'react';
import { HandLandmarkerResult } from '@mediapipe/tasks-vision';
import { COLORS } from '../types';

interface WebcamPreviewProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    resultsRef: React.MutableRefObject<HandLandmarkerResult | null>;
    isCameraReady: boolean;
}

const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8], // Index
    [0, 9], [9, 10], [10, 11], [11, 12], // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17], [0, 5], [0, 17] // Palm
];

const WebcamPreview: React.FC<WebcamPreviewProps> = ({ videoRef, resultsRef, isCameraReady }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!isCameraReady) return;
        let animationFrameId: number;

        const render = () => {
            const canvas = canvasRef.current;
            const video = videoRef.current;

            if (canvas && video && video.readyState >= 2) { 
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth;
                    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight;

                    // Clear with dark void color
                    ctx.fillStyle = '#0a0a0a';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // 1. Draw Video Feed (Grayscale & Mirrored)
                    ctx.save();
                    ctx.scale(-1, 1);
                    ctx.translate(-canvas.width, 0);
                    ctx.filter = 'grayscale(100%) contrast(1.2) brightness(0.8)';
                    ctx.globalAlpha = 0.5;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    ctx.filter = 'none';
                    ctx.restore();
                    ctx.globalAlpha = 1.0;

                    // 2. Draw Landmarks
                    if (resultsRef.current && resultsRef.current.landmarks) {
                        for (let i = 0; i < resultsRef.current.landmarks.length; i++) {
                            const landmarks = resultsRef.current.landmarks[i];
                            const handInfo = resultsRef.current.handedness[i];
                            if (!handInfo || !handInfo[0]) continue;

                            const handedness = handInfo[0];
                            const isRight = handedness.categoryName === 'Right';
                            const color = isRight ? COLORS.right : COLORS.left;

                            ctx.strokeStyle = 'white';
                            ctx.lineWidth = 1;

                            // Draw connections (thin white lines)
                            ctx.beginPath();
                            for (const [start, end] of HAND_CONNECTIONS) {
                                const p1 = landmarks[start];
                                const p2 = landmarks[end];
                                ctx.moveTo((1 - p1.x) * canvas.width, p1.y * canvas.height);
                                ctx.lineTo((1 - p2.x) * canvas.width, p2.y * canvas.height);
                            }
                            ctx.stroke();

                            // Draw joints as small dots
                            ctx.fillStyle = color;
                            for (const lm of landmarks) {
                                ctx.beginPath();
                                ctx.arc((1 - lm.x) * canvas.width, lm.y * canvas.height, 2, 0, 2 * Math.PI);
                                ctx.fill();
                            }

                            // Active Cursor (Index Tip)
                            const tip = landmarks[8];
                            ctx.beginPath();
                            ctx.strokeStyle = color;
                            ctx.lineWidth = 2;
                            ctx.arc((1 - tip.x) * canvas.width, tip.y * canvas.height, 8, 0, 2 * Math.PI);
                            ctx.stroke();
                        }
                    }
                    
                    // 3. Scanlines Overlay
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                    for (let i = 0; i < canvas.height; i += 4) {
                        ctx.fillRect(0, i, canvas.width, 1);
                    }
                }
            }
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [isCameraReady, videoRef, resultsRef]);

    if (!isCameraReady) return null;

    return (
        <div className="fixed bottom-8 right-8 w-48 h-36 bg-[#0a0a0a] border border-[#333] z-50 pointer-events-none group">
            <div className="absolute -top-6 right-0 text-[9px] font-bold uppercase tracking-[0.25em] text-[#3B82F6]">
                Optical Sensor
            </div>
            {/* Corners */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/50"></div>
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/50"></div>
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/50"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-white/50"></div>
            
            <canvas ref={canvasRef} className="w-full h-full object-cover opacity-80" />
        </div>
    );
};

export default WebcamPreview;
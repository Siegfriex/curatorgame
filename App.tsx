/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader, useProgress } from '@react-three/drei';
import { GameStatus, NoteData } from './types';
import { DEMO_CHART, SONG_URL, SONG_BPM } from './constants';
import { useMediaPipe } from './hooks/useMediaPipe';
import GameScene from './components/GameScene';
import WebcamPreview from './components/WebcamPreview';
import { Play, Activity, Hexagon, RotateCcw } from 'lucide-react';

const App: React.FC = () => {
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.LOADING);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [health, setHealth] = useState(100);

  const audioRef = useRef<HTMLAudioElement>(new Audio(SONG_URL));
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const { isCameraReady, handPositionsRef, lastResultsRef, error: cameraError } = useMediaPipe(videoRef);
  const { progress } = useProgress(); 

  // Game Logic Handlers
  const handleNoteHit = useCallback((note: NoteData, goodCut: boolean) => {
     let points = 100;
     if (goodCut) points += 50; 

     // Haptic feedback for impact
     if (navigator.vibrate) {
         navigator.vibrate(goodCut ? 40 : 20);
     }

     setCombo(c => {
       const newCombo = c + 1;
       if (newCombo > 30) setMultiplier(8);
       else if (newCombo > 20) setMultiplier(4);
       else if (newCombo > 10) setMultiplier(2);
       else setMultiplier(1);
       return newCombo;
     });

     setScore(s => s + (points * multiplier));
     setHealth(h => Math.min(100, h + 2));
  }, [multiplier]);

  const handleNoteMiss = useCallback((note: NoteData) => {
      setCombo(0);
      setMultiplier(1);
      setHealth(h => {
          const newHealth = h - 15;
          if (newHealth <= 0) {
             setTimeout(() => endGame(false), 0);
             return 0;
          }
          return newHealth;
      });
  }, []);

  const startGame = async () => {
    if (!isCameraReady) return;
    
    setScore(0);
    setCombo(0);
    setMultiplier(1);
    setHealth(100);

    DEMO_CHART.forEach(n => { n.hit = false; n.missed = false; });

    try {
      if (audioRef.current) {
          audioRef.current.currentTime = 0;
          await audioRef.current.play();
          setGameStatus(GameStatus.PLAYING);
      }
    } catch (e) {
        console.error("Audio play failed", e);
        alert("Could not start audio. Please interact with the page first.");
    }
  };

  const endGame = (victory: boolean) => {
      setGameStatus(victory ? GameStatus.VICTORY : GameStatus.GAME_OVER);
      if (audioRef.current) {
          audioRef.current.pause();
      }
  };

  useEffect(() => {
      if (gameStatus === GameStatus.LOADING && isCameraReady) {
          setGameStatus(GameStatus.IDLE);
      }
  }, [isCameraReady, gameStatus]);

  return (
    <div className="relative w-full h-screen bg-[#0a0a0a] overflow-hidden font-sans selection:bg-[#3B82F6] selection:text-white">
      {/* Hidden Video for Processing */}
      <video 
        ref={videoRef} 
        className="absolute opacity-0 pointer-events-none"
        playsInline
        muted
        autoPlay
        style={{ width: '640px', height: '480px' }}
      />

      {/* 3D Canvas */}
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, toneMappingExposure: 1.2 }}>
          {gameStatus !== GameStatus.LOADING && (
             <GameScene 
                gameStatus={gameStatus}
                audioRef={audioRef}
                handPositionsRef={handPositionsRef}
                chart={DEMO_CHART}
                onNoteHit={handleNoteHit}
                onNoteMiss={handleNoteMiss}
                onSongEnd={() => endGame(true)}
             />
          )}
      </Canvas>

      {/* Webcam Mini-Map Preview */}
      <WebcamPreview 
          videoRef={videoRef} 
          resultsRef={lastResultsRef} 
          isCameraReady={isCameraReady} 
      />

      {/* Vignette & Grain Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(10,10,10,0.8)_100%)] z-10"></div>
      
      {/* UI Overlay */}
      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-12 z-20">
          
          {/* Header - Editorial Style */}
          <header className="flex justify-between items-start w-full border-t border-b border-[#e5e5e5]/20 py-6 backdrop-blur-sm">
              <div className="flex flex-col">
                  <h1 className="editorial-serif text-5xl italic text-white leading-none tracking-tight">Curator's <br/>Odysseia</h1>
                  <div className="flex items-center gap-2 mt-2">
                      <div className="w-2 h-2 bg-[#28317C]"></div>
                      <span className="micro-label text-[#3B82F6]">Kinetic Interface v3.5</span>
                  </div>
              </div>
              
              {/* HUD Stats (Visible during play) */}
              <div className={`flex gap-16 transition-all duration-700 ${gameStatus === GameStatus.PLAYING ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                   <div className="flex flex-col items-start border-l border-[#e5e5e5]/20 pl-6">
                       <span className="micro-label text-gray-400 mb-2">Curation Score</span>
                       <span className="editorial-serif text-4xl text-white">{score.toLocaleString()}</span>
                   </div>
                   <div className="flex flex-col items-start border-l border-[#e5e5e5]/20 pl-6">
                       <span className="micro-label text-gray-400 mb-2">Flow State</span>
                       <div className="flex items-baseline gap-2">
                           <span className={`editorial-serif text-4xl ${combo > 10 ? 'text-[#3B82F6]' : 'text-white'}`}>
                               {combo}
                           </span>
                           <span className="micro-label text-gray-500">chain</span>
                       </div>
                   </div>
                   <div className="flex flex-col items-start w-48 border-l border-[#e5e5e5]/20 pl-6">
                       <span className="micro-label text-gray-400 mb-2">Structural Integrity</span>
                       <div className="w-full h-[2px] bg-[#333] mt-3">
                           <div 
                               className="h-full bg-[#3B82F6] shadow-[0_0_10px_#3B82F6] transition-all duration-300 ease-out" 
                               style={{ width: `${health}%` }}
                           />
                       </div>
                   </div>
              </div>
          </header>

          {/* Center Content (Menus) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
              
              {/* Loading State */}
              {gameStatus === GameStatus.LOADING && (
                  <div className="flex flex-col items-center gap-6">
                      <div className="relative w-16 h-16">
                          <div className="absolute inset-0 border border-[#333] rotate-45"></div>
                          <div className="absolute inset-0 border border-white animate-spin-slow"></div>
                      </div>
                      <p className="micro-label text-white tracking-[0.4em] animate-pulse">Calibrating Sensors</p>
                      {cameraError && <p className="micro-label text-red-500 border border-red-900/50 p-2 bg-red-950/20">{cameraError}</p>}
                  </div>
              )}

              {/* Main Menu - The Snapshot */}
              {gameStatus === GameStatus.IDLE && (
                  <div className="max-w-3xl w-full">
                      <div className="backdrop-blur-xl bg-[#0a0a0a]/60 border border-white/10 p-16 relative overflow-hidden">
                          {/* Decorative Elements */}
                          <div className="absolute top-0 right-0 p-4">
                              <Hexagon className="text-[#28317C] opacity-50 w-12 h-12 stroke-[0.5]" />
                          </div>

                          <div className="flex flex-col gap-10 relative z-10">
                              <div>
                                  <div className="flex items-center gap-4 mb-6">
                                      <span className="micro-label px-2 py-1 bg-[#28317C] text-white">System Ready</span>
                                      <span className="micro-label text-gray-500">Track: Deep Blue Horizon</span>
                                  </div>
                                  <h2 className="text-7xl editorial-serif italic text-white mb-2 leading-none">
                                      Begin the <br />
                                      <span className="not-italic font-sans font-thin tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-[#3B82F6]">Exhibition</span>
                                  </h2>
                              </div>

                              <div className="grid grid-cols-12 gap-8 border-t border-white/10 pt-10">
                                  <div className="col-span-7 text-gray-400 text-sm font-light leading-loose">
                                      <p className="mb-4">
                                          <strong className="text-white font-normal block micro-label mb-2 text-[#3B82F6]">01. Protocol</strong>
                                          Ensure your physical coordinates are aligned. The system requires <span className="text-white">2 meters</span> of depth.
                                      </p>
                                      <p>
                                          <strong className="text-white font-normal block micro-label mb-2 text-[#28317C]">02. Interaction</strong>
                                          Use your <span className="text-[#28317C]">Primary (Left)</span> and <span className="text-[#3B82F6]">Secondary (Right)</span> controllers to curate incoming artifacts.
                                      </p>
                                  </div>
                                  <div className="col-span-5 flex flex-col justify-end items-end gap-4">
                                      {!isCameraReady ? (
                                           <div className="micro-label text-gray-500 flex items-center gap-3 border border-gray-800 px-4 py-3">
                                               <Activity className="w-3 h-3 animate-pulse" /> Sensor Offline
                                           </div>
                                      ) : (
                                          <button 
                                              onClick={startGame}
                                              className="group relative px-10 py-5 bg-white text-black overflow-hidden transition-all hover:pr-14"
                                          >
                                              <span className="relative z-10 micro-label flex items-center gap-3">
                                                  Initialize Sequence
                                              </span>
                                              <div className="absolute inset-0 bg-[#3B82F6] transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"></div>
                                              <span className="absolute right-5 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                                  <Play className="w-3 h-3 fill-white stroke-none" />
                                              </span>
                                              <span className="absolute inset-0 z-10 flex items-center justify-start px-10 micro-label text-white opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                                                  Initialize Sequence
                                              </span>
                                          </button>
                                      )}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* Results Screen - The Report */}
              {(gameStatus === GameStatus.GAME_OVER || gameStatus === GameStatus.VICTORY) && (
                  <div className="max-w-2xl w-full backdrop-blur-2xl bg-[#0a0a0a]/90 border border-white/10 p-16 text-center shadow-2xl relative">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#28317C] to-[#3B82F6]"></div>
                      
                      <span className="micro-label text-gray-500 mb-6 block tracking-[0.3em]">Curation Report</span>
                      <h2 className={`text-6xl editorial-serif italic mb-4 ${gameStatus === GameStatus.VICTORY ? 'text-white' : 'text-gray-400'}`}>
                          {gameStatus === GameStatus.VICTORY ? "Masterpiece Archived" : "Exhibition Halted"}
                      </h2>
                      
                      <div className="grid grid-cols-3 gap-0 bg-white/5 my-16 border-y border-white/10">
                          <div className="p-8 border-r border-white/10">
                              <span className="micro-label text-[#3B82F6] block mb-2">Total Score</span>
                              <span className="text-3xl text-white font-light tabular-nums">{score.toLocaleString()}</span>
                          </div>
                          <div className="p-8 border-r border-white/10">
                              <span className="micro-label text-[#3B82F6] block mb-2">Max Resonance</span>
                              <span className="text-3xl text-white font-light tabular-nums">{combo}</span>
                          </div>
                          <div className="p-8">
                              <span className="micro-label text-[#3B82F6] block mb-2">Grade</span>
                              <span className="text-3xl text-white font-serif italic">
                                  {score > 50000 ? 'S' : score > 30000 ? 'A' : 'B'}
                              </span>
                          </div>
                      </div>

                      <button 
                          onClick={() => setGameStatus(GameStatus.IDLE)}
                          className="group inline-flex items-center gap-3 micro-label text-white pb-2 border-b border-transparent hover:border-white transition-all"
                      >
                          <RotateCcw className="w-3 h-3 group-hover:-rotate-180 transition-transform duration-500" />
                          Reset Installation
                      </button>
                  </div>
              )}
          </div>
          
          {/* Footer */}
          <footer className="w-full flex justify-between items-end border-t border-[#e5e5e5]/20 pt-6">
               <div className="flex flex-col gap-2">
                   <div className="flex gap-2">
                       <div className="w-16 h-1 bg-[#28317C]"></div>
                       <div className="w-8 h-1 bg-[#3B82F6]"></div>
                       <div className="w-2 h-1 bg-white"></div>
                   </div>
                   <p className="micro-label text-gray-600">Editorial Brutalism System</p>
               </div>
               <div className="text-right">
                   <p className="micro-label text-gray-500 mb-1">Coordinates</p>
                   <p className="text-[10px] text-gray-400 font-mono tracking-widest">34°03'07.9"N 118°14'37.3"W</p>
               </div>
          </footer>
      </div>
    </div>
  );
};

export default App;
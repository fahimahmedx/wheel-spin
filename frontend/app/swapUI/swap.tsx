"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronDown, Loader2, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const tokens = [
  { symbol: "cbBTC", name: "Coinbase Wrapped BTC", color: "#FFD700", image: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Bitcoin.svg/300px-Bitcoin.svg.png" },
  { symbol: "DEGEN", name: "DEGEN", color: "#8A2BE2", image: "/assets/degen.avif" },
  { symbol: "WETH", name: "Wrapped Ethereum", color: "#FFC0CB", image: "/assets/weth.webp" },
];

function RouletteWheel({
  spinning,
  onSpinComplete,
}: {
  spinning: boolean;
  onSpinComplete: () => void;
}) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (spinning) {
      const targetRotation = Math.floor(Math.random() * 360) + 1800; // At least 5 full spins
      const duration = 6000; // 6 seconds
      const start = performance.now();
      const animate = (time: number) => {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 4); // Ease out quartic
        setRotation(targetRotation * easeProgress);
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          onSpinComplete();

          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      };
      requestAnimationFrame(animate);
    }
  }, [spinning, onSpinComplete]);

  return (
    <div className="relative w-64 h-64">
      
      <div
        className="absolute inset-0 rounded-full overflow-hidden shadow-lg"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? "none" : "transform 0.5s ease-out",
        }}
      >
        {tokens.map((token, index) => (
          <div
            key={token.symbol}
            className="absolute w-full h-full"
            style={{
              transform: `rotate(${(index * 360) / tokens.length}deg)`,
            }}
          >
            <div
              className="absolute top-0 bottom-0 left-1/2 right-0 flex items-center justify-center"
              style={{
                backgroundColor: token.color,
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.3)",
              }}
            >
              <div className="relative w-12 h-12">
                {/* <Image
                  src={token.image}
                  alt={token.symbol}
                  layout="fill"
                  objectFit="contain"
                /> */}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute top-0 left-1/2 w-0 h-0 -mt-2 -ml-2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-black" />
    </div>
  );
}

function ParticleBackground() {
  useEffect(() => {
    const canvas = document.getElementById(
      "particle-canvas"
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: {
      x: number;
      y: number;
      radius: number;
      color: string;
      vx: number;
      vy: number;
    }[] = [];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    function animate() {
      requestAnimationFrame(animate);
      ctx?.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        ctx?.beginPath();
        ctx?.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx!.fillStyle = particle.color;
        ctx?.fill();
      });
    }

    animate();

    return () => {
      cancelAnimationFrame(animate as unknown as number);
    };
  }, []);

  return <canvas id="particle-canvas" className="fixed inset-0 z-[-1]" />;
}

// function Leaderboard() {
//   const leaderboardData = [
//     { name: "Solandyyyyyy", amount: "1,000,000" },
//     { name: "ANONYMOUSSSS", amount: "750,000" },
//     { name: "CryptoAggarwal", amount: "500,000" },
//     { name: "SolJakey", amount: "250,000" },
//     { name: "WEB3ISKING", amount: "100,000" },
//   ];

//   return (
//     <div className="bg-black/50 p-4 rounded-lg">
//       <h3 className="text-xl font-bold mb-2 text-white flex items-center">
//         <Trophy className="mr-2" /> Leaderboard
//       </h3>
//       <ul className="space-y-2">
//         {leaderboardData.map((item, index) => (
//           <li key={index} className="flex justify-between text-white">
//             <span>{item.name}</span>
//             <span>${item.amount}</span>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

export default function Component() {
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState<{
    symbol: string;
    name: string;
    color: string;
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleSpin = useCallback(() => {
    setSpinning(true);
    setToToken(null);
  }, []);

  const handleSpinComplete = useCallback(() => {
    const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
    setToToken(randomToken);
    setSpinning(false);
    setShowResult(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center">
      <div className="wallet-info absolute top-4 right-4 text-white">
        {/* Connected Wallet: {primaryWal.address} */}
        <ConnectButton />
      </div>
      <ParticleBackground />
      <div className="max-w-4xl mx-auto p-6 space-y-6 bg-black/30 backdrop-blur-sm rounded-xl shadow-2xl">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Web3 Casino Roulette
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="from-token" className="text-white">
                From
              </Label>
              <Select
                value={fromToken.symbol}
                onValueChange={(value) => {
                  const selectedToken = tokens.find((t) => t.symbol === value);
                  if (selectedToken) {
                    setFromToken(selectedToken);
                  }
                }}
              >
                <SelectTrigger
                  id="from-token"
                  className="bg-white/10 border-white/20 text-white"
                >
                  <SelectValue placeholder="Select token" />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map((token) => (
                    <SelectItem key={token.symbol} value={token.symbol}>
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: token.color }}
                        />
                        {token.name} ({token.symbol})
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-white">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
              />
            </div>
            <div className="flex justify-center">
              <ChevronDown className="w-6 h-6 text-white" />
            </div>
            <div className="flex justify-center">
              <RouletteWheel
                spinning={spinning}
                onSpinComplete={handleSpinComplete}
              />
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-bold text-lg py-6"
                onClick={handleSpin}
                disabled={!amount || spinning}
              >
                {spinning ? (
                  <>
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    Spinning...
                  </>
                ) : (
                  "Spin to Swap"
                )}
              </Button>
            </motion.div>
          </div>
          {/* <Leaderboard /> */}
        </div>
      </div>
      <AnimatePresence>
        {showResult && (
          <Dialog open={showResult} onOpenChange={setShowResult}>
            <DialogContent className="bg-gradient-to-br from-purple-600 to-indigo-600 text-white">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">
                  Swap Result
                </DialogTitle>
              </DialogHeader>
              <div className="text-center py-4">
                <p className="text-xl mb-2">
                  You swapped{" "}
                  <span className="font-bold">
                    {amount} {fromToken.symbol}
                  </span>
                </p>
                <p className="text-3xl font-bold mb-4">for</p>
                <p
                  className="text-4xl font-bold"
                  style={{ color: toToken?.color }}
                >
                  {amount} {toToken?.symbol}
                </p>
              </div>
              <Button
                onClick={() => setShowResult(false)}
                className="mt-4 bg-white text-purple-600 hover:bg-gray-100"
              >
                Close
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

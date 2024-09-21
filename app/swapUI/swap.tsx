"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
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

const tokens = [
  { symbol: "ETH", name: "Ethereum", color: "#627EEA" },
  { symbol: "BTC", name: "Bitcoin", color: "#F7931A" },
  { symbol: "USDT", name: "Tether", color: "#26A17B" },
  { symbol: "LINK", name: "Chainlink", color: "#2A5ADA" },
  { symbol: "ADA", name: "Cardano", color: "#0033AD" },
  { symbol: "DOT", name: "Polkadot", color: "#E6007A" },
  { symbol: "XRP", name: "Ripple", color: "#23292F" },
  { symbol: "SOL", name: "Solana", color: "#00FFA3" },
];

export function RouletteWheel({
  spinning,
  onSpinComplete,
}: {
  spinning: boolean;
  onSpinComplete: () => void;
}) {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    if (spinning) {
      const targetRotation = Math.floor(Math.random() * 360) + 720; // At least 2 full spins
      const duration = 5000; // 5 seconds
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
        }
      };
      requestAnimationFrame(animate);
    }
  }, [spinning, onSpinComplete]);

  return (
    <div className="relative w-64 h-64">
      <div
        className="absolute inset-0 rounded-full overflow-hidden"
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
              className="absolute top-0 bottom-0 left-1/2 right-0"
              style={{ backgroundColor: token.color }}
            >
              <span
                className="absolute left-1/4 top-1/2 -translate-y-1/2 text-white font-bold"
                style={{ transform: "rotate(90deg)" }}
              >
                {token.symbol}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="absolute top-0 left-1/2 w-0 h-0 -mt-2 -ml-2 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-black" />
    </div>
  );
}

export default function Component() {
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState<{
    symbol: string;
    name: string;
    color: string;
  } | null>(null);
  const [amount, setAmount] = useState("");
  const [spinning, setSpinning] = useState(false);

  const handleSpin = () => {
    setSpinning(true);
    setToToken(null);
  };

  const handleSpinComplete = () => {
    const randomToken = tokens[Math.floor(Math.random() * tokens.length)];
    setToToken(randomToken);
    setSpinning(false);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <Label htmlFor="from-token">From</Label>
        <Select
          value={fromToken.symbol}
          onValueChange={(value) => {
            const selectedToken = tokens.find((t) => t.symbol === value);
            if (selectedToken) {
              setFromToken(selectedToken);
            }
          }}
        >
          <SelectTrigger id="from-token">
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
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="flex justify-center">
        <ChevronDown className="w-6 h-6" />
      </div>
      <div className="flex justify-center">
        <RouletteWheel
          spinning={spinning}
          onSpinComplete={handleSpinComplete}
        />
      </div>
      <Button
        className="w-full"
        onClick={handleSpin}
        disabled={!amount || spinning}
      >
        {spinning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Spinning...
          </>
        ) : (
          "Spin to Swap"
        )}
      </Button>
      {toToken && !spinning && (
        <div className="text-center">
          <p className="font-semibold">
            Swapped {amount} {fromToken.symbol} for {amount} {toToken.symbol}
          </p>
        </div>
      )}
    </div>
  );
}

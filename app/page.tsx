/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Dialog } from "@headlessui/react";

// Types
type BMICategory = "Normal" | "Overweight" | "Obese";

interface FootRegion {
  name: string;
  key: string;
  ranges: {
    Normal: [number, number];
    Overweight: [number, number];
    Obese: [number, number];
  };
  suggestion: {
    cause: string;
    treatment: string;
  };
  topPx: number;
  leftPx: number;
}

interface SensorData {
  [key: string]: number;
}

// Foot Regions Data
const footRegions: FootRegion[] = [
  {
    name: "Great Toe",
    key: "greatToe",
    ranges: { Normal: [200, 300], Overweight: [250, 350], Obese: [300, 400] },
    suggestion: {
      cause: "Insufficient push-off or neurological issue.",
      treatment: "Strengthen toe flexors or consult a podiatrist.",
    },
    topPx: 40,
    leftPx: 165,
  },
  {
    name: "1st Metatarsal Head",
    key: "firstMetatarsal",
    ranges: { Normal: [250, 350], Overweight: [300, 400], Obese: [350, 450] },
    suggestion: {
      cause: "Excessive forefoot loading.",
      treatment: "Use cushioned insoles or offloading techniques.",
    },
    topPx: 130,
    leftPx: 135,
  },
  {
    name: "5th Metatarsal Head",
    key: "fifthMetatarsal",
    ranges: { Normal: [150, 250], Overweight: [200, 300], Obese: [250, 350] },
    suggestion: {
      cause: "Instability during lateral push-off.",
      treatment: "Wear stable footwear or try lateral strengthening.",
    },
    topPx: 230,
    leftPx: 160,
  },
  {
    name: "Heel",
    key: "heel",
    ranges: { Normal: [300, 400], Overweight: [350, 450], Obese: [400, 500] },
    suggestion: {
      cause: "Heel strike impact is low or shifted load.",
      treatment: "Check gait, consider cushioned heel inserts.",
    },
    topPx: 370,
    leftPx: 180,
  },
];

const FootPressureAnalyzer: React.FC = () => {
  const [bmi, setBmi] = useState<number>(0);
  const [bmiCategory, setBmiCategory] = useState<BMICategory>("Normal");
  const [sensorData, setSensorData] = useState<SensorData>({});
  const sensorBufferRef = useRef<SensorData[]>([]);
  const [timer, setTimer] = useState<number>(30);
  const [dialogOpen, setDialogOpen] = useState(true);
  const [form, setForm] = useState({ name: "", height: "", weight: "" });

  const [hoveredRegion, setHoveredRegion] = useState<{
    name: string;
    value: number;
    top: number;
    left: number;
  } | null>(null);

  const handleSubmit = () => {
    const h = parseFloat(form.height);
    const w = parseFloat(form.weight);
    if (h > 0 && w > 0) {
      const calculatedBmi = w / ((h / 100) * (h / 100));
      setBmi(calculatedBmi);
      if (calculatedBmi < 25) setBmiCategory("Normal");
      else if (calculatedBmi < 30) setBmiCategory("Overweight");
      else setBmiCategory("Obese");
      setDialogOpen(false);
    }
  };

  useEffect(() => {
    if (!dialogOpen) {
      const fetchData = async () => {
        try {
          const res = await fetch(
            "https://inshoe-pressure-measurement-default-rtdb.asia-southeast1.firebasedatabase.app/sensorData.json"
          );
          const data = await res.json();

          const liveData: SensorData = {
            greatToe: data.sensor1_kPa,
            firstMetatarsal: data.sensor2_kPa,
            fifthMetatarsal: data.sensor3_kPa,
            heel: data.sensor4_kPa,
          };
          sensorBufferRef.current.push(liveData);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      };

      const fetchInterval = setInterval(fetchData, 1000);
      const timerInterval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            clearInterval(fetchInterval);

            const buffer = sensorBufferRef.current;
            const summed: SensorData = {};
            buffer.forEach((reading) => {
              for (const key in reading) {
                summed[key] = (summed[key] || 0) + reading[key];
              }
            });
            const averaged: SensorData = {};
            for (const key in summed) {
              averaged[key] = Math.round(summed[key] / buffer.length);
            }
            setSensorData(averaged);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(fetchInterval);
        clearInterval(timerInterval);
      };
    }
  }, [dialogOpen]);

  const allNormal = footRegions.every((region) => {
    const value = sensorData[region.key] ?? 0;
    const [min, max] = region.ranges[bmiCategory];
    return value >= min && value <= max;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900">
      {/* Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => {}}
        className="fixed inset-0 z-10 bg-black bg-opacity-80 flex items-center justify-center"
      >
        <div className="bg-white text-black p-6 rounded-xl shadow-lg space-y-4 w-80">
          <h2 className="text-xl font-bold">Enter your details</h2>
          <input
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 w-full rounded"
          />
          <input
            type="number"
            placeholder="Height (cm)"
            value={form.height}
            onChange={(e) => setForm({ ...form, height: e.target.value })}
            className="border p-2 w-full rounded"
          />
          <input
            type="number"
            placeholder="Weight (kg)"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            className="border p-2 w-full rounded"
          />
          <button
            onClick={handleSubmit}
            className="bg-blue-600 text-white px-4 py-2 rounded-md w-full"
          >
            Start
          </button>
        </div>
      </Dialog>

      {!dialogOpen && (
        <>
          <h2 className="text-2xl font-semibold mb-2">
            Hi {form.name}! Here is your foot pressure analysis:
          </h2>

          <div className="text-sm text-gray-600 mb-4">
            Waiting for sensor readings... {timer > 0 ? `${timer}s` : "Done!"}
          </div>

          {/* Foot Image */}
          <div className="relative w-full max-w-md mx-auto">
            <Image
              src="/foot-outline.png"
              alt="Foot Outline"
              width={400}
              height={600}
              className="mx-auto scale-x-[-1]"
            />
            {footRegions.map((region, idx) => {
              const value = sensorData[region.key] ?? 0;
              const [min, max] = region.ranges[bmiCategory];
              const isNormal = value >= min && value <= max;

              // Positioning
              // const top = `${20 + idx * 15}%`;
              // const left = `${40 + (idx % 2) * 15}%`;

              const top = region.topPx;
              const left = region.leftPx;

              return (
                <div
                  key={region.key}
                  className={`absolute w-6 h-6 rounded-full border-2 cursor-pointer z-10 ${
                    isNormal ? "bg-green-500" : "bg-red-500"
                  }`}
                  style={{ top: `${top}px`, left: `${left}px` }}
                  onMouseEnter={() =>
                    setHoveredRegion({ name: region.name, value, top, left })
                  }
                  onMouseLeave={() => setHoveredRegion(null)}
                />
              );
            })}
            {hoveredRegion && (
              <div
                className="absolute bg-white text-black text-sm px-3 py-2 rounded-lg shadow-lg z-20"
                style={{
                  top: `${hoveredRegion.top - 5}px`,
                  left: `${hoveredRegion.left + 5}px`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                <div className="font-semibold">{hoveredRegion.name}</div>
                <div>{hoveredRegion.value} kPa</div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {timer === 0 && (
            <div className="mt-6 space-y-4">
              {allNormal ? (
                <div className="text-green-600 font-semibold text-lg">
                  ✅ Everything looks normal. You are good to go!
                </div>
              ) : (
                footRegions.map((region) => {
                  const value = sensorData[region.key] ?? 0;
                  const [min, max] = region.ranges[bmiCategory];
                  const isNormal = value >= min && value <= max;
                  return (
                    <div
                      key={region.key}
                      className="bg-white p-4 rounded-xl shadow"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold">{region.name}</p>
                        <div
                          className={`w-4 h-4 rounded-full ${
                            isNormal ? "bg-green-500" : "bg-red-500"
                          }`}
                        ></div>
                      </div>
                      <p className="text-sm">
                        Pressure: {value} kPa (Expected: {min}–{max})
                      </p>
                      {!isNormal && (
                        <div className="text-sm text-red-500 mt-1">
                          <p>Cause: {region.suggestion.cause}</p>
                          <p>Treatment: {region.suggestion.treatment}</p>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FootPressureAnalyzer;

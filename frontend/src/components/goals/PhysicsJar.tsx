"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

interface PhysicsJarProps {
    currentAmount: number;
    targetAmount: number;
    goalName: string;
    className?: string;
    triggerAnimation?: number;
}

export function PhysicsJar({ currentAmount, targetAmount, goalName, className, triggerAnimation }: PhysicsJarProps) {
    const sceneRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<Matter.Engine | null>(null);
    const renderRef = useRef<Matter.Render | null>(null);
    const runnerRef = useRef<Matter.Runner | null>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    const totalCoins = Math.min(100, Math.floor((currentAmount / targetAmount) * 100));

    // Handle initial sizing and resize
    useEffect(() => {
        if (!sceneRef.current) return;

        const updateDimensions = () => {
            if (sceneRef.current) {
                setDimensions({
                    width: sceneRef.current.clientWidth,
                    height: 220
                });
            }
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, []);

    // Physics setup
    useEffect(() => {
        if (dimensions.width === 0 || !sceneRef.current) return;

        const { Engine, Render, Runner, Bodies, Composite, MouseConstraint, Mouse, Events } = Matter;

        // Create engine
        const engine = Engine.create();
        engineRef.current = engine;

        // Create renderer
        const render = Render.create({
            element: sceneRef.current,
            engine: engine,
            options: {
                width: dimensions.width,
                height: dimensions.height,
                wireframes: false,
                background: "transparent",
                pixelRatio: window.devicePixelRatio,
            }
        });
        renderRef.current = render;

        // Custom Rendering for Coins
        Events.on(render, "afterRender", () => {
            const context = render.context;
            const bodies = Composite.allBodies(engine.world);

            bodies.forEach((body: any) => {
                if (body.label === "coin") {
                    const { x, y } = body.position;
                    const radius = body.circleRadius;
                    const angle = body.angle;

                    context.save();
                    context.translate(x, y);
                    context.rotate(angle);

                    // Coin Edge/Border (3D effect)
                    context.beginPath();
                    context.arc(0, 0, radius, 0, Math.PI * 2);
                    const edgeGradient = context.createLinearGradient(-radius, -radius, radius, radius);
                    edgeGradient.addColorStop(0, "#d97706"); // Amber 600
                    edgeGradient.addColorStop(1, "#92400e"); // Amber 800
                    context.fillStyle = edgeGradient;
                    context.fill();

                    // Coin Face
                    context.beginPath();
                    context.arc(0, 0, radius * 0.85, 0, Math.PI * 2);
                    const faceGradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
                    faceGradient.addColorStop(0, "#fbbf24"); // Amber 400
                    faceGradient.addColorStop(1, "#f59e0b"); // Amber 500
                    context.fillStyle = faceGradient;
                    context.fill();

                    // Symbol (₹)
                    context.fillStyle = "rgba(180, 83, 9, 0.8)"; // Amber 700
                    context.font = `bold ${radius * 1.0}px sans-serif`;
                    context.textAlign = "center";
                    context.textBaseline = "middle";
                    context.fillText("₹", 0, 1);

                    context.restore();
                }
            });
        });

        // Jar Physics Boundaries (Tapered Shape)
        const wallThickness = 20;
        const jarWidthBase = dimensions.width * 0.75;
        const jarWidthTop = dimensions.width * 0.85;
        const jarHeight = dimensions.height * 0.85;
        const centerX = dimensions.width / 2;
        const bottomY = dimensions.height - 15;

        // Invisible walls for physics
        const walls = [
            // Bottom
            Bodies.rectangle(centerX, bottomY, jarWidthBase, wallThickness, { isStatic: true, render: { visible: false } }),
            // Left (Slightly Angled)
            Bodies.rectangle(centerX - jarWidthBase / 2 - 5, dimensions.height / 2 + 5, wallThickness, jarHeight, {
                isStatic: true,
                angle: -0.05,
                render: { visible: false }
            }),
            // Right (Slightly Angled)
            Bodies.rectangle(centerX + jarWidthBase / 2 + 5, dimensions.height / 2 + 5, wallThickness, jarHeight, {
                isStatic: true,
                angle: 0.05,
                render: { visible: false }
            }),
        ];

        Composite.add(engine.world, walls);

        // Add initial coins
        const coinRadius = dimensions.width < 400 ? 7 : 9;
        const initialCoins = [];
        for (let i = 0; i < totalCoins; i++) {
            const x = centerX + (Math.random() - 0.5) * (jarWidthBase - coinRadius * 4);
            const y = bottomY - 20 - Math.random() * (jarHeight * 0.7);
            initialCoins.push(createCoin(x, y, coinRadius));
        }
        Composite.add(engine.world, initialCoins);

        // Interactions
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: { stiffness: 0.2, render: { visible: false } }
        });
        Composite.add(engine.world, mouseConstraint);
        render.mouse = mouse;

        // Start engine and renderer
        const runner = Runner.create();
        runnerRef.current = runner;
        Runner.run(runner, engine);
        Render.run(render);

        return () => {
            Render.stop(render);
            Runner.stop(runner);
            Engine.clear(engine);
            Composite.clear(engine.world, false);
            render.canvas.remove();
        };
    }, [dimensions]);

    // Handle coin drop trigger
    useEffect(() => {
        if (triggerAnimation && engineRef.current) {
            const centerX = dimensions.width / 2;
            const coinRadius = dimensions.width < 400 ? 9 : 11;
            const newCoin = createCoin(centerX + (Math.random() - 0.5) * 40, -20, coinRadius);
            Matter.Composite.add(engineRef.current.world, newCoin);
            Matter.Body.applyForce(newCoin, newCoin.position, { x: (Math.random() - 0.5) * 0.02, y: 0.05 });
        }
    }, [triggerAnimation]);

    function createCoin(x: number, y: number, radius: number) {
        return Matter.Bodies.circle(x, y, radius, {
            restitution: 0.4,
            friction: 0.2,
            density: 0.02,
            label: "coin",
            render: { visible: false } // We use custom drawing
        });
    }

    return (
        <div className={`relative overflow-hidden group/jar ${className}`} style={{ height: "220px" }}>
            {/* Visual Jar Background (Improved CSS/SVG Shape) */}
            <div className="absolute inset-x-[10%] bottom-2 top-4 border-[3px] border-zinc-200/40 dark:border-zinc-700/30 rounded-b-[40px] rounded-t-[10px] bg-gradient-to-b from-white/10 to-white/5 dark:from-white/5 dark:to-transparent backdrop-blur-[1px] pointer-events-none z-0 shadow-inner">
                {/* Visual Sheen/Reflection */}
                <div className="absolute left-4 top-4 bottom-8 w-2 bg-white/20 dark:bg-white/10 rounded-full blur-[1px]" />
            </div>

            {/* Physics Layer */}
            <div ref={sceneRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing z-10" />

            {/* Info Overlays */}
            <div className="absolute top-6 right-[15%] flex flex-col items-end pointer-events-none z-20">
                <span className="text-[10px] font-black uppercase text-zinc-400 tracking-tighter">Jar Status</span>
                <span className="text-sm font-black italic text-amber-600 dark:text-amber-500 drop-shadow-sm">
                    {Math.round((currentAmount / targetAmount) * 100)}%
                </span>
            </div>

            <div className="absolute inset-x-0 bottom-4 text-center pointer-events-none z-20">
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest opacity-0 group-hover/jar:opacity-100 transition-opacity duration-300">
                    Interact to Stir
                </span>
            </div>
        </div>
    );
}

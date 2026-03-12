"use client";

import React, { useEffect, useRef, useState } from "react";
import Matter from "matter-js";

interface PhysicsJarProps {
    currentAmount: number;
    targetAmount: number;
    goalName: string;
    className?: string;
    triggerAnimation?: number; // Change this to trigger a coin drop
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
                    height: 200 // Fixed height for the jar area
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

        const Engine = Matter.Engine,
            Render = Matter.Render,
            Runner = Matter.Runner,
            Bodies = Matter.Bodies,
            Composite = Matter.Composite,
            MouseConstraint = Matter.MouseConstraint,
            Mouse = Matter.Mouse;

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
                pixelRatio: window.devicePixelRatio
            }
        });
        renderRef.current = render;

        // Jar Boundaries
        const wallThickness = 10;
        const jarWidth = dimensions.width * 0.8;
        const jarHeight = dimensions.height * 0.9;
        const centerX = dimensions.width / 2;
        const bottomY = dimensions.height - wallThickness / 2 - 5;

        const wallOptions = {
            isStatic: true,
            render: { fillStyle: "rgba(161, 161, 170, 0.2)" }
        };

        const leftWall = Bodies.rectangle(centerX - jarWidth / 2, dimensions.height / 2, wallThickness, jarHeight, wallOptions);
        const rightWall = Bodies.rectangle(centerX + jarWidth / 2, dimensions.height / 2, wallThickness, jarHeight, wallOptions);
        const bottom = Bodies.rectangle(centerX, bottomY, jarWidth + wallThickness, wallThickness, wallOptions);

        // Add walls to world
        Composite.add(engine.world, [leftWall, rightWall, bottom]);

        // Add initial coins based on progress
        const coinRadius = dimensions.width < 400 ? 6 : 8;
        const coins = [];
        for (let i = 0; i < totalCoins; i++) {
            const x = centerX + (Math.random() - 0.5) * (jarWidth - coinRadius * 4);
            const y = bottomY - Math.random() * (jarHeight * 0.8);
            coins.push(createCoin(x, y, coinRadius));
        }
        Composite.add(engine.world, coins);

        // Add mouse control
        const mouse = Mouse.create(render.canvas);
        const mouseConstraint = MouseConstraint.create(engine, {
            mouse: mouse,
            constraint: {
                stiffness: 0.2,
                render: { visible: false }
            }
        });
        Composite.add(engine.world, mouseConstraint);

        // Keep mouse in sync with scroll
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
            render.textures = {};
        };
    }, [dimensions]);

    // Handle coin drop trigger
    useEffect(() => {
        if (triggerAnimation && engineRef.current) {
            const centerX = dimensions.width / 2;
            const coinRadius = dimensions.width < 400 ? 8 : 10;
            const newCoin = createCoin(centerX + (Math.random() - 0.5) * 20, -20, coinRadius);
            Matter.Composite.add(engineRef.current.world, newCoin);

            // Give it a little nudge
            Matter.Body.applyForce(newCoin, newCoin.position, {
                x: (Math.random() - 0.5) * 0.02,
                y: 0.1
            });
        }
    }, [triggerAnimation]);

    function createCoin(x: number, y: number, radius: number) {
        return Matter.Bodies.circle(x, y, radius, {
            restitution: 0.5,
            friction: 0.1,
            density: 0.01,
            render: {
                fillStyle: "#f59e0b", // Amber 500
                strokeStyle: "#d97706", // Amber 600
                lineWidth: 2
            }
        });
    }

    return (
        <div
            className={`relative overflow-hidden rounded-xl bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-zinc-800/50 ${className}`}
            style={{ height: "200px" }}
        >
            <div ref={sceneRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />
            <div className="absolute top-2 right-2 flex flex-col items-end pointer-events-none">
                <span className="text-[10px] font-bold uppercase text-zinc-400">Jar Fill</span>
                <span className="text-xs font-mono font-bold text-zinc-600 dark:text-zinc-400">
                    {Math.round((currentAmount / targetAmount) * 100)}%
                </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 py-2 text-center pointer-events-none">
                <span className="text-[10px] text-zinc-400 font-medium">Interactions Enabled • Tap to Stir</span>
            </div>
        </div>
    );
}

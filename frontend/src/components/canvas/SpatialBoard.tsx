"use client";

import React, { useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    BackgroundVariant,
    Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from 'next-themes';
import { GoalNode } from './GoalNode';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

const nodeTypes = {
    goal: GoalNode,
};

const initialNodes = [
    {
        id: 'mock-income',
        type: 'goal',
        position: { x: 100, y: 200 },
        data: { label: 'Monthly Salary', amount: 85000 },
    },
    {
        id: 'mock-goal-1',
        type: 'goal',
        position: { x: 400, y: 150 },
        data: { label: 'New Laptop', amount: 120000 },
    },
    {
        id: 'mock-goal-2',
        type: 'goal',
        position: { x: 400, y: 300 },
        data: { label: 'Emergency Fund', amount: 500000 },
    },
];

const initialEdges: Edge[] = [
    { id: 'e-in1', source: 'mock-income', target: 'mock-goal-1', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
    { id: 'e-in2', source: 'mock-income', target: 'mock-goal-2', type: 'smoothstep', style: { stroke: '#3b82f6', strokeWidth: 2 } },
];

export function SpatialBoard() {
    const { theme } = useTheme();
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes as any);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, style: { strokeWidth: 2 } } as any, eds)),
        [setEdges]
    );

    const handleAddNode = () => {
        const newNode = {
            id: `node-${nodes.length + 1}`,
            type: 'goal',
            position: {
                x: 200 + Math.random() * 200,
                y: 100 + Math.random() * 200
            },
            data: { label: 'New Block', amount: 0 },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    const isDark = theme === 'dark';

    return (
        <div style={{ width: '100%', height: '100%' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                colorMode={theme === 'dark' ? 'dark' : 'light'}
                className="bg-zinc-50 dark:bg-zinc-950"
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={2}
                />

                {/* Internal UI Controls */}
                <Panel position="top-right" className="m-4">
                    <Button onClick={handleAddNode} className="shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Node
                    </Button>
                </Panel>

                <Controls showInteractive={false} />

                <MiniMap
                    nodeColor={theme === 'dark' ? '#3f3f46' : '#d4d4d8'}
                    maskColor={theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'}
                    className="overflow-hidden shadow-xl rounded-xl"
                />
            </ReactFlow>
        </div>
    );
}

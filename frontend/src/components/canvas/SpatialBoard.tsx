"use client";

import React, { useCallback, useState } from 'react';
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
    Panel,
    NodeChange,
    EdgeChange,
    applyNodeChanges,
    applyEdgeChanges,
    useOnSelectionChange,
    Node,
    ReactFlowProvider
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useTheme } from 'next-themes';
import { GoalNode } from './GoalNode';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';

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

function SpatialBoardContent() {
    const { theme } = useTheme();
    const [nodes, setNodes] = useNodesState(initialNodes as any);
    const [edges, setEdges] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    useOnSelectionChange({
        onChange: ({ nodes }) => {
            if (nodes.length === 1) {
                setSelectedNode(nodes[0]);
            } else {
                setSelectedNode(null);
            }
        },
    });

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );

    const onConnect = useCallback(
        (params: Connection | Edge) => setEdges((eds) => addEdge({
            ...params,
            animated: true,
            style: { strokeWidth: 2 }
        } as any, eds)),
        [setEdges]
    );

    const handleAddNode = () => {
        const newNode = {
            id: `node-${Date.now()}`,
            type: 'goal',
            position: {
                x: 200 + Math.random() * 200,
                y: 100 + Math.random() * 200
            },
            data: { label: 'New Goal', amount: 0 },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    const handleDeleteSelected = () => {
        if (selectedNode) {
            setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
            setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
            setSelectedNode(null);
        }
    };

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
                deleteKeyCode={['Backspace', 'Delete']}
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

                {/* Mobile Context Action Bar */}
                {selectedNode && (
                    <Panel position="bottom-center" className="mb-6 z-50">
                        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-full px-4 py-2 flex items-center space-x-4 animate-in slide-in-from-bottom-5">
                            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[150px]">
                                {selectedNode.data.label as string}
                            </span>
                            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800" />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDeleteSelected}
                                className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-full h-8 px-3"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                            </Button>
                        </div>
                    </Panel>
                )}
            </ReactFlow>
        </div>
    );
}

export default function SpatialBoard() {
    return (
        <ReactFlowProvider>
            <SpatialBoardContent />
        </ReactFlowProvider>
    );
}

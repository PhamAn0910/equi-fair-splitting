import { useRef, useEffect, useState } from 'react';
import { getInitials } from '@/lib/constants';

interface SettlementNode {
  id: string;
  name: string;
  colorHex: string;
  balance: number;
  isAdmin: boolean;
}

interface SettlementEdge {
  from: string;
  to: string;
  amount: number;
}

interface SettlementGraphProps {
  nodes: SettlementNode[];
  edges: SettlementEdge[];
}

// Position nodes in a circle
function calculateNodePositions(count: number, centerX: number, centerY: number, radius: number) {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i * 2 * Math.PI) / count - Math.PI / 2; // Start from top
    positions.push({
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    });
  }
  return positions;
}

export function SettlementGraph({ nodes, edges }: SettlementGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Dynamic height based on number of nodes to prevent cut-off
  const baseHeight = nodes.length <= 3 ? 280 : nodes.length <= 5 ? 340 : 400;
  const [dimensions, setDimensions] = useState({ width: 320, height: baseHeight });

  useEffect(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      const height = nodes.length <= 3 ? 280 : nodes.length <= 5 ? 340 : 400;
      setDimensions({ width, height });
    }
  }, [nodes.length]);

  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
  const nodeRadius = 24;

  const positions = calculateNodePositions(nodes.length, centerX, centerY, radius);

  // Create a map for quick position lookup
  const positionMap: Record<string, { x: number; y: number }> = {};
  nodes.forEach((node, index) => {
    positionMap[node.id] = positions[index];
  });

  return (
    <div 
      ref={containerRef}
      className="relative w-full bg-card rounded-2xl p-4"
      style={{ height: dimensions.height + 32 }}
    >
      <svg 
        width={dimensions.width} 
        height={dimensions.height}
        className="absolute inset-0"
      >
        {/* Dashed connection lines */}
        {edges.map((edge, index) => {
          const fromPos = positionMap[edge.from];
          const toPos = positionMap[edge.to];
          if (!fromPos || !toPos) return null;

          // Calculate angle for arrow
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          // Offset from node centers
          const offsetStart = nodeRadius + 4;
          const offsetEnd = nodeRadius + 4;
          
          const startX = fromPos.x + (dx / length) * offsetStart;
          const startY = fromPos.y + (dy / length) * offsetStart;
          const endX = toPos.x - (dx / length) * offsetEnd;
          const endY = toPos.y - (dy / length) * offsetEnd;

          // Midpoint for the arrow
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          return (
            <g key={`edge-${index}`}>
              {/* Dashed line */}
              <line
                x1={startX}
                y1={startY}
                x2={endX}
                y2={endY}
                stroke="hsl(var(--muted-foreground) / 0.3)"
                strokeWidth="2"
                strokeDasharray="6,4"
                className="flow-line"
              />
              {/* Arrow in the middle */}
              <polygon
                points="0,-5 10,0 0,5"
                fill="hsl(var(--muted-foreground) / 0.5)"
                transform={`translate(${midX}, ${midY}) rotate(${angle})`}
              />
            </g>
          );
        })}
      </svg>

      {/* Node circles with labels */}
      {nodes.map((node, index) => {
        const pos = positions[index];
        const isPositive = node.balance > 0;
        const isNegative = node.balance < 0;

        return (
          <div
            key={node.id}
            className="absolute flex flex-col items-center"
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Balance badge */}
            {node.balance !== 0 && (
              <div
                className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold z-10 whitespace-nowrap"
                style={{
                  transform: 'translate(40%, -50%)',
                  backgroundColor: isPositive ? '#3b761f1A' : 'rgba(231, 110, 80, 0.1)',
                  color: isPositive ? '#3b761f' : 'rgb(231, 110, 80)'
                }}
              >
                {isPositive ? '+' : ''}{Math.abs(node.balance).toFixed(2)}
              </div>
            )}
            
            {/* Avatar circle */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md ${
                node.isAdmin ? 'pulse-node ring-2 ring-primary ring-offset-2 ring-offset-card' : ''
              }`}
              style={{ backgroundColor: node.colorHex }}
            >
              {getInitials(node.name)}
            </div>
            
            {/* Name label */}
            <span className="mt-1 text-xs font-medium text-muted-foreground">
              {node.isAdmin ? 'You' : node.name}
            </span>
          </div>
        );
      })}

      {/* CSS for flow animation */}
      <style>{`
        .flow-line {
          animation: dash 20s linear infinite;
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }
      `}</style>
    </div>
  );
}

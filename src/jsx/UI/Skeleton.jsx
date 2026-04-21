import React from 'react';
import '../../css/Skeleton.css';

const Skeleton = ({ type = 'text', className = '' }) => {
  const classes = `skeleton skeleton-${type} ${className}`;
  return <div className={classes} />;
};

export const TableSkeleton = ({ rows = 5, cols = 6 }) => {
  return (
    <div className="skeleton-table-wrapper" style={{ width: '100%' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ display: 'flex', gap: '8px', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} type="text" style={{ flex: j === 0 ? 2 : 1, height: '20px' }} />
          ))}
        </div>
      ))}
    </div>
  );
};

export default Skeleton;

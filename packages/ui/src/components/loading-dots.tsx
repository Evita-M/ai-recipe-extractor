import * as React from 'react';

export interface LoadingDotsProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export const LoadingDots = React.forwardRef<SVGSVGElement, LoadingDotsProps>(
  ({ size = 24, color = 'currentColor', className, ...props }, ref) => (
    <svg
      ref={ref}
      width={size}
      height={size / 4}
      viewBox="0 0 50 10"
      fill="none"
      className={className}
      {...props}
    >
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle key={i} cx={5 + i * 10} cy={5} r={3} fill={color}>
          <animate
            attributeName="opacity"
            values="0;1;0"
            keyTimes="0;0.5;1"
            dur="1s"
            begin={`${i * 0.2}s`}
            repeatCount="indefinite"
          />
        </circle>
      ))}
    </svg>
  )
);
LoadingDots.displayName = 'LoadingDots';

export default LoadingDots;

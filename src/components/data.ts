
export interface DataPoint {
  x: number;
  y: number;
}

export function generateRandomGaussianData(
  mean: number,
  deviation: number,
  count: number
): DataPoint[] {
  const data: DataPoint[] = [];
  const variance = deviation ** 2;
  for (let i = 0; i < count; i++) {
    const x = mean + ((i - count / 2) * deviation) / (count / 2);
    const y =(1 / Math.sqrt(2 * Math.PI * variance)) *Math.exp(-((x - mean) ** 2) / (2 * variance));
    data.push({ x, y });
  }
  return data;
}

// export function kde(
//   kernel: (x: number) => number,
//   thresholds: number[],
//   data: DataPoint[]
// ): DataPoint[] {
//   return thresholds.map((t) => {
//     const value = d3.mean(data, (d) => {
//       if (typeof d.y === "number") {
//         return kernel(t - d.y);
//       } else {
//         return 0;
//       }
//     });
//     return { x: t, y: value || 0 };
//   });
// }

// export function epanechnikov(bandwidth: number): (x: number) => number {
//   return (x) => {
//     const scaledX = Math.abs(x / bandwidth);
//     return scaledX <= 1 ? (0.75 * (1 - scaledX * scaledX)) / bandwidth : 0;
//   };
// }

//   for (let i = 0; i < leftPadding; i++) {
//     const x = mean - ((count / 2 + leftPadding - i) * stdDev) / (count / 2);
//     const y =
//       (1 / Math.sqrt(2 * Math.PI * variance)) *
//       Math.exp(-((x - mean) ** 2) / (2 * variance)) *
//       (i / leftPadding);
//     data.push({ x, y });
//   }

//   for (let i = 0; i < rightPadding; i++) {
//     const x = mean + ((count / 2 + i + 1) * stdDev) / (count / 2);
//     const y =
//       (1 / Math.sqrt(2 * Math.PI * variance)) *
//       Math.exp(-((x - mean) ** 2) / (2 * variance)) *
//       ((rightPadding - i) / rightPadding);
//     data.push({ x, y });
//   }

//   return data;
// }

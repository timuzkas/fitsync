import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { tokens } from '../../tokens';

interface LoadSparklineProps {
  data: number[];
  color?: string;
  label?: string;
  height?: number;
  showValue?: boolean;
  valueColor?: string;
}

export function LoadSparkline({
  data,
  color = tokens.color.primary,
  label,
  height = 40,
  showValue,
  valueColor,
}: LoadSparklineProps) {
  if (!data || data.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        {label && <Text style={styles.label}>{label}</Text>}
        <Text style={styles.noData}>—</Text>
      </View>
    );
  }

  const maxVal = Math.max(...data, 1);
  const width = 80;
  const dotCount = data.length;
  const spacing = width / (dotCount - 1);

  const total = data.reduce((a, b) => a + b, 0);

  return (
    <View style={styles.row}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.sparkline, { width, height }]}>
        {data.map((val, i) => {
          const y = height - (val / maxVal) * (height - 4) - 2;
          const isLast = i === data.length - 1;
          return (
            <React.Fragment key={i}>
              <View
                style={{
                  position: 'absolute',
                  left: i * spacing - 2,
                  top: y,
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: isLast ? color : `${color}88`,
                }}
              />
              {i > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    left: (i - 1) * spacing,
                    top: y + 2,
                    width: spacing,
                    height: 1,
                    backgroundColor: `${color}44`,
                    transform: [
                      {
                        rotate: `${Math.atan2(
                          y - (height - (data[i - 1] / maxVal) * (height - 4) - 2),
                          spacing
                        )}rad`,
                      },
                    ],
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
      {showValue && (
        <Text style={[styles.value, { color: valueColor || color }]}>{Math.round(total)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space.sm,
  },
  sparkline: {
    position: 'relative',
  },
  label: {
    fontSize: tokens.font.sm,
    color: tokens.color.textMuted,
  },
  value: {
    fontSize: tokens.font.sm,
    fontWeight: '600',
  },
  noData: {
    color: tokens.color.textMuted,
    fontSize: tokens.font.md,
  },
});

import React from 'react';
import { View, Text } from 'react-native';
import tw from 'twrnc';

interface MarkdownRendererProps {
  children: string;
}

export default function MarkdownRenderer({ children }: MarkdownRendererProps) {
  if (!children || typeof children !== 'string') {
    return null;
  }

  // Parse lines of markdown
  const lines = children.split('\n');

  // Helper to parse inline bold text (**bold**)
  const renderStyledText = (text: string, baseStyle: any) => {
    const parts = text.split('**');
    return (
      <Text style={baseStyle}>
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            // Text between ** is bold with accented bright coloring
            return (
              <Text key={index} style={tw`font-extrabold text-white`}>
                {part}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <View style={tw`space-y-2.5`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // 1. Level 3 Heading (###)
        if (trimmed.startsWith('### ')) {
          return (
            <View key={idx} style={tw`mt-3 mb-1.5`}>
              {renderStyledText(
                trimmed.substring(4),
                tw`text-sm font-black text-teal-300 uppercase tracking-wide`
              )}
            </View>
          );
        }

        // 2. Level 2 Heading (##)
        if (trimmed.startsWith('## ')) {
          return (
            <View key={idx} style={tw`mt-4 mb-2`}>
              {renderStyledText(
                trimmed.substring(3),
                tw`text-base font-black text-teal-400 tracking-tight`
              )}
            </View>
          );
        }

        // 3. Level 1 Heading (#)
        if (trimmed.startsWith('# ')) {
          return (
            <View key={idx} style={tw`mt-5 mb-2.5`}>
              {renderStyledText(
                trimmed.substring(2),
                tw`text-lg font-black text-white tracking-tight`
              )}
            </View>
          );
        }

        // 4. Bullet lists (* or -)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = trimmed.startsWith('* ') ? trimmed.substring(2) : trimmed.substring(2);
          return (
            <View key={idx} style={tw`flex-row items-start pl-2 py-0.5`}>
              <Text style={tw`text-teal-400 text-xs mr-2 font-mono`}>•</Text>
              <View style={tw`flex-1`}>
                {renderStyledText(content, tw`text-xs text-slate-300 leading-normal`)}
              </View>
            </View>
          );
        }

        // 5. Numbered lists (e.g. 1. 2.)
        const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
        if (numMatch) {
          const num = numMatch[1];
          const content = numMatch[2];
          return (
            <View key={idx} style={tw`flex-row items-start pl-2 py-0.5`}>
              <Text style={tw`text-teal-400 text-xs mr-2 font-mono font-bold`}>{num}.</Text>
              <View style={tw`flex-1`}>
                {renderStyledText(content, tw`text-xs text-slate-300 leading-normal`)}
              </View>
            </View>
          );
        }

        // 6. Empty spacing line
        if (trimmed === '') {
          return <View key={idx} style={tw`h-1`} />;
        }

        // 7. Normal paragraphs
        return (
          <View key={idx} style={tw`py-0.5`}>
            {renderStyledText(trimmed, tw`text-xs text-slate-300 leading-relaxed`)}
          </View>
        );
      })}
    </View>
  );
}

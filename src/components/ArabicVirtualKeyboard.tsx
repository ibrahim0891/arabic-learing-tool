'use client';

import React from 'react';
import Keyboard from 'react-simple-keyboard';
import arabicLayout from 'simple-keyboard-layouts/build/layouts/arabic';
import 'react-simple-keyboard/build/css/index.css';

interface ArabicVirtualKeyboardProps {
  input: string;
  onChange: (input: string) => void;
  onKeyPress?: (button: string) => void;
}

export const ArabicVirtualKeyboard: React.FC<ArabicVirtualKeyboardProps> = ({
  input,
  onChange,
  onKeyPress,
}) => {
  const keyboardRef = React.useRef<any>(null);
  const [layoutName, setLayoutName] = React.useState('default');

  const handleKeyPress = (button: string) => {
    if (button === '{shift}' || button === '{lock}') {
      setLayoutName(layoutName === 'default' ? 'shift' : 'default');
      return;
    }
    if (button === '{space}') {
      onChange(input + ' ');
      return;
    }
    if (button === '{bksp}') {
      onChange(input.slice(0, -1));
      return;
    }
    if (onKeyPress) {
      onKeyPress(button);
    }
  };

  return (
    <div className="arabic-keyboard-container w-full rounded-2xl p-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-md select-none">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-subtle)] text-xs font-semibold text-[var(--ink-muted)]">
        <span className="flex items-center gap-1.5 text-[var(--accent-ochre)]">
          <span className="w-2 h-2 rounded-full bg-[var(--accent-ochre)]" />
          Arabic On-Screen Keyboard (لوحة المفاتيح العربية)
        </span>
        <span className="text-[11px] font-mono">
          Click keys or type with physical keyboard
        </span>
      </div>

      <div dir="rtl" className="font-arabic text-lg">
        <Keyboard
          keyboardRef={(r) => (keyboardRef.current = r)}
          layoutName={layoutName}
          layout={{
            default: arabicLayout.layout.default,
            shift: arabicLayout.layout.shift,
          }}
          input={input}
          onChange={(newVal) => onChange(newVal)}
          onKeyPress={handleKeyPress}
          theme="hg-theme-default arabic-custom-keyboard"
          display={{
            '{bksp}': '⌫ مسح',
            '{shift}': '⇧ تشكيل',
            '{space}': 'مسافة (Space)',
            '{enter}': '↵ إدخال',
          }}
        />
      </div>
    </div>
  );
};

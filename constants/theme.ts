/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#B8860B'; // A rich, elegant gold for light mode
const tintColorDark = '#D4AF37';  // A slightly brighter gold for contrast on dark backgrounds

export const Colors = {
  light: {
    text: '#000000',
    background: '#FCFCFC',
    tint: tintColorLight,
    icon: '#5A5A5A',
    tabIconDefault: '#5A5A5A',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#EAEAEA',
    background: '#121212',
    tint: tintColorDark,
    icon: '#A9A9A9',
    tabIconDefault: '#A9A9A9',
    tabIconSelected: tintColorDark,
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./global.css",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        sans: ["BeVietnamPro"],
        normal: ["BeVietnamPro"],
        light: ["BeVietnamProLight"],
        thin: ["BeVietnamProThin"],
        extralight: ["BeVietnamProExtraLight"],
        medium: ["BeVietnamProMedium"],
        semibold: ["BeVietnamProSemiBold"],
        bold: ["BeVietnamProBold"],
        extrabold: ["BeVietnamProExtraBold"],
        black: ["BeVietnamProBlack"],
      },
    },
  },
  // plugins: [
  //   function ({ addUtilities }) {
  //     addUtilities({
  //       '.font-normal': { 
  //         fontFamily: 'BeVietnamPro',
  //       },
  //       '.font-light': { 
  //         fontFamily: 'BeVietnamProLight',
  //       },
  //       '.font-thin': { 
  //         fontFamily: 'BeVietnamProThin',
  //       },
  //       '.font-extralight': { 
  //         fontFamily: 'BeVietnamProExtraLight',
  //       },
  //       '.font-medium': { 
  //         fontFamily: 'BeVietnamProMedium',
  //       },
  //       '.font-semibold': { 
  //         fontFamily: 'BeVietnamProSemiBold',
  //       },
  //       '.font-bold': { 
  //         fontFamily: 'BeVietnamProBold',
  //       },
  //       '.font-extrabold': { 
  //         fontFamily: 'BeVietnamProExtraBold',
  //       },
  //       '.font-black': { 
  //         fontFamily: 'BeVietnamProBlack',
  //       },
  //     });
  //   },
  // ],
}
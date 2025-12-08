@tailwind base;
@tailwind components;
@tailwind utilities;

/* 自定義樣式：隱藏捲軸但保留捲動功能 (Scrollbar Hide) */
@layer utilities {
  .scrollbar-hide::-webkit-scrollbar {
      display: none;
  }
  .scrollbar-hide {
      -ms-overflow-style: none;  /* IE and Edge */
      scrollbar-width: none;  /* Firefox */
  }
}

/* 確保全螢幕應用在手機上不會有彈性滾動造成的空白 */
body {
  background-color: black;
  overscroll-behavior-y: none;
}

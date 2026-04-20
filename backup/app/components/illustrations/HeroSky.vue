<template>
  <svg
    viewBox="0 0 1440 720"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMax slice"
    aria-hidden="true"
    class="h-full w-full"
  >
    <defs>
      <linearGradient id="heroSkyBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#f4d9b8" />
        <stop offset="45%" stop-color="#e8c5c8" />
        <stop offset="100%" stop-color="#b6c8d9" />
      </linearGradient>
      <radialGradient id="heroSunGlow" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stop-color="#f0a95c" stop-opacity="0.9" />
        <stop offset="60%" stop-color="#f0a95c" stop-opacity="0.15" />
        <stop offset="100%" stop-color="#f0a95c" stop-opacity="0" />
      </radialGradient>
    </defs>

    <rect width="1440" height="720" fill="url(#heroSkyBg)" />

    <!-- Sun glow halo -->
    <circle cx="1080" cy="220" r="160" fill="url(#heroSunGlow)" />
    <circle cx="1080" cy="220" r="72" fill="#f0a95c" opacity="0.9" />

    <!-- Clouds -->
    <g opacity="0.55" fill="#fbfaf5">
      <ellipse cx="260" cy="170" rx="95" ry="14" />
      <ellipse cx="330" cy="192" rx="70" ry="10" />
      <ellipse cx="820" cy="130" rx="120" ry="13" />
      <ellipse cx="910" cy="155" rx="60" ry="8" />
      <ellipse cx="540" cy="240" rx="85" ry="10" />
      <ellipse cx="1260" cy="195" rx="75" ry="10" />
    </g>

    <!-- Distant bird pair -->
    <g fill="#2f4a5a" opacity="0.55">
      <path d="M420 160 q4 -5 8 0 q4 -5 8 0" stroke="#2f4a5a" stroke-width="1.5" fill="none" stroke-linecap="round" />
      <path d="M460 180 q3 -4 6 0 q3 -4 6 0" stroke="#2f4a5a" stroke-width="1.2" fill="none" stroke-linecap="round" />
    </g>
  </svg>
</template>

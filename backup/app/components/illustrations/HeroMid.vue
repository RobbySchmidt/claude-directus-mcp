<template>
  <svg
    viewBox="0 0 1440 720"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMax slice"
    aria-hidden="true"
    class="h-full w-full"
  >
    <defs>
      <linearGradient id="heroMidPeak" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#4a6b7c" />
        <stop offset="100%" stop-color="#2f4a5a" />
      </linearGradient>
    </defs>

    <!-- Mid range -->
    <path
      d="M0 560 L120 460 L240 520 L380 380 L520 480 L660 400 L800 500 L940 380 L1080 460 L1220 420 L1440 500 L1440 720 L0 720 Z"
      fill="url(#heroMidPeak)"
    />

    <!-- Snow caps -->
    <g fill="#fbfaf5">
      <path d="M360 400 L380 380 L402 402 L380 418 Z" />
      <path d="M640 420 L660 400 L682 422 L660 436 Z" />
      <path d="M920 400 L940 380 L962 402 L940 418 Z" />
      <path d="M1060 480 L1080 460 L1100 482 L1080 496 Z" />
    </g>

    <!-- Subtle shadow line -->
    <path
      d="M0 560 L120 460 L240 520 L380 380 L520 480 L660 400 L800 500 L940 380 L1080 460 L1220 420 L1440 500"
      stroke="#1f2b3a"
      stroke-width="1"
      fill="none"
      opacity="0.25"
    />
  </svg>
</template>

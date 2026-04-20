<script setup lang="ts">
defineProps<{
  variant: 'alpine-see' | 'hochgebirge' | 'almwiese'
}>()
</script>

<template>
  <svg
    viewBox="0 0 400 260"
    xmlns="http://www.w3.org/2000/svg"
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
    class="h-full w-full"
  >
    <!-- Variant: alpine-see (Bergsee) -->
    <template v-if="variant === 'alpine-see'">
      <defs>
        <linearGradient id="tourSky1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#cfe0ee" />
          <stop offset="100%" stop-color="#f0d8c0" />
        </linearGradient>
        <linearGradient id="tourLake1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7aacd0" />
          <stop offset="100%" stop-color="#3d6b90" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#tourSky1)" />
      <circle cx="310" cy="70" r="22" fill="#f0a95c" opacity="0.9" />
      <path
        d="M0 180 L70 110 L130 150 L200 80 L270 140 L340 100 L400 150 L400 200 L0 200 Z"
        fill="#5a7a98"
      />
      <path d="M180 90 L200 80 L220 100 L200 110 Z" fill="#fbfaf5" />
      <path
        d="M0 200 L60 170 L140 190 L220 160 L300 185 L400 170 L400 220 L0 220 Z"
        fill="#2f6b4e"
      />
      <rect x="0" y="220" width="400" height="40" fill="url(#tourLake1)" />
      <g stroke="#fbfaf5" opacity="0.3" stroke-width="1">
        <line x1="40" y1="232" x2="80" y2="232" />
        <line x1="140" y1="240" x2="200" y2="240" />
        <line x1="260" y1="234" x2="320" y2="234" />
      </g>
    </template>

    <!-- Variant: hochgebirge (Schnee-Gipfel) -->
    <template v-else-if="variant === 'hochgebirge'">
      <defs>
        <linearGradient id="tourSky2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#9ab5cc" />
          <stop offset="100%" stop-color="#d8e4ee" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#tourSky2)" />
      <g fill="#fbfaf5" opacity="0.55">
        <ellipse cx="80" cy="60" rx="40" ry="6" />
        <ellipse cx="300" cy="40" rx="50" ry="5" />
      </g>
      <!-- Back peaks -->
      <path
        d="M0 160 L60 80 L120 130 L180 60 L240 120 L300 70 L360 130 L400 100 L400 200 L0 200 Z"
        fill="#6a8aa5"
      />
      <!-- Snow caps -->
      <path d="M160 80 L180 60 L200 85 L180 100 Z" fill="#fbfaf5" />
      <path d="M280 90 L300 70 L320 95 L300 108 Z" fill="#fbfaf5" />
      <path d="M40 100 L60 80 L80 105 L60 115 Z" fill="#fbfaf5" />
      <!-- Mid peaks -->
      <path
        d="M0 200 L80 150 L160 190 L240 140 L320 180 L400 150 L400 260 L0 260 Z"
        fill="#3a5a4a"
      />
      <g fill="#1f4a36">
        <polygon points="60,180 68,164 76,180" />
        <polygon points="140,195 148,178 156,195" />
        <polygon points="260,170 268,152 276,170" />
        <polygon points="340,185 348,168 356,185" />
      </g>
    </template>

    <!-- Variant: almwiese (Alm mit Hütte) -->
    <template v-else>
      <defs>
        <linearGradient id="tourSky3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#b8d0e4" />
          <stop offset="100%" stop-color="#f4e0c4" />
        </linearGradient>
        <linearGradient id="tourMeadow" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6fa860" />
          <stop offset="100%" stop-color="#3d7a3a" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill="url(#tourSky3)" />
      <circle cx="320" cy="60" r="26" fill="#f0a95c" opacity="0.9" />
      <!-- Distant peaks -->
      <path
        d="M0 140 L60 90 L130 120 L200 80 L270 115 L340 85 L400 120 L400 170 L0 170 Z"
        fill="#8aa5c0"
      />
      <path d="M180 90 L200 80 L220 100 L200 112 Z" fill="#fbfaf5" />
      <!-- Meadow -->
      <path
        d="M0 170 Q100 160 200 170 Q300 180 400 165 L400 260 L0 260 Z"
        fill="url(#tourMeadow)"
      />
      <!-- Hut -->
      <g transform="translate(120 175)">
        <rect x="0" y="10" width="44" height="28" fill="#8a5a3a" />
        <polygon points="-4,10 22,-8 48,10" fill="#5a2f20" />
        <rect x="16" y="22" width="10" height="16" fill="#3a1f10" />
        <rect x="6" y="16" width="6" height="6" fill="#f0d8a0" />
        <rect x="32" y="16" width="6" height="6" fill="#f0d8a0" />
      </g>
      <!-- Trees -->
      <g>
        <g transform="translate(60 195)">
          <polygon points="0,0 -8,14 8,14" fill="#1f4a36" />
          <polygon points="0,-10 -10,6 10,6" fill="#1f4a36" />
          <polygon points="0,-20 -11,-4 11,-4" fill="#1f4a36" />
        </g>
        <g transform="translate(300 200)">
          <polygon points="0,0 -8,14 8,14" fill="#1f4a36" />
          <polygon points="0,-10 -10,6 10,6" fill="#1f4a36" />
        </g>
      </g>
      <!-- Flowers dots -->
      <g>
        <circle cx="40" cy="230" r="2" fill="#f0a95c" />
        <circle cx="70" cy="240" r="2" fill="#f4e0c4" />
        <circle cx="220" cy="235" r="2" fill="#f0a95c" />
        <circle cx="260" cy="245" r="2" fill="#fbfaf5" />
        <circle cx="350" cy="232" r="2" fill="#f0a95c" />
      </g>
    </template>
  </svg>
</template>

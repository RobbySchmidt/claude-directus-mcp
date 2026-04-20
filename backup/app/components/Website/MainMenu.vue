<template>
  <div 
    id="menu-holder"
    class="z-20 xl:pt-0 transition-transform fixed top-[95px] xl:top-0 w-full xl:translate-x-0 xl:relative left-0"
    :class="{
      'xl:left-0 right-0': store.menuOpen,
      '-translate-x-full': !store.menuOpen
    }">

    <nav 
      id="main-menu" 
      class="h-screen xl:h-full bg-white pb-40 xl:pb-10 overflow-y-auto border-l-[15px] xl:border-none"
      aria-label="Hauptnavigation"
      :style="{ 'border-color': activeBorderColor }">   

      <ul>
        <template v-for="(section, sIndex) in mergedNavigation" :key="sIndex">

          <template v-for="(item, index) in section.items" :key="item.id || index">

            <template v-if="$device.isDesktop">
              <WebsiteMenuItem 
                :menuItem="item"
                :isLastHighlighted="section.isLastMenuItemHighlighted"
              />
            </template>

            <template v-else>
              <WebsiteMenuItem 
                :menuItem="item"
              />
            </template>

          </template>

        </template>
      </ul>
      <WebsiteBottomMenu v-if="bottomNavigation" :navigation="bottomNavigation" />
    </nav>
  </div>
</template>



<script setup>
import { useStore } from "~~/store/store";
const store = useStore();

const props = defineProps({
  navigation: { type: Object },
  facilities: { type: Array },
  subNavigation: { type: Object },
  bottomNavigation: { type: Object },
});

const loaded = ref(false);

onMounted(() => {
  setTimeout(() => loaded.value = true, 10);
});

watch(
  () => store.menuOpen,
  (newValue) => {
    if (newValue) {
      document.body.classList.add('overflow-hidden', 'lg:overflow-auto');
    } else {
      document.body.classList.remove('overflow-hidden', 'lg:overflow-auto');
    }
  }
);


const mergedNavigation = computed(() => {
  const facilitiesNav = {
    title: "Facilities",
    isLastMenuItemHighlighted: false,
    items: (props.facilities || []).map(f => ({
      ...f,
      type: "facility"
    }))
  };

  return [
    props.navigation,
    facilitiesNav,
    props.subNavigation
  ].filter(Boolean);
});

 const route = useRoute();

const activeBorderColor = computed(() => {
  if (!props.facilities || props.facilities.length === 0) return 'var(--color-primary)';

  const segments = route.path.split('/').filter(Boolean);
  const firstSegment = segments[0];

  const facility = props.facilities.find(f => f.slug === firstSegment);
  return facility?.color || 'var(--color-primary)';
});
</script>
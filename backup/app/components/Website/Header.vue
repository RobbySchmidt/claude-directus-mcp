<template>  
  <header 
    id="siteHeader" 
    class="sticky top-0 z-40 w-full xl:border-r-3 !border-r-secondary xl:h-screen overflow-y-auto pr-4 md:pr-8 xl:px-0 bg-white xl:border-l-[15px]"
    :class="{'lg:pr-0' : navigation.isLastMenuItemHighlighted}"
    :style="{ 'border-color': activeBorderColor }">

    <div 
      class="flex justify-between items-center xl:block"
      :class="{'xl:max-w-[1100px] 3xl:max-w-[1300px] ' : !navigation.isLastMenuItemHighlighted}">
      <NuxtLink
        to="/"
        @click="closeMenu"
        class="relative z-50 my-2.5 xl:my-12 pl-2 md:pl-4 xl:pl-8 block">
        <img 
        :src="route.path.startsWith('/rosengarten') ? getAssetUrl() + general.logo_secondary.filename_disk : getAssetUrl() + general.logo_main.filename_disk" 
        :alt="general.logo_main.title"
        class="block w-[200px] xl:w-full max-w-[340px] h-[77px]">
      </NuxtLink>
      
      <WebsiteMainMenu :navigation="mainNavigation" :facilities="facilities" :subNavigation="subNavigation" :bottomNavigation="bottomNavigation"/>
      
      <button
        @click="store.menuOpen = !store.menuOpen"
        aria-controls="main-menu"
        aria-label="Navigation öffnen"            
        class="focus:outline-none relative w-7 h-14 xl:hidden z-50">
          <span class="block absolute h-0.5 w-7 transform transition duration-300 ease-in-out bg-black" :class="store.menuOpen ? 'rotate-45': ' -translate-y-1.5'"></span>
          <span class="block absolute  h-0.5 w-5 transform transition duration-300 ease-in-out bg-black" :class="store.menuOpen ? 'opacity-0' : ''"></span>
          <span class="block absolute  h-0.5 w-7 transform  transition duration-300 ease-in-out bg-black" :class="store.menuOpen ? '-rotate-45': 'translate-y-1.5'"></span>
      </button>
      
    </div>
  </header>  
</template>

<script setup>   
  import { useStore } from "~~/store/store";
  const { getItems } = useDirectusItems();
  
  const route = useRoute()
  const store = useStore();
 	
  function closeMenu() {
    store.menuOpen = false
    store.subMenuOpen = false
  }

  const { 
    data: navigation, 
    pending: mainNavigationPending, 
    error: mainNavigationError 
  } = await useAsyncData(
  'mainNavigation', 
    () => getItems({
      collection: 'navigation',
      params: {
        fields: ['title', 'items.*', 'items.page.slug', 'items.children.page.slug', 'items.children.*', 'isLastMenuItemHighlighted'],
      },
    }),
    { 
      transform: data => data
    }
  );

  const mainNavigation = computed(() => {
    return navigation.value.find(n => n.title === 'Main')
  })

  const subNavigation = computed(() => {
    return navigation.value.find(n => n.title === 'SubNavigation')
  })

  const bottomNavigation = computed(() => {
    return navigation.value.find(n => n.title === 'BottomNavigation')
  })

  const {
    data: general,
    pending: pendingGeneral,
    error: errorGeneral,
  } = await useAsyncData('headerConf', () => {
    return getItems({      
      collection: "general",      
      params: {
      fields: [
        'logo_main.*',
        'logo_secondary.*',
      ],
    }
    })
    },
    {
      transform: (data) => data,
    }
  )

  const {
    data: facilities,
    pending: pendingFacilities,
    error: errorFacilities,
  } = await useAsyncData('facilities', () => {
    return getItems({      
      collection: "facilities",      
      params: {
      fields: [
        '*',
        '*.*',
      ],
    }
    })
    },
    {
      transform: (data) => data,
    }
  )

 const activeBorderColor = computed(() => {
  if (!facilities.value) return 'var(--color-primary)';

  const segments = route.path.split('/').filter(Boolean);
  const firstSegment = segments[0];

  const facility = facilities.value.find(f => f.slug === firstSegment);
  return facility?.color || 'var(--color-primary)';
});


  const loaded = ref(false)
  // onMounted(() => {
  //     setTimeout(function() {
  //       loaded.value = true

  //       const firstPartOfPath = route.path.split('/')[1];      

  //       if (navigation && navigation.value.items && navigation.value.items.length > 0) {
  //       const matchingItem = navigation.value.items.find(item => {
  //         const firstPartOfUrl = item.url ? item.url.split('/')[1] : null;
  //         return item.url && firstPartOfUrl === firstPartOfPath;
  //       });
  //       if (matchingItem && matchingItem.children && matchingItem.children.length > 0) {
  //         subNavi.value = true;          
  //       } else {
  //         subNavi.value = false;
  //       }
  //     } else {
  //       subNavi.value = false;
  //     }

  //     }, 10);
  // })



  // watch(
  //   () => [route.path, navigation],
  //   ([currentPath, navigationData]) => {
  //     const firstPartOfPath = route.path.split('/')[1];
  //     if (navigationData && navigationData.value.items && navigationData.value.items.length > 0) {
  //       const matchingItem = navigationData.value.items.find(item => {
  //         const firstPartOfUrl = item.url ? item.url.split('/')[1] : null;
  //         return item.url && firstPartOfUrl === firstPartOfPath;
  //       });
  //       if (matchingItem && matchingItem.children && matchingItem.children.length > 0) {
  //         subNavi.value = true;          
  //       } else {
  //         subNavi.value = false;
  //       }
  //     } else {
  //       subNavi.value = false;
  //     }

  //   }
  // );

  // watch(
  //   () => store.menuOpen,
  //   (newValue) => {
  //     if (newValue) {
  //       document.body.classList.add('overflow-hidden', 'lg:overflow-auto');
  //     } else {
  //       document.body.classList.remove('overflow-hidden', 'lg:overflow-auto');
  //     }
  //   },
  // );
  
</script>
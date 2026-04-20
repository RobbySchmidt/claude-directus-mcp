<template>  
  <li 
    v-if="menuItem.type != 'submenu' && checkPageSlug(menuItem)"
    class="text-white lg:text-primary text-base border-b-2 xl:first:border-t-2 border-secondary"
    :class="{ 
      'lg:last:[&>a]:bg-primary lg:last:[&>a]:text-primary-foreground last:[&>a]:lg:px-20 last:ml-auto': isLastHighlighted
    }">

    <NuxtLink 
      :to="getUrl(menuItem)"
      :target="menuItem.open_in_new_tab ? '_blank' : '_self'" 
      @click="closeMenu()" 
      class="py-3 w-full px-4 text-black hover:text-white duration-300 ease-in-out flex flex-col group"
      :style="{
        '--hover-color': menuItem.color ?? 'var(--color-primary)',
        backgroundColor: isActiveLink(menuItem) ? (menuItem.color ?? 'var(--color-primary)') : ''
      }"
      :class="{
        '[&>span]:text-white': isActiveLink(menuItem)
      }"
    >
      <span>{{ menuItem.title }}</span>
      <span 
        v-if="menuItem.sub_title"
        class="text-[#00000080] group-hover:text-white text-sm duration-300 ease-in-out">
        {{ menuItem.sub_title }}
      </span>
    </NuxtLink>
  </li>

  <li 
    v-else
    ref="submenu-wrapper"
    class="relative z-10 border-b-2 first:border-t-2 border-accent border-none menu-item-has-children">
    
    <button
      type="button"
      :aria-controls="'submenu-' + menuItem.id"
      @click="store.subMenuOpen = !store.subMenuOpen"
      class="relative px-4 box-border flex items-center justify-between w-full text-black xl:hover:bg-primary hover:text-white text-base lg:border-none font-medium py-3 group cursor-pointer text-start duration-300 ease-in-out"
      :class="{
        'text-white bg-primary' : store.subMenuOpen || route.path.startsWith('/rosengarten')
      }">
      <div>
        <span 
          class="block">
          {{ menuItem.title }}
        </span>
        <span 
          v-if="menuItem.sub_title" 
          class="block text-[#00000080] text-sm group-hover:text-white duration-300 ease-in-out"
          :class="{
            'text-white' : store.subMenuOpen || route.path.startsWith('/rosengarten')
          }">
          {{ menuItem.sub_title }}
        </span>
      </div>
   
      <ChevronDown
        class="ml-1 transition-transform duration-300 ease-in-out"
        :class="{
          '-rotate-90 lg:-rotate-0': !store.subMenuOpen,
          'lg:rotate-180': store.subMenuOpen
        }"
      />
    </button>

    <ul
      :id="'submenu-' + menuItem.id"
      ref="submenu"
      :style="store.subMenuOpen ? 'max-height:'+ submenu.scrollHeight + 'px' : 'max-height:0'"
      class="overflow-hidden lg:translate-x-0 text-lg w-full transition-all duration-300 ease-in-out border-b-2 border-secondary">

      <li
        class="lg:hidden duration-300 ease-in-out"
        >
      </li>

      <template v-for="(submenuItem, index) in menuItem.children">                  
        <li
          v-if="checkPageSlug(submenuItem)"
          :style="'transition-delay:'+ ((index+1+0.3)*0.5)*150 + 'ms'"
          class="border-t-2 border-secondary"
          
        >
          <NuxtLink
            :to="getUrl(submenuItem)"
            :target="submenuItem.open_in_new_tab ? '_blank' : '_self'"
            @click="closeMenu"
            class="block w-full px-8 lg:px-8 py-2 font-medium text-base bg-white hover:!bg-primary hover:text-white duration-300 ease-in-out relative before:absolute before:content xl:before:content-none before:w-1 before:h-1 before:rounded-full before:left-5 before:top-1/2 before:translate-y-[calc(-50%-1px)] before:bg-black"
            :class="{ 'text-white !bg-primary before:bg-white': isActiveLink(submenuItem) }"
          >
            {{ submenuItem.title }}
          </NuxtLink>
        </li>
      </template>  
    </ul> 
  </li> 
</template>

<script setup>

const props = defineProps({
  menuItem: { type: Object },
  isLastHighlighted: {type: Boolean}
});

import { useStore } from "~~/store/store";
import { ChevronDown, ChevronLeft } from 'lucide-vue-next';
import { onClickOutside } from '@vueuse/core'
import { useTemplateRef } from 'vue'

const store = useStore();

function closeMenu() {
  store.menuOpen = false
  store.subMenuOpen = false
}

const submenu = ref()
const submenuWrapper = useTemplateRef('submenu-wrapper')

onClickOutside(submenuWrapper, () => { store.subMenuOpen = false })

function checkPageSlug(item){
  if (item.type === 'facility') return true
  if (item.type === 'page' && item.page) return true
  if (item.type === 'page' && !item.page) return false
  return true
}

function getUrl(item) {
  if (item.type === 'page') {
    return `/${item.page?.slug ?? ''}`; // always with slash
  }
  if (item.type === 'facility') {
    return `/${item.slug}`; // add leading slash
  }
  if (item.type === 'facilityPage') {
    return `/${item.page.slug}`;
  }
  if (item.type === 'url') {
    return item.url.startsWith('/') ? item.url : `/${item.url}`;
  }
  return item.url.startsWith('/') ? item.url : `/${item.url}`;
}


const route = useRoute()

function isActiveLink(item) {
  const target = getUrl(item)
  const currentPath = route.path

  if (!target) return false

  // 1) Exact match always valid
  if (currentPath === target) return true

  // 2) If target is index (e.g. "/rosengarten") we do NOT match children
  const isIndexPage = target.split('/').length <= 2   // e.g. "/", "/rosengarten"
  if (isIndexPage) return false

  // 3) For nested links → match children
  return currentPath.startsWith(target + '/')
}


</script>

<style scoped>
  

  
  @media (width >= 80rem /* 1280px */) {
    a:hover {
      background-color: var(--hover-color);
    }
  }

</style>

<template>
    <q-layout view="hHh Lpr lFf">
        <q-header elevated class="bg-primary text-white">
            <q-toolbar>
                <q-btn dense flat round icon="menu" @click="toggleLeftDrawer" />
                <q-toolbar-title>
                    CMS Admin
                </q-toolbar-title>
                <q-btn flat round dense icon="logout" @click="logout">
                    <q-tooltip>Logout</q-tooltip>
                </q-btn>
            </q-toolbar>
        </q-header>

        <q-drawer show-if-above v-model="leftDrawerOpen" side="left" bordered>
            <q-scroll-area class="fit">
                <q-list>
                    <q-item-label header>Menu</q-item-label>

                    <q-item clickable v-ripple to="/cms" active-class="text-primary bg-blue-1">
                        <q-item-section avatar>
                            <q-icon name="dashboard" />
                        </q-item-section>
                        <q-item-section>
                            Dashboard CMS
                        </q-item-section>
                    </q-item>

                    <!-- Add more CMS menu items here -->

                </q-list>
            </q-scroll-area>
        </q-drawer>

        <q-page-container class="bg-grey-1">
            <q-page>
                <q-card flat style="border-radius: 8px 0px 0px 0px">
                    <slot></slot>
                </q-card>
            </q-page>
        </q-page-container>
    </q-layout>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const leftDrawerOpen = ref(false)
const auth = useAuthStore()

const toggleLeftDrawer = () => {
    leftDrawerOpen.value = !leftDrawerOpen.value
}

const logout = () => {
    auth.logout()
}
</script>
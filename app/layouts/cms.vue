<template>
    <q-layout view="hHh Lpr lFf">
        <q-header elevated class="bg-primary text-white">
            <q-toolbar>
                <q-toolbar-title>
                    CMS Admin
                </q-toolbar-title>
                <q-btn flat round dense icon="logout" @click="logout">
                    <q-tooltip>Logout</q-tooltip>
                </q-btn>
            </q-toolbar>
        </q-header>       

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
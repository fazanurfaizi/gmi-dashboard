<template>
  <div class="fullscreen bg-grey-2 flex flex-center">
    <q-card square class="q-pa-lg shadow-2" style="width: 400px">
      <q-card-section class="text-center">
        <div class="text-h5 text-weight-bold text-primary">Login</div>
        <div class="text-grey-6">Sign in to your dashboard</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="handleLogin" class="q-gutter-md">
          <q-input
            filled
            v-model="username"
            label="Username"
            lazy-rules
            :rules="[val => val && val.length > 0 || 'Please type something']"
          />

          <q-input
            filled
            type="password"
            v-model="password"
            label="Password"
            lazy-rules
            :rules="[val => val && val.length > 0 || 'Please type something']"
          />

          <div class="text-center text-negative q-mt-sm" v-if="errorMessage">
            {{ errorMessage }}
          </div>

          <div>
            <q-btn label="Login" type="submit" color="primary" class="full-width" :loading="loading" />
          </div>
          
          <div class="text-caption text-center text-grey-6">
            Hint: admin / admin
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'auth',
  middleware: ['auth-middleware']
})

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const loading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  loading.value = true
  errorMessage.value = ''
  
  const success = await authStore.login(username.value, password.value)
  
  if (success) {
    router.push('/cms')
  } else {
    errorMessage.value = 'Invalid username or password'
  }
  
  loading.value = false
}
</script>
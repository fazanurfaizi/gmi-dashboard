<template>
  <div class="fullscreen bg-grey-2 flex flex-center">
    <q-card square class="q-pa-lg shadow-2" style="width: 400px">
      <q-card-section class="text-center">
        <div class="text-h5 text-weight-bold text-primary">Login</div>
        <div class="text-grey-6">Sign in to your dashboard</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            filled
            v-model="form.username"
            label="Username"
            lazy-rules
            :rules="[val => val && val.length > 0 || 'Please type something']"
          />

          <q-input
            filled
            type="password"
            v-model="form.password"
            label="Password"
            lazy-rules
            :rules="[val => val && val.length > 0 || 'Please type something']"
          />

          <div class="text-center text-negative q-mt-sm" v-if="errorMsg">
            {{ errorMsg }}
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
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: 'auth',
})

const auth = useAuthStore()
const form = reactive({
  username: '',
  password: ''
})
const loading = ref(false)
const errorMsg = ref('')

const onSubmit = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    await auth.login(form)
  } catch (err: any) {
    errorMsg.value = err?.statusMessage || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
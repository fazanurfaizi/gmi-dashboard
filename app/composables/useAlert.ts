import { Dialog, Notify, Loading, LoadingBar, BottomSheet } from 'quasar'

type Position = 'top' | 'right' | 'bottom' | 'left' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' | undefined

export const useAlert = () => {
  const loadingOverlay = (show = true, msg = '') => {
    if (show) {
      Loading.show({
        message: msg,
      })
    } else {
      setTimeout(() => {
        Loading.hide()
      }, 300)
    }
  }

  const loading = (show = true) => {
    LoadingBar.setDefaults({
      color: 'red',
      size: '3px',
      position: 'top',
    })
    if (show) {
      LoadingBar.start()
    } else {
      setTimeout(() => {
        LoadingBar.stop()
      }, 300)
    }
  }

  const showToast = (msg: string, color = 'dark', timeout = 5000, position: Position = 'bottom-right', caption = '') => {
    Notify.create({
      progress: true,
      message: msg,
      position: position,
      html: true,
      icon: 'info',
      color: color,
      timeout: timeout,
      caption: caption,
      actions: [
        {
          label: 'x',
          color: 'yellow',
          handler: () => {},
        },
      ],
    })
  }

  const showSuccess = (title: string, msg = '') => {
    Notify.create({
      type: 'positive',
      message: title,
      caption: msg,
      position: 'bottom-right',
      timeout: 5000,
      actions: [
        {
          label: 'x',
          color: 'white',
          handler: () => {},
        },
      ],
    })
  }

  const showNotif = (title: string, msg = '', type = 'negative') => {
    Notify.create({
      type: type,
      message: title,
      caption: msg,
      position: 'center',
      timeout: 5000,
      actions: [
        {
          label: 'x',
          color: 'yellow',
          handler: () => {},
        },
      ],
    })
  }

  const showAlert = (title: string, msg = '', persistent = false) => {
    let judul = title
    let pesan = msg
    if (title === 'try') {
      judul = 'Opps!'
      pesan = 'Terjadi kesalahan saat menghubungkan ke server, harap coba lagi atau tekan Refresh!'
    }
    Dialog.create({
      transitionShow: 'jump-up',
      transitionHide: 'jump-down',
      title: judul,
      message: pesan,
      html: true,
      persistent: persistent,
    })
  }

  const showError = (e: string, json?: JSON) => {
    let err = e
    if (json) err = JSON.stringify(e)
    showAlert('ERROR', err)
  }

  const showBottomSheet = (message = '', actions = [], callback: any) => {
    BottomSheet.create({
      message: message,
      actions: actions,
    })
      .onOk((action) => {
        if (callback) callback(action.id)
      })
  }

  const confirm = (message: string, callback: any, options: any = undefined, prompt: any = undefined) => {
    Dialog.create({
      transitionShow: 'jump-up',
      transitionHide: 'jump-down',
      title: 'Confirm',
      message: message,
      html: true,
      cancel: true,
      options: options,
      prompt: prompt,
    })
      .onOk((data) => {
        callback(true, data)
      })
      .onCancel(() => {
        callback(false)
      })
  }

  return {
    loadingOverlay,
    loading,
    showToast,
    showSuccess,
    showNotif,
    showAlert,
    showError,
    showBottomSheet,
    confirm,
  }
}
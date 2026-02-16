// import DOMPurify from 'dompurify'

export function useSafeHtml() {
  const render = (el: HTMLElement, html: string) => {
    // const fragment = DOMPurify.sanitize(html, {
    //   RETURN_DOM_FRAGMENT: true,
    //   USE_PROFILES: { html: true },
    //   ADD_TAGS: ['style'],
    //   ADD_ATTR: ['style', 'class'],
    //   WHOLE_DOCUMENT: true,
    // })

    // // Remove previous content safely
    // el.replaceChildren(fragment)
    return html
  }

  return { render }
}

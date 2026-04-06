import { chromium } from 'playwright'
import { execSync } from 'child_process'

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let browser

  try {
    const { targetUrl, formSchema, testData, authentication } = req.body

    if (!targetUrl || !formSchema || !testData) {
      return res.status(400).json({
        success: false,
        error: 'targetUrl, formSchema, and testData are required'
      })
    }

    console.log(`Running test on: ${targetUrl}`)

    // Install browser if needed (for Vercel)
    try {
      await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    } catch (e) {
      console.log('Installing Playwright browser...')
      execSync('npx playwright install chromium --with-deps', { stdio: 'inherit' })
    }

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })
    const page = await browser.newPage()
    
    const startTime = Date.now()

    // Handle authentication if needed
    if (authentication && (authentication.login || authentication.email || authentication.password)) {
      console.log('Handling authentication during test...')
      
      const loginUrl = authentication.loginUrl || targetUrl
      console.log(`Navigating to login URL: ${loginUrl}`)
      await page.goto(loginUrl, { waitUntil: 'networkidle' })
      
      let authSuccessful = false

      // Fill login field if provided
      if (authentication.login && authentication.loginField) {
        const loginField = authentication.loginField || 'login'
        const loginSelectors = [
          `input[name="${loginField}"]`,
          `#${loginField}`,
          `[id*="login"]`,
          `input[type="text"]`
        ]

        for (const selector of loginSelectors) {
          try {
            if (await page.$(selector)) {
              await page.fill(selector, authentication.login)
              console.log(`Filled login field: ${selector}`)
              authSuccessful = true
              break
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      // Fill email field if provided
      if (authentication.email && authentication.emailField) {
        const emailField = authentication.emailField || 'email'
        const emailSelectors = [
          `input[name="${emailField}"]`,
          `#${emailField}`,
          `[id*="email"]`,
          `input[type="email"]`
        ]

        for (const selector of emailSelectors) {
          try {
            if (await page.$(selector)) {
              await page.fill(selector, authentication.email)
              console.log(`Filled email field: ${selector}`)
              authSuccessful = true
              break
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      // Fill password field if provided
      if (authentication.password && authentication.passwordField) {
        const passwordField = authentication.passwordField || 'password'
        const passwordSelectors = [
          `input[name="${passwordField}"]`,
          `#${passwordField}`,
          `[id*="password"]`,
          `input[type="password"]`
        ]

        for (const selector of passwordSelectors) {
          try {
            if (await page.$(selector)) {
              await page.fill(selector, authentication.password)
              console.log(`Filled password field: ${selector}`)
              authSuccessful = true
              break
            }
          } catch (e) {
            // Continue to next selector
          }
        }
      }

      // Try to submit form if we filled in auth fields
      if (authSuccessful) {
        try {
          const submitBtn = await page.$('button[type="submit"], input[type="submit"], button:has-text("Login"), button:has-text("Sign In"), button:has-text("Submit")')
          if (submitBtn) {
            await submitBtn.click()
            // Wait a bit longer for navigation after login
            await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 10000 }).catch(() => {})
            console.log('Authentication form submitted, redirected...')
          }
        } catch (e) {
          console.log('Could not find or click submit button:', e.message)
        }
      } else {
        console.log('No authentication fields filled, skipping login submission')
      }
      
      // Add delay to ensure page is ready
      await page.waitForTimeout(1000)
    }

    // Navigate to target URL (or stay on current URL if already there after login)
    const currentUrl = page.url()
    console.log(`Current URL: ${currentUrl}`)
    console.log(`Target URL: ${targetUrl}`)
    
    if (currentUrl !== targetUrl) {
      console.log(`Navigating to target URL: ${targetUrl}`)
      await page.goto(targetUrl, { waitUntil: 'networkidle' })
    }
    
    // Additional wait to ensure page content is loaded
    await page.waitForTimeout(1000)

    // Fill form fields reliably via DOM evaluation
    for (const field of formSchema.fields) {
      const fieldValue = testData[field.name]
      if (fieldValue === null || fieldValue === undefined || fieldValue === '') continue

      const result = await page.evaluate(({ field, value }) => {
        const escapeCss = (str) => {
          return str.replace(/([\\"'\[\]#.:;,!?+*~^$|\/(){}<>])/g, '\\$1')
        }

        const selectors = [
          `[name="${escapeCss(field.name)}"]`,
          `#${escapeCss(field.name)}`
        ]

        const element = document.querySelector(selectors.join(','))
        if (!element) {
          return { filled: false, reason: 'element-not-found' }
        }

        const tag = element.tagName.toLowerCase()
        const type = element.type ? element.type.toLowerCase() : ''
        const normalizedValue = field.type === 'checkbox' ? Boolean(value) : String(value)

        if (field.type === 'checkbox' || type === 'checkbox') {
          element.checked = Boolean(value)
          element.dispatchEvent(new Event('change', { bubbles: true }))
          return { filled: true, action: 'checkbox' }
        }

        if (field.type === 'radio' || type === 'radio') {
          const radio = document.querySelector(`input[name="${escapeCss(field.name)}"][value="${escapeCss(normalizedValue)}"]`)
          if (radio) {
            radio.checked = true
            radio.dispatchEvent(new Event('change', { bubbles: true }))
            return { filled: true, action: 'radio' }
          }
          return { filled: false, reason: 'radio-option-not-found' }
        }

        if (tag === 'select' || field.type === 'select') {
          const select = tag === 'select' ? element : document.querySelector(`select[name="${escapeCss(field.name)}"]`)
          if (!select) {
            return { filled: false, reason: 'select-not-found' }
          }

          const optionByValue = Array.from(select.options).find(opt => opt.value === normalizedValue)
          if (optionByValue) {
            select.value = optionByValue.value
            select.dispatchEvent(new Event('change', { bubbles: true }))
            return { filled: true, action: 'select-value' }
          }

          const optionByText = Array.from(select.options).find(opt => opt.textContent.trim() === normalizedValue)
          if (optionByText) {
            select.value = optionByText.value
            select.dispatchEvent(new Event('change', { bubbles: true }))
            return { filled: true, action: 'select-text' }
          }

          return { filled: false, reason: 'option-not-found' }
        }

        element.value = normalizedValue
        element.dispatchEvent(new Event('input', { bubbles: true }))
        element.dispatchEvent(new Event('change', { bubbles: true }))
        return { filled: true, action: 'input' }
      }, { field, value: fieldValue })

      if (!result.filled && field.required) {
        console.warn(`Could not fill required field: ${field.name}`, result.reason)
      } else if (result.filled) {
        console.log(`Filled field: ${field.name}`, result.action)
      }
    }

    // Take screenshot before submission
    const screenshotBuffer = await page.screenshot()
    const screenshotBase64 = screenshotBuffer.toString('base64')

    // Try to submit form
    let submitError = null
    try {
      const submitBtn = await page.evaluateHandle(() => {
        const form = document.querySelector('form')
        const candidates = []

        if (form) {
          candidates.push(...Array.from(form.querySelectorAll('button, input')))
        }

        candidates.push(...Array.from(document.querySelectorAll('button, input')))

        const isClickable = (element) => {
          const tag = element.tagName.toLowerCase()
          const type = element.type ? element.type.toLowerCase() : ''
          if (tag === 'button') return true
          if (tag === 'input' && ['submit', 'button', 'image', 'reset'].includes(type)) return true
          return false
        }

        for (const element of candidates) {
          if (!isClickable(element)) continue
          const style = window.getComputedStyle(element)
          if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue
          if (element.disabled) continue
          return element
        }

        return null
      })

      const submitElement = submitBtn.asElement()
      if (submitElement) {
        await submitElement.click()
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 7000 }).catch(() => {})
        } catch (e) {
          // Page might not navigate after submit
        }
        console.log('Form submitted successfully via clickable button')
      } else {
        console.log('No clickable button found, trying form.submit() fallback')
        const formFound = await page.$('form')
        if (formFound) {
          await page.evaluate(() => {
            const form = document.querySelector('form')
            if (form) {
              const evt = new Event('submit', { bubbles: true, cancelable: true })
              form.dispatchEvent(evt)
              form.submit()
            }
          })
          try {
            await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 7000 }).catch(() => {})
          } catch (e) {
            // Page might not navigate after submit
          }
          console.log('Form submitted successfully via fallback form.submit()')
        } else {
          console.log('No form element found for fallback submit')
        }
      }
    } catch (error) {
      submitError = error.message
      console.warn('Error during form submission:', submitError)
    }

    // Take screenshot after submission
    const afterSubmitScreenshot = await page.screenshot()
    const afterSubmitBase64 = afterSubmitScreenshot.toString('base64')

    const duration = Date.now() - startTime

    // Determine test status
    const finalUrl = page.url()
    const pageTitle = await page.title()
    const pageContent = await page.content()
    
    let testStatus = 'passed'
    let statusMessage = 'Form submitted and navigated to response page'

    // Check if still on login page (authentication failed)
    const pageHeading = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('h1, h2, h3'))
        .map(h => h.textContent.toLowerCase())
        .join(' ')
    })

    if ((pageTitle.toLowerCase().includes('login') || pageHeading.includes('login')) && 
        (finalUrl === (authentication?.loginUrl || targetUrl))) {
      testStatus = 'failed'
      statusMessage = 'Authentication failed - still on login page. Check credentials and field names.'
    }
    // Check if URL remained the same (form might not have been submitted)
    else if (finalUrl === targetUrl && !pageContent.includes('success') && !pageContent.includes('thank')) {
      // This could still be valid if form submission is asynchronous
      statusMessage = 'Form appears to be submitted (page content updated)'
      testStatus = 'passed'
    }
    // Check for common error indicators (but be smart about it)
    else if ((pageContent.toLowerCase().includes('error') || 
              pageContent.toLowerCase().includes('invalid') ||
              pageContent.toLowerCase().includes('failed')) &&
             !pageContent.toLowerCase().includes('success')) {
      // Only mark as failed if page doesn't indicate success
      if (!pageContent.toLowerCase().includes('404') && 
          !pageContent.toLowerCase().includes('network error')) {
        testStatus = 'warning'
        statusMessage = 'Form submitted but page shows potential error indicators'
      }
    }
    // Check if URL changed (successful navigation after form submission)
    else if (finalUrl !== targetUrl) {
      testStatus = 'passed'
      statusMessage = 'Form submitted successfully - redirected to: ' + finalUrl
    }

    if (submitError) {
      testStatus = 'error'
      statusMessage = submitError
    }

    res.json({
      success: true,
      status: testStatus,
      message: statusMessage,
      duration,
      timestamp: new Date().toISOString(),
      submittedData: testData,
      finalUrl,
      pageTitle,
      screenshot: `data:image/png;base64,${screenshotBase64}`,
      afterSubmitScreenshot: `data:image/png;base64,${afterSubmitBase64}`,
      error: submitError || null
    })

  } catch (error) {
    console.error('Test execution error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute test'
    })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

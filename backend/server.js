import express from 'express'
import cors from 'cors'
import { chromium } from 'playwright'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

/**
 * Detect form fields from a URL using Playwright
 * POST /api/detect-form
 */
app.post('/api/detect-form', async (req, res) => {
  let browser

  function normalizeNavigationError(error, url) {
    const message = error?.message || ''
    if (message.includes('ERR_NAME_NOT_RESOLVED')) {
      return `Unable to resolve host for URL: ${url}. Please check the URL or DNS/network access from the backend.`
    }
    if (message.includes('ERR_CONNECTION_REFUSED')) {
      return `Connection refused when accessing ${url}. The site may be down or blocking requests.`
    }
    if (message.includes('ERR_CERT_AUTHORITY_INVALID') || message.includes('ERR_CERT_COMMON_NAME_INVALID')) {
      return `SSL certificate issue when accessing ${url}. Try using a valid HTTPS URL or check the certificate.`
    }
    return message
  }

  try {
    const { targetUrl, authentication } = req.body

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        error: 'targetUrl is required'
      })
    }

    // Validate URL
    new URL(targetUrl)

    console.log(`Detecting form fields from: ${targetUrl}`)

    // Launch browser (container-friendly)
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    const page = await browser.newPage()

    // Handle authentication if needed
    if (authentication && (authentication.login || authentication.email || authentication.password)) {
      console.log('Handling authentication...')
      
      const loginUrl = authentication.loginUrl || targetUrl
      console.log(`Navigating to login URL: ${loginUrl}`)
      try {
        await page.goto(loginUrl, { waitUntil: 'networkidle' })
      } catch (error) {
        throw new Error(normalizeNavigationError(error, loginUrl))
      }
      
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
      }
      
      // Add delay to ensure page is ready
      await page.waitForTimeout(1000)
    }

    // Navigate to target URL (or stay on current URL if already there after login)
    const currentUrl = page.url()
    console.log(`Current URL after auth: ${currentUrl}`)
    console.log(`Target URL: ${targetUrl}`)
    
    if (currentUrl !== targetUrl) {
      console.log(`Navigating to target URL: ${targetUrl}`)
      try {
        await page.goto(targetUrl, { waitUntil: 'networkidle' })
      } catch (error) {
        throw new Error(normalizeNavigationError(error, targetUrl))
      }
    }
    
    // Wait for page to load and check content type
    await page.waitForTimeout(1000)
    
    // Check if page is returning JSON (API endpoint, not a form page)
    const pageContentType = await page.evaluate(() => {
      return document.contentType
    })
    
    const pageContent = await page.content()
    const isJsonPage = pageContentType && pageContentType.includes('application/json')
    const looksLikeJson = pageContent.trim().startsWith('{') || pageContent.trim().startsWith('[')
    
    if (isJsonPage || looksLikeJson) {
      return res.json({
        success: false,
        message: 'This URL appears to be an API endpoint returning JSON, not a form page',
        suggestion: 'Please provide a URL to an actual HTML form page (e.g., a contact form, login page, etc.)'
      })
    }

    // Detect form fields
    const formSchema = await page.evaluate(() => {
      // Check if we're on a login page
      const pageTitle = document.title.toLowerCase()
      const headingText = Array.from(document.querySelectorAll('h1, h2, h3'))
        .map(h => h.textContent.toLowerCase())
        .join(' ')
      
      const isLoginPage = pageTitle.includes('login') || 
                         pageTitle.includes('sign in') ||
                         headingText.includes('login') ||
                         headingText.includes('sign in')
      
      if (isLoginPage && !headingText.includes('register') && !headingText.includes('signup')) {
        return null // Will trigger error handling
      }
      
      // Find all forms
      const forms = document.querySelectorAll('form')
      let targetForm = null
      
      // If multiple forms, pick the one with most fields
      if (forms.length > 0) {
        let maxFields = 0
        for (const form of forms) {
          const fieldCount = form.querySelectorAll('input, textarea, select').length
          if (fieldCount > maxFields) {
            maxFields = fieldCount
            targetForm = form
          }
        }
      }

      // If no form found, try to find inputs outside of form tags
      if (!targetForm) {
        const inputs = document.querySelectorAll('input, textarea, select')
        if (inputs.length === 0) {
          return null
        }
        targetForm = document.body
      }

      const fields = []
      const seenNames = new Set()

      // Get form title/heading
      let formTitle = 'Web Form'
      const heading = targetForm.querySelector('h1, h2, h3, legend')
      if (heading) {
        formTitle = heading.textContent.trim()
      }

      // Detect all input fields
      const inputs = targetForm.querySelectorAll('input, textarea, select')

      inputs.forEach(input => {
        const name = input.getAttribute('name') || input.getAttribute('id')
        const type = input.getAttribute('type') || 'text'
        const label = input.getAttribute('placeholder') || input.getAttribute('aria-label') || ''
        const required = input.hasAttribute('required') || input.hasAttribute('aria-required')

        // Skip if no name/id or already processed
        if (!name || seenNames.has(name)) return
        if (type === 'submit' || type === 'button' || type === 'hidden' || type === 'checkbox' || type === 'radio') return

        seenNames.add(name)

        let fieldLabel = label
        if (!fieldLabel) {
          const labelElement = document.querySelector(`label[for="${name}"]`)
          if (labelElement) {
            fieldLabel = labelElement.textContent.trim()
          }
        }

        // Determine field type
        let fieldType = type
        if (input.tagName === 'TEXTAREA') {
          fieldType = 'textarea'
        } else if (input.tagName === 'SELECT') {
          fieldType = 'select'
        }

        const field = {
          name,
          label: fieldLabel || name.charAt(0).toUpperCase() + name.slice(1),
          type: fieldType,
          required,
          placeholder: input.getAttribute('placeholder') || ''
        }

        // For select, get options
        if (fieldType === 'select') {
          const options = Array.from(input.querySelectorAll('option'))
            .filter(opt => opt.value)
            .map(opt => opt.textContent.trim())
          if (options.length > 0) {
            field.options = options
          }
        }

        fields.push(field)
      })

      return {
        title: formTitle,
        description: `Form detected from ${window.location.hostname}`,
        url: window.location.href,
        fields: fields.length > 0 ? fields : null
      }
    })

    if (!formSchema) {
      return res.json({
        success: false,
        message: 'Detected a login page. Please provide authentication credentials or a different URL.',
        suggestion: 'The page appears to be a login page. Try providing authentication details.'
      })
    }

    if (!formSchema.fields || formSchema.fields.length === 0) {
      return res.json({
        success: false,
        message: 'No form fields detected on this page',
        suggestion: 'The page may be using JavaScript to render the form or form fields may not have name attributes'
      })
    }

    res.json({
      success: true,
      schema: formSchema
    })

  } catch (error) {
    console.error('Detection error:', error.message)
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to detect form fields',
      type: error.name
    })
  } finally {
    if (browser) {
      await browser.close()
    }
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'BasicTester Form Detector' })
})

app.get('/test-connectivity', async (req, res) => {
  try {
    const response = await fetch('https://oamsnetbase.teamtectonic.id/console');
    res.send(`Status: ${response.status}`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/**
 * Run test with provided data
 * POST /api/run-test
 */
app.post('/api/run-test', async (req, res) => {
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

    // Launch browser (container-friendly)
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
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
})


// Start server
app.listen(PORT, () => {
  console.log(`✓ BasicTester Backend running on http://localhost:${PORT}`)
  console.log(`✓ Form detection API: POST http://localhost:${PORT}/api/detect-form`)
})

// Process signal and error handlers to aid diagnosis on platforms that send SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM received - shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received - shutting down')
  process.exit(0)
})

process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err && err.stack ? err.stack : err)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('unhandledRejection at:', promise, 'reason:', reason)
})

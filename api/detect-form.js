import { chromium } from 'playwright'

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

    // Install browser if needed (for Vercel)
    try {
      await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] })
    } catch (e) {
      console.log('Installing Playwright browser...')
      const { execSync } = require('child_process')
      execSync('npx playwright install chromium --with-deps', { stdio: 'inherit' })
    }

    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    })
    const page = await browser.newPage()

    // Handle authentication if needed
    if (authentication && (authentication.login || authentication.email || authentication.password)) {
      console.log('Handling authentication...')
      
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
      await page.goto(targetUrl, { waitUntil: 'networkidle' })
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
}

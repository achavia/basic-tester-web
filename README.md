# BasicTester - Modern Web Testing Tool

<div align="center">

![BasicTester Logo](https://img.shields.io/badge/BasicTester-v1.0-blue?style=for-the-badge)
![.NET Framework](https://img.shields.io/badge/.NET-Framework%204.8-purple?style=for-the-badge)
![Playwright](https://img.shields.io/badge/Playwright-Automation-green?style=for-the-badge)

**Developer Pre-QA Testing Tool**

Automated form testing tool dengan UI/UX modern tanpa Bootstrap. Lakukan test minimum sebelum release ke QA/QC.

[Features](#fitur) • [Installation](#instalasi) • [Usage](#cara-penggunaan) • [Examples](#contoh-penggunaan)

</div>

---

## 📋 Table of Contents

- [Fitur](#fitur)
- [Screenshots](#screenshots)
- [Persyaratan Sistem](#persyaratan-sistem)
- [Instalasi](#instalasi)
- [Cara Penggunaan](#cara-penggunaan)
- [Auto-Detect Fitur](#auto-detect-form-fields)
- [Login Authentication](#login-authentication)
- [Contoh Penggunaan](#contoh-penggunaan)
- [Troubleshooting](#troubleshooting)
- [Deployment](#deployment-ke-iis)
- [Architecture](#architecture)

---

## ✨ Fitur

### 🎨 **Modern UI/UX**
- **Custom Design System** - Tanpa Bootstrap, pure CSS dengan high contrast
- **Responsive Design** - Mobile-friendly dengan smooth transitions
- **Dark Mode Support** - Otomatis mengikuti system preference
- **Black & White Theme** - Background putih, font hitam untuk maximal readability

### 🚀 **Core Functionality**
1. **Manajemen Test Scenario** - Buat, edit, dan hapus skenario test
2. **Auto-Detect Form Fields** - Deteksi otomatis field form dari URL menggunakan Playwright
3. **Dynamic Form Schema** - Definisikan field form menggunakan JSON dengan live preview
4. **Login Authentication Support** - Test form yang memerlukan login terlebih dahulu
5. **Playwright Automation** - Automated testing dengan Node.js Playwright
6. **Screenshot Capture** - Ambil screenshot saat test execution untuk debugging
7. **Test Results History** - Track riwayat hasil test dengan status badges

### 🔧 **Advanced Features**
- **Smart Form Validation** - Deteksi field types otomatis (text, email, password, checkbox, select, textarea)
- **Multiple Selector Strategies** - Playwright mencari field dengan berbagai cara
- **Error Handling** - Detailed error messages untuk debugging
- **Real-time Preview** - Preview form sebelum test dijalankan

---

## 📸 Screenshots

### Test Scenario List
![List View](https://via.placeholder.com/800x400?text=Test+Scenarios+List)

### Create New Test
![Create Test](https://via.placeholder.com/800x500?text=Create+Test+Scenario)

### Auto-Detect Fields
![Auto Detect](https://via.placeholder.com/800x500?text=Auto-Detect+Form+Fields)

### Run Test
![Run Test](https://via.placeholder.com/800x600?text=Run+Test+Page)

---

## 💻 Persyaratan Sistem

### Development Environment
- **Visual Studio** 2019 atau lebih baru
- **.NET Framework** 4.8
- **Node.js** v16+ dan npm
- **Windows** 10/11 atau Windows Server 2016+

### Runtime/Production
- **Windows Server** dengan IIS
- **.NET Framework** 4.8
- **Node.js** harus terinstall di server
- **Internet connection** untuk mengakses target URLs

---

## 🚀 Instalasi

### 1. Clone/Download Repository

```bash
git clone <repository-url>
cd basic-tester
```

### 2. Restore NuGet Packages

Buka **Package Manager Console** di Visual Studio:

```powershell
Update-Package -reinstall
```

Atau menggunakan command line:

```bash
NuGet.exe restore BasicTester.sln
```

### 3. Install Playwright

Install Playwright secara global:

```bash
npm install -g playwright
```

Install Playwright browsers:

```bash
playwright install chromium
```

### 4. Build & Run

1. Buka `BasicTester.sln` di Visual Studio
2. Set `BasicTester` sebagai Startup Project
3. Press **F5** atau klik **Start Debugging**

Aplikasi akan berjalan di `https://localhost:44300/`

---

## 📖 Cara Penggunaan

### Workflow Overview

```
1. Create Test Scenario → 2. Configure Schema → 3. Run Test → 4. View Results
```

### 1. Buat Test Scenario Baru

1. Klik **"Create New Test"** di navigation menu
2. Masukkan **Target URL** (contoh: `https://example.com/login`)
3. Pilih **Auto-Detect Form Fields** untuk deteksi otomatis ATAU
4. Definisikan **Form Schema** manual dalam format JSON
5. (Optional) Enable **Authentication** jika URL memerlukan login
6. Klik **"Preview Schema"** untuk melihat preview form
7. Klik **"Create Test Scenario"** untuk menyimpan

### 2. Edit Test Scenario (Optional)

1. Dari list, klik **"Edit"** pada scenario
2. Update **Target URL** atau **Form Schema**
3. Update **Login Credentials** jika diperlukan
4. Klik **"Save Changes"**

### 3. Run Test

1. Klik **"Run Test"** pada scenario
2. Masukkan **Test Data** untuk setiap field
3. (Optional) Update **Login Credentials** jika berubah
4. Klik **"Run Test with Playwright"**
5. Tunggu hasil test (maksimal 90 detik)
6. Lihat **Test Results** dengan:
   - Status badge (Passed/Failed/Error)
   - Duration
   - Error details (jika gagal)
   - Screenshot link

---

## 🔍 Auto-Detect Form Fields

Fitur untuk mendeteksi otomatis field form dari URL tanpa manual configuration.

### Cara Menggunakan

1. Masukkan **Target URL**
2. (Optional) Centang **"This URL requires authentication"**
3. Isi **Login Credentials** jika diperlukan:
   - Login URL (opsional)
   - Field names (login, email, password)
   - Credentials (username, email, password)
4. Klik **"Auto-Detect Form Fields"**
5. Tunggu proses deteksi (~10-30 detik)
6. Schema akan terisi otomatis

### Yang Terdeteksi

- ✅ Input fields (text, email, password, number, dll)
- ✅ Textarea
- ✅ Select dropdown dengan options
- ✅ Checkbox dan radio buttons
- ✅ Field labels
- ✅ Placeholder text
- ✅ Required attributes

### Yang Tidak Terdeteksi

- ❌ Hidden fields
- ❌ Submit buttons
- ❌ Field tanpa name/id attribute

### Troubleshooting Auto-Detect

**Masalah:** "No form fields detected"

**Solution:**
1. Pastikan URL dapat diakses
2. Cek apakah form memerlukan authentication
3. Cek browser console (F12) untuk error details
4. Coba configure schema manually

---

## 🔐 Login Authentication

Untuk form yang memerlukan login sebelum dapat diakses.

### Cara Menggunakan

#### Di Create Test Scenario:

1. Centang **"This URL requires authentication"**
2. Isi **Login Credentials**:
   - **Login URL** (opsional) - Jika beda dengan target URL
   - **Login Field Name** - Name attribute untuk username (default: "login")
   - **Email Field Name** - Name attribute untuk email (default: "email")
   - **Password Field Name** - Name attribute untuk password (default: "password")
   - **Login Value** - Username untuk login
   - **Email Value** - Email untuk login
   - **Password Value** - Password untuk login

#### Di Run Test:

Login credentials tersimpan dari scenario, tapi bisa di-override saat run test.

### How It Works

1. Playwright membuka Login URL (atau Target URL)
2. Mengisi login form dengan credentials
3. Klik tombol submit/login
4. Tunggu redirect ke target form
5. Detect/isi target form

### Tips

- Gunakan **Inspect Element** di browser untuk mencari field names
- Playwright mencoba field dengan multiple selector strategies
- Test account yang digunakan sebaiknya dedicated untuk testing

---

## 📝 Form Schema Format

Schema didefinisikan dalam format JSON:

```json
{
  "title": "Contact Form",
  "description": "Test contact form submission",
  "fields": [
    {
      "name": "fullName",
      "label": "Full Name",
      "type": "text",
      "required": true,
      "placeholder": "John Doe"
    },
    {
      "name": "email",
      "label": "Email Address",
      "type": "email",
      "required": true,
      "placeholder": "john@example.com"
    },
    {
      "name": "message",
      "label": "Message",
      "type": "textarea",
      "required": true,
      "placeholder": "Enter your message"
    },
    {
      "name": "country",
      "label": "Country",
      "type": "select",
      "required": true,
      "options": ["Indonesia", "Malaysia", "Singapore", "Thailand"]
    },
    {
      "name": "agreeTerms",
      "label": "I agree to the terms and conditions",
      "type": "checkbox",
      "required": true
    }
  ]
}
```

### Supported Field Types

| Type | Description | Example |
|------|-------------|---------|
| `text` | Plain text input | Name, address |
| `email` | Email input | Email address |
| `password` | Password input | Password field |
| `number` | Number input | Age, quantity |
| `tel` | Telephone input | Phone number |
| `url` | URL input | Website URL |
| `textarea` | Multi-line text | Message, comments |
| `select` | Dropdown selection | Country, category |
| `checkbox` | Checkbox | Terms agreement |
| `radio` | Radio button | Gender, options |
| `date` | Date picker | Birthdate |
| `file` | File upload | File attachment |

### Field Properties

```json
{
  "name": "fieldName",        // Required: HTML name attribute
  "label": "Field Label",     // Optional: Display label
  "type": "text",             // Required: Field type
  "required": true,           // Optional: Is required?
  "placeholder": "Enter...",  // Optional: Placeholder text
  "options": ["A", "B"],      // Required for select: Array of options
  "defaultValue": "value"     // Optional: Default value
}
```

---

## 🎯 Contoh Penggunaan

### Example 1: Login Form Test

**Scenario:** Test login functionality

**Schema:**
```json
{
  "title": "Login Form Test",
  "description": "Test user login with valid credentials",
  "fields": [
    {
      "name": "email",
      "label": "Email Address",
      "type": "email",
      "required": true,
      "placeholder": "user@example.com"
    },
    {
      "name": "password",
      "label": "Password",
      "type": "password",
      "required": true,
      "placeholder": "Enter password"
    }
  ]
}
```

**Test Data:**
```json
{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

### Example 2: Registration Form with Auto-Detect

**Target URL:** `https://example.com/register`

**Steps:**
1. Create new test scenario
2. Enter URL: `https://example.com/register`
3. Click **"Auto-Detect Form Fields"**
4. Review detected schema
5. Save scenario

### Example 3: Protected Form with Login

**Scenario:** Test form that requires authentication

**Target URL:** `https://example.com/dashboard/form`

**Login Settings:**
- ✅ Requires authentication
- Login URL: `https://example.com/login`
- Login Field: `username`
- Email Field: `email`
- Password Field: `password`
- Login Value: `testuser`
- Email Value: `test@example.com`
- Password Value: `TestPass123!`

**Schema:** (Auto-detect from protected page)

### Example 4: Multi-Step Form

**Schema:**
```json
{
  "title": "Registration Multi-Step",
  "description": "Test multi-step registration form",
  "fields": [
    {
      "name": "firstName",
      "label": "First Name",
      "type": "text",
      "required": true
    },
    {
      "name": "lastName",
      "label": "Last Name",
      "type": "text",
      "required": true
    },
    {
      "name": "email",
      "label": "Email",
      "type": "email",
      "required": true
    },
    {
      "name": "password",
      "label": "Password",
      "type": "password",
      "required": true
    },
    {
      "name": "confirmPassword",
      "label": "Confirm Password",
      "type": "password",
      "required": true
    },
    {
      "name": "phone",
      "label": "Phone Number",
      "type": "tel",
      "required": false
    },
    {
      "name": "country",
      "label": "Country",
      "type": "select",
      "required": true,
      "options": ["Indonesia", "Malaysia", "Singapore", "Thailand", "Philippines", "Vietnam"]
    },
    {
      "name": "acceptTerms",
      "label": "I accept the Terms and Conditions",
      "type": "checkbox",
      "required": true
    }
  ]
}
```

---

## 🔧 Troubleshooting

### Test Gagal / Timeout

**Symptoms:** Test running terlalu lama atau timeout

**Solutions:**
1. Pastikan Node.js terinstall: `node --version`
2. Cek Playwright installation: `npm list -g playwright`
3. Cek browser installation: `playwright install --help`
4. Pastikan target URL dapat diakses
5. Cek firewall/network settings
6. Lihat **Console** (F12) untuk error details

### Screenshot Tidak Muncul

**Symptoms:** Test selesai tapi tidak ada screenshot

**Solutions:**
1. Pastikan folder `TestResults` ada dan writable
2. Cek disk space available
3. Lihat error message di test results
4. Cek IIS/IIS Express permissions

### Field Form Tidak Ditemukan

**Symptoms:** Error "Element not found: fieldName"

**Solutions:**
1. Pastikan field name di schema sesuai dengan HTML
2. Cek page source (F12 → Elements tab)
3. Playwright menggunakan multiple strategies:
   ```
   1. input[name="fieldname"]     → by name attribute
   2. #fieldname                   → by id
   3. [id="fieldname"]            → by id attribute
   4. input[placeholder*="text"]  → by placeholder (case-insensitive)
   ```
4. Gunakan **Inspect Element** untuk mencari atribut yang tepat
5. Jika form dalam iframe, auto-detect mungkin tidak bekerja

### Auto-Detect Tidak Bekerja

**Symptoms:** "No form fields detected" atau error

**Solutions:**
1. Cek browser console (F12) untuk error details
2. Pastikan URL mengembalikan status 200
3. Jika form butuh JavaScript rendering, tunggu loading
4. Coba configure schema manually
5. Pastikan Playwright Chromium terinstall

### Login Gagal

**Symptoms:** Error saat login atau detect login form instead

**Solutions:**
1. Pastikan field names benar (bukan label)
2. Cek apakah login sukses (playwright akan auto-detect)
3. Jika warning "Detected login form", credentials mungkin salah
4. Gunakan browser dev tools untuk inspect login form
5. Pastikan test account valid

### Data Tidak Tersimpan

**Symptoms:** Scenario hilang setelah app restart

**Note:** Tool ini menggunakan **in-memory storage**. Data akan hilang saat:
- App restart
- IIS restart
- Server reboot

**Solution:** Export schema JSON sebelum app restart (planned feature)

---

## 🚀 Deployment ke IIS

### 1. Publish Project

```bash
msbuild BasicTester.csproj /p:Configuration=Release /p:DeployOnBuild=true /p:PublishProfile=FolderProfile /p:PublishFolder=C:\Publish\BasicTester
```

Atau gunakan Visual Studio:
1. Right-click project → **Publish**
2. Create new publish profile → **Folder**
3. Set location → **Publish**

### 2. Configure IIS

Buka **IIS Manager**:

#### Create Website
1. Right-click **Sites** → **Add Website**
2. Configuration:
   - **Site name**: BasicTester
   - **Physical path**: `C:\Publish\BasicTester`
   - **Port**: 80 (atau port lain)
   - **Host name**: (optional)

#### Configure Application Pool
1. Click **Application Pools**
2. Find **BasicTester** pool
3. Right-click → **Basic Settings**
4. .NET CLR Version: **v4.0**
5. Managed Pipeline Mode: **Integrated**

### 3. Install Node.js di Server

```powershell
# Download Node.js from https://nodejs.org/
# Atau menggunakan Chocolatey
choco install nodejs
```

### 4. Install Playwright

```bash
npm install -g playwright
playwright install chromium
```

### 5. Configure Permissions

Pastikan IIS user punya permissions:
- Read/Execute on application folder
- Write on `TestResults` folder
- Execute on Node.js executable

### 6. Test Deployment

Buka browser dan akses:
- `http://localhost/` (jika port 80)
- `http://localhost:port/` (jika custom port)

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- ASP.NET MVC 5 (Framework 4.8)
- C#
- Newtonsoft.Json (JSON serialization)

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- jQuery 3.7.1
- **Custom Design System** (No Bootstrap)

**Testing Engine:**
- Node.js
- Playwright (Chromium)

### Project Structure

```
BasicTester/
├── App_Start/
│   ├── BundleConfig.cs       # CSS/JS bundles
│   ├── FilterConfig.cs       # Global filters
│   └── RouteConfig.cs        # URL routing
├── Content/
│   ├── main.css              # Custom design system
│   └── Site.css              # Legacy styles
├── Controllers/
│   └── TestController.cs     # Main controller
├── Models/
│   ├── TestScenario.cs       # Scenario model
│   ├── FormSchema.cs         # Schema models
│   ├── TestResult.cs         # Result model
│   └── LoginCredentials.cs   # Login model
├── Scripts/
│   ├── jquery-3.7.1.js       # jQuery library
│   └── test-form.js          # Custom scripts
├── Services/
│   └── PlaywrightService.cs  # Playwright integration
├── Views/
│   ├── Shared/
│   │   ├── _Layout.cshtml    # Master layout
│   │   └── Error.cshtml      # Error page
│   └── Test/
│       ├── Index.cshtml      # List scenarios
│       ├── Create.cshtml     # Create new
│       ├── Edit.cshtml       # Edit scenario
│       └── Run.cshtml        # Run test
└── TestResults/              # Screenshots & logs (auto-created)
```

### Data Flow

```
User Action
    ↓
Controller (TestController)
    ↓
Service Layer (PlaywrightService)
    ↓
Generate Playwright Script
    ↓
Execute Node.js Process
    ↓
Playwright Runs Test
    ↓
Parse Output
    ↓
Return Result to UI
```

### Key Components

**TestController.cs:**
- `Index()` - List all scenarios
- `Create()` - Show create form
- `Create(TestScenario)` - Save new scenario
- `Edit(int id)` - Show edit form
- `Edit(TestScenario)` - Update scenario
- `Run(int id)` - Show run test page
- `Run(TestScenario, TestData)` - Execute test
- `DetectFormFields()` - Auto-detect fields

**PlaywrightService.cs:**
- `DetectFormFieldsAsync()` - Auto-detect fields from URL
- `RunTestAsync()` - Execute test with data
- `GenerateTestScript()` - Generate Playwright JS code
- `ExecutePlaywrightScript()` - Run Node.js process

---

## 🎨 Custom Design System

Tool ini menggunakan **custom CSS framework** tanpa Bootstrap untuk:
- **High Performance** - Tidak ada dependency eksternal
- **Full Control** - Custom styling sesuai kebutuhan
- **Modern Look** - Clean, minimal design
- **Better Accessibility** - High contrast (WCAG AA compliant)

### Design Tokens

```css
/* Colors */
--bg-primary: #ffffff          /* White background */
--text-primary: #000000        /* Black text */
--border-color: #000000        /* Black borders */

/* Buttons */
--btn-primary: #000000         /* Black button */
--btn-success: #008800         /* Green */
--btn-danger: #cc0000          /* Red */
--btn-warning: #cc6600         /* Orange */
--btn-info: #0000cc            /* Blue */

/* Typography */
--font-family: System UI, sans-serif
--font-size-base: 16px
```

### Responsive Breakpoints

- **Mobile**: < 768px
- **Tablet**: 768px - 991px
- **Desktop**: > 991px

---

## 📝 Catatan Penting

### Limitations
1. **In-Memory Storage** - Data hilang saat app restart
2. **No Database** - Tidak ada persistence (by design)
3. **Single Browser** - Hanya Chromium yang di-support
4. **Max Timeout** - 90 detik per test
5. **No Parallel Testing** - Tests run sequentially

### Security Notes
1. **Test Credentials** - Password tersimpan di memory (plain text)
2. **No Encryption** - Test data tidak di-encrypt
3. **Development Only** - Jangan gunakan untuk production credentials
4. **Server Access** - Node.js process punya akses ke server

### Best Practices
1. Gunakan **dedicated test accounts** - Jangan gunakan production credentials
2. Test di **staging environment** dulu sebelum production URLs
3. **Review screenshots** untuk validasi visual
4. **Monitor test results** secara regular
5. **Update schemas** saat form berubah

---

## 🛣️ Roadmap

### Planned Features
- [ ] Database persistence (SQL Server/SQLite)
- [ ] Export/Import scenarios
- [ ] Bulk test execution
- [ ] Test scheduling (cron jobs)
- [ ] Email notifications
- [ ] Detailed test reports (PDF)
- [ ] Multi-user support
- [ ] API integration

### Potential Improvements
- [ ] Support untuk Firefox/WebKit browsers
- [ ] Visual regression testing
- [ ] Performance testing (load time)
- [ ] API endpoint testing
- [ ] Mobile testing (responsive design validation)

---

## 📄 License

Free to use for development and testing purposes.

---

## 🤝 Contributing

Contributions are welcome! Silahkan:
1. Fork repository
2. Create feature branch
3. Make changes
4. Submit pull request

---

## 📧 Support

Untuk pertanyaan atau issues:
- Cek **Troubleshooting** section
- Lihat browser console (F12) untuk error details
- Review Playwright documentation: https://playwright.dev/docs/intro

---

<div align="center">

**Built with ❤️ for developers**

[⬆ Back to Top](#basictester---modern-web-testing-tool)

</div>

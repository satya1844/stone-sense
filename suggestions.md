stones-web/
├── app/                          # Next.js 13+ App Router
│   ├── globals.css              ✓ (already exists)
│   ├── layout.jsx               # Root layout
│   ├── page.jsx                 # Homepage
│   ├── loading.jsx              # Global loading component
│   ├── not-found.jsx            # 404 page
│   │
│   ├── (auth)/                  # Auth route group
│   │   ├── login/
│   │   │   └── page.jsx
│   │   ├── register/
│   │   │   └── page.jsx
│   │   └── forgot-password/
│   │       └── page.jsx
│   │
│   ├── patient/                 # Patient dashboard
│   │   ├── layout.jsx
│   │   ├── page.jsx             # Patient dashboard
│   │   ├── upload-scan/
│   │   │   └── page.jsx         # Upload kidney scan
│   │   ├── results/
│   │   │   ├── page.jsx         # Scan results list
│   │   │   └── [id]/
│   │   │       └── page.jsx     # Individual result
│   │   ├── hospitals/
│   │   │   └── page.jsx         # Hospital locator
│   │   └── profile/
│   │       └── page.jsx
│   │
│   ├── doctor/                  # Doctor dashboard
│   │   ├── layout.jsx
│   │   ├── page.jsx             # Doctor dashboard
│   │   ├── patients/
│   │   │   ├── page.jsx         # Patient list
│   │   │   └── [id]/
│   │   │       └── page.jsx     # Patient details
│   │   ├── reports/
│   │   │   ├── page.jsx         # Reports list
│   │   │   └── [id]/
│   │   │       └── page.jsx     # Individual report
│   │   └── alerts/
│   │       └── page.jsx         # Urgent cases
│   │
│   ├── api/                     # API routes
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── route.js
│   │   │   ├── register/
│   │   │   │   └── route.js
│   │   │   └── logout/
│   │   │       └── route.js
│   │   ├── upload/
│   │   │   └── route.js         # File upload handler
│   │   ├── ai-analysis/
│   │   │   └── route.js         # Connect to Sankrut's model
│   │   ├── reports/
│   │   │   ├── route.js         # Generate PDF reports
│   │   │   └── [id]/
│   │   │       └── route.js
│   │   ├── hospitals/
│   │   │   └── route.js         # Hospital location API
│   │   ├── notifications/
│   │   │   └── route.js         # SMS/alert system
│   │   └── chatbot/
│   │       └── route.js         # Chatbot API
│   │
│   └── globals.css              ✓ (already exists)
│
├── components/                  # Reusable components
│   ├── ui/                      # Base UI components
│   │   ├── button.jsx
│   │   ├── input.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   └── loading-spinner.jsx
│   ├── layout/
│   │   ├── navbar.jsx
│   │   ├── sidebar.jsx
│   │   └── footer.jsx
│   ├── forms/
│   │   ├── upload-form.jsx
│   │   ├── login-form.jsx
│   │   └── registration-form.jsx
│   ├── scan-analysis/
│   │   ├── scan-viewer.jsx
│   │   ├── results-display.jsx
│   │   └── measurement-display.jsx
│   ├── reports/
│   │   ├── pdf-generator.jsx
│   │   └── report-preview.jsx
│   ├── maps/
│   │   └── hospital-map.jsx
│   └── chatbot/
│       └── chat-interface.jsx
│
├── lib/                         # Utility libraries
│   ├── auth.js                  # Authentication logic
│   ├── database.js              # Database connection
│   ├── ai-integration.js        # Connect to Sankrut's model
│   ├── pdf-generator.js         # PDF creation utilities
│   ├── sms-service.js           # SMS notification service
│   ├── file-upload.js           # File handling utilities
│   └── utils.js                 # General utilities
│
├── types/                       # JS docs for type hints (optional)
│   ├── auth.js
│   ├── patient.js
│   ├── doctor.js
│   ├── scan-result.js
│   └── hospital.js
│
├── hooks/                       # Custom React hooks
│   ├── use-auth.js
│   ├── use-upload.js
│   └── use-geolocation.js
│
├── middleware.js                # Auth middleware
├── next.config.js              ✓ (already exists)
├── tailwind.config.js
├── package.json
└── README.md
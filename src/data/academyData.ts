export interface Topic {
  title: string;
  steps: string[];
  importantNotes?: string[];
  bestPractices?: string[];
  screenshotType?: "dashboard" | "calendar" | "patients" | "treatments" | "finance" | "settings" | "staff" | "analytics";
}

export interface TrainingCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  topics: Topic[];
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
}

export const workflowSteps: WorkflowStep[] = [
  { id: "arrives", title: "Patient Arrives", description: "Patient walks into clinic or calls in." },
  { id: "patient", title: "Add/Search Patient", description: "Search existing records or create a new profile." },
  { id: "booking", title: "Book Appointment", description: "Schedule a time slot and select the dental service." },
  { id: "treatment", title: "Add Treatment", description: "Record diagnoses, tooth numbers, and service costs." },
  { id: "payment", title: "Record Payment", description: "Enter the paid amount (or leave blank to consider fully paid)." },
  { id: "invoice", title: "Generate Invoice", description: "Review calculated outstanding amount and collection details." },
  { id: "followup", title: "Schedule Follow-up", description: "Book next visits or routines to ensure continuous care." }
];

export const trainingCategories: TrainingCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn how to configure your clinic settings, add staff, and prepare your workspace.",
    iconName: "Compass",
    topics: [
      {
        title: "Create Clinic Profile",
        screenshotType: "settings",
        steps: [
          "Navigate to the Settings module in the sidebar.",
          "On the General Settings tab, update your Clinic Name, Address, Contact Email, and Phone Number.",
          "Save changes to update all patient-facing records and invoice headers."
        ],
        importantNotes: [
          "Double-check that your email and phone number are correct, as they are used for automated communications and booking notifications."
        ],
        bestPractices: [
          "Upload your official logo if supported to ensure a professional brand identity."
        ]
      },
      {
        title: "Add Staff Members",
        screenshotType: "staff",
        steps: [
          "Navigate to the Staff Management module in the sidebar.",
          "Click the 'Add Staff' button at the top right.",
          "Fill in the staff member's Name, Email, and a temporary Password.",
          "Assign a Role (Owner, Doctor, Receptionist, Admin) and save."
        ],
        importantNotes: [
          "Each role has specific permissions. For example, only Owners and Admins can view financial reports, whereas Doctors focus on treatments."
        ],
        bestPractices: [
          "Set up unique logins for every staff member to maintain clear audit logs and avoid credential sharing."
        ]
      },
      {
        title: "Configure Services",
        screenshotType: "settings",
        steps: [
          "Go to Settings and switch to the Services Catalog tab.",
          "Review the seeded default services (Consultation, Cleaning, Root Canal Treatment, etc.).",
          "Click 'Add New Service' to register custom services tailored to your clinic, or use the inline toggles to disable services you do not offer."
        ],
        importantNotes: [
          "Only clinic Owners or Admins can permanently delete a service from the database. Other staff can only enable or disable them."
        ],
        bestPractices: [
          "Keep service names distinct and clear (e.g., 'Composite Filling' vs 'Amalgam Filling') to ensure patients and staff select the correct option."
        ]
      },
      {
        title: "Review Settings",
        screenshotType: "settings",
        steps: [
          "Navigate to Settings -> General Settings.",
          "Verify the currency settings and default billing preferences.",
          "Review other system configurations to match your local regulations."
        ]
      },
      {
        title: "Start Adding Patients",
        screenshotType: "patients",
        steps: [
          "Navigate to the Patients module.",
          "Click the 'Register Patient' button.",
          "Enter basic details like Name, Age, Gender, and Contact Phone.",
          "Click 'Register' to create the profile instantly."
        ]
      }
    ]
  },
  {
    id: "patients",
    title: "Patients",
    description: "Manage patient files, view treatment history, and organize contact details.",
    iconName: "Users",
    topics: [
      {
        title: "Add Patient",
        screenshotType: "patients",
        steps: [
          "Go to the Patients page.",
          "Click 'Register Patient'.",
          "Fill in the required fields: Full Name, Age, Gender, and Phone Number.",
          "Submit the form to create their digital chart."
        ],
        bestPractices: [
          "Always enter a valid phone number. This is crucial for matching records and sending appointment updates."
        ]
      },
      {
        title: "Edit Patient",
        screenshotType: "patients",
        steps: [
          "Search for the patient on the Patients page and click on their name to view their profile.",
          "Click the 'Edit Details' button on the profile header.",
          "Update details (e.g., address, phone, age) and save changes."
        ]
      },
      {
        title: "View Patient History",
        screenshotType: "patients",
        steps: [
          "Open the patient's detail profile page.",
          "Scroll through the tabs to review: Appointments history, Treatments records, and Financial balance/invoices."
        ],
        bestPractices: [
          "Review the history tab before every appointment to familiarize yourself with the patient's previous complaints and treatments."
        ]
      },
      {
        title: "Search Patient",
        screenshotType: "patients",
        steps: [
          "On the Patients dashboard, locate the search bar at the top.",
          "Type the patient's name, email, or phone number.",
          "The matching list filters instantly as you type."
        ],
        bestPractices: [
          "Perform a quick search before registering a new patient to avoid creating duplicate profiles."
        ]
      },
      {
        title: "Delete Patient",
        screenshotType: "patients",
        steps: [
          "Open the patient's profile page.",
          "Click the 'Delete Patient' button (only accessible to Owners or Admins).",
          "Confirm the permanent deletion request."
        ],
        importantNotes: [
          "Deleting a patient will permanently remove all associated appointments, treatment history, and invoices. This action cannot be undone."
        ]
      }
    ]
  },
  {
    id: "appointments",
    title: "Appointments",
    description: "Schedule visits, manage chair time, reschedule, and handle cancellations.",
    iconName: "Calendar",
    topics: [
      {
        title: "Book Appointment",
        screenshotType: "calendar",
        steps: [
          "Navigate to the Appointments page or the Calendar page.",
          "Click 'Book Appointment' or click directly on an empty calendar slot.",
          "Select the Patient name, choose the dentist/staff, select the Service, and specify the Date and Time.",
          "If the required service is missing from the list, click 'Add New Service' inline to register it instantly without leaving the form.",
          "Confirm the booking."
        ],
        bestPractices: [
          "Use the inline service registration feature to keep booking workflows uninterrupted."
        ]
      },
      {
        title: "Reschedule Appointment",
        screenshotType: "calendar",
        steps: [
          "Locate the appointment on the Calendar or in the Appointments list.",
          "Click to open the appointment details modal.",
          "Modify the date, start time, or duration.",
          "Save the modifications."
        ]
      },
      {
        title: "Cancel Appointment",
        screenshotType: "calendar",
        steps: [
          "Click the target appointment to open its details.",
          "Change the status dropdown from 'Scheduled' or 'Completed' to 'Cancelled'.",
          "Save to release the calendar time slot."
        ],
        importantNotes: [
          "Cancelled appointments remain in the patient history for records but do not occupy active slots on the calendar."
        ]
      },
      {
        title: "Calendar View",
        screenshotType: "calendar",
        steps: [
          "Open the Calendar module.",
          "Toggle between Day, Week, and Month views to visualize clinic occupancy.",
          "Use the filters to view appointments for a specific doctor or dental chair."
        ]
      }
    ]
  },
  {
    id: "treatments",
    title: "Treatments",
    description: "Record dental procedures, dental charting numbers, and individual session costs.",
    iconName: "Activity",
    topics: [
      {
        title: "Add Treatment",
        screenshotType: "treatments",
        steps: [
          "Open the patient's profile page.",
          "Under the Treatments tab, click 'Add Treatment'.",
          "Select the service, input the diagnosis text, specify the target tooth number, and enter the treatment cost.",
          "Enter the Paid Amount or leave it empty to mark it fully paid.",
          "Save the treatment."
        ],
        importantNotes: [
          "If the Paid Amount field is left completely empty, the system automatically considers the treatment fully paid. The paid amount will match the total cost, resulting in $0 outstanding.",
          "If the patient has only made a partial payment, you MUST type the exact amount paid (e.g. '0' or '100') to track outstanding dues correctly."
        ],
        bestPractices: [
          "Record treatments immediately after the session to ensure accurate charts and real-time billing logs."
        ]
      },
      {
        title: "Diagnosis",
        steps: [
          "When adding a treatment, write a clear clinical description in the Diagnosis field (e.g. 'Deep dentin caries on distal surface').",
          "This helps other staff understand the history at a glance."
        ]
      },
      {
        title: "Tooth Number",
        steps: [
          "Enter the specific tooth number(s) involved in the procedure.",
          "You can use universal numbering (1-32) or FDI notation (11-48) based on your clinic's preference."
        ]
      },
      {
        title: "Cost & Payments",
        steps: [
          "Enter the total cost of the procedure.",
          "Check the billing status to verify if it is Paid, Partial, or Unpaid based on your inputs."
        ]
      }
    ]
  },
  {
    id: "finance",
    title: "Finance",
    description: "Understand revenue tracking, payments collection, and outstanding balance accounting.",
    iconName: "Coins",
    topics: [
      {
        title: "Total Revenue",
        screenshotType: "finance",
        steps: [
          "Calculated as the sum of the total costs of all recorded treatments.",
          "Represents the gross value of services rendered before payments are fully settled."
        ]
      },
      {
        title: "Collected Amount",
        screenshotType: "finance",
        steps: [
          "Calculated as the sum of all actual payments entered into the system.",
          "Includes full payments (including blank-field defaults) and partial payments."
        ]
      },
      {
        title: "Outstanding Amount",
        screenshotType: "finance",
        steps: [
          "Outstanding Amount = Total Revenue - Collected Amount.",
          "Represents the money still owed to the clinic by patients."
        ],
        importantNotes: [
          "To find patients with outstanding balances, check the Patients list or run a billing query.",
          "Let's look at a concrete accounting example:",
          "Scenario A: Treatment cost is $1,000, Paid Amount is left blank. Revenue is $1,000, Collected is $1,000, Outstanding is $0.",
          "Scenario B: Treatment cost is $1,500, Paid Amount is filled as '500'. Revenue is $1,500, Collected is $500, Outstanding is $1,000."
        ]
      }
    ]
  },
  {
    id: "services",
    title: "Service Management",
    description: "Manage clinic-specific services catalog, custom items, and deletion access.",
    iconName: "Settings",
    topics: [
      {
        title: "Add Service",
        screenshotType: "settings",
        steps: [
          "Go to Settings -> Services Catalog tab.",
          "Click the 'Add New Service' button.",
          "Enter the name of the service (e.g., 'Dental X-Ray') and click save.",
          "The service will immediately be available in all appointment and treatment dropdowns."
        ]
      },
      {
        title: "Edit Service",
        steps: [
          "In the Services Catalog table, click 'Edit' or click directly on the service name field.",
          "Modify the service name.",
          "Click 'Save' to apply the update across the system."
        ]
      },
      {
        title: "Disable Service",
        steps: [
          "In the Services Catalog table, find the active status switch or toggle next to the service name.",
          "Turn the switch off to disable the service.",
          "Disabled services are hidden from new booking selections but remain safely linked to historical patient charts."
        ]
      },
      {
        title: "Delete Service Restrictions",
        steps: [
          "In the Services Catalog table, click the 'Delete' button next to a service.",
          "Verify the warning and confirm deletion."
        ],
        importantNotes: [
          "Only users logged in as the clinic OWNER or ADMIN can delete a service from the database.",
          "For receptionists or doctors, the delete button is disabled or hidden. This prevents accidental loss of historical catalog records."
        ]
      }
    ]
  },
  {
    id: "calendar",
    title: "Calendar",
    description: "Navigate calendar layouts, filter schedules, and manage slot availability.",
    iconName: "Calendar",
    topics: [
      {
        title: "Calendar Navigation",
        screenshotType: "calendar",
        steps: [
          "Navigate to the Calendar module.",
          "Click on 'Today' to center on the current date, or use the chevron buttons to navigate back and forth.",
          "Switch between Day, Week, and Month views in the top-right toolbar."
        ]
      },
      {
        title: "Doctor Schedule Filter",
        screenshotType: "calendar",
        steps: [
          "Use the filter dropdown at the top of the Calendar to select a specific doctor.",
          "The calendar will display only the appointments assigned to that doctor, which is helpful for clinics with multiple treatment rooms."
        ]
      }
    ]
  },
  {
    id: "staff-management",
    title: "Staff Management",
    description: "Manage system access, create staff profiles, and understand role permissions.",
    iconName: "Users",
    topics: [
      {
        title: "Manage Staff",
        screenshotType: "staff",
        steps: [
          "Navigate to the Staff Management page.",
          "Review the list of current staff members, their roles, and login emails.",
          "Admins and Owners can update staff details or remove access when needed."
        ]
      },
      {
        title: "Role Permissions Guide",
        screenshotType: "staff",
        steps: [
          "Owner: Full system access, including billing/finance details, staff management, settings edit, and service deletions.",
          "Admin: Similar to Owner, manages staff, settings, and view finances.",
          "Doctor: Can manage calendars, view patient charts, record diagnoses, and add treatments. Cannot access clinic-wide financial summaries or settings details.",
          "Receptionist: Can register patients, search patient profiles, view messages, and book/cancel appointments. Cannot record treatments, delete services, or view financial graphs."
        ]
      }
    ]
  },
  {
    id: "reports",
    title: "Reports & Analytics",
    description: "Analyze financial performances, clinic metrics, and export data backups.",
    iconName: "TrendingUp",
    topics: [
      {
        title: "Track Clinic Growth",
        screenshotType: "analytics",
        steps: [
          "Navigate to the Analytics page.",
          "Review graphs tracking monthly revenue collections, appointment stats, and new registration volumes."
        ]
      },
      {
        title: "CSV Data Export",
        steps: [
          "Go to Settings -> General Settings.",
          "Locate the 'Export Clinic Data' card.",
          "Click the export button to download CSV backups of your patients, appointments, and billing data."
        ],
        importantNotes: [
          "Only Owners and Admins have permission to export clinic data, ensuring patient confidentiality and record security."
        ]
      }
    ]
  }
];

export const faqs: FAQItem[] = [
  {
    id: "faq-edit-appointment",
    question: "How do I edit an appointment?",
    answer: "Go to the Calendar or Appointments page, click on the appointment card you wish to modify to open the details modal, edit the date, time, doctor, or notes, and then click 'Save'.",
    category: "appointments"
  },
  {
    id: "faq-print-invoices",
    question: "How do I print invoices?",
    answer: "Navigate to the Patient's profile, click on the target Treatment/Invoice, and look for the print options or use your browser's print utility to print the formatted receipt sheet.",
    category: "finance"
  },
  {
    id: "faq-outstanding-payments",
    question: "How do I track outstanding payments?",
    answer: "You can check the patient's balance directly on their profile page. Any treatment with a Paid Amount less than the Total Cost displays an Outstanding status. The Finance dashboard also summarizes total clinic-wide outstanding balances.",
    category: "finance"
  },
  {
    id: "faq-add-staff",
    question: "How do I add staff?",
    answer: "If you are logged in as an Owner or Admin, navigate to the Staff Management page, click 'Add Staff', enter their name, email, and choose their role, then click save.",
    category: "staff-management"
  },
  {
    id: "faq-add-services",
    question: "How do I add services?",
    answer: "Navigate to Settings -> Services Catalog, click the 'Add New Service' button, enter the service name, and click save. Alternatively, you can create a new service directly inside the Book Appointment modal using the 'Add New Service' option.",
    category: "services"
  }
];
